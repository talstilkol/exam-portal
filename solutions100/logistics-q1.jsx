// Logistics Management — React Q1 (75 pts)
// Source spec: /Users/tal/Desktop/חומרים למבחן/מבחנים 1/עותק של מבחן מחסן לוגיסטי.docx
// Target 100/100 — Worker + Product classes, exact 5-digit ID validation,
// exact name validation (4+ chars + space), Hebrew error alerts per spec,
// forklift license check, products list filtered by inPlace=false.

import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import "./style.css";

// ───────────────────── Classes (per spec) ─────────────────────
// Worker: 5-digit unique ID, full name, has license (boolean), visit count
class Worker {
  constructor(id, fullName, hasLicense = false) {
    this.id = String(id);
    this.fullName = fullName;
    this.hasLicense = !!hasLicense;
    this.visits = 0;
  }
  visit() { this.visits += 1; }
}

// Product: 5-digit unique ID, name, needs forklift, in place
class Product {
  constructor(id, name, needsForklift, inPlace = false) {
    this.id = String(id);
    this.name = name;
    this.needsForklift = !!needsForklift;
    this.inPlace = !!inPlace;
  }
}

// Default products — exact list from spec (English values)
const DEFAULT_PRODUCTS = () => [
  new Product(11122, "Green Box",  false),
  new Product(22554, "Green Box",  false),
  new Product(66698, "Blue Box",   true),
  new Product(78544, "Red Box",    false),
  new Product(69875, "Red Box",    false),
];

// ───────────────────── Persistence ─────────────────────
const KEY_W = "logistics-workers";
const KEY_P = "logistics-products";
const KEY_LOG = "logistics-visits-log";

function loadWorkers() {
  try {
    const raw = localStorage.getItem(KEY_W);
    if (raw) {
      const arr = JSON.parse(raw);
      return arr.map((w) => Object.assign(new Worker(w.id, w.fullName, w.hasLicense), { visits: w.visits || 0 }));
    }
  } catch {}
  return [];
}
function saveWorkers(arr) { try { localStorage.setItem(KEY_W, JSON.stringify(arr)); } catch {} }

function loadProducts() {
  try {
    const raw = localStorage.getItem(KEY_P);
    if (raw) {
      const arr = JSON.parse(raw);
      return arr.map((p) => new Product(p.id, p.name, p.needsForklift, p.inPlace));
    }
  } catch {}
  return DEFAULT_PRODUCTS();
}
function saveProducts(arr) { try { localStorage.setItem(KEY_P, JSON.stringify(arr)); } catch {} }

function loadLog() { try { const r = localStorage.getItem(KEY_LOG); return r ? JSON.parse(r) : []; } catch { return []; } }
function saveLog(arr) { try { localStorage.setItem(KEY_LOG, JSON.stringify(arr)); } catch {} }

// ───────────────────── Validators (per spec — EXACT messages) ─────────────────────
// "המספר צריך להיות בעל 5 ספרות בלבד.
//  במידה והוזן מספר אשר קטן או גדול מ-5 ספרות תופיע הודעת שגיאה
//  the number must be with 5 digits."
function validateNumber(num) {
  if (!/^\d{5}$/.test(num)) return "the number must be with 5 digits";
  return "";
}
// "שם מלא. אותיות בלבד עם רווח אחד לפחות.
//  במידה ולא יכיל רק אותיות או פחות מ-4 תווים (לא כולל הרווח):
//  the name must contain minimum 4 characters."
function validateFullName(name) {
  if (!name || !name.trim()) return "the name must contain minimum 4 characters";
  // letters + spaces only, at least one space
  if (!/^[A-Za-z]+( [A-Za-z]+)+$/.test(name.trim()))
    return "the name must contain minimum 4 characters";
  const lettersOnly = name.replace(/\s/g, "");
  if (lettersOnly.length < 4)
    return "the name must contain minimum 4 characters";
  return "";
}

