import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import "./style.css";
 
const SERVICES = {
  101: { name: "מגן דוד אדום", icon: "A" },
  100: { name: "משטרה", icon: "B" },
  102: { name: "כיבוי והצלה", icon: "C" }
};
 
function validName(name) { return name.length >= 4 && !/\d/.test(name); }
function validPassword(pass) { return pass.length === 8 && /[A-Za-z]/.test(pass) && /\d/.test(pass); }
 
function App() {
  const saved = JSON.parse(localStorage.getItem("helpme-user") || "null");
  const [user, setUser] = useState(saved);
  const [service, setService] = useState("101");
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={!user ? <Register setUser={setUser} /> : <Home user={user} service={service} setService={setService} />} />
      <Route path="/:clientName" element={<Home user={user} service={service} setService={setService} />} />
      <Route path="/request/:phone" element={<Request user={user} service={service} />} />
    </Routes>
  </BrowserRouter>;
}
 
function Register({ setUser }) {
  const [form, setForm] = useState({ fullName: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  function change(next) {
    setForm(next);
    if (!validName(next.fullName)) return setError("שם מלא: לפחות 4 תווים וללא ספרות");
    if (!validPassword(next.password)) return setError("ססמא: 8 תווים עם אות וספרה לפחות");
    const user = { fullName: next.fullName, password: next.password };
    localStorage.setItem("helpme-user", JSON.stringify(user));
    setUser(user);
    navigate(`/${encodeURIComponent(user.fullName)}`);
  }
  return <main className="phone"><h1>הרשמה</h1>{error && <p className="error">{error}</p>}<input placeholder="שם מלא" onChange={e => change({ ...form, fullName: e.target.value })} /><input placeholder="ססמא" type="password" onChange={e => change({ ...form, password: e.target.value })} /><footer>helpMe!</footer></main>;
}
 
function Home({ user, service, setService }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  if (!user) return <p>Register first</p>;
  const data = SERVICES[service];
  return <main className="phone"><header><span>{data.icon}</span><b>{service}</b><button onClick={() => setOpen(!open)}>☰</button></header>
    {open && <section className="menu">{Object.keys(SERVICES).map(phone => <button className={phone === service ? "selected" : ""} key={phone} onClick={() => { setService(phone); setOpen(false); }}>{SERVICES[phone].name} {phone}</button>)}</section>}
    <button className="help" onClick={() => navigate(`/request/${service}`)}>הצילו</button><footer>helpMe!</footer></main>;
}
 
function Request({ user }) {
  const { phone } = useParams();
  const [tries, setTries] = useState(0);
  const [locked, setLocked] = useState(false);
  const [form, setForm] = useState({ p1: "", p2: "" });
  const navigate = useNavigate();
  if (!user) return <p>Register first</p>;
  function cancel() {
    if (locked) return;
    if (form.p1 === user.password && form.p2 === user.password) return navigate(`/${encodeURIComponent(user.fullName)}`);
    const next = tries + 1;
    setTries(next);
    if (next >= 3) setLocked(true);
    alert("Wrong password");
  }
  return <main className="phone"><header><span>{SERVICES[phone].icon}</span><b>{phone}</b><button>☰</button></header>
    <section className="request"><p>{phone} {SERVICES[phone].name}</p><p>{user.fullName}</p></section>
    <input type="password" placeholder="ססמא" onChange={e => setForm({ ...form, p1: e.target.value })} />
    <input type="password" placeholder="אישור ססמא" onChange={e => setForm({ ...form, p2: e.target.value })} />
    <button disabled={locked} onClick={cancel}>{locked ? "נעול" : "ביטול"}</button>
  </main>;
}
 
export default App;
