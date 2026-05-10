import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./style.css";
 
const initialTrips = [
  { id: 1, area: "Israel", description: "Short family trip", days: 3, partners: ["Dana", "Ben"] }
];
 
function validateTrip(trip) {
  if (!/^[A-Za-z]{2,100}$/.test(trip.area)) return "Area must be English letters, 2-100 chars";
  if (!trip.description || trip.description.length > 200) return "Description must be up to 200 chars";
  const days = Number(trip.days);
  if (!Number.isInteger(days) || days < 1 || days > 100) return "Days must be 1-100";
  if (trip.partners.some(p => !/^[A-Za-z]{1,15}$/.test(p))) return "Partner names must be English letters up to 15 chars";
  return null;
}
 
function App() {
  const [logged, setLogged] = useState(false);
  const [trips, setTrips] = useState(initialTrips);
  return <BrowserRouter><Routes>
    <Route path="/" element={<SignIn setLogged={setLogged} />} />
    <Route path="/home" element={<Home logged={logged} setLogged={setLogged} trips={trips} />} />
    <Route path="/add" element={<AddUpdate mode="add" logged={logged} setLogged={setLogged} trips={trips} setTrips={setTrips} />} />
    <Route path="/update" element={<AddUpdate mode="update" logged={logged} setLogged={setLogged} trips={trips} setTrips={setTrips} />} />
  </Routes></BrowserRouter>;
}
 
function Shell({ logged, setLogged, children }) {
  const navigate = useNavigate();
  function go(path) { if (logged) navigate(path); }
  return <main className="app"><h1>TRAVEL-SV</h1><aside><button disabled={logged} onClick={() => navigate("/")}>SignIn</button><button disabled={!logged} onClick={() => go("/home")}>Home</button><button disabled={!logged} onClick={() => go("/add")}>Add</button><button disabled={!logged} onClick={() => go("/update")}>Update</button><button disabled={!logged} onClick={() => { setLogged(false); navigate("/"); }}>Logout</button></aside><section>{children}</section></main>;
}
 
function SignIn({ setLogged }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  function login() {
    if (form.username !== "svcollege" || form.password !== "abcde") return alert("One of the entered details is invalid");
    setLogged(true);
    navigate("/home");
  }
  return <Shell logged={false} setLogged={setLogged}><input placeholder="User Name" onChange={e => setForm({ ...form, username: e.target.value })} /><input placeholder="Password" type="password" onChange={e => setForm({ ...form, password: e.target.value })} /><button onClick={login}>Login</button></Shell>;
}
 
function Home({ logged, setLogged, trips }) {
  const [index, setIndex] = useState(Math.max(0, trips.length - 1));
  const trip = trips[index];
  return <Shell logged={logged} setLogged={setLogged}>{trip ? <article className="trip"><button onClick={() => setIndex((index - 1 + trips.length) % trips.length)}>◀</button><h2>{trip.area}</h2><p>{trip.description}</p><p>{trip.days} days</p><p>{trip.partners.join(", ")}</p><button onClick={() => setIndex((index + 1) % trips.length)}>▶</button></article> : <p>No trips yet</p>}</Shell>;
}
 
function AddUpdate({ mode, logged, setLogged, trips, setTrips }) {
  const [selectedId, setSelectedId] = useState(trips[0]?.id || "");
  const selected = trips.find(t => t.id === Number(selectedId));
  const [form, setForm] = useState(mode === "update" && selected ? selected : { area: "", description: "", days: "", partners: [""] });
  const navigate = useNavigate();
  function addPartner() { setForm({ ...form, partners: [...form.partners, ""] }); }
  function changePartner(value, i) { setForm({ ...form, partners: form.partners.map((p, idx) => idx === i ? value : p) }); }
  function submit() {
    const err = validateTrip(form);
    if (err) return alert(err);
    const fixed = { ...form, id: form.id || Date.now(), days: Number(form.days), partners: form.partners.filter(Boolean) };
    setTrips(mode === "add" ? [...trips, fixed] : trips.map(t => t.id === fixed.id ? fixed : t));
    navigate("/home");
  }
  return <Shell logged={logged} setLogged={setLogged}>{mode === "update" ? <select value={selectedId} onChange={e => { const t = trips.find(x => x.id === Number(e.target.value)); setSelectedId(e.target.value); setForm(t); }}><option value="">Area</option>{trips.map(t => <option key={t.id} value={t.id}>{t.area}</option>)}</select> : <input placeholder="Area" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} />}
    <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
    <input placeholder="Days" value={form.days} onChange={e => setForm({ ...form, days: e.target.value })} />
    {form.partners.map((p, i) => <input key={i} placeholder="Partner" value={p} onChange={e => changePartner(e.target.value, i)} />)}<button onClick={addPartner}>+</button><button onClick={submit}>{mode === "add" ? "Add" : "Update"}</button></Shell>;
}
 
export default App;
