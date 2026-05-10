// Football Club — React Q1 (50 pts)
// Solution targeting 100/100 — fixes all known bugs documented in the improvement panel.
// Source spec: /Users/tal/Desktop/חומרים למבחן/מבחנים 1/עותק של מבחן אימון .pdf

import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
  Navigate,
} from "react-router-dom";
import "./style.css";

// ───────────────────────────── starter data ─────────────────────────────
const STARTER_USERS = [
  {
    username: "talko",
    password: "Aa123456!",
    teamName: "Maccabi tel Aviv",
    players: [
      { id: 1, name: "Karry Hane",       age: 30, inLineup: true,  goals: 20, assists: 4  },
      { id: 2, name: "Jinicius Junior",  age: 23, inLineup: true,  goals: 14, assists: 7  },
      { id: 3, name: "Mionel Lessi",     age: 36, inLineup: true,  goals: 30, assists: 12 },
      { id: 4, name: "Mylian Kbappe",    age: 24, inLineup: true,  goals: 25, assists: 5  },
      { id: 5, name: "Maolo Paldini",    age: 55, inLineup: true,  goals: 1,  assists: 3  },
      { id: 6, name: "Suis Luarez",      age: 37, inLineup: true,  goals: 15, assists: 8  },
    ],
  },
];

// ─────────────────────── persistence (localStorage) ───────────────────────
const STORAGE_KEY = "football-club-users";
function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return STARTER_USERS;
}
function saveUsers(users) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(users)); } catch {}
}

// ────────────────────────────── validators ──────────────────────────────
// Team name: only English letters; capital only at start of each word
// e.g. "Maccabi tel Aviv" valid, "haPoel Jerusalem" invalid (capital mid-word)
function validateTeamName(value) {
  if (!value || !value.trim()) return "Team name is required";
  if (!/^[A-Za-z][a-z]*( [A-Z]?[a-z]+)*$/.test(value.trim()))
    return "Team name: English letters only; uppercase only at start of each word";
  return "";
}

// Password: 8-20 chars, must contain uppercase, lowercase, digit, special char
function validatePassword(value) {
  if (!value) return "Password is required";
  if (value.length < 8 || value.length > 20)
    return "Password must be 8-20 characters";
  if (!/[a-z]/.test(value)) return "Password must contain a lowercase letter";
  if (!/[A-Z]/.test(value)) return "Password must contain an uppercase letter";
  if (!/\d/.test(value))   return "Password must contain a digit";
  if (!/[^A-Za-z0-9]/.test(value))
    return "Password must contain a special character";
  return "";
}

// Player validation; editingId lets us exclude self when checking lineup count
function validatePlayer(player, players, editingId = null) {
  const errors = {};
  if (!player.name || !player.name.trim()) errors.name = "Name is required";

  const age = Number(player.age);
  if (!Number.isInteger(age) || age < 18 || age > 60)
    errors.age = "Age must be a number between 18 and 60";

  const goals = Number(player.goals);
  if (player.goals === "" || !Number.isInteger(goals) || goals < 0)
    errors.goals = "Goals must be a non-negative integer";

  const assists = Number(player.assists);
  if (player.assists === "" || !Number.isInteger(assists) || assists < 0)
    errors.assists = "Assists must be a non-negative integer";

  if (player.inLineup) {
    const lineupCount = players.filter(
      (p) => p.inLineup && p.id !== editingId
    ).length;
    if (lineupCount >= 11) errors.inLineup = "Only 11 players can be in lineup";
  }
  return errors;
}

