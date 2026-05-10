import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import "./style.css";
 
const initialClients = [
  { id: "123456789", username: "shem bar", password: "123456", money: 1000, expenses: [{ company: "Ebay", amount: 50 }, { company: "Levis", amount: 500 }] },
  { id: "987654321", username: "dor chen", password: "abcdef", money: 2500, expenses: [] },
  { id: "555555555", username: "max nudler", password: "111111", money: 700, expenses: [{ company: "SushiBar", amount: 35 }] }
];
 
function validateClient(form, clients, editingId = null) {
  if (!/^\d{9}$/.test(form.id)) return "ID must be exactly 9 digits";
  if (!editingId && clients.some(c => c.id === form.id)) return "ID already exists";
  if (form.username.trim().length < 4) return "User name must be at least 4 chars";
  if (form.password.length < 6) return "Password minimum 6 chars";
  if (form.confirm !== undefined && form.password !== form.confirm) return "Passwords must match";
  const money = Number(form.money);
  if (!Number.isFinite(money) || money < 0 || money > 1000000) return "Money must be 0-1000000";
  return null;
}
 
function App() {
  const [clients, setClients] = useState(initialClients);
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login clients={clients} />} />
      <Route path="/register" element={<Register clients={clients} setClients={setClients} />} />
      <Route path="/edit/:id" element={<Register clients={clients} setClients={setClients} edit />} />
      <Route path="/client/:id" element={<Client clients={clients} setClients={setClients} />} />
      <Route path="/admin" element={<Admin clients={clients} setClients={setClients} />} />
    </Routes>
  </BrowserRouter>;
}
 
function Login({ clients }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  function enter() {
    if (form.username === "ADMIN" && form.password === "ADMIN") return navigate("/admin");
    const client = clients.find(c => c.username === form.username && c.password === form.password);
    if (!client) return alert("Wrong user name or password");
    navigate(`/client/${client.id}`);
  }
  return <main className="center"><h1>SV-BANK</h1><input placeholder="User Name" onChange={e => setForm({ ...form, username: e.target.value })} /><input placeholder="Password" type="password" onChange={e => setForm({ ...form, password: e.target.value })} /><button onClick={() => navigate("/register")}>Create new user</button><button onClick={enter}>ENTER</button></main>;
}
 
function Register({ clients, setClients, edit = false }) {
  const { id } = useParams();
  const old = clients.find(c => c.id === id);
  const [form, setForm] = useState(old ? { ...old, confirm: old.password } : { id: "", username: "", password: "", confirm: "", money: "" });
  const navigate = useNavigate();
  function save() {
    const err = validateClient(form, clients, edit ? id : null);
    if (err) return alert(err);
    const fixed = { id: form.id, username: form.username, password: form.password, money: Number(form.money), expenses: old?.expenses || [] };
    setClients(edit ? clients.map(c => c.id === id ? fixed : c) : [...clients, fixed]);
    navigate(`/client/${fixed.id}`);
  }
  return <main className="center"><h1>REGISTER</h1>{["id", "username", "password", "confirm", "money"].map(k => <input key={k} placeholder={k} value={form[k] ?? ""} type={k.includes("password") || k === "confirm" ? "password" : "text"} onChange={e => setForm({ ...form, [k]: e.target.value })} />)}<button onClick={save}>Create</button></main>;
}
 
function Client({ clients, setClients }) {
  const { id } = useParams();
  const client = clients.find(c => c.id === id);
  const [showAction, setShowAction] = useState(false);
  const [expense, setExpense] = useState({ amount: "", company: "" });
  const navigate = useNavigate();
  if (!client) return <p>Client not found</p>;
  function addExpense() {
    const amount = Number(expense.amount);
    setClients(clients.map(c => c.id === id ? { ...c, expenses: [...c.expenses, { company: expense.company, amount }], money: c.money - amount } : c));
    setShowAction(false);
    setExpense({ amount: "", company: "" });
  }
  return <main className="center"><h1>Welcome {client.username}</h1><button onClick={() => alert(`Balance: ${client.money}`)}>Balance</button><button onClick={() => setShowAction(true)}>ACTION</button><button onClick={() => navigate(`/edit/${id}`)}>EDIT</button><button onClick={() => navigate("/")}>EXIT</button>{showAction && <section><input type="number" placeholder="amount" onChange={e => setExpense({ ...expense, amount: e.target.value })} /><input placeholder="company" onChange={e => setExpense({ ...expense, company: e.target.value })} /><button onClick={addExpense}>Save action</button></section>}</main>;
}
 
function Admin({ clients, setClients }) {
  const [open, setOpen] = useState(null);
  function deleteExpense(clientId, index) {
    setClients(clients.map(c => c.id === clientId ? { ...c, expenses: c.expenses.filter((_, i) => i !== index) } : c));
  }
  return <main><h1>Manager</h1>{clients.map(c => <article className="admin" key={c.id}><button onClick={() => setOpen(open === c.id ? null : c.id)}>●</button> {c.id} {c.username}{open === c.id && <section>{c.expenses.map((e, i) => <p key={i}>{e.company} {e.amount} <button onClick={() => deleteExpense(c.id, i)}>X</button></p>)}<button onClick={() => setClients(clients.filter(x => x.id !== c.id))}>Cancel</button></section>}</article>)}</main>;
}
 
export default App;
