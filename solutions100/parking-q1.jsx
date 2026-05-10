// SV Parking — React Q1 (50 pts)
// Source spec: /Users/tal/Desktop/חומרים למבחן/מבחנים 1/עותק של מבחן חדש 2023.pdf
// Target 100/100 — exact city prices, signin/signup, choose-parking, active-parking,
// history (paid only), persistence, logout.

import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
  Link,
} from "react-router-dom";
import "./style.css";

// ───────────────────── City pricing (per spec) ─────────────────────
// "תל אביב 150 ₪, נתניה 100 ₪, רחובות 50 ₪"
const CITY_PRICES = {
  "Tel Aviv": 150,
  "Netanya":  100,
  "Rehovot":  50,
};

// ───────────────────── Persistence ─────────────────────
const KEY_USERS    = "parking-users";
const KEY_SESSION  = "parking-session";
const KEY_ACTIVE   = "parking-active";
const KEY_HISTORY  = "parking-history";

function loadUsers()    { try { const r = localStorage.getItem(KEY_USERS);   return r ? JSON.parse(r) : []; } catch { return []; } }
function saveUsers(arr) { try { localStorage.setItem(KEY_USERS, JSON.stringify(arr)); } catch {} }
function loadSession()  { try { return localStorage.getItem(KEY_SESSION); } catch { return null; } }
function saveSession(u) { try { u ? localStorage.setItem(KEY_SESSION, u) : localStorage.removeItem(KEY_SESSION); } catch {} }
function loadActive()   { try { const r = localStorage.getItem(KEY_ACTIVE);  return r ? JSON.parse(r) : null; } catch { return null; } }
function saveActive(a)  { try { a ? localStorage.setItem(KEY_ACTIVE, JSON.stringify(a)) : localStorage.removeItem(KEY_ACTIVE); } catch {} }
function loadHistory()  { try { const r = localStorage.getItem(KEY_HISTORY); return r ? JSON.parse(r) : []; } catch { return []; } }
function saveHistory(h) { try { localStorage.setItem(KEY_HISTORY, JSON.stringify(h)); } catch {} }

// ───────────────────── App shell ─────────────────────
export default function AppShell() {
  const [users, setUsers]     = useState(loadUsers);
  const [session, setSession] = useState(loadSession);
  const [active, setActive]   = useState(loadActive);
  const [history, setHistory] = useState(loadHistory);

  useEffect(() => { saveUsers(users); },     [users]);
  useEffect(() => { saveSession(session); }, [session]);
  useEffect(() => { saveActive(active); },   [active]);
  useEffect(() => { saveHistory(history); }, [history]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={session ? <Navigate to="/choose-parking" replace /> : <Welcome />} />
        <Route path="/signup"   element={<Signup users={users} setUsers={setUsers} setSession={setSession} />} />
        <Route path="/signin"   element={<Signin users={users} setSession={setSession} />} />
        <Route path="/choose-parking"   element={session ? <Choose users={users} session={session} active={active} setActive={setActive} setSession={setSession} /> : <Navigate to="/" replace />} />
        <Route path="/active-parking"   element={session && active ? <Active users={users} session={session} active={active} setActive={setActive} history={history} setHistory={setHistory} setSession={setSession} /> : <Navigate to="/choose-parking" replace />} />
        <Route path="/history"  element={session ? <History history={history} session={session} setSession={setSession} /> : <Navigate to="/" replace />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// ───────────────────── Page 1 — Welcome (signin/signup) ─────────────────────
function Welcome() {
  const navigate = useNavigate();
  return (
    <main className="page center">
      <h1>🅿️ SV Parking</h1>
      <p>Manage your parking — pay by city, track your sessions.</p>
      <div className="row">
        <button className="btn-primary" onClick={() => navigate("/signin")}>Sign In</button>
        <button className="btn-secondary" onClick={() => navigate("/signup")}>Sign Up</button>
      </div>
    </main>
  );
}

// ───────────────────── Page 2 — Sign Up ─────────────────────
function Signup({ users, setUsers, setSession }) {
  const [form, setForm] = useState({ username: "", password: "", car: "", phone: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((e) => { const c = { ...e }; delete c[field]; return c; });
    }
  }

  function submit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.username.trim()) errs.username = "Username is required";
    if (users.some((u) => u.username === form.username)) errs.username = "Username already exists";
    if (form.password.length < 6) errs.password = "Password must be at least 6 chars";
    if (!form.car.trim()) errs.car = "Car number is required";
    // ✅ Phone: 9-10 digits per Israeli format
    if (!/^\d{9,10}$/.test(form.phone)) errs.phone = "Phone must be 9-10 digits";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setUsers([...users, { ...form }]);
    setSession(form.username);
    navigate("/choose-parking", { replace: true });
  }

  return (
    <main className="page center">
      <h1>Sign Up</h1>
      <form onSubmit={submit} className="signup-form" noValidate>
        <Field label="Username" value={form.username} onChange={(v) => setField("username", v)} error={errors.username} />
        <Field label="Password" type="password" value={form.password} onChange={(v) => setField("password", v)} error={errors.password} />
        <Field label="Car number" value={form.car} onChange={(v) => setField("car", v)} error={errors.car} />
        <Field label="Phone (9-10 digits)" value={form.phone} onChange={(v) => setField("phone", v)} error={errors.phone} inputMode="numeric" />
        <button type="submit" className="btn-primary">Sign Up</button>
      </form>
    </main>
  );
}

// Reusable field
function Field({ label, value, onChange, error, type = "text", ...rest }) {
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      {error && <p className="err-text err-red" role="alert">{error}</p>}
      <input
        type={type}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        aria-invalid={!!error}
        {...rest}
      />
    </div>
  );
}