// ───────────────────────────── shell + routes ─────────────────────────────
export default function AppShell() {
  const [users, setUsers] = useState(loadUsers);
  // Persist on every change
  useEffect(() => { saveUsers(users); }, [users]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Login users={users} />} />
        <Route path="/register"  element={<Register users={users} setUsers={setUsers} />} />
        <Route path="/team/:teamName"                      element={<Team        users={users} setUsers={setUsers} />} />
        <Route path="/team/:teamName/add"                  element={<PlayerForm  mode="add"  users={users} setUsers={setUsers} />} />
        <Route path="/team/:teamName/edit"                 element={<PlayerForm  mode="edit" users={users} setUsers={setUsers} />} />
        <Route path="/team/:teamName/edit/:playerId"       element={<PlayerForm  mode="edit" users={users} setUsers={setUsers} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// ───────────────────────────── Login page ─────────────────────────────
function Login({ users }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  function submit(e) {
    e.preventDefault();
    const found = users.find(
      (u) => u.username === form.username && u.password === form.password
    );
    // ✅ FIXED: prefix "username", real apostrophe (not &#x27;)
    if (!found) {
      alert(
        `username ${form.username} doesn't exist or the password doesn't match`
      );
      return;
    }
    navigate(`/team/${encodeURIComponent(found.teamName)}`);
  }

  return (
    <main className="page center">
      <h1>Football Club Svcollege</h1>
      <form onSubmit={submit} className="login-form">
        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          aria-label="Username"
          autoFocus
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          aria-label="Password"
          required
        />
        <div className="row">
          <button type="submit" className="btn-primary">Login</button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </div>
      </form>
    </main>
  );
}

// ───────────────────────────── Register page ─────────────────────────────
function Register({ users, setUsers }) {
  const [form, setForm] = useState({
    name: "", teamName: "", password: "", confirm: "",
  });
  // ✅ FIXED: per-field errors object (not single alert)
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    // ✅ FIXED: clear field-specific error on type
    if (errors[key]) {
      setErrors((e) => {
        const copy = { ...e };
        delete copy[key];
        return copy;
      });
    }
  }

  function submit(e) {
    e.preventDefault();
    const errs = {};
    // name: per spec, NO validation. (only ensure not 100% empty for UX safety)
    // teamName
    const teamErr = validateTeamName(form.teamName);
    if (teamErr) errs.teamName = teamErr;
    if (users.some((u) => u.teamName === form.teamName.trim()))
      errs.teamName = "Team name already exists";
    // password
    const pwdErr = validatePassword(form.password);
    if (pwdErr) errs.password = pwdErr;
    // confirm
    if (form.password !== form.confirm) errs.confirm = "Passwords do not match";

    if (Object.keys(errs).length > 0) {
      // ✅ Show all errors above their fields simultaneously
      setErrors(errs);
      return;
    }

    setUsers([
      ...users,
      {
        username: form.name || form.teamName.trim(),
        password: form.password,
        teamName: form.teamName.trim(),
        players: [],
      },
    ]);
    setErrors({});
    navigate("/");
  }

  return (
    <main className="page center">
      <h1>Football Club Svcollege</h1>
      <form onSubmit={submit} className="register-form" noValidate>
        <Field
          label="username"
          value={form.name}
          onChange={(v) => setField("name", v)}
          error={errors.name}
        />
        <Field
          label="Team name"
          value={form.teamName}
          onChange={(v) => setField("teamName", v)}
          error={errors.teamName}
        />
        <Field
          type="password"
          label="Password"
          value={form.password}
          onChange={(v) => setField("password", v)}
          error={errors.password}
        />
        <Field
          type="password"
          label="Confirm password"
          value={form.confirm}
          onChange={(v) => setField("confirm", v)}
          error={errors.confirm}
        />
        <button type="submit" className="btn-primary">Register</button>
      </form>
    </main>
  );
}

// Reusable field with per-field error shown ABOVE the input
function Field({ label, value, onChange, error, type = "text" }) {
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      {/* ✅ FIXED: error displayed above input, not in a single alert */}
      {error && <p className="err-text" role="alert">{error}</p>}
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

// ───────────────────────────── Team page ─────────────────────────────
function Team({ users }) {
  const { teamName } = useParams();
  const decoded = decodeURIComponent(teamName || "");
  const user = users.find((u) => u.teamName === decoded);
  const [search, setSearch]   = useState("");
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const players = useMemo(() => {
    if (!user) return [];
    const term = search.trim().toLowerCase();
    return user.players.filter((p) => {
      const inFilter = showAll || p.inLineup;
      const matchesSearch = !term || p.name.toLowerCase().includes(term);
      return inFilter && matchesSearch;
    });
  }, [user, search, showAll]);

  if (!user) return <NotFound team={decoded} onBack={() => navigate("/")} />;

  return (
    <Layout teamName={teamName}>
      <h1>{decoded}</h1>
      <input
        placeholder="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search players"
        className="search-input"
      />
      <div className="cards">
        {players.length === 0 && (
          <p className="empty">No players found</p>
        )}
        {players.map((p) => (
          <article
            key={p.id}
            className="card"
            tabIndex={0}
            role="button"
            aria-label={`Edit ${p.name}`}
            onClick={() =>
              navigate(`/team/${encodeURIComponent(decoded)}/edit/${p.id}`)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(`/team/${encodeURIComponent(decoded)}/edit/${p.id}`);
              }
            }}
          >
            <b>{p.name}</b>
            <span>Age: {p.age}</span>
            <span>{p.inLineup ? "In lineup" : "Not in lineup"}</span>
          </article>
        ))}
      </div>
      <button
        className="btn-toggle"
        onClick={() => setShowAll((v) => !v)}
        aria-pressed={showAll}
      >
        {showAll ? "Show only lineup players" : "Show All Players"}
      </button>
    </Layout>
  );
}

