import { useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import "./style.css";
 
const starterUsers = [
  {
    username: "talko",
    password: "Aa123456!",
    teamName: "Maccabi tel Aviv",
    players: [
      { id: 1, name: "Karry Hane", age: 30, inLineup: true, goals: 20, assists: 4 },
      { id: 2, name: "Jinicius Junior", age: 23, inLineup: true, goals: 14, assists: 7 },
      { id: 3, name: "Mionel Lessi", age: 36, inLineup: true, goals: 30, assists: 12 },
      { id: 4, name: "Mylian Kbappe", age: 24, inLineup: true, goals: 25, assists: 5 },
      { id: 5, name: "Maolo Paldini", age: 55, inLineup: true, goals: 1, assists: 3 },
      { id: 6, name: "Suis Luarez", age: 37, inLineup: true, goals: 15, assists: 8 }
    ]
  }
];
 
function isTeamNameValid(value) {
  return /^[A-Z]?[a-z]+( [A-Z]?[a-z]+)*$/.test(value.trim());
}
 
function isStrongPassword(value) {
  return value.length >= 8 && value.length <= 20 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}
 
function isPlayerValid(player, players, editingId = null) {
  const nameOk = player.name.trim().length > 0;
  const age = Number(player.age);
  const goals = Number(player.goals);
  const assists = Number(player.assists);
  const lineupCount = players.filter(p => p.inLineup && p.id !== editingId).length;
  if (!nameOk) return "Name is required";
  if (!Number.isInteger(age) || age < 18 || age > 60) return "Age must be 18-60";
  if (!Number.isInteger(goals) || !Number.isInteger(assists)) return "Goals and assists must be numbers";
  if (player.inLineup && lineupCount >= 11) return "Only 11 players can be in lineup";
  return null;
}
 
function AppShell() {
  const [users, setUsers] = useState(starterUsers);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login users={users} />} />
        <Route path="/register" element={<Register users={users} setUsers={setUsers} />} />
        <Route path="/team/:teamName" element={<Team users={users} setUsers={setUsers} />} />
        <Route path="/team/:teamName/add" element={<PlayerForm mode="add" users={users} setUsers={setUsers} />} />
        <Route path="/team/:teamName/edit" element={<PlayerForm mode="edit" users={users} setUsers={setUsers} />} />
        <Route path="/team/:teamName/edit/:playerId" element={<PlayerForm mode="edit" users={users} setUsers={setUsers} />} />
      </Routes>
    </BrowserRouter>
  );
}
 
function Login({ users }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  function submit() {
    const found = users.find(u => u.username === form.username && u.password === form.password);
    if (!found) return alert(`${form.username} doesn't exist or the password doesn't match`);
    navigate(`/team/${encodeURIComponent(found.teamName)}`);
  }
  return <main className="page center">
    <h1>Football Club Svcollege</h1>
    <input placeholder="Username" onChange={e => setForm({ ...form, username: e.target.value })} />
    <input placeholder="Password" type="password" onChange={e => setForm({ ...form, password: e.target.value })} />
    <button onClick={submit}>Login</button>
    <button onClick={() => navigate("/register")}>Register</button>
  </main>;
}
 
function Register({ users, setUsers }) {
  const [form, setForm] = useState({ username: "", teamName: "", password: "", confirm: "" });
  const navigate = useNavigate();
  function error() {
    if (!form.username.trim()) return "Username is required";
    if (users.some(u => u.username === form.username)) return "Username already exists";
    if (!isTeamNameValid(form.teamName)) return "Team name must contain English letters only and no uppercase inside words";
    if (!isStrongPassword(form.password)) return "Password must be 8-20 chars with uppercase, lowercase, number and special char";
    if (form.password !== form.confirm) return "Passwords do not match";
    return null;
  }
  function submit() {
    const err = error();
    if (err) return alert(err);
    setUsers([...users, { username: form.username, password: form.password, teamName: form.teamName, players: [] }]);
    navigate("/");
  }
  return <main className="page center">
    <h1>Football Club Svcollege</h1>
    {Object.keys(form).map(key => <input key={key} placeholder={key} type={key.includes("password") || key === "confirm" ? "password" : "text"} onChange={e => setForm({ ...form, [key]: e.target.value })} />)}
    <button onClick={submit}>Register</button>
  </main>;
}
 
function Layout({ children, teamName }) {
  const navigate = useNavigate();
  return <main className="page team-layout">
    <aside>
      <button onClick={() => navigate(`/team/${teamName}`)}>Team</button>
      <button onClick={() => navigate(`/team/${teamName}/add`)}>Add Player</button>
      <button onClick={() => navigate(`/team/${teamName}/edit`)}>Edit Player</button>
      <button onClick={() => navigate("/")}>Logout</button>
    </aside>
    <section className="content">{children}</section>
  </main>;
}
 
function Team({ users, setUsers }) {
  const { teamName } = useParams();
  const decodedTeam = decodeURIComponent(teamName);
  const user = users.find(u => u.teamName === decodedTeam);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  if (!user) return <p>Team not found</p>;
  const players = user.players.filter(p => (showAll || p.inLineup) && p.name.toLowerCase().includes(search.toLowerCase()));
  return <Layout teamName={teamName}>
    <h1>{decodedTeam}</h1>
    <input placeholder="Search" onChange={e => setSearch(e.target.value)} />
    <div className="cards">
      {players.map(p => <article key={p.id} onClick={() => navigate(`/team/${teamName}/edit/${p.id}`)} className="card">
        <b>{p.name}</b><span>Age: {p.age}</span><span>{p.inLineup ? "In lineup" : "Not in lineup"}</span>
      </article>)}
    </div>
    <button onClick={() => setShowAll(!showAll)}>{showAll ? "Show only lineup players" : "Show All Players"}</button>
  </Layout>;
}
 
function PlayerForm({ mode, users, setUsers }) {
  const { teamName, playerId } = useParams();
  const decodedTeam = decodeURIComponent(teamName);
  const user = users.find(u => u.teamName === decodedTeam);
  const navigate = useNavigate();
  const initial = user?.players.find(p => String(p.id) === String(playerId)) || { name: "", age: "", inLineup: false, goals: "", assists: "" };
  const [form, setForm] = useState(initial);
  if (!user) return <p>Team not found</p>;
  function save() {
    const editId = mode === "edit" && form.id ? form.id : null;
    const err = isPlayerValid(form, user.players, editId);
    if (err) return alert(err);
    const fixed = { ...form, id: form.id || Date.now(), age: Number(form.age), goals: Number(form.goals), assists: Number(form.assists) };
    setUsers(users.map(u => u.teamName !== decodedTeam ? u : { ...u, players: mode === "add" ? [...u.players, fixed] : u.players.map(p => p.id === fixed.id ? fixed : p) }));
    alert(mode === "add" ? "Player added" : "Player saved");
    navigate(`/team/${teamName}`);
  }
  return <Layout teamName={teamName}>
    <h1>{decodedTeam}</h1>
    {mode === "edit" && <select onChange={e => setForm(user.players.find(p => p.id === Number(e.target.value)))} value={form.id || ""}>
      <option value="">Player</option>{user.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>}
    <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
    <input placeholder="Age" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
    <label><input type="checkbox" checked={form.inLineup} onChange={e => setForm({ ...form, inLineup: e.target.checked })} /> In lineup?</label>
    <input placeholder="Goals" value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} />
    <input placeholder="Assists" value={form.assists} onChange={e => setForm({ ...form, assists: e.target.value })} />
    <button onClick={save}>{mode === "add" ? "Add Player" : "Save"}</button>
  </Layout>;
}
 
export default AppShell;
