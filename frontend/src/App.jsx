import { useState, useRef } from "react";
import axios from "axios";

// ─────────────────────────────────────────
// GRID BACKGROUND
// ─────────────────────────────────────────
function GridBackground() {
  return (
    <div aria-hidden="true" style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)
      `,
      backgroundSize: "48px 48px",
      WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
      maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)"
    }} />
  );
}

// ─────────────────────────────────────────
// SCORE RING
// ─────────────────────────────────────────
function ScoreRing({ score, label, color }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5.5" />
        <circle
          cx="45" cy="45" r={radius} fill="none"
          stroke={color} strokeWidth="5.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
        />
        <text x="45" y="50" textAnchor="middle" fill="white" fontSize="15" fontWeight="600"
          fontFamily="'Plus Jakarta Sans', sans-serif">{score}%</text>
      </svg>
      <span style={{
        fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em",
        textTransform: "uppercase", fontFamily: "var(--mono)"
      }}>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────
// CANDIDATE CARD
// ─────────────────────────────────────────
function CandidateCard({ candidate, index }) {
  const [expanded, setExpanded] = useState(false);
  const palette = [
    { accent: "#60a5fa", bg: "rgba(96,165,250,0.08)",   border: "rgba(96,165,250,0.25)"  },
    { accent: "#a78bfa", bg: "rgba(167,139,250,0.08)",  border: "rgba(167,139,250,0.25)" },
    { accent: "#34d399", bg: "rgba(52,211,153,0.08)",   border: "rgba(52,211,153,0.25)"  },
    { accent: "#fb923c", bg: "rgba(251,146,60,0.08)",   border: "rgba(251,146,60,0.25)"  },
    { accent: "#f472b6", bg: "rgba(244,114,182,0.08)",  border: "rgba(244,114,182,0.25)" },
  ];
  const p = palette[index % palette.length];
  const initials = (candidate.candidate_name || "?")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{
      background: "var(--card)",
      border: `1px solid var(--border)`,
      borderRadius: 12,
      overflow: "hidden",
      transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
      boxShadow: `inset 3px 0 0 0 ${p.accent}`,
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = p.border;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `inset 3px 0 0 0 ${p.accent}, 0 8px 28px rgba(0,0,0,0.3)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `inset 3px 0 0 0 ${p.accent}`;
      }}
    >
      {/* Card row */}
      <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        {/* Rank */}
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: p.bg, border: `1px solid ${p.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600,
          color: p.accent, flexShrink: 0
        }}>#{index + 1}</div>

        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: p.bg, border: `1px solid ${p.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--sans)", fontSize: 14, fontWeight: 700,
          color: p.accent, flexShrink: 0
        }}>{initials}</div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600, fontSize: 15, color: "var(--text)",
            fontFamily: "var(--sans)", marginBottom: 4,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
          }}>{candidate.candidate_name}</div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)" }}>
              {candidate.candidate_email}
            </span>
            <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)" }}>
              {candidate.candidate_phone}
            </span>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "transparent",
            border: `1px solid ${p.border}`,
            borderRadius: 7, padding: "6px 15px",
            fontFamily: "var(--mono)", fontSize: 11.5,
            color: p.accent, cursor: "pointer",
            transition: "background 0.15s", flexShrink: 0,
            letterSpacing: "0.04em"
          }}
          onMouseEnter={e => e.currentTarget.style.background = p.bg}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >{expanded ? "▲ Collapse" : "▼ View Resume"}</button>
      </div>

      {/* Expandable snippet */}
      {expanded && (
        <div style={{
          borderTop: "1px solid var(--border)",
          background: "var(--deep)",
          padding: "18px 24px",
          maxHeight: 280, overflowY: "auto",
          animation: "slideIn 0.2s ease"
        }}>
          <pre style={{
            fontFamily: "var(--mono)", fontSize: 12.5,
            color: "var(--subtext)", whiteSpace: "pre-wrap",
            lineHeight: 1.85, margin: 0
          }}>{candidate.resume_snippet}</pre>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// FILE ZONE
// ─────────────────────────────────────────
function FileZone({ file, onChange, label }) {
  return (
    <label style={{
      display: "block",
      border: `1.5px dashed ${file ? "var(--accent)" : "var(--border-2)"}`,
      borderRadius: 10, padding: "28px 20px",
      textAlign: "center", cursor: "pointer",
      background: file ? "var(--accent-bg)" : "var(--deep)",
      transition: "all 0.2s", marginBottom: 18,
      position: "relative"
    }}
      onMouseEnter={e => {
        if (!file) e.currentTarget.style.borderColor = "var(--accent-bd)";
        e.currentTarget.style.background = "var(--accent-bg)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = file ? "var(--accent)" : "var(--border-2)";
        e.currentTarget.style.background = file ? "var(--accent-bg)" : "var(--deep)";
      }}
    >
      <input type="file" accept=".pdf" onChange={onChange} style={{
        position: "absolute", inset: 0, opacity: 0,
        cursor: "pointer", width: "100%", height: "100%"
      }} />
      <div style={{ fontSize: 24, marginBottom: 8, opacity: file ? 1 : 0.4 }}>
        {file ? "📋" : "↑"}
      </div>
      {file ? (
        <div style={{ fontSize: 13, color: "var(--accent)", fontFamily: "var(--mono)" }}>
          {file.name}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13.5, color: "var(--subtext)", marginBottom: 4, fontFamily: "var(--sans)" }}>
            {label}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)" }}>
            Accepts .pdf files only
          </div>
        </>
      )}
    </label>
  );
}

