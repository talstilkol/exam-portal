import { useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./style.css";
 
const initialFlights = [
  { id: "101", company: "Elal", passengers: 180 },
  { id: "204", company: "Arkia", passengers: 90 },
  { id: "333", company: "Delta", passengers: 220 },
  { id: "444", company: "Lufthansa", passengers: 140 }
];
 
function isFlightValid(form, flights) {
  if (!/^\d{1,5}$/.test(form.id)) return "Flight number must be numeric up to 5 digits";
  if (flights.some(f => f.id === form.id)) return "Flight number already exists";
  if (!/[A-Za-z]/.test(form.company)) return "Company must contain at least one letter";
  const passengers = Number(form.passengers);
  if (!Number.isInteger(passengers) || passengers < 1 || passengers > 450) return "Passengers must be 1-450";
  return null;
}
 
function App() {
  const [flights, setFlights] = useState(initialFlights);
  const [logged, setLogged] = useState(false);
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login setLogged={setLogged} />} />
      <Route path="/controlpanel" element={<Control flights={flights} />} />
      <Route path="/controlpanel/sort" element={<Sort flights={flights} />} />
      <Route path="/controlpanel/add" element={<Add flights={flights} setFlights={setFlights} />} />
      <Route path="/controlpanel/delete" element={<Delete flights={flights} setFlights={setFlights} />} />
    </Routes>
  </BrowserRouter>;
}
 
function Login({ setLogged }) {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  function enter() {
    if (password !== "12345") return alert("Wrong password");
    setLogged(true);
    navigate("/controlpanel");
  }
  return <main className="page center"><h1>Flight Control</h1><input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} /><button onClick={enter}>כניסה</button></main>;
}
 
function Menu() {
  const navigate = useNavigate();
  return <aside className="menu"><button onClick={() => navigate("/controlpanel")}>כל הטיסות</button><button onClick={() => navigate("/controlpanel/sort")}>מיון טיסות</button><button onClick={() => navigate("/controlpanel/add")}>הוסף טיסה</button><button onClick={() => navigate("/controlpanel/delete")}>מחק טיסה</button></aside>;
}
 
function FlightCards({ flights }) {
  return <div className="cards">{flights.map(f => <article className="card" key={f.id}><b>מספר טיסה: {f.id}</b><span>חברה: {f.company}</span><span>נוסעים: {f.passengers}</span></article>)}</div>;
}
 
function Control({ flights }) {
  return <main className="panel"><Menu /><section><h1>כל הטיסות</h1><FlightCards flights={flights} /></section></main>;
}
 
function Sort({ flights }) {
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("");
  const shown = useMemo(() => {
    let result = flights.filter(f => f.company.toLowerCase().includes(search.toLowerCase()));
    if (order === "low") result = [...result].sort((a, b) => a.passengers - b.passengers);
    if (order === "high") result = [...result].sort((a, b) => b.passengers - a.passengers);
    return result;
  }, [flights, search, order]);
  return <main className="panel"><Menu /><section><input placeholder="מיון לפי חברה" onChange={e => setSearch(e.target.value)} /><select onChange={e => setOrder(e.target.value)}><option value="">בחר מיון</option><option value="low">הכי מעט נוסעים</option><option value="high">הכי הרבה נוסעים</option></select><FlightCards flights={shown} /></section></main>;
}
 
function Add({ flights, setFlights }) {
  const [form, setForm] = useState({ id: "", company: "", passengers: "" });
  const navigate = useNavigate();
  function add() {
    const err = isFlightValid(form, flights);
    if (err) return alert(err);
    setFlights([...flights, { ...form, passengers: Number(form.passengers) }]);
    navigate("/controlpanel");
  }
  return <main className="panel"><Menu /><section>{Object.keys(form).map(k => <input key={k} placeholder={k} onChange={e => setForm({ ...form, [k]: e.target.value })} />)}<button onClick={add}>צור</button></section></main>;
}
 
function Delete({ flights, setFlights }) {
  const [id, setId] = useState("");
  function remove() {
    if (!/^\d{1,5}$/.test(id)) return alert("Flight number must be numeric up to 5 digits");
    const exists = flights.some(f => f.id === id);
    if (!exists) return alert("No such flight");
    const next = flights.filter(f => f.id !== id);
    setFlights(next);
    alert(`Flight deleted. Total flights: ${next.length}. Total passengers: ${next.reduce((s, f) => s + f.passengers, 0)}`);
  }
  return <main className="panel"><Menu /><section><input placeholder="Flight number" onChange={e => setId(e.target.value)} /><button onClick={remove}>מחק</button></section></main>;
}
 
export default App;
