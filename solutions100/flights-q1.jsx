// Flight Control — React Q1 (50 pts)
// Source spec: /Users/tal/Desktop/חומרים למבחן/מבחנים 1/עותק של מבחן טיסות.docx
// Target 100/100 — flight CRUD with validation, status updates,
// search/filter, color indicator per status.

import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import "./style.css";

// ───────────────────── Validators ─────────────────────
// Flight number: 2 uppercase letters + 3-4 digits (e.g. LY007, EL001)
const FLIGHT_NUMBER_RE = /^[A-Z]{2}\d{3,4}$/;
// Airport code: 3 uppercase letters (IATA)
const AIRPORT_CODE_RE  = /^[A-Z]{3}$/;

const STATUSES = [
  { value: "scheduled", label: "Scheduled", color: "#2563eb" },
  { value: "boarding",  label: "Boarding",  color: "#f59e0b" },
  { value: "departed",  label: "Departed",  color: "#7c3aed" },
  { value: "landed",    label: "Landed",    color: "#16a34a" },
  { value: "cancelled", label: "Cancelled", color: "#dc2626" },
  { value: "delayed",   label: "Delayed",   color: "#ea580c" },
];

// ───────────────────── Persistence ─────────────────────
const KEY = "flights";
function loadFlights() {
  try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch {}
  return [
    { id: 1, number: "LY007", from: "TLV", to: "JFK", status: "scheduled", time: "2026-05-10T14:30" },
    { id: 2, number: "EL101", from: "TLV", to: "LHR", status: "boarding",  time: "2026-05-09T20:00" },
    { id: 3, number: "UA215", from: "JFK", to: "TLV", status: "delayed",   time: "2026-05-10T09:15" },
  ];
}
function saveFlights(arr) { try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch {} }

// ───────────────────── App shell ─────────────────────
export default function AppShell() {
  const [flights, setFlights] = useState(loadFlights);
  useEffect(() => { saveFlights(flights); }, [flights]);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<FlightList flights={flights} setFlights={setFlights} />} />
        <Route path="/add"     element={<FlightForm flights={flights} setFlights={setFlights} mode="add" />} />
        <Route path="/edit/:id" element={<FlightForm flights={flights} setFlights={setFlights} mode="edit" />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// ───────────────────── Page 1 — Flight list ─────────────────────
function FlightList({ flights, setFlights }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  // ✅ Debounced search via simple effect
  const [debounced, setDebounced] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => {
    const term = debounced.trim().toUpperCase();
    return flights.filter((f) => {
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (!term) return true;
      return (
        f.number.includes(term) ||
        f.from.includes(term) ||
        f.to.includes(term)
      );
    });
  }, [flights, debounced, statusFilter]);

  function updateStatus(id, newStatus) {
    const flight = flights.find((f) => f.id === id);
    if (!flight) return;
    // ✅ FIXED: skip alert if same status (per spec)
    if (flight.status === newStatus) return;
    setFlights(flights.map((f) => f.id === id ? { ...f, status: newStatus } : f));
    alert(`Flight ${flight.number}: ${flight.status} → ${newStatus}`);
  }

  function remove(id) {
    if (!confirm("Delete this flight?")) return;
    setFlights(flights.filter((f) => f.id !== id));
  }

  return (
    <main className="page">
      <header className="hero">
        <h1>✈️ Flight Control</h1>
        <p>{filtered.length} flight(s)</p>
      </header>
      <section className="controls">
        <input
          type="search"
          placeholder="Search flight # / from / to"
          value={search}
          onChange={(e) => setSearch(e.target.value.toUpperCase())}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button className="btn-primary" onClick={() => navigate("/add")}>+ Add Flight</button>
      </section>
      <section className="flights-grid">
        {filtered.length === 0 && <p className="empty">No matching flights</p>}
        {filtered.map((f) => {
          const status = STATUSES.find((s) => s.value === f.status);
          return (
            <article key={f.id} className="flight-card" style={{ "--status-color": status?.color || "#666" }}>
              <header className="fc-head">
                <h3>{f.number}</h3>
                <span className="status-badge">{status?.label || f.status}</span>
              </header>
              <p>{f.from} → {f.to}</p>
              <p>{new Date(f.time).toLocaleString("he-IL")}</p>
              <select value={f.status} onChange={(e) => updateStatus(f.id, e.target.value)} aria-label={`Update status for ${f.number}`}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <div className="fc-actions">
                <button onClick={() => navigate(`/edit/${f.id}`)}>Edit</button>
                <button onClick={() => remove(f.id)} className="btn-danger">Delete</button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

// ───────────────────── Page 2 — Flight form (add/edit) ─────────────────────
function FlightForm({ flights, setFlights, mode }) {
  const navigate = useNavigate();
  // useParams not strictly needed here since we use window.location for simplicity
  const id = mode === "edit"
    ? Number(window.location.pathname.split("/").pop())
    : null;
  const existing = mode === "edit" ? flights.find((f) => f.id === id) : null;

  const [form, setForm] = useState(existing || {
    number: "", from: "", to: "", status: "scheduled", time: "",
  });
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
    // ✅ Validation: flight number regex
    if (!FLIGHT_NUMBER_RE.test(form.number))
      errs.number = "Flight number must be 2 letters + 3-4 digits (e.g. LY007)";
    // ✅ Validation: airport codes 3 uppercase letters
    if (!AIRPORT_CODE_RE.test(form.from)) errs.from = "From: 3 uppercase letters";
    if (!AIRPORT_CODE_RE.test(form.to))   errs.to   = "To: 3 uppercase letters";
    if (form.from === form.to)            errs.to   = "Origin and destination must differ";
    if (!form.time)                       errs.time = "Departure time is required";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (mode === "add") {
      setFlights([...flights, { ...form, id: Date.now() }]);
    } else {
      setFlights(flights.map((f) => f.id === id ? { ...form, id } : f));
    }
    navigate("/");
  }

  return (
    <main className="page center">
      <h1>{mode === "add" ? "✈️ Add Flight" : "✏️ Edit Flight"}</h1>
      <form onSubmit={submit} className="flight-form" noValidate>
        <Field label="Flight number (e.g. LY007)" value={form.number} onChange={(v) => setField("number", v.toUpperCase())} error={errors.number} />
        <Field label="From (IATA code)" value={form.from} onChange={(v) => setField("from", v.toUpperCase())} error={errors.from} maxLength={3} />
        <Field label="To (IATA code)"   value={form.to}   onChange={(v) => setField("to", v.toUpperCase())}   error={errors.to}   maxLength={3} />
        <label>
          Status:
          <select value={form.status} onChange={(e) => setField("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label>
          Departure:
          <input type="datetime-local" value={form.time}
            onChange={(e) => setField("time", e.target.value)}
            aria-invalid={!!errors.time} />
          {errors.time && <p className="err-text err-red">{errors.time}</p>}
        </label>
        <div className="row">
          <button type="submit" className="btn-primary">{mode === "add" ? "Add" : "Save"}</button>
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
