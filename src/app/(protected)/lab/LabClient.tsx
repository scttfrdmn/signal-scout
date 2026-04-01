'use client'

import { useState, useEffect, useRef } from 'react'
import type { PromptVersion, ScanResult } from '@/lib/db/schema'

type AdminUser = {
  id: string
  name: string
  email: string
  role: string | null
}

type Tab = 'editor' | 'history' | 'test' | 'team'

const MONO: React.CSSProperties = { fontFamily: "'DM Mono', monospace" }
const BG = '#f0ede9'
const BORDER = '1px solid #d4d0cb'

const labelStyle: React.CSSProperties = {
  ...MONO,
  fontSize: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  color: '#8a7e78',
  marginBottom: 4,
  display: 'block',
}

const inputStyle: React.CSSProperties = {
  ...MONO,
  fontSize: 11,
  color: '#1a1a1a',
  background: BG,
  border: '1px solid #ccc8c2',
  padding: '5px 7px',
  width: '100%',
  outline: 'none',
  lineHeight: 1.6,
  boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  display: 'block',
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    active: { background: 'rgba(0,100,60,0.07)', color: '#1a6b1a', border: '1px solid rgba(0,100,60,0.2)' },
    draft: { background: 'rgba(100,90,80,0.07)', color: '#8a7e78', border: '1px solid rgba(100,90,80,0.2)' },
    archived: { background: 'rgba(100,90,80,0.04)', color: '#aaa', border: '1px solid rgba(100,90,80,0.1)' },
  }
  return (
    <span style={{
      ...MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em',
      padding: '2px 7px', ...styles[status],
    }}>
      {status}
    </span>
  )
}

