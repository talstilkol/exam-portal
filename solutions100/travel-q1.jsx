// Travel-SV — React Q1 (50 pts)
// Source spec: /Users/tal/Desktop/חומרים למבחן/מבחנים 1/עותק של מבחן פולסטאק מועד ג.pdf
// Target 100/100 — journal CRUD with date validation, location required,
// search in notes, sort by date (newest first), edit/delete entries.

import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import "./style.css";

// ───────────────────── Persistence ─────────────────────
const KEY = "travel-entries";
function loadEntries() {
  try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch {}
  return [];
}
function saveEntries(arr) { try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch {} }

// ───────────────────── App shell ─────────────────────
export default function AppShell() {
  const [entries, setEntries] = useState(loadEntries);
  useEffect(() => { saveEntries(entries); }, [entries]);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<JournalList entries={entries} setEntries={setEntries} />} />
        <Route path="/add"       element={<EntryForm entries={entries} setEntries={setEntries} mode="add" />} />
        <Route path="/edit/:id"  element={<EntryForm entries={entries} setEntries={setEntries} mode="edit" />} />
        <Route path="/view/:id"  element={<EntryView entries={entries} setEntries={setEntries} />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// ───────────────────── Page 1 — Journal list (sorted) ─────────────────────
function JournalList({ entries, setEntries }) {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return entries
      .filter((e) => {
        if (!term) return true;
        // ✅ Search in notes + location + tags
        return (
          e.notes.toLowerCase().includes(term) ||
          e.location.toLowerCase().includes(term) ||
          (e.tags || []).some((t) => t.toLowerCase().includes(term))
        );
      })
      // ✅ FIXED: sort by date — newest first
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [entries, search]);

  return (
    <main className="page">
      <header className="hero">
        <h1>🌍 Travel-SV — Journal</h1>
        <p>{filtered.length} entr{filtered.length === 1 ? "y" : "ies"}</p>
      </header>
      <section className="controls">
        <input type="search" placeholder="Search notes, location, tags…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-primary" onClick={() => navigate("/add")}>+ New Entry</button>
      </section>
      <section className="entries-grid">
        {filtered.length === 0 && <p className="empty">{entries.length === 0 ? "No entries yet — add your first!" : "No matching entries"}</p>}
        {filtered.map((e) => (
          <article key={e.id} className="entry-card"
            onClick={() => navigate(`/view/${e.id}`)}
            tabIndex={0} role="button"
            onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); navigate(`/view/${e.id}`); } }}>
            <div className="entry-date">📅 {new Date(e.date).toLocaleDateString("he-IL")}</div>
            <h3>📍 {e.location}</h3>
            <p className="entry-snippet">{e.notes.slice(0, 120)}{e.notes.length > 120 ? "…" : ""}</p>
            {e.tags && e.tags.length > 0 && (
              <div className="entry-tags">
                {e.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}

// ───────────────────── Page 2 — Entry form (add/edit) ─────────────────────
function EntryForm({ entries, setEntries, mode }) {
  const navigate = useNavigate();
  const id = mode === "edit" ? Number(window.location.pathname.split("/").pop()) : null;
  const existing = mode === "edit" ? entries.find((e) => e.id === id) : null;

  const [form, setForm] = useState(
    existing
      ? { ...existing, tagsInput: (existing.tags || []).join(", ") }
      : { date: new Date().toISOString().slice(0, 10), location: "", notes: "", tagsInput: "" }
  );
  const [errors, setErrors] = useState({});

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((e) => { const c = { ...e }; delete c[field]; return c; });
    }
  }

  function submit(e) {
    e.preventDefault();
    const errs = {};
    // ✅ Validation: date required and valid
    if (!form.date) errs.date = "Date is required";
    else if (Number.isNaN(new Date(form.date).getTime())) errs.date = "Invalid date";
    // ✅ Validation: location required
    if (!form.location.trim()) errs.location = "Location is required";
    if (!form.notes.trim())    errs.notes    = "Notes are required";

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const tags = form.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = {
      date: form.date,
      location: form.location.trim(),
      notes: form.notes,
      tags,
    };
    if (mode === "add") {
      setEntries([...entries, { ...payload, id: Date.now() }]);
    } else {
      setEntries(entries.map((e) => e.id === id ? { ...payload, id } : e));
    }
    navigate("/");
  }

  return (
    <main className="page center">
      <h1>{mode === "add" ? "📝 New Entry" : "✏️ Edit Entry"}</h1>
      <form onSubmit={submit} className="entry-form" noValidate>
        <div className={`field ${errors.date ? "has-error" : ""}`}>
          {errors.date && <p className="err-text err-red">{errors.date}</p>}
          <label>
            Date:
            <input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} />
          </label>
        </div>
        <div className={`field ${errors.location ? "has-error" : ""}`}>
          {errors.location && <p className="err-text err-red">{errors.location}</p>}
          <label>
            Location:
            <input type="text" placeholder="e.g. Tokyo, Japan"
              value={form.location} onChange={(e) => setField("location", e.target.value)} />
          </label>
        </div>
        <div className={`field ${errors.notes ? "has-error" : ""}`}>
          {errors.notes && <p className="err-text err-red">{errors.notes}</p>}
          <label>
            Notes:
            <textarea rows="6" placeholder="What did you see and feel today?"
              value={form.notes} onChange={(e) => setField("notes", e.target.value)} />
          </label>
        </div>
        <label>
          Tags (comma-separated):
          <input type="text" placeholder="food, beach, hike"
            value={form.tagsInput} onChange={(e) => setField("tagsInput", e.target.value)} />
        </label>
        <div className="row">
          <button type="submit" className="btn-primary">{mode === "add" ? "Add" : "Save"}</button>
          <button type="button" className="btn-back" onClick={() => navigate("/")}>← Back</button>
        </div>
      </form>
    </main>
  );
}

// ───────────────────── Page 3 — Entry view ─────────────────────
function EntryView({ entries, setEntries }) {
  const navigate = useNavigate();
  const id = Number(window.location.pathname.split("/").pop());
  const entry = entries.find((e) => e.id === id);
  if (!entry) return <Navigate to="/" replace />;

  function remove() {
    if (!confirm("Delete this entry?")) return;
    setEntries(entries.filter((e) => e.id !== entry.id));
    navigate("/");
  }

  return (
    <main className="page">
      <header className="entry-view-head">
        <button className="btn-back" onClick={() => navigate("/")}>← Back</button>
        <button className="btn-edit" onClick={() => navigate(`/edit/${entry.id}`)}>✏️ Edit</button>
        <button className="btn-danger" onClick={remove}>🗑 Delete</button>
      </header>
      <article className="entry-full">
        <div className="entry-date">📅 {new Date(entry.date).toLocaleDateString("he-IL", { dateStyle: "full" })}</div>
        <h1>📍 {entry.location}</h1>
        {entry.tags && entry.tags.length > 0 && (
          <div className="entry-tags">
            {entry.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
          </div>
        )}
        <div className="entry-notes" style={{ whiteSpace: "pre-wrap" }}>{entry.notes}</div>
      </article>
    </main>
  );
}
