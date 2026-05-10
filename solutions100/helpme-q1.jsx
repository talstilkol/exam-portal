// HelpMe — React Q1 (75 pts)
// Source spec: /Users/tal/Desktop/חומרים למבחן/מבחנים 1/עותק של מבחן מועד א פולסטאק (1).pdf
// Target 100/100 — first-time-only signup, 3-attempt lock with locked state,
// service selector persistence, big red emergency button, validations exact to spec.

import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import "./style.css";

// ───────────────────── Persistence (localStorage) ─────────────────────
const KEY_USER     = "helpme-user";
const KEY_SERVICE  = "helpme-service-choice";
const KEY_LOCKED   = "helpme-locked";

function loadUser()    { try { const r = localStorage.getItem(KEY_USER); return r ? JSON.parse(r) : null; } catch { return null; } }
function saveUser(u)   { try { localStorage.setItem(KEY_USER, JSON.stringify(u)); } catch {} }
function loadService() { try { return localStorage.getItem(KEY_SERVICE) || ""; } catch { return ""; } }
function saveService(s){ try { localStorage.setItem(KEY_SERVICE, s); } catch {} }
function loadLocked()  { try { return localStorage.getItem(KEY_LOCKED) === "1"; } catch { return false; } }
function saveLocked(v) { try { localStorage.setItem(KEY_LOCKED, v ? "1" : "0"); } catch {} }

// ───────────────────── Validators (per spec) ─────────────────────
// "שם מלא — לפחות באורך 4 תווים ללא ספרות כלל"
function validateName(name) {
  if (!name || name.length < 4) return "Name must be at least 4 characters";
  if (/\d/.test(name))           return "Name must NOT contain digits";
  return "";
}
// "סיסמה — באורך 8 תווים עם אות אחת וספרה אחת לפחות"
function validatePassword(pwd) {
  if (!pwd || pwd.length < 8)        return "Password must be at least 8 characters";
  if (!/[a-zA-Z]/.test(pwd))         return "Password must contain at least one letter";
  if (!/\d/.test(pwd))               return "Password must contain at least one digit";
  return "";
}

// Emergency services per spec — מד״א / משטרה / מכבי אש
const SERVICES = [
  { id: "mda",     label: "מגן דוד אדום", phone: "101", color: "#dc2626", icon: "🚑" },
  { id: "police",  label: "משטרה",        phone: "100", color: "#1e40af", icon: "🚓" },
  { id: "fire",    label: "מכבי אש",      phone: "102", color: "#ea580c", icon: "🚒" },
];