// ───────────────────── App shell ─────────────────────
export default function AppShell() {
  const [workers, setWorkers]   = useState(loadWorkers);
  const [products, setProducts] = useState(loadProducts);
  const [log, setLog]           = useState(loadLog);
  const [currentWorkerId, setCurrentWorkerId] = useState(null);

  useEffect(() => { saveWorkers(workers); },   [workers]);
  useEffect(() => { saveProducts(products); }, [products]);
  useEffect(() => { saveLog(log); },           [log]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<HomePage />} />
        <Route path="/signup"  element={<SignupPage workers={workers} setWorkers={setWorkers} />} />
        <Route path="/login"   element={<LoginPage workers={workers} onLogin={setCurrentWorkerId} />} />
        <Route path="/welcome" element={
          currentWorkerId
            ? <WelcomePage
                workers={workers} setWorkers={setWorkers}
                products={products} setProducts={setProducts}
                log={log} setLog={setLog}
                currentWorkerId={currentWorkerId}
                onLogout={() => setCurrentWorkerId(null)}
              />
            : <Navigate to="/" replace />
        } />
        <Route path="/visits" element={
          <VisitsPage log={log} workers={workers} products={products} />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// ───────────────────── Page 1 — Home (Sign up + Log in) ─────────────────────
function HomePage() {
  const navigate = useNavigate();
  return (
    <main className="page center bg-gray">
      <h1>Logistics Management</h1>
      <div className="home-buttons">
        <button className="btn-blue" onClick={() => navigate("/signup")}>
          Sign up
        </button>
        <button className="btn-blue" onClick={() => navigate("/login")}>
          Log in
        </button>
      </div>
    </main>
  );
}

// ───────────────────── Page 2 — Sign up ─────────────────────
function SignupPage({ workers, setWorkers }) {
  const [form, setForm] = useState({ no: "", fullName: "", hasLicense: false });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((e) => {
        const c = { ...e };
        delete c[field];
        return c;
      });
    }
  }

  function submit(e) {
    e.preventDefault();
    const errs = {};
    const numErr  = validateNumber(form.no);
    const nameErr = validateFullName(form.fullName);
    if (numErr)  errs.no = numErr;
    if (nameErr) errs.fullName = nameErr;
    // ✅ uniqueness — find by NO only (per spec)
    if (!numErr && workers.some((w) => w.id === form.no))
      errs.no = "Worker NO already exists";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const newWorker = new Worker(form.no, form.fullName.trim(), form.hasLicense);
    setWorkers([...workers, newWorker]);
    alert("Sign up successful");
    navigate("/login");
  }

  return (
    <main className="page center">
      <h1>Sign up</h1>
      <form onSubmit={submit} className="signup-form" noValidate>
        <Field
          label="NO."
          value={form.no}
          onChange={(v) => setField("no", v)}
          error={errors.no}
          inputMode="numeric"
          maxLength={5}
        />
        <Field
          label="FullName"
          value={form.fullName}
          onChange={(v) => setField("fullName", v)}
          error={errors.fullName}
        />
        <fieldset className="radio-group">
          <legend>Forklift truck</legend>
          <label>
            <input
              type="radio"
              name="license"
              checked={form.hasLicense === true}
              onChange={() => setField("hasLicense", true)}
            /> yes
          </label>
          <label>
            <input
              type="radio"
              name="license"
              checked={form.hasLicense === false}
              onChange={() => setField("hasLicense", false)}
            /> no
          </label>
        </fieldset>
        <button type="submit" className="btn-blue">Create</button>
      </form>
    </main>
  );
}

// Reusable field with red error above input
function Field({ label, value, onChange, error, ...rest }) {
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <input
        type="text"
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        aria-invalid={!!error}
        {...rest}
      />
      {/* ✅ Red error below input per spec image */}
      {error && <p className="err-text err-red" role="alert">{error}</p>}
    </div>
  );
}

// ───────────────────── Page 3 — Log in ─────────────────────
function LoginPage({ workers, onLogin }) {
  const [no, setNo] = useState("");
  const navigate = useNavigate();

  function submit(e) {
    e.preventDefault();
    const found = workers.find((w) => w.id === no);
    // ✅ FIXED: exact Hebrew alert text per spec — "X העובד לא קיים"
    if (!found) {
      alert("X העובד לא קיים");
      return;
    }
    onLogin(no);
    navigate("/welcome");
  }

  return (
    <main className="page center">
      <h1>log in</h1>
      <form onSubmit={submit} className="login-form" noValidate>
        <input
          type="text"
          placeholder="NO."
          value={no}
          onChange={(e) => setNo(e.target.value)}
          aria-label="Worker NO"
          maxLength={5}
        />
        <button type="submit" className="btn-blue">Enter</button>
      </form>
    </main>
  );
}