export default function LabClient() {
  const [tab, setTab] = useState<Tab>('editor')

  // Versions
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(true)

  // Editor state
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null)
  const [draftLabel, setDraftLabel] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [draftFocusAreaInstruction, setDraftFocusAreaInstruction] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [promoting, setPromoting] = useState(false)

  // Test scan state
  const [testFocusArea, setTestFocusArea] = useState('')
  const [testVersionId, setTestVersionId] = useState('')
  const [testLogs, setTestLogs] = useState<string[]>([])
  const [testResults, setTestResults] = useState<ScanResult[]>([])
  const [testRunning, setTestRunning] = useState(false)
  const [testError, setTestError] = useState('')
  const [labScans, setLabScans] = useState<{ id: string; focusArea: string | null; createdAt: string; results: ScanResult[] }[]>([])
  const [labScansOpen, setLabScansOpen] = useState(false)

  // Team state
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null)

  const testScrollRef = useRef<HTMLDivElement>(null)

  const activeVersion = versions.find((v) => v.status === 'active')

  useEffect(() => {
    fetchVersions()
  }, [])

  useEffect(() => {
    if (tab === 'team' && users.length === 0) fetchUsers()
    if (tab === 'test' && labScans.length === 0) fetchLabScans()
  }, [tab])

  async function fetchVersions() {
    setVersionsLoading(true)
    try {
      const res = await fetch('/api/prompt-versions')
      const data = await res.json()
      setVersions(data)
      if (!testVersionId && data.length > 0) {
        const active = data.find((v: PromptVersion) => v.status === 'active')
        setTestVersionId(active?.id ?? data[0].id)
      }
    } finally {
      setVersionsLoading(false)
    }
  }

  async function fetchUsers() {
    setUsersLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      setUsers(await res.json())
    } finally {
      setUsersLoading(false)
    }
  }

  async function fetchLabScans() {
    const res = await fetch('/api/scans?lab=true')
    const data = await res.json()
    setLabScans(data.map((s: any) => ({
      id: s.id,
      focusArea: s.focusArea,
      createdAt: s.createdAt,
      results: s.results,
    })))
  }

  function loadVersionIntoEditor(v: PromptVersion) {
    setEditingVersionId(v.id)
    setDraftLabel(v.label ?? '')
    setDraftBody(v.body)
    setDraftFocusAreaInstruction(v.focusAreaInstruction)
    setSaveError('')
    setTab('editor')
  }

  function clearEditor() {
    setEditingVersionId(null)
    setDraftLabel('')
    setDraftBody('')
    setDraftFocusAreaInstruction('')
    setSaveError('')
  }

  async function saveDraft() {
    setSaving(true)
    setSaveError('')
    try {
      let res: Response
      if (editingVersionId) {
        res = await fetch(`/api/prompt-versions/${editingVersionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: draftLabel, body: draftBody, focusAreaInstruction: draftFocusAreaInstruction }),
        })
      } else {
        res = await fetch('/api/prompt-versions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: draftLabel, body: draftBody, focusAreaInstruction: draftFocusAreaInstruction }),
        })
      }
      if (!res.ok) {
        const err = await res.json()
        setSaveError(err.error ?? 'Save failed')
        return
      }
      const saved = await res.json()
      setEditingVersionId(saved.id)
      await fetchVersions()
    } finally {
      setSaving(false)
    }
  }

  async function promoteVersion(id: string) {
    if (!confirm('Promote this version to production? The current active version will be archived.')) return
    setPromoting(true)
    try {
      const res = await fetch(`/api/prompt-versions/${id}/activate`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        setSaveError(err.error ?? 'Activation failed')
        return
      }
      await fetchVersions()
    } finally {
      setPromoting(false)
    }
  }

  async function runTestScan() {
    if (!testVersionId) return
    setTestRunning(true)
    setTestLogs([])
    setTestResults([])
    setTestError('')

    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ focusArea: testFocusArea || undefined, promptVersionId: testVersionId }),
    })

    if (!res.ok || !res.body) {
      setTestError('Scan request failed')
      setTestRunning(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    const collectedResults: ScanResult[] = []
    let finalIsLab = false
    let finalVersionId: string | undefined

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const msg = JSON.parse(line.slice(6))
          if (msg.type === 'log') setTestLogs((p) => [...p, msg.message])
          if (msg.type === 'result') {
            collectedResults.push(msg.data)
            setTestResults((p) => [...p, msg.data])
            setTimeout(() => testScrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
          }
          if (msg.type === 'error') setTestError(msg.message)
          if (msg.type === 'done') {
            finalIsLab = msg.isLab
            finalVersionId = msg.promptVersionId
          }
        } catch { /* ignore */ }
      }
    }

    setTestRunning(false)

    if (collectedResults.length > 0 && finalIsLab) {
      const id = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
      fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          focusArea: testFocusArea || null,
          results: collectedResults,
          isLab: true,
          promptVersionId: finalVersionId ?? null,
        }),
      }).catch(() => { /* fire-and-forget */ })
      fetchLabScans()
    }
  }

  async function toggleRole(userId: string, currentRole: string | null) {
    const newRole = currentRole === 'prompt-editor' ? null : 'prompt-editor'
    setRoleUpdating(userId)
    const prev = users
    setUsers((u) => u.map((x) => x.id === userId ? { ...x, role: newRole } : x))
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) setUsers(prev)
    } catch {
      setUsers(prev)
    } finally {
      setRoleUpdating(null)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'editor', label: 'Editor' },
    { key: 'history', label: 'Version History' },
    { key: 'test', label: 'Test Scan' },
    { key: 'team', label: 'Team' },
  ]

  return (
    <div style={{ ...MONO, minHeight: '100vh', background: BG, color: '#1a1a1a' }}>
      {/* Header */}
      <div style={{ borderBottom: BORDER, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <a href="/" style={{ fontSize: 11, color: '#8a7e78', textDecoration: 'none' }}>← scout</a>
        <span style={{ fontSize: 11, color: '#3a3530' }}>Prompt Lab</span>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: BORDER, display: 'flex', padding: '0 24px' }}>
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              ...MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em',
              padding: '10px 16px', border: 'none', borderBottom: tab === key ? '2px solid #1a1a1a' : '2px solid transparent',
              background: 'transparent', cursor: 'pointer',
              color: tab === key ? '#1a1a1a' : '#8a7e78',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: 24, maxWidth: 900 }}>

        {/* EDITOR TAB */}
        {tab === 'editor' && (
          <div>
            {activeVersion && (
              <div style={{ fontSize: 10, color: '#8a7e78', marginBottom: 16 }}>
                Active version: <strong style={{ color: '#3a3530' }}>{activeVersion.label ?? activeVersion.id}</strong>
                {activeVersion.activatedAt && (
                  <span> — promoted {new Date(activeVersion.activatedAt).toLocaleDateString()}</span>
                )}
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <span style={labelStyle}>Label (optional)</span>
              <input
                value={draftLabel}
                onChange={(e) => setDraftLabel(e.target.value)}
                placeholder="e.g. Focus more on climate orgs"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <span style={labelStyle}>Prompt Body</span>
              <textarea
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                rows={24}
                style={{ ...textareaStyle, minHeight: 400 }}
                placeholder="Prompt body — must contain {{CUTOFF_DATE}} and {{FOCUS_AREA_INSTRUCTION}}"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={labelStyle}>Focus Area Instruction</span>
              <textarea
                value={draftFocusAreaInstruction}
                onChange={(e) => setDraftFocusAreaInstruction(e.target.value)}
                rows={4}
                style={textareaStyle}
                placeholder="Focus area block — must contain {{FOCUS_AREA}}"
              />
            </div>

            {saveError && (
              <div style={{ fontSize: 11, color: '#c0392b', marginBottom: 12 }}>{saveError}</div>
            )}

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={saveDraft}
                disabled={saving || !draftBody || !draftFocusAreaInstruction}
                style={{
                  ...MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em',
                  padding: '7px 14px', border: BORDER, background: BG, cursor: 'pointer',
                  color: '#1a1a1a', opacity: (saving || !draftBody) ? 0.5 : 1,
                }}
              >
                {saving ? 'Saving…' : editingVersionId ? 'Save Draft' : 'Create Draft'}
              </button>

              {editingVersionId && (
                <button
                  onClick={() => promoteVersion(editingVersionId)}
                  disabled={promoting}
                  style={{
                    ...MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em',
                    padding: '7px 14px', border: '1px solid #1a6b1a', background: 'rgba(0,100,60,0.06)',
                    cursor: 'pointer', color: '#1a6b1a', opacity: promoting ? 0.5 : 1,
                  }}
                >
                  {promoting ? 'Promoting…' : 'Promote to Production'}
                </button>
              )}

              {editingVersionId && (
                <button
                  onClick={clearEditor}
                  style={{
                    ...MONO, fontSize: 10, padding: '7px 10px', border: 'none',
                    background: 'transparent', cursor: 'pointer', color: '#8a7e78',
                  }}
                >
                  New Draft
                </button>
              )}
            </div>
          </div>
        )}

        {/* VERSION HISTORY TAB */}
        {tab === 'history' && (
          <div>
            {versionsLoading ? (
              <div style={{ fontSize: 11, color: '#8a7e78' }}>Loading…</div>
            ) : versions.length === 0 ? (
              <div style={{ fontSize: 11, color: '#8a7e78' }}>No versions yet.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: BORDER }}>
                    {['Label', 'Status', 'Created', 'Activated', 'Actions'].map((h) => (
                      <th key={h} style={{ ...labelStyle, textAlign: 'left', padding: '4px 8px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #e8e4df' }}>
                      <td style={{ padding: '8px 8px', color: '#3a3530' }}>{v.label ?? <span style={{ color: '#b0a8a0', fontStyle: 'italic' }}>Unlabeled</span>}</td>
                      <td style={{ padding: '8px 8px' }}><StatusBadge status={v.status} /></td>
                      <td style={{ padding: '8px 8px', color: '#8a7e78', whiteSpace: 'nowrap' }}>{new Date(v.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '8px 8px', color: '#8a7e78', whiteSpace: 'nowrap' }}>
                        {v.activatedAt ? new Date(v.activatedAt).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '8px 8px', display: 'flex', gap: 8 }}>
                        {v.status === 'draft' && (
                          <button
                            onClick={() => loadVersionIntoEditor(v)}
                            style={{ ...MONO, fontSize: 9, padding: '3px 8px', border: BORDER, background: BG, cursor: 'pointer', color: '#3a3530' }}
                          >
                            Edit
                          </button>
                        )}
                        {v.status === 'archived' && (
                          <button
                            onClick={() => promoteVersion(v.id)}
                            style={{ ...MONO, fontSize: 9, padding: '3px 8px', border: '1px solid #1a6b1a', background: 'rgba(0,100,60,0.05)', cursor: 'pointer', color: '#1a6b1a' }}
                          >
                            Re-activate
                          </button>
                        )}
                        <button
                          onClick={() => loadVersionIntoEditor(v)}
                          style={{ ...MONO, fontSize: 9, padding: '3px 8px', border: BORDER, background: BG, cursor: 'pointer', color: '#8a7e78' }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TEST SCAN TAB */}
        {tab === 'test' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <span style={labelStyle}>Focus Area (optional)</span>
                <input
                  value={testFocusArea}
                  onChange={(e) => setTestFocusArea(e.target.value)}
                  placeholder="e.g. Climate tech"
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <span style={labelStyle}>Prompt Version</span>
                <select
                  value={testVersionId}
                  onChange={(e) => setTestVersionId(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label ?? `(unlabeled) ${v.id.slice(0, 6)}`} [{v.status}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={runTestScan}
              disabled={testRunning || !testVersionId}
              style={{
                ...MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em',
                padding: '7px 14px', border: '1px solid #e8490f', background: 'rgba(232,73,15,0.06)',
                cursor: testRunning ? 'wait' : 'pointer', color: '#e8490f',
                opacity: (testRunning || !testVersionId) ? 0.5 : 1, marginBottom: 20,
              }}
            >
              {testRunning ? 'Running…' : 'Run Test Scan'}
            </button>

            {testLogs.length > 0 && (
              <div style={{ marginBottom: 16, padding: '8px 12px', background: '#ece9e4', border: BORDER }}>
                {testLogs.map((l, i) => (
                  <div key={i} style={{ fontSize: 10, color: '#8a7e78', lineHeight: 1.8 }}>{l}</div>
                ))}
              </div>
            )}

            {testError && (
              <div style={{ fontSize: 11, color: '#c0392b', marginBottom: 12 }}>{testError}</div>
            )}

            {testResults.length > 0 && (
              <div>
                <div style={{ fontSize: 9, ...MONO, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#8a7e78', marginBottom: 12 }}>
                  Test Results — {testResults.length} signal{testResults.length !== 1 ? 's' : ''}
                </div>
                {testResults.map((r) => (
                  <div key={r.id} style={{
                    border: '1px solid #e8490f', padding: 14, marginBottom: 12,
                    background: 'rgba(232,73,15,0.03)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        ...MONO, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.18em',
                        padding: '2px 7px', border: '1px solid #e8490f', color: '#e8490f',
                      }}>TEST</span>
                      <span style={{ fontSize: 12, color: '#1a1a1a', fontWeight: 500 }}>{r.companyName}</span>
                      {r.sector && <span style={{ fontSize: 10, color: '#8a7e78' }}>{r.sector}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#3a3530', marginBottom: 6, lineHeight: 1.6 }}>{r.opportunity}</div>
                    {r.signal && <div style={{ fontSize: 10, color: '#8a7e78', marginBottom: 4 }}><strong>Signal:</strong> {r.signal}</div>}
                    {r.whyEnso && <div style={{ fontSize: 10, color: '#8a7e78', marginBottom: 4 }}><strong>Why ENSO:</strong> {r.whyEnso}</div>}
                    {r.urgency && <div style={{ fontSize: 10, color: '#8a7e78' }}><strong>At stake:</strong> {r.urgency}</div>}
                  </div>
                ))}
                <div ref={testScrollRef} />
              </div>
            )}

            {/* Past lab scans */}
            <div style={{ marginTop: 32 }}>
              <button
                onClick={() => setLabScansOpen(!labScansOpen)}
                style={{ ...MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', padding: '6px 0', border: 'none', background: 'transparent', cursor: 'pointer', color: '#8a7e78' }}
              >
                {labScansOpen ? '▾' : '▸'} Past Test Scans ({labScans.length})
              </button>

              {labScansOpen && labScans.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {labScans.map((s) => (
                    <div key={s.id} style={{ borderBottom: '1px solid #e8e4df', padding: '8px 0', fontSize: 11 }}>
                      <span style={{ color: '#3a3530' }}>{s.focusArea ?? '(no focus area)'}</span>
                      <span style={{ color: '#8a7e78', marginLeft: 12 }}>{new Date(s.createdAt).toLocaleString()}</span>
                      <span style={{ color: '#b0a8a0', marginLeft: 12 }}>{s.results?.length ?? 0} results</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TEAM TAB */}
        {tab === 'team' && (
          <div>
            {usersLoading ? (
              <div style={{ fontSize: 11, color: '#8a7e78' }}>Loading…</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: BORDER }}>
                    {['Name', 'Email', 'Role', 'Action'].map((h) => (
                      <th key={h} style={{ ...labelStyle, textAlign: 'left', padding: '4px 8px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #e8e4df' }}>
                      <td style={{ padding: '8px 8px', color: '#3a3530' }}>{u.name}</td>
                      <td style={{ padding: '8px 8px', color: '#8a7e78' }}>{u.email}</td>
                      <td style={{ padding: '8px 8px' }}>
                        {u.role === 'prompt-editor'
                          ? <span style={{ ...MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '2px 7px', border: '1px solid #1a6b1a', color: '#1a6b1a', background: 'rgba(0,100,60,0.05)' }}>editor</span>
                          : <span style={{ color: '#b0a8a0', fontSize: 10 }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '8px 8px' }}>
                        <button
                          onClick={() => toggleRole(u.id, u.role)}
                          disabled={roleUpdating === u.id}
                          style={{
                            ...MONO, fontSize: 9, padding: '3px 10px', border: BORDER,
                            background: BG, cursor: 'pointer', color: '#3a3530',
                            opacity: roleUpdating === u.id ? 0.5 : 1,
                          }}
                        >
                          {u.role === 'prompt-editor' ? 'Remove editor' : 'Add editor'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