// ─────────────────────────────────────────
// PANEL
// ─────────────────────────────────────────
function Panel({ children }) {
  return (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderTop: "1px solid var(--accent-bd)",
      borderRadius: 14,
      padding: "28px 30px",
      marginBottom: 20,
      transition: "border-color 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--border-2)";
        e.currentTarget.style.borderTopColor = "var(--accent)";
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.2)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.borderTopColor = "var(--accent-bd)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────
// PANEL HEADER
// ─────────────────────────────────────────
function PanelHeader({ icon, title, desc }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: "var(--accent-bg)",
        border: "1px solid var(--accent-bd)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, flexShrink: 0
      }}>{icon}</div>
      <div>
        <div style={{
          fontSize: 17, fontWeight: 700, color: "var(--text)",
          fontFamily: "var(--sans)", letterSpacing: "-0.01em"
        }}>{title}</div>
        <div style={{
          fontSize: 12, color: "var(--muted)",
          fontFamily: "var(--mono)", marginTop: 2
        }}>{desc}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────
const TABS = [
  { id: "analyze", label: "Resume Analyzer",  icon: "◈" },
  { id: "bulk",    label: "Bulk Upload",       icon: "⊞" },
  { id: "search",  label: "Candidate Search",  icon: "⊙" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("analyze");
  const [toastMsg,  setToastMsg]  = useState("");

  // Analyze
  const [file,          setFile]          = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analysis,      setAnalysis]      = useState("");
  const [loading,       setLoading]       = useState(false);

  // Bulk
  const [bulkFile,    setBulkFile]    = useState(null);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  // Search
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const analysisRef = useRef(null);

  const notify = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleAnalyze = async () => {
    if (!file) return notify("Please upload a resume PDF.");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("job_description", jobDescription);
    try {
      setLoading(true); setAnalysis("");
      const res = await axios.post("http://127.0.0.1:8000/analyze-resume/", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setAnalysis(res.data.analysis);
      setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: "smooth" }), 250);
    } catch { notify("Error — ensure the backend server is running."); }
    finally { setLoading(false); }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return notify("Please select a PDF file.");
    const fd = new FormData();
    fd.append("file", bulkFile);
    try {
      setBulkLoading(true);
      const res = await axios.post("http://127.0.0.1:8000/upload-bulk-resumes/", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setBulkMessage(res.data.message);
    } catch { notify("Upload failed. Check the backend."); }
    finally { setBulkLoading(false); }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return notify("Please enter a search query.");
    const fd = new FormData();
    fd.append("query", searchQuery);
    try {
      setSearchLoading(true); setSearchResults([]);
      const res = await axios.post("http://127.0.0.1:8000/search-candidates/", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSearchResults(res.data.matching_candidates || []);
    } catch { notify("Search failed. Check the backend."); }
    finally { setSearchLoading(false); }
  };

  // Robust parsing — matches "ATS_SCORE: 80" (strict backend format)
  // Falls back to looking for the score AFTER "out of 100:" or ": \d+" at end of line
  const parseAtsScore = (text) => {
    // First try strict format from updated backend prompt
    let m = text.match(/ATS_SCORE:\s*(\d{1,3})/i);
    if (m) return m[1];
    // Fallback: "ATS Score out of 100: 80" — grab the number AFTER the colon
    m = text.match(/ATS Score[^:\n]*:\s*(\d{1,3})/i);
    if (m) return m[1];
    // Fallback: "ATS Score: 80/100" — grab first number before slash
    m = text.match(/ATS Score[^:\n]*:\s*(\d{1,3})\s*[\/\\]/i);
    if (m) return m[1];
    return null;
  };
  const parseMatchScore = (text) => {
    // First try strict format
    let m = text.match(/JOB_MATCH:\s*(\d{1,3})/i);
    if (m) return m[1];
    // "Job Match Percentage: 60%"
    m = text.match(/Job Match[^:\n]*:\s*(\d{1,3})\s*%/i);
    if (m) return m[1];
    // "Job Match Percentage: 60"
    m = text.match(/Job Match[^:\n]*:\s*(\d{1,3})/i);
    if (m) return m[1];
    return null;
  };
  const atsScore   = parseAtsScore(analysis);
  const matchScore = parseMatchScore(analysis);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #0f1117;
          --deep:      #090b10;
          --card:      #161b25;
          --card-2:    #1c2230;
          --elevated:  #202736;

          --border:    rgba(255,255,255,0.08);
          --border-2:  rgba(255,255,255,0.14);

          --text:      #e8edf5;
          --subtext:   #9aa3b5;
          --muted:     #525c72;

          --accent:    #5b8dee;
          --accent-2:  #7aa4f2;
          --accent-bg: rgba(91,141,238,0.09);
          --accent-bd: rgba(91,141,238,0.28);

          --green:     #4ade80;

          --sans: 'Plus Jakarta Sans', sans-serif;
          --mono: 'Fira Code', monospace;

          --r-sm: 8px;
          --r:    12px;
          --r-lg: 16px;
        }

        html, body { height: 100%; }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--sans);
          font-size: 14px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--elevated); border-radius: 4px; }

        /* ── LAYOUT ── */
        .app {
          position: relative;
          z-index: 1;
          max-width: 860px;
          margin: 0 auto;
          padding: 56px 28px 80px;
        }

        /* ── HEADER ── */
        .header {
          text-align: center;
          margin-bottom: 48px;
        }

        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--accent-bg);
          border: 1px solid var(--accent-bd);
          border-radius: 100px;
          padding: 5px 16px 5px 10px;
          margin-bottom: 22px;
        }

        .badge-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 7px var(--green);
          animation: pulse 2.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }

        .badge-text {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--accent-2);
          letter-spacing: 0.06em;
        }

        .header-title {
          font-size: clamp(30px, 5vw, 46px);
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin-bottom: 12px;
        }

        .header-title span { color: var(--accent-2); }

        .header-subtitle {
          font-size: 13.5px;
          color: var(--muted);
          font-family: var(--mono);
          letter-spacing: 0.02em;
        }

        .header-rule {
          width: 44px; height: 2px;
          background: linear-gradient(90deg, var(--accent), transparent);
          margin: 20px auto 0;
          border-radius: 2px;
        }

        /* ── TABS ── */
        .tab-nav {
          display: flex;
          gap: 3px;
          background: var(--deep);
          border: 1px solid var(--border);
          border-radius: var(--r);
          padding: 5px;
          margin-bottom: 24px;
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 14px;
          border: 1px solid transparent;
          border-radius: var(--r-sm);
          background: transparent;
          color: var(--muted);
          font-family: var(--sans);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
        }

        .tab-btn:hover:not(.active) {
          color: var(--subtext);
          background: rgba(255,255,255,0.035);
        }

        .tab-btn.active {
          background: var(--card);
          border-color: var(--border-2);
          color: var(--text);
          box-shadow: 0 2px 10px rgba(0,0,0,0.28);
        }

        /* ── TEXTAREA ── */
        .textarea {
          width: 100%;
          background: var(--deep);
          border: 1px solid var(--border);
          border-radius: var(--r);
          padding: 14px 16px;
          color: var(--text);
          font-family: var(--mono);
          font-size: 13px;
          line-height: 1.8;
          resize: vertical;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          margin-bottom: 18px;
        }

        .textarea:focus {
          border-color: var(--accent-bd);
          box-shadow: 0 0 0 3px rgba(91,141,238,0.07);
        }

        .textarea::placeholder { color: var(--muted); }

        /* ── BUTTON ── */
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 22px;
          border-radius: var(--r-sm);
          border: 1px solid;
          font-family: var(--sans);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: -0.01em;
        }

        .btn-primary {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
          box-shadow: 0 2px 12px rgba(91,141,238,0.28);
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--accent-2);
          border-color: var(--accent-2);
          box-shadow: 0 4px 20px rgba(91,141,238,0.38);
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn:active:not(:disabled) { transform: scale(0.99); }

        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.22);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── SCORE ROW ── */
        .score-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 26px;
        }

        .score-chip {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--deep);
          border: 1px solid var(--border);
          border-radius: var(--r);
          padding: 16px 22px;
        }

        .score-val {
          font-size: 30px;
          font-weight: 800;
          color: var(--text);
          font-family: var(--mono);
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .score-lbl {
          font-size: 10.5px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.09em;
          margin-top: 4px;
          font-family: var(--mono);
        }

        /* ── ANALYSIS OUTPUT ── */
        .analysis-box {
          background: var(--deep);
          border: 1px solid var(--border);
          border-radius: var(--r);
          padding: 20px 22px;
          max-height: 500px;
          overflow-y: auto;
        }

        .analysis-box pre {
          font-family: var(--mono);
          font-size: 12.5px;
          color: var(--subtext);
          white-space: pre-wrap;
          line-height: 1.9;
        }

        /* ── DIVIDER ── */
        .divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 22px 0;
        }

        .divider-line { flex: 1; height: 1px; background: var(--border); }

        .divider-label {
          font-size: 10.5px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-family: var(--mono);
          white-space: nowrap;
        }

        /* ── SUCCESS NOTICE ── */
        .notice-success {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(74,222,128,0.07);
          border: 1px solid rgba(74,222,128,0.22);
          border-radius: var(--r-sm);
          padding: 12px 16px;
          margin-top: 18px;
          font-family: var(--mono);
          font-size: 13px;
          color: var(--green);
          animation: fadeUp 0.25s ease;
        }

        /* ── INFO BOX ── */
        .info-box {
          background: var(--accent-bg);
          border: 1px solid var(--accent-bd);
          border-radius: var(--r);
          padding: 18px 20px;
          display: flex;
          gap: 14px;
          align-items: flex-start;
          margin-top: 0;
        }

        .info-icon { color: var(--accent-2); font-size: 16px; margin-top: 1px; flex-shrink: 0; }

        .info-title {
          font-size: 13.5px; font-weight: 600;
          color: var(--text); margin-bottom: 4px;
        }

        .info-body {
          font-size: 12.5px; color: var(--muted);
          font-family: var(--mono); line-height: 1.8;
        }

        /* ── CANDIDATES ── */
        .candidates-stack { display: flex; flex-direction: column; gap: 11px; }

        .results-meta {
          display: flex; align-items: baseline;
          justify-content: space-between; margin-bottom: 14px;
        }

        .results-label {
          font-size: 14px; font-weight: 700;
          color: var(--text); letter-spacing: -0.01em;
        }

        .results-count {
          font-size: 12px; color: var(--muted); font-family: var(--mono);
        }

        /* ── EMPTY ── */
        .empty {
          text-align: center; padding: 60px 24px;
          color: var(--muted); font-family: var(--mono);
          font-size: 13px; line-height: 1.9;
        }

        .empty-glyph { font-size: 38px; opacity: 0.22; margin-bottom: 14px; display: block; }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-5px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .fade-up { animation: fadeUp 0.26s ease both; }

        /* ── TOAST ── */
        .toast {
          position: fixed; bottom: 28px; left: 50%;
          transform: translateX(-50%) translateY(10px);
          background: var(--card-2);
          border: 1px solid var(--border-2);
          border-radius: var(--r-sm);
          padding: 12px 22px;
          font-family: var(--mono); font-size: 12.5px;
          color: var(--text);
          box-shadow: 0 16px 48px rgba(0,0,0,0.5);
          opacity: 0; pointer-events: none;
          transition: all 0.25s ease;
          z-index: 999; white-space: nowrap;
          backdrop-filter: blur(12px);
        }

        .toast.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        /* ── FOOTER ── */
        .footer {
          text-align: center; margin-top: 60px;
          font-family: var(--mono); font-size: 11px;
          color: var(--muted); letter-spacing: 0.06em; opacity: 0.55;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 600px) {
          .app { padding: 32px 16px 60px; }
          .tab-btn { font-size: 12px; padding: 10px 8px; }
        }
      `}</style>

      <GridBackground />

      <div className="app">

        {/* ── HEADER ── */}
        <header className="header">
          <div className="header-badge">
            <div className="badge-dot" />
            <span className="badge-text">AI · VECTOR SEARCH · LLM POWERED</span>
          </div>
          <h1 className="header-title">
            AI Recruitment<br />
            <span>Intelligence Platform</span>
          </h1>
          <p className="header-subtitle">Resume analysis · bulk indexing · semantic candidate search</p>
          <div className="header-rule" />
        </header>

        {/* ── TAB NAV ── */}
        <nav className="tab-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {/* ════════════════════════════
            ANALYZE TAB
        ════════════════════════════ */}
        {activeTab === "analyze" && (
          <div className="fade-up">
            <Panel>
              <PanelHeader
                icon="📄"
                title="Candidate Resume Analyzer"
                desc="ATS scoring · skill gaps · job-fit report"
              />
              <FileZone
                file={file}
                onChange={e => setFile(e.target.files[0])}
                label="Drop resume PDF here or click to browse"
              />
              <textarea
                className="textarea"
                rows={6}
                placeholder="Paste the job description here — role title, required skills, qualifications, responsibilities..."
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
                {loading ? <><div className="spinner" /> Analyzing…</> : "Run Analysis"}
              </button>
            </Panel>

            {analysis && (
              <Panel>
                <div ref={analysisRef} />
                <PanelHeader
                  icon="📊"
                  title="Analysis Report"
                  desc="AI-generated resume intelligence"
                />

                {(atsScore || matchScore) && (
                  <div className="score-row">
                    {atsScore && (
                      <div className="score-chip">
                        <ScoreRing score={parseInt(atsScore)} label="ATS Score" color="#60a5fa" />
                        <div>
                          <div className="score-val">{atsScore}</div>
                          <div className="score-lbl">ATS Score</div>
                        </div>
                      </div>
                    )}
                    {matchScore && (
                      <div className="score-chip">
                        <ScoreRing score={parseInt(matchScore)} label="Job Match" color="#a78bfa" />
                        <div>
                          <div className="score-val">{matchScore}%</div>
                          <div className="score-lbl">Job Match</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="divider">
                  <div className="divider-line" />
                  <span className="divider-label">Full Report</span>
                  <div className="divider-line" />
                </div>

                <div className="analysis-box">
                  <pre>{analysis}</pre>
                </div>
              </Panel>
            )}
          </div>
        )}

        {/* ════════════════════════════
            BULK UPLOAD TAB
        ════════════════════════════ */}
        {activeTab === "bulk" && (
          <div className="fade-up">
            <Panel>
              <PanelHeader
                icon="📦"
                title="Recruiter Bulk Resume Upload"
                desc="Merged PDF · auto-parsed · vectorized into search index"
              />
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18, fontFamily: "var(--mono)" }}>
                Format each resume as{" "}
                <strong style={{ color: "var(--subtext)" }}>RESUME 1</strong>,{" "}
                <strong style={{ color: "var(--subtext)" }}>RESUME 2</strong>… within a single merged PDF.
              </p>
              <FileZone
                file={bulkFile}
                onChange={e => setBulkFile(e.target.files[0])}
                label="Drop bulk resume PDF here or click to browse"
              />
              <button className="btn btn-primary" onClick={handleBulkUpload} disabled={bulkLoading}>
                {bulkLoading ? <><div className="spinner" /> Processing…</> : "Upload & Index"}
              </button>
              {bulkMessage && (
                <div className="notice-success">
                  <span>✓</span> {bulkMessage}
                </div>
              )}
            </Panel>

            <div className="info-box">
              <span className="info-icon">ℹ</span>
              <div>
                <div className="info-title">How bulk upload works</div>
                <div className="info-body">
                  Each resume is extracted, segmented, and stored in a FAISS vector index using
                  sentence-transformer embeddings. Once indexed, use the Candidate Search tab
                  to query across all uploaded profiles using natural language.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════
            SEARCH TAB
        ════════════════════════════ */}
        {activeTab === "search" && (
          <div className="fade-up">
            <Panel>
              <PanelHeader
                icon="🔍"
                title="AI Candidate Search Engine"
                desc="Semantic vector search across your resume database"
              />
              <textarea
                className="textarea"
                rows={4}
                placeholder="Describe the ideal candidate — e.g. Machine learning engineer with TensorFlow and 3+ years in production AI..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleSearch} disabled={searchLoading}>
                {searchLoading ? <><div className="spinner" /> Searching…</> : "Search Candidates"}
              </button>
            </Panel>

            {searchResults.length > 0 && (
              <div className="fade-up">
                <div className="results-meta">
                  <span className="results-label">Top Matching Candidates</span>
                  <span className="results-count">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} · ranked by relevance</span>
                </div>
                <div className="candidates-stack">
                  {searchResults.map((c, i) => (
                    <CandidateCard key={i} candidate={c} index={i} />
                  ))}
                </div>
              </div>
            )}

            {searchResults.length === 0 && !searchLoading && searchQuery && (
              <div className="empty fade-up">
                <span className="empty-glyph">◎</span>
                No candidates matched your query.<br />
                Try different keywords or upload more resumes first.
              </div>
            )}

            {!searchQuery && (
              <div className="info-box">
                <span className="info-icon">ℹ</span>
                <div>
                  <div className="info-title">Semantic search — no exact keywords needed</div>
                  <div className="info-body">
                    Describe the ideal candidate in plain language. The engine uses vector similarity
                    to find the closest matches regardless of exact wording.
                    Upload resumes via Bulk Upload first for best results.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="footer">
          AI RECRUITMENT INTELLIGENCE PLATFORM · REACT + FASTAPI + LANGCHAIN + FAISS
        </div>
      </div>

      <div className={`toast ${toastMsg ? "visible" : ""}`}>{toastMsg}</div>
    </>
  );
}