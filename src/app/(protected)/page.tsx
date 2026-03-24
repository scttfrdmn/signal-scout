'use client'

import { useState, useRef, useEffect } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import type { ScanResult, SavedSearch } from '@/lib/db/schema'

type Status = 'Pursuing' | 'Watch' | 'Passed'

type ScanHistoryEntry = {
  id: string
  focusArea: string
  timestamp: string
  results: ScanResult[]
  statuses?: Record<string, Status>
  pipelineSent?: Record<string, boolean>
}

const STATUS_STYLES: Record<Status, React.CSSProperties> = {
  Pursuing: {
    background: 'rgba(0,100,60,0.07)',
    color: '#004030',
    border: '1px solid rgba(0,100,60,0.2)',
  },
  Watch: {
    background: 'rgba(140,109,0,0.07)',
    color: '#7a5e00',
    border: '1px solid rgba(140,109,0,0.2)',
  },
  Passed: {
    background: 'rgba(160,40,0,0.06)',
    color: '#8c2200',
    border: '1px solid rgba(160,40,0,0.2)',
  },
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '8px',
  fontFamily: "'DM Mono', monospace",
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  color: '#8a7e78',
  marginBottom: '4px',
  display: 'block',
}

const VALUE_STYLE: React.CSSProperties = {
  fontSize: '11px',
  color: '#3a3530',
  lineHeight: '1.6',
  fontFamily: "'DM Mono', monospace",
}

const EDIT_INPUT: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: '11px',
  color: '#1a1a1a',
  background: '#f0ede9',
  border: '1px solid #ccc8c2',
  padding: '4px 6px',
  borderRadius: 0,
  outline: 'none',
  width: '100%',
  lineHeight: '1.5',
}