// ───────────────────── Page 4 — Welcome (after login) ─────────────────────
function WelcomePage({ workers, setWorkers, products, setProducts, log, setLog, currentWorkerId, onLogout }) {
  const navigate = useNavigate();
  const worker = workers.find((w) => w.id === currentWorkerId);

  // ✅ Show only products that are NOT in place (inPlace=false)
  const visible = useMemo(
    () => products.filter((p) => !p.inPlace),
    [products]
  );

  if (!worker) return <Navigate to="/" replace />;

  function update(productId) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    // ✅ FIXED: forklift license logic per spec
    if (product.needsForklift && !worker.hasLicense) {
      alert("יש צורך ברישיון למלגזה");
      return;
    }
    // mark in place + remove from visible list, increment worker visits
    const updatedProducts = products.map((p) =>
      p.id === productId ? new Product(p.id, p.name, p.needsForklift, true) : p
    );
    const updatedWorkers = workers.map((w) =>
      w.id === worker.id
        ? Object.assign(new Worker(w.id, w.fullName, w.hasLicense), { visits: (w.visits || 0) + 1 })
        : w
    );
    setProducts(updatedProducts);
    setWorkers(updatedWorkers);
    setLog([
      ...log,
      { workerId: worker.id, productId, at: new Date().toISOString() },
    ]);
  }

  return (
    <main className="page welcome-page">
      <header className="welcome-header">
        <h1>Welcome {worker.fullName}</h1>
        <button className="btn-logout" onClick={() => { onLogout(); navigate("/"); }}>
          Log Out
        </button>
      </header>

      <section className="details-card">
        <h2>Details:</h2>
        <p>Full Name: <strong>{worker.fullName}</strong></p>
        <p>NO.: <strong>{worker.id}</strong></p>
        {/* ✅ FIXED: license display in Hebrew (כן/לא) per spec */}
        <p>Forklift truck license: <strong>{worker.hasLicense ? "כן" : "לא"}</strong></p>
        <p>Visits to warehouse: <strong>{worker.visits || 0}</strong></p>
      </section>

      <section className="products-list">
        <h2>List of products</h2>
        {visible.length === 0 && <p className="empty">All products are in place ✓</p>}
        {visible.map((p) => (
          <article key={p.id} className="product-card">
            <div className="product-info">
              <p>NO. <strong>{p.id}</strong></p>
              <p>Name: <strong>{p.name}</strong></p>
              <p>Need forklift truck: <strong>{p.needsForklift ? "yes" : "no"}</strong></p>
            </div>
            <button className="btn-update" onClick={() => update(p.id)}>
              Update
            </button>
          </article>
        ))}
      </section>

      <button className="btn-link" onClick={() => navigate("/visits")}>
        ← View all worker visits
      </button>
    </main>
  );
}

// ───────────────────── Page 5 — Visits log (extra view per spec) ─────────────────────
function VisitsPage({ log, workers, products }) {
  const navigate = useNavigate();
  return (
    <main className="page">
      <h1>📋 כל הכניסות למחסן</h1>
      {log.length === 0 && <p className="empty">No visits recorded yet</p>}
      <table className="visits-table">
        <thead>
          <tr><th>Worker</th><th>Product</th><th>Time</th></tr>
        </thead>
        <tbody>
          {log.map((entry, i) => {
            const w = workers.find((x) => x.id === entry.workerId);
            const p = products.find((x) => x.id === entry.productId);
            return (
              <tr key={i}>
                <td>{w ? `${w.fullName} (${w.id})` : entry.workerId}</td>
                <td>{p ? `${p.name} (${p.id})` : entry.productId}</td>
                <td>{new Date(entry.at).toLocaleString("he-IL")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button className="btn-back" onClick={() => navigate(-1)}>← BACK</button>
    </main>
  );
}