// ───────────────────── Page 3 — Sign In ─────────────────────
function Signin({ users, setSession }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  function submit(e) {
    e.preventDefault();
    const found = users.find((u) => u.username === form.username && u.password === form.password);
    if (!found) { setError("Username or password incorrect"); return; }
    setSession(form.username);
    navigate("/choose-parking", { replace: true });
  }
  return (
    <main className="page center">
      <h1>Sign In</h1>
      <form onSubmit={submit} className="signin-form" noValidate>
        <input type="text" placeholder="Username"
          value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input type="password" placeholder="Password"
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="err-text err-red">{error}</p>}
        <button type="submit" className="btn-primary">Sign In</button>
      </form>
    </main>
  );
}

// ───────────────────── Layout (navbar) ─────────────────────
function Layout({ children, session, setSession }) {
  const navigate = useNavigate();
  function logout() { setSession(null); navigate("/", { replace: true }); }
  return (
    <main className="page parking-layout">
      <aside className="navbar" aria-label="Navigation">
        <div className="nav-user">👤 {session}</div>
        <button onClick={() => navigate("/choose-parking")}>Choose Parking</button>
        <button onClick={() => navigate("/active-parking")}>Active Parking</button>
        <button onClick={() => navigate("/history")}>History</button>
        <button className="btn-logout" onClick={logout}>Logout</button>
      </aside>
      <section className="content">{children}</section>
    </main>
  );
}

// ───────────────────── Page 4 — Choose Parking ─────────────────────
function Choose({ users, session, active, setActive, setSession }) {
  const me = users.find((u) => u.username === session);
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function start() {
    setError("");
    // ✅ FIXED: city + car required
    if (!city) { setError("Please choose a city"); return; }
    if (!me?.car) { setError("Car number missing on profile"); return; }
    if (active) { setError("You already have an active parking. Pay first."); return; }
    setActive({
      city,
      pricePerHour: CITY_PRICES[city],
      car: me.car,
      startedAt: new Date().toISOString(),
    });
    navigate("/active-parking");
  }

  return (
    <Layout session={session} setSession={setSession}>
      <h1>Choose Parking</h1>
      {active && (
        <div className="alert">
          You have an active parking in <strong>{active.city}</strong>.
          <Link to="/active-parking">Go to active →</Link>
        </div>
      )}
      <div className="city-grid">
        {Object.entries(CITY_PRICES).map(([name, price]) => (
          <button
            key={name}
            className={`city-card ${city === name ? "selected" : ""}`}
            onClick={() => setCity(name)}
            aria-pressed={city === name}
          >
            <h3>{name}</h3>
            {/* ✅ Exact prices per spec */}
            <p className="price">₪{price}/h</p>
          </button>
        ))}
      </div>
      <p>Car: <strong>{me?.car || "—"}</strong></p>
      {error && <p className="err-text err-red">{error}</p>}
      <button className="btn-primary" onClick={start} disabled={!city || !!active}>
        Start Parking
      </button>
    </Layout>
  );
}