function ResultCard({
  result,
  index,
  status,
  onStatusChange,
  onSendToPipeline,
  pipelineSent,
  pipelineSending,
  pipelineError,
  pipelineWarning,
  isEditing,
  draft,
  onStartEdit,
  onDraftChange,
  onSaveEdit,
}: {
  result: ScanResult
  index: number
  status: Status | undefined
  onStatusChange: (id: string, status: Status | undefined) => void
  onSendToPipeline: (result: ScanResult) => void
  pipelineSent: boolean
  pipelineSending: boolean
  pipelineError: boolean
  pipelineWarning?: string
  isEditing: boolean
  draft: Partial<ScanResult & { dmName: string; dmTitle: string }>
  onStartEdit: () => void
  onDraftChange: (patch: Partial<ScanResult & { dmName: string; dmTitle: string }>) => void
  onSaveEdit: () => void
}) {
  return (
    <div
      style={{
        background: '#e3e1de',
        border: isEditing ? '1px solid #a09088' : '1px solid #ccc8c2',
        padding: '16px 18px',
        animation: 'fi 0.3s ease both',
        animationDelay: `${index * 0.06}s`,
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px',
          flexWrap: 'wrap',
        }}
      >
        {isEditing ? (
          <input
            value={draft.companyName ?? result.companyName}
            onChange={(e) => onDraftChange({ companyName: e.target.value })}
            style={{
              ...EDIT_INPUT,
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '15px',
              letterSpacing: '0.07em',
              flex: 1,
              minWidth: '120px',
            }}
          />
        ) : (
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '15px',
              letterSpacing: '0.07em',
              color: '#1a1a1a',
              flex: 1,
              minWidth: '120px',
            }}
          >
            {result.companyName}
          </span>
        )}

        {result.sector && !isEditing && (
          <span
            style={{
              fontSize: '8px',
              fontFamily: "'DM Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: '#8a7e78',
              border: '1px solid #d4d0cb',
              padding: '2px 6px',
            }}
          >
            {result.sector}
          </span>
        )}

        {/* Edit / Save button */}
        {isEditing ? (
          <button
            onClick={onSaveEdit}
            style={{
              fontSize: '8px',
              fontFamily: "'DM Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              padding: '4px 10px',
              background: '#1a1a1a',
              color: 'white',
              border: '1px solid #1a1a1a',
              cursor: 'pointer',
              borderRadius: 0,
            }}
          >
            Save
          </button>
        ) : (
          <button
            onClick={onStartEdit}
            style={{
              fontSize: '8px',
              fontFamily: "'DM Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              padding: '4px 10px',
              background: 'transparent',
              color: '#8a7e78',
              border: '1px solid #d4d0cb',
              cursor: 'pointer',
              borderRadius: 0,
            }}
          >
            Edit
          </button>
        )}

        {/* Status dropdown */}
        {!isEditing && (
          <select
            value={status ?? ''}
            onChange={(e) => {
              const val = e.target.value
              onStatusChange(result.id, val ? (val as Status) : undefined)
            }}
            style={{
              fontSize: '8px',
              fontFamily: "'DM Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              padding: '3px 6px',
              border: status ? (STATUS_STYLES[status].border as string) : '1px solid #d4d0cb',
              background: status ? (STATUS_STYLES[status].background as string) : '#f0ede9',
              color: status ? (STATUS_STYLES[status].color as string) : '#3a3530',
              cursor: 'pointer',
              outline: 'none',
              borderRadius: 0,
              appearance: 'none',
              WebkitAppearance: 'none',
              paddingRight: '16px',
            }}
          >
            <option value="">— Status</option>
            <option value="Pursuing">Pursuing</option>
            <option value="Watch">Watch</option>
            <option value="Passed">Passed</option>
          </select>
        )}

        {/* Pipeline button */}
        {!isEditing && (
          <button
            onClick={() => onSendToPipeline(result)}
            disabled={pipelineSent || pipelineSending}
            style={{
              fontSize: '8px',
              fontFamily: "'DM Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              padding: '4px 10px',
              background: pipelineSent ? 'rgba(0,100,60,0.07)' : pipelineError ? 'rgba(160,40,0,0.06)' : '#1a1a1a',
              color: pipelineSent ? '#004030' : pipelineError ? '#8c2200' : 'white',
              border: pipelineSent ? '1px solid rgba(0,100,60,0.2)' : pipelineError ? '1px solid rgba(160,40,0,0.2)' : '1px solid #1a1a1a',
              cursor: pipelineSent || pipelineSending ? 'default' : 'pointer',
              opacity: pipelineSending ? 0.5 : 1,
              borderRadius: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {pipelineSent ? 'Sent' : pipelineSending ? 'Sending...' : pipelineError ? 'Retry' : '→ Pipeline'}
          </button>
        )}
        {!isEditing && pipelineWarning && !pipelineSent && (
          <span
            style={{
              fontSize: '8px',
              fontFamily: "'DM Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              padding: '3px 7px',
              background: 'rgba(180,120,0,0.07)',
              color: '#7a5e00',
              border: '1px solid rgba(180,120,0,0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            ⚠ {pipelineWarning}
          </span>
        )}
      </div>

      {/* Opportunity */}
      {isEditing ? (
        <textarea
          rows={3}
          value={draft.opportunity ?? result.opportunity}
          onChange={(e) => onDraftChange({ opportunity: e.target.value })}
          style={{ ...EDIT_INPUT, marginBottom: '14px', resize: 'vertical' }}
        />
      ) : (
        <p
          style={{
            fontStyle: 'italic',
            fontSize: '12px',
            color: '#3a3530',
            lineHeight: '1.75',
            fontFamily: "'DM Mono', monospace",
            marginBottom: '14px',
          }}
        >
          {result.opportunity}
        </p>
      )}

      {/* Two-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px 20px',
          marginBottom: '12px',
        }}
      >
        <div>
          <span style={LABEL_STYLE}>Signal</span>
          {isEditing ? (
            <textarea rows={2} value={draft.signal ?? result.signal} onChange={(e) => onDraftChange({ signal: e.target.value })} style={{ ...EDIT_INPUT, resize: 'vertical' }} />
          ) : (
            <span style={VALUE_STYLE}>{result.signal}</span>
          )}
        </div>
        <div>
          <span style={LABEL_STYLE}>Why ENSO</span>
          {isEditing ? (
            <textarea rows={2} value={draft.whyEnso ?? result.whyEnso} onChange={(e) => onDraftChange({ whyEnso: e.target.value })} style={{ ...EDIT_INPUT, resize: 'vertical' }} />
          ) : (
            <span style={VALUE_STYLE}>{result.whyEnso}</span>
          )}
        </div>
        <div>
          <span style={LABEL_STYLE}>Decision Maker</span>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <input value={draft.dmName ?? result.decisionMaker.name} onChange={(e) => onDraftChange({ dmName: e.target.value })} placeholder="Name" style={EDIT_INPUT} />
              <input value={draft.dmTitle ?? result.decisionMaker.title} onChange={(e) => onDraftChange({ dmTitle: e.target.value })} placeholder="Title" style={EDIT_INPUT} />
            </div>
          ) : (
            <span style={VALUE_STYLE}>
              {result.decisionMaker.name}, {result.decisionMaker.title}
            </span>
          )}
        </div>
        <div>
          <span style={LABEL_STYLE}>Urgency</span>
          {isEditing ? (
            <input value={draft.urgency ?? result.urgency} onChange={(e) => onDraftChange({ urgency: e.target.value })} style={EDIT_INPUT} />
          ) : (
            <span style={VALUE_STYLE}>{result.urgency}</span>
          )}
        </div>
      </div>

      {/* Source */}
      <div style={{ borderTop: '1px solid #ccc8c2', paddingTop: '10px' }}>
        <span style={LABEL_STYLE}>Source</span>
        <a
          href={result.source.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '10px',
            fontFamily: "'DM Mono', monospace",
            color: '#2a5db0',
            textDecoration: 'none',
          }}
        >
          {result.source.publication}
          {result.source.headline ? ` — ${result.source.headline}` : ''}
        </a>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { user } = useUser()
  const [focusArea, setFocusArea] = useState('')
  const [scanning, setScanning] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [results, setResults] = useState<ScanResult[]>([])
  const [statuses, setStatuses] = useState<Record<string, Status>>({})
  const [history, setHistory] = useState<ScanHistoryEntry[]>([])
  const [pipelineSent, setPipelineSent] = useState<Record<string, boolean>>({})
  const [pipelineSending, setPipelineSending] = useState<Record<string, boolean>>({})
  const [pipelineError, setPipelineError] = useState<Record<string, boolean>>({})
  const [pipelineWarning, setPipelineWarning] = useState<Record<string, string>>({})
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)
  const [historySearch, setHistorySearch] = useState('')
  const [historyLimit, setHistoryLimit] = useState(10)
  const [editingResults, setEditingResults] = useState<Record<string, boolean>>({})
  const [editDraft, setEditDraft] = useState<Record<string, Partial<ScanResult & { dmName: string; dmTitle: string }>>>({})
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [savingSearch, setSavingSearch] = useState(false)

  const logEndRef = useRef<HTMLDivElement>(null)
  const currentScanId = useRef<string | null>(null)

  // Load scan history and saved searches from DB on mount
  useEffect(() => {
    fetch('/api/scans')
      .then(r => r.json())
      .then((rows: Array<{ id: string; focusArea: string | null; createdAt: string; results: ScanResult[]; statuses: Record<string, Status> | null; pipelineSent: Record<string, boolean> | null }>) => {
        setHistory(rows.map(row => ({
          id: row.id,
          focusArea: row.focusArea ?? 'General',
          timestamp: row.createdAt,
          results: row.results,
          statuses: row.statuses ?? undefined,
          pipelineSent: row.pipelineSent ?? undefined,
        })))
      })
      .catch(() => { /* non-fatal */ })

    fetch('/api/saved-searches')
      .then(r => r.json())
      .then(setSavedSearches)
      .catch(() => { /* non-fatal */ })
  }, [])

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [log])

  async function runScan() {
    setScanning(true)
    setLog([])
    setResults([])
    setStatuses({})
    setActiveHistoryId(null)
    setPipelineSent({})
    setPipelineSending({})
    setPipelineError({})
    setPipelineWarning({})

    const scanId = Math.random().toString(36).slice(2, 10)
    currentScanId.current = scanId
    const timestamp = new Date().toISOString()
    const currentFocusArea = focusArea.trim()

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusArea: currentFocusArea }),
      })

      if (!res.ok) {
        setLog((prev) => [...prev, `Error: HTTP ${res.status}`])
        setScanning(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const scanResults: ScanResult[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          let event: { type: string; message?: string; data?: ScanResult }
          try {
            event = JSON.parse(line.slice(6))
          } catch {
            continue
          }

          if (event.type === 'log' && event.message) {
            setLog((prev) => [...prev, event.message!])
          }
          if (event.type === 'result' && event.data) {
            scanResults.push(event.data)
            setResults((prev) => [...prev, event.data!])
            // Check for pipeline duplicates in background
            const resultId = event.data.id
            const companyName = event.data.companyName
            fetch(`/api/check-pipeline?company=${encodeURIComponent(companyName)}`)
              .then(r => r.json())
              .then((data: { match: { id: string; companyName: string; stage: string } | null }) => {
                if (data.match) {
                  setPipelineWarning(prev => ({ ...prev, [resultId]: `Already in Pipeline (${data.match!.stage})` }))
                }
              })
              .catch(() => { /* non-fatal */ })
          }
          if (event.type === 'done') {
            setScanning(false)
            if (scanResults.length === 0) {
              setLog((prev) => [...prev, 'Scan complete — no results found. Try a different focus area.'])
            }
            const entry: ScanHistoryEntry = {
              id: scanId,
              focusArea: currentFocusArea || 'General',
              timestamp,
              results: [...scanResults],
            }
            setHistory((prev) => [entry, ...prev.slice(0, 19)])
            // Persist to DB (fire and forget)
            fetch('/api/scans', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: scanId, focusArea: currentFocusArea || null, results: scanResults }),
            }).catch(() => { /* non-fatal */ })
          }
          if (event.type === 'error' && event.message) {
            setLog((prev) => [...prev, `Error: ${event.message}`])
            setScanning(false)
          }
        }
      }
    } catch (e) {
      setLog((prev) => [...prev, `Error: ${String(e)}`])
      setScanning(false)
    }
  }

  async function sendToPipeline(result: ScanResult) {
    if (pipelineSent[result.id] || pipelineSending[result.id]) return
    setPipelineSending((prev) => ({ ...prev, [result.id]: true }))
    setPipelineError((prev) => ({ ...prev, [result.id]: false }))
    try {
      await fetch('/api/send-to-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result,
          sponsor: user?.firstName ?? 'Signal Scout',
        }),
      })
      const next = { ...pipelineSent, [result.id]: true }
      setPipelineSent(next)
      // Persist pipelineSent to DB
      if (currentScanId.current) {
        fetch(`/api/scans/${currentScanId.current}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pipelineSent: next }),
        }).catch(() => { /* non-fatal */ })
      }
    } catch {
      setPipelineError((prev) => ({ ...prev, [result.id]: true }))
    } finally {
      setPipelineSending((prev) => ({ ...prev, [result.id]: false }))
    }
  }

  function setStatus(id: string, status: Status | undefined) {
    setStatuses((prev) => {
      const next = { ...prev }
      if (status === undefined) {
        delete next[id]
      } else {
        next[id] = status
      }
      // Persist statuses to DB
      if (currentScanId.current) {
        fetch(`/api/scans/${currentScanId.current}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statuses: next }),
        }).catch(() => { /* non-fatal */ })
      }
      return next
    })
  }

  function loadHistoryEntry(entry: ScanHistoryEntry) {
    setResults(entry.results)
    setLog([])
    setActiveHistoryId(entry.id)
    setStatuses(entry.statuses ?? {})
    setPipelineSent(entry.pipelineSent ?? {})
    setPipelineSending({})
    setPipelineError({})
    setPipelineWarning({})
    setEditingResults({})
    setEditDraft({})
    currentScanId.current = entry.id
  }

  async function deleteHistoryEntry(e: React.MouseEvent, entryId: string) {
    e.stopPropagation()
    if (!window.confirm('Delete this scan? This cannot be undone.')) return
    setHistory((prev) => prev.filter((h) => h.id !== entryId))
    if (activeHistoryId === entryId) {
      setResults([])
      setActiveHistoryId(null)
      currentScanId.current = null
    }
    fetch(`/api/scans/${entryId}`, { method: 'DELETE' }).catch(() => { /* non-fatal */ })
  }

  function rerunScan(e: React.MouseEvent, entry: ScanHistoryEntry) {
    e.stopPropagation()
    setFocusArea(entry.focusArea)
  }

  function startEdit(resultId: string, result: ScanResult) {
    setEditDraft((prev) => ({
      ...prev,
      [resultId]: {
        companyName: result.companyName,
        opportunity: result.opportunity,
        signal: result.signal,
        whyEnso: result.whyEnso,
        urgency: result.urgency,
        dmName: result.decisionMaker.name,
        dmTitle: result.decisionMaker.title,
      },
    }))
    setEditingResults((prev) => ({ ...prev, [resultId]: true }))
  }

  function saveEdit(resultId: string) {
    const draft = editDraft[resultId]
    if (!draft) return
    const updated = results.map((r) => {
      if (r.id !== resultId) return r
      return {
        ...r,
        companyName: draft.companyName ?? r.companyName,
        opportunity: draft.opportunity ?? r.opportunity,
        signal: draft.signal ?? r.signal,
        whyEnso: draft.whyEnso ?? r.whyEnso,
        urgency: draft.urgency ?? r.urgency,
        decisionMaker: {
          name: draft.dmName ?? r.decisionMaker.name,
          title: draft.dmTitle ?? r.decisionMaker.title,
        },
      }
    })
    setResults(updated)
    setEditingResults((prev) => ({ ...prev, [resultId]: false }))
    if (currentScanId.current) {
      fetch(`/api/scans/${currentScanId.current}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: updated }),
      }).catch(() => { /* non-fatal */ })
    }
    // Update history entry too
    if (activeHistoryId) {
      setHistory((prev) => prev.map((h) =>
        h.id === activeHistoryId ? { ...h, results: updated } : h
      ))
    }
  }

  async function saveCurrentSearch() {
    const name = window.prompt('Save as:', focusArea.trim().slice(0, 40))
    if (!name) return
    setSavingSearch(true)
    try {
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), focusArea: focusArea.trim() }),
      })
      if (res.ok) {
        const created = await res.json()
        setSavedSearches(prev => [created, ...prev])
      }
    } finally {
      setSavingSearch(false)
    }
  }

  async function deleteSavedSearch(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setSavedSearches(prev => prev.filter(s => s.id !== id))
    fetch(`/api/saved-searches/${id}`, { method: 'DELETE' }).catch(() => { /* non-fatal */ })
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <header
        style={{
          height: '51px',
          minHeight: '51px',
          background: '#f0ede9',
          borderBottom: '1px solid #d4d0cb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '21px',
              letterSpacing: '0.28em',
              color: '#1a1a1a',
              lineHeight: 1,
            }}
          >
            ENSO
          </span>
          <span
            style={{
              fontSize: '8px',
              fontFamily: "'DM Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: '#e8490f',
            }}
          >
            Signal Scout
          </span>
          <span
            style={{
              fontSize: '8px',
              fontFamily: "'DM Mono', monospace",
              color: '#c0b8b0',
              letterSpacing: '0.1em',
            }}
          >
            v{process.env.NEXT_PUBLIC_APP_VERSION}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span
            style={{
              fontSize: '9px',
              fontFamily: "'DM Mono', monospace",
              color: '#8a7e78',
            }}
          >
            {dateStr}
          </span>
          <a
            href="https://github.com/scttfrdmn/signal-scout/issues/new?labels=feedback"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '9px',
              fontFamily: "'DM Mono', monospace",
              color: '#8a7e78',
              textDecoration: 'none',
              border: '1px solid #d4d0cb',
              borderRadius: 3,
              padding: '3px 8px',
              letterSpacing: '0.08em',
            }}
          >
            feedback
          </a>
          <UserButton />
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '248px 1fr',
          flex: 1,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* Sidebar */}
        <aside
          style={{
            width: '248px',
            background: '#ebebeb',
            borderRight: '1px solid #d4d0cb',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            overflowY: 'auto',
          }}
        >
          {/* Focus area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: '8px',
                fontFamily: "'DM Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: '#8a7e78',
              }}
            >
              Focus Area
            </label>
            <textarea
              rows={4}
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              disabled={scanning}
              placeholder="e.g. climate infrastructure, consumer health, civic tech..."
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '11px',
                border: '1px solid #ccc8c2',
                background: '#f0ede9',
                color: '#1a1a1a',
                padding: '8px 10px',
                resize: 'vertical',
                outline: 'none',
                lineHeight: '1.6',
                borderRadius: 0,
                width: '100%',
              }}
            />
          </div>

          {/* Run scan button */}
          <button
            onClick={runScan}
            disabled={scanning}
            style={{
              width: '100%',
              background: '#1a1a1a',
              color: 'white',
              fontSize: '9px',
              fontFamily: "'DM Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              padding: '10px 0',
              border: 'none',
              cursor: scanning ? 'default' : 'pointer',
              opacity: scanning ? 0.4 : 1,
              borderRadius: 0,
            }}
          >
            {scanning ? 'Scanning...' : 'Run Scan'}
          </button>

          {/* Save current search */}
          {focusArea.trim() && !scanning && (
            <button
              onClick={saveCurrentSearch}
              disabled={savingSearch}
              style={{
                background: 'transparent',
                border: '1px solid #d4d0cb',
                color: '#8a7e78',
                fontSize: '8px',
                fontFamily: "'DM Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                padding: '5px 0',
                cursor: 'pointer',
                borderRadius: 0,
                width: '100%',
              }}
            >
              + Save search
            </button>
          )}

          {/* Saved searches */}
          {savedSearches.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '8px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.18em', color: '#8a7e78' }}>
                Saved Searches
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {savedSearches.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    <button
                      onClick={() => setFocusArea(s.focusArea)}
                      style={{
                        flex: 1,
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '9px',
                        fontFamily: "'DM Mono', monospace",
                        color: '#3a3530',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 0,
                      }}
                      title={s.focusArea}
                    >
                      {s.name}
                    </button>
                    <button
                      onClick={(e) => deleteSavedSearch(e, s.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '0 6px',
                        cursor: 'pointer',
                        color: '#c0b8b0',
                        fontSize: '11px',
                        flexShrink: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scan log */}
          {log.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span
                style={{
                  fontSize: '8px',
                  fontFamily: "'DM Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  color: '#8a7e78',
                }}
              >
                Scan Log
              </span>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '9px',
                  color: '#8a7e78',
                  lineHeight: '1.7',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1px',
                }}
              >
                {log.map((entry, i) => (
                  <div key={i}>{entry}</div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          )}

          {/* Scan history */}
          {history.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span
                style={{
                  fontSize: '8px',
                  fontFamily: "'DM Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  color: '#8a7e78',
                }}
              >
                Recent Scans
              </span>
              {/* Search */}
              <input
                value={historySearch}
                onChange={(e) => { setHistorySearch(e.target.value); setHistoryLimit(10) }}
                placeholder="Filter scans..."
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '9px',
                  border: '1px solid #ccc8c2',
                  background: '#f0ede9',
                  color: '#1a1a1a',
                  padding: '4px 8px',
                  outline: 'none',
                  borderRadius: 0,
                  width: '100%',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {history
                  .filter((e) => !historySearch || e.focusArea.toLowerCase().includes(historySearch.toLowerCase()))
                  .slice(0, historyLimit)
                  .map((entry) => {
                  const d = new Date(entry.timestamp)
                  const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  const timeLabel = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                  const isActive = activeHistoryId === entry.id
                  return (
                    <div
                      key={entry.id}
                      style={{
                        background: isActive ? '#e3e1de' : 'transparent',
                        border: isActive ? '1px solid #ccc8c2' : '1px solid transparent',
                        borderRadius: 0,
                        display: 'flex',
                        alignItems: 'stretch',
                        gap: 0,
                      }}
                    >
                      <button
                        onClick={() => loadHistoryEntry(entry)}
                        style={{
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          padding: '5px 8px',
                          cursor: 'pointer',
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '9px',
                            fontFamily: "'DM Mono', monospace",
                            color: '#3a3530',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                          }}
                        >
                          {entry.focusArea}
                        </span>
                        <span style={{ fontSize: '8px', fontFamily: "'DM Mono', monospace", color: '#8a7e78' }}>
                          {dateLabel} {timeLabel} · {entry.results.length} signal{entry.results.length !== 1 ? 's' : ''}
                        </span>
                      </button>
                      {/* Re-run */}
                      <button
                        onClick={(e) => rerunScan(e, entry)}
                        title="Re-run with this focus area"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '0 5px',
                          cursor: 'pointer',
                          color: '#8a7e78',
                          fontSize: '10px',
                          flexShrink: 0,
                        }}
                      >
                        ↺
                      </button>
                      {/* Delete */}
                      <button
                        onClick={(e) => deleteHistoryEntry(e, entry.id)}
                        title="Delete scan"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '0 5px',
                          cursor: 'pointer',
                          color: '#c0b8b0',
                          fontSize: '11px',
                          flexShrink: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
                {/* Load more */}
                {history.filter((e) => !historySearch || e.focusArea.toLowerCase().includes(historySearch.toLowerCase())).length > historyLimit && (
                  <button
                    onClick={() => setHistoryLimit((n) => n + 10)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '8px',
                      fontFamily: "'DM Mono', monospace",
                      color: '#8a7e78',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      textAlign: 'left',
                      textDecoration: 'underline',
                    }}
                  >
                    Load more
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main
          style={{
            flex: 1,
            background: '#f7f5f2',
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          {/* Results */}
          {results.length > 0 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '18px',
                }}
              >
                <span
                  style={{
                    fontSize: '8px',
                    fontFamily: "'DM Mono', monospace",
                    textTransform: 'uppercase',
                    letterSpacing: '0.18em',
                    color: '#8a7e78',
                  }}
                >
                  {results.length} Signal{results.length !== 1 ? 's' : ''}
                  {scanning ? ' (scanning...)' : ''}
                </span>
                {scanning && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#e8490f',
                      display: 'inline-block',
                      animation: 'pulse 1.2s ease-in-out infinite',
                    }}
                  />
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {results
                  .filter((r, i, arr) => arr.findIndex(x => x.companyName.toLowerCase().trim() === r.companyName.toLowerCase().trim()) === i)
                  .map((result, i) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    index={i}
                    status={statuses[result.id]}
                    onStatusChange={setStatus}
                    onSendToPipeline={sendToPipeline}
                    pipelineSent={!!pipelineSent[result.id]}
                    pipelineSending={!!pipelineSending[result.id]}
                    pipelineError={!!pipelineError[result.id]}
                    pipelineWarning={pipelineWarning[result.id]}
                    isEditing={!!editingResults[result.id]}
                    draft={editDraft[result.id] ?? {}}
                    onStartEdit={() => startEdit(result.id, result)}
                    onDraftChange={(patch) => setEditDraft((prev) => ({ ...prev, [result.id]: { ...prev[result.id], ...patch } }))}
                    onSaveEdit={() => saveEdit(result.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Scanning empty state */}
          {scanning && results.length === 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '28px',
                    letterSpacing: '0.2em',
                    color: '#3a3530',
                  }}
                >
                  SCANNING
                </span>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#e8490f',
                    display: 'inline-block',
                    animation: 'pulse 1.2s ease-in-out infinite',
                  }}
                />
              </div>
              {log.length > 0 && (
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: "'DM Mono', monospace",
                    color: '#8a7e78',
                  }}
                >
                  {log[log.length - 1]}
                </span>
              )}
            </div>
          )}

          {/* Idle empty state */}
          {!scanning && results.length === 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
                gap: '12px',
              }}
            >
              <span
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '32px',
                  letterSpacing: '0.1em',
                  color: '#d4d0cb',
                }}
              >
                NO SIGNALS YET
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontFamily: "'DM Mono', monospace",
                  color: '#a09088',
                  textAlign: 'center',
                  maxWidth: '320px',
                  lineHeight: '1.7',
                }}
              >
                Run a scan to surface organizations at brand inflection moments.
              </span>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