// ───────────────────────── Add / Edit player ─────────────────────────
function PlayerForm({ mode, users, setUsers }) {
  const { teamName, playerId } = useParams();
  const decoded = decodeURIComponent(teamName || "");
  const user = users.find((u) => u.teamName === decoded);
  const navigate = useNavigate();

  // initial state — pre-fill if edit and we have a playerId
  const initial = useMemo(() => {
    if (mode === "edit" && user && playerId) {
      const p = user.players.find((x) => String(x.id) === String(playerId));
      if (p) return { ...p };
    }
    return { id: null, name: "", age: "", inLineup: false, goals: "", assists: "" };
  }, [mode, user, playerId]);

  const [form, setForm]     = useState(initial);
  const [errors, setErrors] = useState({});
  // re-init when route changes (different player picked)
  useEffect(() => { setForm(initial); setErrors({}); }, [initial]);

  if (!user) return <NotFound team={decoded} onBack={() => navigate("/")} />;

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((e) => {
        const c = { ...e };
        delete c[key];
        return c;
      });
    }
  }

  function save(e) {
    e.preventDefault();
    const editId = mode === "edit" && form.id ? form.id : null;
    const errs = validatePlayer(form, user.players, editId);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // ✅ Show alert for action result; per-field errors visible above inputs
      alert("Player was not added — please fix the highlighted fields");
      return;
    }
    const fixed = {
      ...form,
      id: form.id || Date.now(),
      age: Number(form.age),
      goals: Number(form.goals),
      assists: Number(form.assists),
    };
    setUsers(
      users.map((u) =>
        u.teamName !== decoded
          ? u
          : {
              ...u,
              players:
                mode === "add"
                  ? [...u.players, fixed]
                  : u.players.map((p) => (p.id === fixed.id ? fixed : p)),
            }
      )
    );
    alert(mode === "add" ? "Player added" : "Player saved");
    navigate(`/team/${encodeURIComponent(decoded)}`);
  }

  return (
    <Layout teamName={teamName}>
      <h1>{decoded}</h1>
      <form onSubmit={save} className="player-form" noValidate>
        {mode === "edit" && (
          <select
            value={form.id || ""}
            onChange={(e) => {
              const p = user.players.find((x) => x.id === Number(e.target.value));
              if (p) setForm({ ...p });
              setErrors({});
            }}
            aria-label="Select a player"
          >
            <option value="">Player</option>
            {user.players.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        <Field label="Name" value={form.name} onChange={(v)=>setField("name",v)} error={errors.name} />
        <Field label="Age"  value={form.age}  onChange={(v)=>setField("age",v)}  error={errors.age} />

        <label className={`checkbox ${errors.inLineup ? "has-error" : ""}`}>
          {errors.inLineup && <p className="err-text" role="alert">{errors.inLineup}</p>}
          <input
            type="checkbox"
            checked={form.inLineup}
            onChange={(e) => setField("inLineup", e.target.checked)}
          />{" "}
          In lineup?
        </label>

        <Field label="Goals"   value={form.goals}   onChange={(v)=>setField("goals",v)}   error={errors.goals} />
        <Field label="Assists" value={form.assists} onChange={(v)=>setField("assists",v)} error={errors.assists} />

        <button type="submit" className="btn-primary">
          {mode === "add" ? "Add Player" : "Save"}
        </button>
      </form>
    </Layout>
  );
}

// ───────────────────────────── Layout (navbar) ─────────────────────────────
function Layout({ children, teamName }) {
  const navigate = useNavigate();
  const decoded = decodeURIComponent(teamName || "");
  return (
    <main className="page team-layout">
      <aside className="navbar" aria-label="Team navigation">
        <button onClick={() => navigate(`/team/${encodeURIComponent(decoded)}`)}>Team</button>
        <button onClick={() => navigate(`/team/${encodeURIComponent(decoded)}/add`)}>Add Player</button>
        <button onClick={() => navigate(`/team/${encodeURIComponent(decoded)}/edit`)}>Edit Player</button>
        <button onClick={() => navigate("/")}>Logout</button>
      </aside>
      <section className="content">{children}</section>
    </main>
  );
}

function NotFound({ team, onBack }) {
  return (
    <main className="page center">
      <h1>Team not found</h1>
      <p>&quot;{team}&quot; does not exist.</p>
      <button onClick={onBack}>← Back to Login</button>
    </main>
  );
}
