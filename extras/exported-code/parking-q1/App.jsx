import { useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./style.css";
 
const cityPrices = { telaviv: 150, netanya: 100, rehovot: 50 };
const cityNames = { telaviv: "Tel Aviv", netanya: "Netanya", rehovot: "Rehovot" };
const startUsers = [{ username: "admin", password: "Aa$123", carNumber: "20809001", carType: "mazda", activeParking: null, history: [] }];
 
function validRegister(form) {
  if (!/^[a-z]+$/.test(form.username)) return "Username must contain lowercase letters only";
  if (!/^\d{8}$/.test(form.carNumber)) return "Car number must be exactly 8 digits";
  if (!form.carType.trim()) return "Car type is required";
  if (!/^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{4,8}$/.test(form.password)) return "Password must be 4-8 chars with uppercase and special char";
  return null;
}
 
function App() {
  const [users, setUsers] = useState(startUsers);
  const [current, setCurrent] = useState(null);
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login users={users} setCurrent={setCurrent} />} />
      <Route path="/signup" element={<Signup users={users} setUsers={setUsers} />} />
      <Route path="/choose-parking" element={<Choose users={users} setUsers={setUsers} current={current} setCurrent={setCurrent} />} />
      <Route path="/active-parking" element={<Active users={users} setUsers={setUsers} current={current} setCurrent={setCurrent} />} />
      <Route path="/history" element={<History current={current} users={users} setCurrent={setCurrent} />} />
    </Routes>
  </BrowserRouter>;
}
 
function Header({ current, setCurrent }) {
  const navigate = useNavigate();
  return <>
    <h1>sv parking</h1>
    {current && <nav>
      <button onClick={() => navigate("/active-parking")}>Active Parking</button>
      <button onClick={() => navigate("/choose-parking")}>Parking</button>
      <button onClick={() => navigate("/history")}>History</button>
      <button onClick={() => { setCurrent(null); navigate("/"); }}>Exit</button>
    </nav>}
  </>;
}
 
function Login({ users, setCurrent }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  function signin() {
    const user = users.find(u => u.username === form.username && u.password === form.password);
    if (!user) return alert("User was not found by the entered details");
    setCurrent(user.username);
    navigate("/choose-parking");
  }
  return <main className="page center"><Header />
    <input placeholder="USERNAME" onChange={e => setForm({ ...form, username: e.target.value })} />
    <input placeholder="PASSWORD" type="password" onChange={e => setForm({ ...form, password: e.target.value })} />
    <button onClick={signin}>SIGNIN</button>
    <button onClick={() => navigate("/signup")}>SIGNUP</button>
  </main>;
}
 
function Signup({ users, setUsers }) {
  const [form, setForm] = useState({ username: "", carNumber: "", carType: "", password: "" });
  const navigate = useNavigate();
  function submit() {
    const err = validRegister(form);
    if (err) return alert(err);
    if (users.some(u => u.username === form.username)) return alert("Username already exists");
    setUsers([...users, { ...form, activeParking: null, history: [] }]);
    navigate("/");
  }
  return <main className="page center"><Header />
    {Object.keys(form).map(key => <input key={key} placeholder={key.toUpperCase()} type={key === "password" ? "password" : "text"} onChange={e => setForm({ ...form, [key]: e.target.value })} />)}
    <button onClick={submit}>REGISTER</button>
  </main>;
}
 
function Choose({ users, setUsers, current, setCurrent }) {
  const [city, setCity] = useState("");
  const navigate = useNavigate();
  const user = users.find(u => u.username === current);
  if (!user) return <Login users={users} setCurrent={setCurrent} />;
  function start() {
    if (!city) return alert("Choose city first");
    if (user.activeParking) return alert("Only one parking can be active until payment");
    const activeParking = { city, cost: cityPrices[city], carNumber: user.carNumber, carType: user.carType, startedAt: Date.now() };
    setUsers(users.map(u => u.username === current ? { ...u, activeParking } : u));
    navigate("/active-parking");
  }
  return <main className="page"><Header current={current} setCurrent={setCurrent} />
    <section className="panel"><select value={city} onChange={e => setCity(e.target.value)}><option value="">CHOOSE CITY</option>{Object.keys(cityPrices).map(c => <option key={c} value={c}>{cityNames[c]}</option>)}</select>
    <h2>Car number: {user.carNumber}</h2><button onClick={start}>START PARKING</button></section>
  </main>;
}
 
function Active({ users, setUsers, current, setCurrent }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = users.find(u => u.username === current);
  if (!user) return <Login users={users} setCurrent={setCurrent} />;
  function pay() {
    const paid = { ...user.activeParking, paidAt: Date.now() };
    setUsers(users.map(u => u.username === current ? { ...u, activeParking: null, history: [...u.history, paid] } : u));
    navigate("/history");
  }
  return <main className="page"><Header current={current} setCurrent={setCurrent} />
    {!user.activeParking ? <p>No active parking</p> : <article className="parking" onClick={() => setOpen(true)}>
      <p>CAR: {user.activeParking.carType}</p><p>NUMBER: {user.activeParking.carNumber}</p><p>CITY: {cityNames[user.activeParking.city]}</p>
      {open && <div className="modal"><b>Cost: {user.activeParking.cost}</b><button onClick={pay}>PAY</button><button onClick={e => { e.stopPropagation(); setOpen(false); }}>CLOSE</button></div>}
    </article>}
  </main>;
}
 
function History({ current, users, setCurrent }) {
  const user = users.find(u => u.username === current);
  return <main className="page"><Header current={current} setCurrent={setCurrent} />
    {(user?.history || []).map((p, i) => <article className="parking" key={i}>CAR: {p.carType}<br/>NUMBER: {p.carNumber}<br/>Cost: {p.cost}</article>)}
  </main>;
}
 
export default App;