// ───────────────────── Page 5 — Active Parking ─────────────────────
function Active({ users, session, active, setActive, history, setHistory, setSession }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());
  // ✅ Real-time clock — updates every second
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const startedAt = new Date(active.startedAt).getTime();
  const elapsedMs = now - startedAt;
  const minutes = Math.max(1, Math.ceil(elapsedMs / 60000));
  const cost = Math.ceil((elapsedMs / 3600000) * active.pricePerHour * 100) / 100;

  function pay() {
    const finalCost = Math.max(active.pricePerHour, cost); // minimum 1 hour
    const entry = {
      id: Date.now(),
      city: active.city,
      car: active.car,
      startedAt: active.startedAt,
      endedAt: new Date().toISOString(),
      minutes,
      cost: finalCost,
      paid: true,
    };
    setHistory([...history, entry]);
    setActive(null);
    alert(`Paid ₪${finalCost} for ${minutes}min in ${active.city}`);
    navigate("/history");
  }

  function close() {
    if (!confirm("Cancel parking without payment?")) return;
    const entry = {
      id: Date.now(),
      city: active.city,
      car: active.car,
      startedAt: active.startedAt,
      endedAt: new Date().toISOString(),
      minutes,
      cost: 0,
      paid: false,
    };
    setHistory([...history, entry]);
    setActive(null);
    navigate("/choose-parking");
  }

  return (
    <Layout session={session} setSession={setSession}>
      <h1>Active Parking</h1>
      <section className="active-card">
        <div className="active-pulse" aria-hidden="true">●</div>
        <h2>{active.city}</h2>
        <p>Car: <strong>{active.car}</strong></p>
        <p>Rate: <strong>₪{active.pricePerHour}/h</strong></p>
        <p>Started: <strong>{new Date(active.startedAt).toLocaleString("he-IL")}</strong></p>
        <p>Elapsed: <strong>{minutes} min</strong></p>
        <p className="big">Cost: <strong>₪{cost.toFixed(2)}</strong></p>
      </section>
      <div className="actions-row">
        {/* ✅ FIXED: Pay only enabled when there is active parking */}
        <button className="btn-primary" onClick={pay} disabled={!active}>
          Pay ₪{Math.max(active.pricePerHour, cost).toFixed(2)}
        </button>
        <button className="btn-back" onClick={close}>Cancel without paying</button>
      </div>
    </Layout>
  );
}

// ───────────────────── Page 6 — History (paid only per spec) ─────────────────────
function History({ history, session, setSession }) {
  // ✅ FIXED: spec — only paid (completed) parkings shown
  const paid = useMemo(() => history.filter((h) => h.paid), [history]);
  return (
    <Layout session={session} setSession={setSession}>
      <h1>History</h1>
      <p>Showing only <strong>completed</strong> (paid) parkings.</p>
      {paid.length === 0 && <p className="empty">No completed parkings yet</p>}
      <table className="history-table">
        <thead>
          <tr><th>City</th><th>Car</th><th>Start</th><th>End</th><th>Minutes</th><th>Cost</th></tr>
        </thead>
        <tbody>
          {paid.slice().reverse().map((h) => (
            <tr key={h.id}>
              <td>{h.city}</td>
              <td>{h.car}</td>
              <td>{new Date(h.startedAt).toLocaleString("he-IL")}</td>
              <td>{new Date(h.endedAt).toLocaleString("he-IL")}</td>
              <td>{h.minutes}</td>
              <td>₪{h.cost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}