// ───────────────────── App shell ─────────────────────
export default function AppShell() {
  const [user, setUser]       = useState(loadUser);
  const [service, setService] = useState(loadService);

  useEffect(() => { saveUser(user);    }, [user]);
  useEffect(() => { saveService(service); }, [service]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ FIXED: registration only on first time. After that, route to home. */}
        <Route path="/"        element={user ? <Home user={user} service={service} setService={setService} setUser={setUser} /> : <Register setUser={setUser} />} />
        <Route path="/register" element={<Register setUser={setUser} />} />
        <Route path="/help"    element={user ? <HelpScreen user={user} service={service} setUser={setUser} /> : <Navigate to="/" replace />} />
        <Route path="/menu"    element={user ? <MenuScreen service={service} setService={setService} /> : <Navigate to="/" replace />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// ───────────────────── Page 1 — Register (first time only) ─────────────────────
function Register({ setUser }) {
  const [form, setForm]     = useState({ name: "", password: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    // ✅ Clear field-specific error on type
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
    const nameErr = validateName(form.name);
    const pwdErr  = validatePassword(form.password);
    if (nameErr) errs.name = nameErr;
    if (pwdErr)  errs.password = pwdErr;
    if (Object.keys(errs).length > 0) {
      // ✅ FIXED: errors shown above each input separately, in red, simultaneously
      setErrors(errs);
      return;
    }
    setUser({ name: form.name, password: form.password, registeredAt: Date.now() });
    setErrors({});
    navigate("/", { replace: true });
  }

  return (
    <main className="page center">
      <h1>📝 הרשמה — פעם ראשונה בלבד</h1>
      <p className="lead">רישום זה יישמר במכשיר שלך ולא יוצג שוב לאחר ההרשמה.</p>
      <form onSubmit={submit} className="register-form" noValidate>
        <Field
          label="שם מלא"
          value={form.name}
          onChange={(v) => setField("name", v)}
          error={errors.name}
        />
        <Field
          type="password"
          label="ססמא"
          value={form.password}
          onChange={(v) => setField("password", v)}
          error={errors.password}
        />
        <button type="submit" className="btn-primary">הרשמה</button>
      </form>
    </main>
  );
}

// Reusable field (error above input, in red, per spec)
function Field({ label, value, onChange, error, type = "text" }) {
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      {/* ✅ FIXED: error displayed above input in red */}
      {error && <p className="err-text err-red" role="alert">{error}</p>}
      <input
        type={type}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        aria-invalid={!!error}
      />
    </div>
  );
}

// ───────────────────── Page 2 — Home (big red button) ─────────────────────
function Home({ user, service, setService, setUser }) {
  const navigate = useNavigate();
  const selected = useMemo(
    () => SERVICES.find((s) => s.id === service),
    [service]
  );

  function help() {
    // ✅ Optional: vibration feedback for tactile confirmation
    if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
    navigate("/help");
  }

  return (
    <main className="page center">
      <header className="home-head">
        <h1>HelpMe!</h1>
        <p>שלום {user.name}</p>
      </header>

      {/* ✅ Service selector visible at top — saved choice persists */}
      <div className="service-bar" role="group" aria-label="בחירת מוקד חירום">
        {SERVICES.map((s) => (
          <button
            key={s.id}
            className={`svc-btn ${selected?.id === s.id ? "active" : ""}`}
            style={{ "--svc-color": s.color }}
            onClick={() => setService(s.id)}
            aria-pressed={selected?.id === s.id}
          >
            <span className="svc-icon">{s.icon}</span>
            <span className="svc-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* ✅ Big red "הצילו" button — center, large, animated pulse */}
      <button
        className="help-btn"
        onClick={help}
        aria-label="לחץ לקריאה לעזרה דחופה"
      >
        הצילו
      </button>

      <button
        className="btn-secondary"
        onClick={() => navigate("/menu")}
      >
        תפריט
      </button>
    </main>
  );
}

// ───────────────────── Page 3 — Help (rescue screen + cancel) ─────────────────────
function HelpScreen({ user, service, setUser }) {
  const navigate = useNavigate();
  const selected = useMemo(
    () => SERVICES.find((s) => s.id === service),
    [service]
  );

  // ✅ FIXED: 3-attempt lock state — survives across renders + persisted
  const [locked, setLocked]     = useState(loadLocked);
  const [attempts, setAttempts] = useState(0);
  const [pwd1, setPwd1]         = useState("");
  const [pwd2, setPwd2]         = useState("");
  const [error, setError]       = useState("");

  useEffect(() => { saveLocked(locked); }, [locked]);

  function tryCancel(e) {
    e.preventDefault();
    if (locked) return;
    // ✅ Spec: double password — both must match user's password and each other
    if (pwd1 !== pwd2) {
      setError("שתי הסיסמאות אינן זהות");
      return;
    }
    if (pwd1 === user.password) {
      setError("");
      setAttempts(0);
      setLocked(false);
      alert("הצלה בוטלה בהצלחה");
      navigate("/", { replace: true });
      return;
    }
    // wrong password — count attempt
    const next = attempts + 1;
    setAttempts(next);
    if (next >= 3) {
      // ✅ FIXED: after 3 wrong attempts → locked
      setLocked(true);
      setError("ננעל — חרגת מ-3 ניסיונות");
      alert("המערכת ננעלה — שלוש ניסיונות סיסמה שגויים");
    } else {
      setError(`סיסמה שגויה. נשארו ${3 - next} ניסיונות`);
    }
    setPwd1("");
    setPwd2("");
  }

  return (
    <main
      className="page center help-screen"
      style={{ "--svc-color": selected?.color || "#dc2626" }}
    >
      <header className="rescue-head">
        <h1>🆘 הצלה בדרך</h1>
        <p>נשלחה הודעה ל־{selected?.label || "מד״א"} (חיוג {selected?.phone || "101"})</p>
      </header>

      <section className="user-details">
        <h2>פרטי המשתמש</h2>
        <p><strong>שם:</strong> {user.name}</p>
        <p><strong>זמן בקשה:</strong> {new Date().toLocaleString("he-IL")}</p>
      </section>

      {/* ✅ Cancel form: 2 password inputs + button. Locked after 3 failed attempts. */}
      <section className="cancel-section">
        <h3>{locked ? "המערכת נעולה" : "ביטול הצלה"}</h3>
        {locked ? (
          <p className="locked-msg">לא ניתן לבטל — נחרגת ממכסת הניסיונות.</p>
        ) : (
          <form onSubmit={tryCancel} noValidate>
            <input
              type="password"
              placeholder="ססמא"
              value={pwd1}
              onChange={(e) => setPwd1(e.target.value)}
              aria-label="ססמא"
              disabled={locked}
            />
            <input
              type="password"
              placeholder="ססמא שוב"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              aria-label="ססמא לאישור"
              disabled={locked}
            />
            {error && <p className="err-text err-red" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={locked || !pwd1 || !pwd2}
              className="btn-cancel"
            >
              בטל הצלה
            </button>
            <p className="attempts-hint">ניסיונות שנותרו: {3 - attempts}</p>
          </form>
        )}
      </section>
    </main>
  );
}

// ───────────────────── Page 4 — Menu (service selection) ─────────────────────
function MenuScreen({ service, setService }) {
  const navigate = useNavigate();
  return (
    <main className="page center">
      <h1>📋 תפריט מוקדים</h1>
      <p>בחר את המוקד שאליו תועבר ההודעה במצב חירום:</p>
      <div className="service-bar service-bar-big">
        {SERVICES.map((s) => (
          <button
            key={s.id}
            className={`svc-btn svc-btn-big ${service === s.id ? "active" : ""}`}
            style={{ "--svc-color": s.color }}
            onClick={() => setService(s.id)}
            aria-pressed={service === s.id}
          >
            <span className="svc-icon">{s.icon}</span>
            <span className="svc-label">{s.label}</span>
            <span className="svc-phone">{s.phone}</span>
          </button>
        ))}
      </div>
      <button className="btn-back" onClick={() => navigate("/")}>
        ← חזרה
      </button>
    </main>
  );
}
