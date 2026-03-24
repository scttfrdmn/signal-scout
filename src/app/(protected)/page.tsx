'use client'

import { useState, useRef, useEffect } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import type { ScanResult } from '@/lib/db/schema'

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

function ResultCard({
  result,
  index,
  status,
  onStatusChange,
  onSendToPipeline,
  pipelineSent,
  pipelineSending,
  pipelineError,
}: {
  result: ScanResult
  index: number
  status: Status | undefined
  onStatusChange: (id: string, status: Status | undefined) => void
  onSendToPipeline: (result: ScanResult) => void
  pipelineSent: boolean
  pipelineSending: boolean
  pipelineError: boolean
}) {
  return (
    <div
      style={{
        background: '#e3e1de',
        border: '1px solid #ccc8c2',
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

        {result.sector && (
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

        {/* Status dropdown */}
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

        {/* Pipeline button */}
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
      </div>

      {/* Opportunity */}
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
          <span style={VALUE_STYLE}>{result.signal}</span>
        </div>
        <div>
          <span style={LABEL_STYLE}>Why ENSO</span>
          <span style={VALUE_STYLE}>{result.whyEnso}</span>
        </div>
        <div>
          <span style={LABEL_STYLE}>Decision Maker</span>
          <span style={VALUE_STYLE}>
            {result.decisionMaker.name}, {result.decisionMaker.title}
          </span>
        </div>
        <div>
          <span style={LABEL_STYLE}>Urgency</span>
          <span style={VALUE_STYLE}>{result.urgency}</span>
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
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)

  const logEndRef = useRef<HTMLDivElement>(null)
  const currentScanId = useRef<string | null>(null)

  // Load scan history from DB on mount
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
    currentScanId.current = entry.id
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {history.map((entry) => {
                  const d = new Date(entry.timestamp)
                  const timeLabel = d.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })
                  const isActive = activeHistoryId === entry.id
                  return (
                    <button
                      key={entry.id}
                      onClick={() => loadHistoryEntry(entry)}
                      style={{
                        textAlign: 'left',
                        background: isActive ? '#e3e1de' : 'transparent',
                        border: isActive ? '1px solid #ccc8c2' : '1px solid transparent',
                        padding: '5px 8px',
                        cursor: 'pointer',
                        borderRadius: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
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
                          maxWidth: '200px',
                          display: 'block',
                        }}
                      >
                        {entry.focusArea}
                      </span>
                      <span
                        style={{
                          fontSize: '8px',
                          fontFamily: "'DM Mono', monospace",
                          color: '#8a7e78',
                        }}
                      >
                        {timeLabel} · {entry.results.length} signal
                        {entry.results.length !== 1 ? 's' : ''}
                      </span>
                    </button>
                  )
                })}
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
