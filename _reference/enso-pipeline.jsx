import { useState, useEffect, useRef } from "react";

// ── Storage helpers (localStorage as stand-in for backend) ──────────────────
const STORAGE_KEY = "enso-pipeline-v1";

const loadPipeline = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const savePipeline = (opps) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(opps)); } catch {}
};

// ── Stages ──────────────────────────────────────────────────────────────────
const STAGES = ["Sparks", "Evaluating", "Reaching Out", "In Conversation", "Proposal", "Won", "Lost", "Retired"];

const STAGE_COLORS = {
  "Sparks":         { bg: "#fff5f2", color: "#e8490f", border: "#f0c0b0" },
  "Evaluating":     { bg: "#fff9e8", color: "#a07010", border: "#e8d890" },
  "Reaching Out":   { bg: "#f0f5ff", color: "#2a5db0", border: "#b8c8e8" },
  "In Conversation":{ bg: "#f0f8f0", color: "#1a6b1a", border: "#a8d8a8" },
  "Proposal":       { bg: "#f5f0ff", color: "#6030a0", border: "#c8b0e8" },
  "Won":            { bg: "#e8f8e8", color: "#0a5a0a", border: "#88c888" },
  "Lost":           { bg: "#f8f0f0", color: "#a03030", border: "#d8a0a0" },
  "Retired":        { bg: "#f0f0f0", color: "#888", border: "#ccc" },
};

const COMPANY_TYPES = ["Startup", "Scale-up", "Enterprise", "NGO", "Foundation", "Government", "Coalition", "Other"];

// ── Utilities ───────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// ── Label component ─────────────────────────────────────────────────────────
const Label = ({ children, style = {} }) => (
  <div style={{ fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8a7e78", fontFamily: "'DM Mono', monospace", marginBottom: 4, ...style }}>
    {children}
  </div>
);

// ── StageBadge ───────────────────────────────────────────────────────────────
const StageBadge = ({ stage }) => {
  const s = STAGE_COLORS[stage] || STAGE_COLORS["Sparks"];
  return (
    <span style={{
      fontSize: 8, padding: "2px 7px", letterSpacing: "0.12em", textTransform: "uppercase",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap",
    }}>
      {stage}
    </span>
  );
};

// ── TypeBadge ────────────────────────────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const isLarge = type === "Enterprise";
  return (
    <span style={{
      fontSize: 8, padding: "2px 7px", letterSpacing: "0.1em", textTransform: "uppercase",
      background: isLarge ? "rgba(42,93,176,0.06)" : "rgba(0,80,60,0.07)",
      color: isLarge ? "#1a3a6e" : "#004030",
      border: `1px solid ${isLarge ? "rgba(42,93,176,0.18)" : "rgba(0,80,60,0.2)"}`,
      fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap",
    }}>
      {type || "Scale-up"}
    </span>
  );
};

// ── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ onAdd }) => (
  <div style={{ padding: "60px 0", textAlign: "center" }}>
    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "#d4d0cb", letterSpacing: "0.06em", marginBottom: 10 }}>
      No opportunities yet.
    </div>
    <p style={{ fontSize: 12, color: "#a09088", lineHeight: 1.8, maxWidth: 320, margin: "0 auto 24px" }}>
      Add one manually or use the Add to Pipeline button in Signal Scout.
    </p>
    <button onClick={onAdd} style={{
      background: "#1a1a1a", color: "#fff", border: "none",
      padding: "9px 22px", fontSize: 9, letterSpacing: "0.16em",
      fontFamily: "'DM Mono', monospace", cursor: "pointer", textTransform: "uppercase",
    }}>
      Add Opportunity
    </button>
  </div>
);

