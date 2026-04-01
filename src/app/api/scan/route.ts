import { auth, currentUser } from '@clerk/nextjs/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildDiscoveryPrompt, buildDiscoveryPromptFromTemplate } from '@/lib/anthropic/prompt'
import { db } from '@/lib/db'
import { promptVersions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { ScanResult } from '@/lib/db/schema'

export const maxDuration = 300
export const runtime = 'nodejs'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const searchSources = [
  'Fast Company',
  'Ad Age / Adweek',
  'Wired / MIT Tech Review',
  'Semafor / Axios',
  'TechCrunch',
  'Bloomberg / Reuters',
  'Fast Company / NYT',
]

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const focusArea: string | undefined = body.focusArea || undefined
  const promptVersionId: string | undefined = body.promptVersionId || undefined

  let prompt: string
  let isLab = false
  let resolvedVersionId: string | undefined

  if (promptVersionId) {
    // Lab scan: require prompt-editor role
    const user = await currentUser()
    if (user?.publicMetadata?.role !== 'prompt-editor') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }
    const [version] = await db.select().from(promptVersions).where(eq(promptVersions.id, promptVersionId))
    if (!version) {
      return new Response(JSON.stringify({ error: 'Prompt version not found' }), { status: 404 })
    }
    prompt = buildDiscoveryPromptFromTemplate(version.body, version.focusAreaInstruction, focusArea)
    isLab = true
    resolvedVersionId = promptVersionId
  } else {
    // Regular scan: use active DB version, fall back to hardcoded
    const [activeVersion] = await db
      .select()
      .from(promptVersions)
      .where(eq(promptVersions.status, 'active'))
      .limit(1)

    if (activeVersion) {
      prompt = buildDiscoveryPromptFromTemplate(activeVersion.body, activeVersion.focusAreaInstruction, focusArea)
      resolvedVersionId = activeVersion.id
    } else {
      prompt = buildDiscoveryPrompt(focusArea)
    }
  }

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      function emit(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const stream = anthropic.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 16000,
          tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 7 } as any],
          messages: [{ role: 'user', content: prompt }],
        } as any)

        let searchCount = 0

        for await (const event of stream) {
          if (
            event.type === 'content_block_start' &&
            (event.content_block as any).type === 'tool_use'
          ) {
            emit({
              type: 'log',
              message: `[${searchCount + 1}/7] Scanning ${searchSources[searchCount] ?? 'sources'}...`,
            })
            searchCount++
          }
        }

        const final = await stream.finalMessage()

        let rawText = ''
        for (const block of final.content) {
          if (block.type === 'text') {
            rawText += block.text
          }
        }

        const jsonMatch = rawText.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
          emit({ type: 'error', message: 'No valid JSON array found in response' })
          return
        }

        let results: ScanResult[]
        try {
          results = JSON.parse(jsonMatch[0])
        } catch (parseErr) {
          emit({ type: 'error', message: `Failed to parse results: ${String(parseErr)}` })
          return
        }

        if (!Array.isArray(results)) {
          emit({ type: 'error', message: 'Response was not a JSON array' })
          return
        }

        emit({ type: 'log', message: `Found ${results.length} signal${results.length !== 1 ? 's' : ''}` })

        for (const result of results) {
          emit({ type: 'result', data: result })
        }

        emit({ type: 'done', isLab, promptVersionId: resolvedVersionId })
      } catch (e) {
        emit({ type: 'error', message: String(e) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
