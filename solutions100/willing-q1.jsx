// Willing App — React Q1 (40 pts)
// Source spec: /Users/tal/Desktop/חומרים למבחן/מבחנים 1/עותק של מבחן פולסטאק מועד ב 2022.pdf
// Target 100/100 — volunteer opportunities CRUD with phone/city validation,
// filter by city, mark as selected.

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
const KEY = "willing-events";
function loadEvents() {
  try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch {}
  return [
    { id: 1, title: "Help at soup kitchen", city: "Tel Aviv",  category: "food",      phone: "0501234567", description: "Sunday morning", selected: false },
    { id: 2, title: "Beach cleanup",        city: "Netanya",  category: "environment", phone: "0521234567", description: "Saturday 9am",  selected: false },
    { id: 3, title: "Read to elderly",      city: "Jerusalem", category: "elderly",   phone: "0531234567", description: "Friday afternoon", selected: false },
  ];
}
function saveEvents(arr) { try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch {} }

const CATEGORIES = ["food", "environment", "elderly", "children", "animals", "education", "health"];

// ───────────────────── App shell ─────────────────────
export default function AppShell() {
  const [events, setEvents] = useState(loadEvents);
  useEffect(() => { saveEvents(events); }, [events]);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Home events={events} setEvents={setEvents} />} />
        <Route path="/add"     element={<AddEvent events={events} setEvents={setEvents} />} />
        <Route path="/find"    element={<FindEvents events={events} setEvents={setEvents} />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// ───────────────────── Page 1 — Home ─────────────────────
function Home({ events }) {
  const navigate = useNavigate();
  const selected = events.filter((e) => e.selected);
  return (
    <main className="page center">
      <h1>🤝 WILLING</h1>
      <p className="lead">Find volunteering opportunities near you, or add new ones.</p>
      <div className="row big-buttons">
        <button className="btn-primary" onClick={() => navigate("/add")}>הוספת התנדבות</button>
        <button className="btn-secondary" onClick={() => navigate("/find")}>מצא התנדבות</button>
      </div>
      {selected.length > 0 && (
        <section className="selected-section">
          <h2>📌 Your selections ({selected.length})</h2>
          {selected.map((e) => (
            <div key={e.id} className="event-pill">
              <strong>{e.title}</strong> — {e.city}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

// ───────────────────── Page 2 — Add Event ─────────────────────
function AddEvent({ events, setEvents }) {
  const [form, setForm] = useState({ title: "", city: "", category: CATEGORIES[0], phone: "", description: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const c = { ...e }; delete c[field]; return c; });
  }

  function submit(e) {
    e.preventDefault();
    const errs = {};
    // ✅ Validation: city required
    if (!form.city.trim()) errs.city = "City is required";
    // ✅ Validation: title required
    if (!form.title.trim()) errs.title = "Title is required";
    // ✅ Validation: phone 9-10 digits (Israeli format)
    if (!/^\d{9,10}$/.test(form.phone)) errs.phone = "Phone must be 9-10 digits";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setEvents([...events, { ...form, id: Date.now(), selected: false }]);
    alert("Event added!");
    navigate("/");
  }

  return (
    <main className="page center">
      <h1>הוספת התנדבות</h1>
      <form onSubmit={submit} className="add-form" noValidate>
        <Field label="Title"  value={form.title}  onChange={(v) => setField("title", v)}  error={errors.title} />
        <Field label="City"   value={form.city}   onChange={(v) => setField("city", v)}   error={errors.city} />
        <label>
          Category:
          <select value={form.category} onChange={(e) => setField("category", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <Field label="Phone (9-10 digits)" value={form.phone} onChange={(v) => setField("phone", v)} error={errors.phone} inputMode="numeric" />
        <label>
          Description:
          <textarea rows="3" value={form.description} onChange={(e) => setField("description", e.target.value)} />
        </label>
        <div className="row">
          <button type="submit" className="btn-primary">Add</button>
          <button type="button" className="btn-back" onClick={() => navigate("/")}>← Back</button>
        </div>
      </form>
    </main>
  );
}

function Field({ label, value, onChange, error, ...rest }) {
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      {error && <p className="err-text err-red" role="alert">{error}</p>}
      <input type="text" placeholder={label} value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label} aria-invalid={!!error} {...rest} />
    </div>
  );
}

// ───────────────────── Page 3 — Find Events ─────────────────────
function FindEvents({ events, setEvents }) {
  const [city, setCity] = useState("all");
  const [category, setCategory] = useState("all");
  const navigate = useNavigate();

  const cities = useMemo(() => Array.from(new Set(events.map((e) => e.city))).sort(), [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (city !== "all" && e.city !== city) return false;
      if (category !== "all" && e.category !== category) return false;
      return true;
    });
  }, [events, city, category]);

  function toggleSelect(id) {
    setEvents(events.map((e) => e.id === id ? { ...e, selected: !e.selected } : e));
  }

  return (
    <main className="page">
      <header className="hero">
        <h1>🔍 מצא התנדבות</h1>
        <p>{filtered.length} opportunit{filtered.length === 1 ? "y" : "ies"}</p>
      </header>
      <section className="filter-bar">
        <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Filter by city">
          <option value="all">All cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </section>
      <section className="events-grid">
        {filtered.length === 0 && <p className="empty">No opportunities matching</p>}
        {filtered.map((e) => (
          <article key={e.id} className={`event-card ${e.selected ? "is-selected" : ""}`}>
            <header>
              <h3>{e.title}</h3>
              <span className="cat-badge">{e.category}</span>
            </header>
            <p>📍 {e.city}</p>
            <p>📞 {e.phone}</p>
            <p>{e.description}</p>
            <button className={e.selected ? "btn-secondary" : "btn-primary"}
              onClick={() => toggleSelect(e.id)}
              aria-pressed={e.selected}>
              {e.selected ? "✓ Selected" : "Select"}
            </button>
          </article>
        ))}
      </section>
      <button className="btn-back" onClick={() => navigate("/")}>← Back</button>
    </main>
  );
}