// ── Opportunity card (list view) ─────────────────────────────────────────────
const OppCard = ({ opp, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: "#fff", border: "1px solid #d4d0cb", padding: "14px 18px",
      cursor: "pointer", transition: "border-color 0.15s",
      display: "grid", gridTemplateColumns: "1fr auto",
      gap: 12, alignItems: "start",
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = "#1a1a1a"}
    onMouseLeave={e => e.currentTarget.style.borderColor = "#d4d0cb"}
  >
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: "0.06em", color: "#1a1a1a" }}>
          {opp.companyName || "Unnamed"}
        </span>
        <TypeBadge type={opp.companyType} />
        <StageBadge stage={opp.stage} />
      </div>
      {opp.sector && (
        <div style={{ fontSize: 9, color: "#8a7e78", letterSpacing: "0.1em", marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>
          {opp.sector.toUpperCase()}
        </div>
      )}
      {opp.scoutSummary && (
        <p style={{ fontSize: 12, color: "#3a3530", lineHeight: 1.6, margin: 0, maxWidth: 560 }}>
          {opp.scoutSummary.length > 140 ? opp.scoutSummary.slice(0, 140) + "…" : opp.scoutSummary}
        </p>
      )}
    </div>
    <div style={{ textAlign: "right", minWidth: 90 }}>
      <div style={{ fontSize: 9, color: "#a09088", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
        {opp.sponsor || "—"}
      </div>
      <div style={{ fontSize: 9, color: "#c8bfb8", fontFamily: "'DM Mono', monospace" }}>
        {opp.dateAdded}
      </div>
    </div>
  </div>
);

// ── Editable field ────────────────────────────────────────────────────────────
const EditableField = ({ label, value, onChange, multiline = false, placeholder = "" }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const ref = useRef(null);

  useEffect(() => { setDraft(value || ""); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  const commit = () => { setEditing(false); if (draft !== value) onChange(draft); };

  return (
    <div style={{ marginBottom: 18 }}>
      <Label>{label}</Label>
      {editing ? (
        multiline ? (
          <textarea
            ref={ref}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            placeholder={placeholder}
            style={{
              width: "100%", minHeight: 80, background: "#f5f3f0",
              border: "1px solid #b8b0a8", color: "#1a1a1a",
              fontFamily: "'DM Mono', monospace", fontSize: 11,
              padding: "8px", lineHeight: 1.7, resize: "vertical", outline: "none",
              boxSizing: "border-box",
            }}
          />
        ) : (
          <input
            ref={ref}
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => e.key === "Enter" && commit()}
            placeholder={placeholder}
            style={{
              width: "100%", background: "#f5f3f0",
              border: "1px solid #b8b0a8", color: "#1a1a1a",
              fontFamily: "'DM Mono', monospace", fontSize: 11,
              padding: "6px 8px", outline: "none", boxSizing: "border-box",
            }}
          />
        )
      ) : (
        <div
          onClick={() => setEditing(true)}
          style={{
            fontSize: 12, color: value ? "#1a1a1a" : "#b0a8a0", lineHeight: 1.7,
            cursor: "text", padding: "4px 0", borderBottom: "1px dashed #d4d0cb",
            minHeight: 22, fontStyle: value ? "normal" : "italic",
          }}
        >
          {value || placeholder || "Click to edit"}
        </div>
      )}
    </div>
  );
};

// ── Next Actions list ─────────────────────────────────────────────────────────
const NextActions = ({ actions = [], onChange }) => {
  const [newAction, setNewAction] = useState("");
  const [newOwner, setNewOwner] = useState("");

  const add = () => {
    if (!newAction.trim()) return;
    onChange([...actions, { id: uid(), action: newAction.trim(), owner: newOwner.trim() }]);
    setNewAction("");
    setNewOwner("");
  };

  const remove = (id) => onChange(actions.filter(a => a.id !== id));

  return (
    <div style={{ marginBottom: 18 }}>
      <Label>Next Actions</Label>
      {actions.length === 0 && (
        <p style={{ fontSize: 11, color: "#b0a8a0", fontStyle: "italic", margin: "4px 0 10px" }}>No actions yet.</p>
      )}
      {actions.map(a => (
        <div key={a.id} style={{
          display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0",
          borderBottom: "1px solid #ece8e4",
        }}>
          <span style={{ fontSize: 11, color: "#1a1a1a", flex: 1, lineHeight: 1.6 }}>{a.action}</span>
          {a.owner && (
            <span style={{
              fontSize: 9, color: "#2a5db0", fontFamily: "'DM Mono', monospace",
              background: "rgba(42,93,176,0.06)", border: "1px solid rgba(42,93,176,0.18)",
              padding: "1px 7px", whiteSpace: "nowrap",
            }}>
              {a.owner}
            </span>
          )}
          <button
            onClick={() => remove(a.id)}
            style={{ background: "none", border: "none", color: "#c8bfb8", cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1 }}
          >×</button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <input
          value={newAction}
          onChange={e => setNewAction(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder="Action item"
          style={{
            flex: 1, background: "#f5f3f0", border: "1px solid #d4d0cb",
            padding: "5px 8px", fontSize: 11, fontFamily: "'DM Mono', monospace",
            color: "#1a1a1a", outline: "none",
          }}
        />
        <input
          value={newOwner}
          onChange={e => setNewOwner(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder="Owner"
          style={{
            width: 90, background: "#f5f3f0", border: "1px solid #d4d0cb",
            padding: "5px 8px", fontSize: 11, fontFamily: "'DM Mono', monospace",
            color: "#1a1a1a", outline: "none",
          }}
        />
        <button
          onClick={add}
          style={{
            background: "#1a1a1a", color: "#fff", border: "none",
            padding: "5px 14px", fontSize: 9, cursor: "pointer",
            fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em",
          }}
        >Add</button>
      </div>
    </div>
  );
};

// ── Detail view ───────────────────────────────────────────────────────────────
const DetailView = ({ opp, onUpdate, onClose, onDelete }) => {
  const update = (field, value) => onUpdate({ ...opp, [field]: value });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(26,26,26,0.55)", zIndex: 100,
      display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: "min(640px, 100vw)", height: "100vh", background: "#f7f5f2",
        overflowY: "auto", borderLeft: "1px solid #d4d0cb",
        display: "flex", flexDirection: "column",
      }}>
        {/* Detail header */}
        <div style={{
          padding: "16px 24px", borderBottom: "1px solid #d4d0cb",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#f0ede9", position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: "0.06em", color: "#1a1a1a" }}>
              {opp.companyName || "Unnamed"}
            </span>
            <StageBadge stage={opp.stage} />
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8a7e78", padding: 0 }}>×</button>
        </div>

        <div style={{ padding: "24px", flex: 1 }}>

          {/* Stage selector */}
          <div style={{ marginBottom: 22 }}>
            <Label>Stage</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {STAGES.map(s => (
                <button key={s} onClick={() => update("stage", s)} style={{
                  padding: "4px 12px", fontSize: 9, cursor: "pointer",
                  fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em",
                  background: opp.stage === s ? "#1a1a1a" : "#ece8e4",
                  color: opp.stage === s ? "#fff" : "#3a3530",
                  border: opp.stage === s ? "1px solid #1a1a1a" : "1px solid #d4d0cb",
                  textTransform: "uppercase",
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Core fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <EditableField label="Company Name" value={opp.companyName} onChange={v => update("companyName", v)} />
            <div style={{ marginBottom: 18 }}>
              <Label>Size &amp; Stage</Label>
              <select
                value={opp.companyType || "Scale-up"}
                onChange={e => update("companyType", e.target.value)}
                style={{
                  width: "100%", background: "#f5f3f0", border: "1px solid #d4d0cb",
                  color: "#1a1a1a", fontFamily: "'DM Mono', monospace", fontSize: 11,
                  padding: "6px 8px", outline: "none", cursor: "pointer",
                }}
              >
                {COMPANY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <EditableField label="Sector" value={opp.sector} onChange={v => update("sector", v)} placeholder="e.g. Climate Infrastructure" />
            <EditableField label="Sponsor" value={opp.sponsor} onChange={v => update("sponsor", v)} placeholder="Who added this" />
          </div>

          <EditableField label="The Opportunity" value={opp.scoutSummary} onChange={v => update("scoutSummary", v)} multiline placeholder="The case for this opportunity — what's happening, why ENSO, what's at stake" />
          <EditableField label="Decision Maker" value={opp.decisionMaker} onChange={v => update("decisionMaker", v)} placeholder="Name and title" />
          <EditableField label="Source" value={opp.source} onChange={v => update("source", v)} placeholder="Publication, headline, URL" />

          {/* Divider */}
          <div style={{ borderTop: "1px solid #d4d0cb", margin: "8px 0 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 8, letterSpacing: "0.18em", color: "#b0a8a0", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap", paddingTop: 10 }}>TEAM</span>
            <div style={{ flex: 1, borderTop: "1px solid #d4d0cb", marginTop: 10 }} />
          </div>

          <EditableField label="Research Notes" value={opp.researchNotes} onChange={v => update("researchNotes", v)} multiline placeholder="Sponsor digs deeper — verify signals, add context" />
          <EditableField label="LinkedIn Connections" value={opp.linkedinConnections} onChange={v => update("linkedinConnections", v)} multiline placeholder="Who at ENSO has a connection here and to whom" />
          <EditableField label="Swarm Notes" value={opp.swarmNotes} onChange={v => update("swarmNotes", v)} multiline placeholder="What the team decided in the NewBiz meeting" />
          <NextActions actions={opp.nextActions || []} onChange={v => update("nextActions", v)} />

          {/* Meta */}
          <div style={{ marginTop: 24, padding: "12px", background: "#ece8e4", border: "1px solid #d4d0cb" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <Label>Added</Label>
                <span style={{ fontSize: 11, color: "#3a3530" }}>{opp.dateAdded}</span>
              </div>
              <div>
                <Label>Entry Source</Label>
                <span style={{ fontSize: 11, color: "#3a3530" }}>{opp.entrySource || "Manual"}</span>
              </div>
              <div>
                <Label>ID</Label>
                <span style={{ fontSize: 9, color: "#a09088", fontFamily: "'DM Mono', monospace" }}>{opp.id}</span>
              </div>
            </div>
          </div>

          {/* Delete */}
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <button
              onClick={() => { if (window.confirm("Remove this opportunity?")) { onDelete(opp.id); onClose(); } }}
              style={{
                background: "none", border: "1px solid #d4d0cb", color: "#a09088",
                padding: "5px 14px", fontSize: 9, cursor: "pointer",
                fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em",
              }}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Add / Edit modal ──────────────────────────────────────────────────────────
const AddModal = ({ onSave, onClose, initial = {} }) => {
  const [form, setForm] = useState({
    companyName: "", companyType: "Scale-up", sector: "", sponsor: "",
    scoutSummary: "", decisionMaker: "",
    source: "", stage: "Sparks",
    ...initial,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(26,26,26,0.55)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: "min(560px, 95vw)", maxHeight: "90vh", background: "#f7f5f2",
        border: "1px solid #d4d0cb", overflowY: "auto", padding: "28px 28px 20px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 22 }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: "0.08em", color: "#1a1a1a" }}>
            Add Opportunity
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8a7e78" }}>×</button>
        </div>

        {[
          ["Company Name", "companyName", false, ""],
          ["Sector", "sector", false, "e.g. Climate Infrastructure"],
          ["Sponsor", "sponsor", false, "Your name"],
          ["The Opportunity", "scoutSummary", true, "The case for this opportunity — what's happening, why ENSO, what's at stake"],
          ["Decision Maker", "decisionMaker", false, "Name and title"],
          ["Source", "source", false, "URL or publication"],
        ].map(([label, key, multi, ph]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <Label>{label}</Label>
            {multi ? (
              <textarea
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={ph}
                style={{
                  width: "100%", minHeight: 60, background: "#f0ede9",
                  border: "1px solid #d4d0cb", color: "#1a1a1a",
                  fontFamily: "'DM Mono', monospace", fontSize: 11,
                  padding: "6px 8px", resize: "vertical", outline: "none",
                  lineHeight: 1.6, boxSizing: "border-box",
                }}
              />
            ) : (
              <input
                type="text"
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={ph}
                style={{
                  width: "100%", background: "#f0ede9",
                  border: "1px solid #d4d0cb", color: "#1a1a1a",
                  fontFamily: "'DM Mono', monospace", fontSize: 11,
                  padding: "6px 8px", outline: "none", boxSizing: "border-box",
                }}
              />
            )}
          </div>
        ))}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <Label>Size &amp; Stage</Label>
            <select value={form.companyType} onChange={e => set("companyType", e.target.value)}
              style={{ width: "100%", background: "#f0ede9", border: "1px solid #d4d0cb", color: "#1a1a1a", fontFamily: "'DM Mono', monospace", fontSize: 11, padding: "6px 8px", outline: "none" }}>
              {COMPANY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label>Stage</Label>
            <select value={form.stage} onChange={e => set("stage", e.target.value)}
              style={{ width: "100%", background: "#f0ede9", border: "1px solid #d4d0cb", color: "#1a1a1a", fontFamily: "'DM Mono', monospace", fontSize: 11, padding: "6px 8px", outline: "none" }}>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={onClose} style={{
            background: "none", border: "1px solid #d4d0cb", color: "#3a3530",
            padding: "8px 18px", fontSize: 9, cursor: "pointer",
            fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em",
          }}>Cancel</button>
          <button
            onClick={() => {
              if (!form.companyName.trim()) return alert("Company name is required.");
              onSave({
                ...form,
                id: initial.id || uid(),
                dateAdded: initial.dateAdded || today(),
                entrySource: initial.entrySource || "Manual",
                nextActions: initial.nextActions || [],
              });
            }}
            style={{
              background: "#1a1a1a", color: "#fff", border: "none",
              padding: "8px 22px", fontSize: 9, cursor: "pointer",
              fontFamily: "'DM Mono', monospace", letterSpacing: "0.16em", textTransform: "uppercase",
            }}
          >Save</button>
        </div>
      </div>
    </div>
  );
};

// ── Main pipeline app ─────────────────────────────────────────────────────────
export default function ENSOPipeline() {
  const [opps, setOpps] = useState([]);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filterStage, setFilterStage] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setOpps(loadPipeline());
  }, []);

  const persist = (updated) => {
    setOpps(updated);
    savePipeline(updated);
  };

  const addOpp = (opp) => {
    persist([opp, ...opps]);
    setShowAdd(false);
    setSelectedOpp(opp);
  };

  const updateOpp = (updated) => {
    const next = opps.map(o => o.id === updated.id ? updated : o);
    persist(next);
    setSelectedOpp(updated);
  };

  const deleteOpp = (id) => {
    persist(opps.filter(o => o.id !== id));
  };

  // Filtering
  const filtered = opps.filter(o => {
    const stageMatch = filterStage === "All" || o.stage === filterStage;
    const q = search.toLowerCase();
    const textMatch = !q || [o.companyName, o.sector, o.sponsor, o.whyEnso]
      .some(f => f && f.toLowerCase().includes(q));
    return stageMatch && textMatch;
  });

  // Stage counts
  const counts = STAGES.reduce((acc, s) => {
    acc[s] = opps.filter(o => o.stage === s).length;
    return acc;
  }, {});

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f7f5f2; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #ece8e4; }
        ::-webkit-scrollbar-thumb { background: #c8bfb8; }
        select { appearance: none; }
        textarea, input, select { font-family: 'DM Mono', monospace; }
      `}</style>

      <div style={{ fontFamily: "'DM Mono', monospace", background: "#f7f5f2", minHeight: "100vh" }}>

        {/* Header */}
        <div style={{
          padding: "14px 30px", borderBottom: "1px solid #d4d0cb",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#f0ede9",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 21, letterSpacing: "0.22em", color: "#1a1a1a" }}>ENSO</span>
            <span style={{ fontSize: 9, letterSpacing: "0.28em", color: "#e8490f", textTransform: "uppercase" }}>Pipeline</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 9, color: "#a09088", letterSpacing: "0.1em", fontFamily: "'DM Mono', monospace" }}>
              {opps.length} {opps.length === 1 ? "opportunity" : "opportunities"}
            </span>
            <span style={{ fontSize: 11, color: "#1a1a1a", letterSpacing: "0.1em" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 51px)" }}>

          {/* Sidebar */}
          <div style={{ borderRight: "1px solid #d4d0cb", padding: "20px 16px", background: "#ebebeb", display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Search */}
            <div>
              <Label>Search</Label>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Company, sector, sponsor…"
                style={{
                  width: "100%", background: "#e0deda", border: "1px solid #ccc8c2",
                  color: "#1a1a1a", fontSize: 10, padding: "6px 8px", outline: "none",
                  fontFamily: "'DM Mono', monospace",
                }}
              />
            </div>

            {/* Stage filters */}
            <div>
              <Label>Filter by Stage</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {["All", ...STAGES].map(s => {
                  const active = filterStage === s;
                  const count = s === "All" ? opps.length : (counts[s] || 0);
                  return (
                    <button key={s} onClick={() => setFilterStage(s)} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "5px 8px", fontSize: 9, cursor: "pointer",
                      fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em",
                      background: active ? "#1a1a1a" : "none",
                      color: active ? "#fff" : "#3a3530",
                      border: `1px solid ${active ? "#1a1a1a" : "transparent"}`,
                      textAlign: "left", width: "100%",
                    }}>
                      <span>{s}</span>
                      <span style={{ opacity: 0.6 }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add button */}
            <div style={{ marginTop: "auto" }}>
              <button
                onClick={() => setShowAdd(true)}
                style={{
                  width: "100%", background: "#1a1a1a", color: "#fff", border: "none",
                  padding: "10px", fontSize: 9, cursor: "pointer",
                  fontFamily: "'DM Mono', monospace", letterSpacing: "0.16em", textTransform: "uppercase",
                }}
              >
                + Add Opportunity
              </button>
            </div>
          </div>

          {/* Main list */}
          <div style={{ padding: "24px 28px", overflowY: "auto" }}>

            {/* Stage summary strip */}
            {opps.length > 0 && (
              <div style={{ display: "flex", gap: 1, marginBottom: 22, background: "#d4d0cb" }}>
                {STAGES.filter(s => counts[s] > 0).map(s => {
                  const c = STAGE_COLORS[s];
                  return (
                    <div key={s} onClick={() => setFilterStage(filterStage === s ? "All" : s)} style={{
                      flex: counts[s], background: c.bg, padding: "7px 10px",
                      cursor: "pointer", borderTop: `2px solid ${c.border}`, minWidth: 0,
                    }}>
                      <div style={{ fontSize: 7, letterSpacing: "0.14em", color: c.color, fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 14, fontFamily: "'Bebas Neue', sans-serif", color: "#1a1a1a", letterSpacing: "0.04em" }}>
                        {counts[s]}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Filter label */}
            {filterStage !== "All" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <StageBadge stage={filterStage} />
                <button onClick={() => setFilterStage("All")} style={{
                  background: "none", border: "none", fontSize: 9, color: "#a09088",
                  cursor: "pointer", fontFamily: "'DM Mono', monospace",
                }}>
                  Clear filter ×
                </button>
              </div>
            )}

            {/* List */}
            {filtered.length === 0 && opps.length === 0 && (
              <EmptyState onAdd={() => setShowAdd(true)} />
            )}
            {filtered.length === 0 && opps.length > 0 && (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#a09088", fontSize: 12 }}>
                No opportunities match this filter.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {filtered.map(o => (
                <OppCard key={o.id} opp={o} onClick={() => setSelectedOpp(o)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedOpp && (
        <DetailView
          opp={selectedOpp}
          onUpdate={updateOpp}
          onClose={() => setSelectedOpp(null)}
          onDelete={deleteOpp}
        />
      )}

      {/* Add modal */}
      {showAdd && (
        <AddModal onSave={addOpp} onClose={() => setShowAdd(false)} />
      )}
    </>
  );
}
