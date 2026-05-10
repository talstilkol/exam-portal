import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./style.css";
 
class Employee {
  constructor(no, fullName, forklift) {
    this.no = no;
    this.fullName = fullName;
    this.forklift = forklift;
    this.visits = 0;
    this.placed = 0;
  }
}
class Product {
  constructor(no, name, needForklift) {
    this.no = no;
    this.name = name;
    this.needForklift = needForklift;
    this.inPlace = false;
  }
}
 
const initialProducts = [
  new Product("11122", "Green Box", false),
  new Product("22554", "Green Box", false),
  new Product("66698", "Blue Box", true),
  new Product("78544", "Red Box", false),
  new Product("69875", "Red Box", false)
];
 
function App() {
  const [workers, setWorkers] = useState([]);
  const [products, setProducts] = useState(initialProducts);
  const [current, setCurrent] = useState(null);
  return <BrowserRouter><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/signup" element={<Signup workers={workers} setWorkers={setWorkers} />} />
    <Route path="/login" element={<Login workers={workers} setWorkers={setWorkers} current={current} setCurrent={setCurrent} products={products} setProducts={setProducts} />} />
    <Route path="/manager" element={<Manager workers={workers} />} />
  </Routes></BrowserRouter>;
}
 
function Home() {
  const navigate = useNavigate();
  return <main className="center"><h2>Logistics Management</h2><button onClick={() => navigate("/signup")}>Sign up</button><button onClick={() => navigate("/login")}>Log in</button></main>;
}
 
function Signup({ workers, setWorkers }) {
  const [form, setForm] = useState({ no: "", fullName: "", forklift: false });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  function create() {
    if (!/^\d{5}$/.test(form.no)) return setError("the number must be with 5 digits.");
    if (!/^[A-Za-z]+ [A-Za-z]+$/.test(form.fullName) || form.fullName.replace(" ", "").length < 4) return setError("the name must contain minimum 4 characters.");
    if (workers.some(w => w.no === form.no)) return setError("worker already exists");
    setWorkers([...workers, new Employee(form.no, form.fullName, form.forklift)]);
    navigate("/");
  }
  return <main className="center"><h1>Sign up</h1>{error && <p className="error">{error}</p>}<input placeholder="NO." onChange={e => setForm({ ...form, no: e.target.value })} /><input placeholder="FullName" onChange={e => setForm({ ...form, fullName: e.target.value })} /><label><input type="radio" checked={!form.forklift} onChange={() => setForm({ ...form, forklift: false })} /> no</label><label><input type="radio" checked={form.forklift} onChange={() => setForm({ ...form, forklift: true })} /> yes</label><button onClick={create}>Create</button></main>;
}
 
function Login({ workers, setWorkers, current, setCurrent, products, setProducts }) {
  const [no, setNo] = useState("");
  const navigate = useNavigate();
  function login() {
    if (no === "99999") return navigate("/manager");
    const found = workers.find(w => w.no === no);
    if (!found) return alert(`worker ${no} does not exist`);
    setWorkers(workers.map(w => w.no === no ? { ...w, visits: w.visits + 1 } : w));
    setCurrent(no);
  }
  const worker = workers.find(w => w.no === current);
  function updateProduct(p) {
    if (p.needForklift && !worker.forklift) return alert("Need forklift truck license");
    setProducts(products.map(x => x.no === p.no ? { ...x, inPlace: true } : x));
    setWorkers(workers.map(w => w.no === worker.no ? { ...w, placed: w.placed + 1 } : w));
  }
  if (!worker) return <main className="center"><h1>Log in</h1><input placeholder="NO." onChange={e => setNo(e.target.value)} /><button onClick={login}>Enter</button></main>;
  return <main className="dashboard"><h1>Welcome {worker.fullName}</h1><aside>Full Name: {worker.fullName}<br/>NO.: {worker.no}<br/>Forklift truck license: {worker.forklift ? "yes" : "no"}</aside><section>{products.filter(p => !p.inPlace).map(p => <article key={p.no} className="product">NO. {p.no}<br/>Name: {p.name}<br/>Need forklift truck: {p.needForklift ? "yes" : "no"}<button onClick={() => updateProduct(p)}>Update</button></article>)}</section><button onClick={() => setCurrent(null)}>Log Out</button></main>;
}
 
function Manager({ workers }) {
  const navigate = useNavigate();
  return <main><h1>Manager</h1><table><tbody>{workers.filter(w => w.visits > 0).map(w => <tr key={w.no}><td>{w.no}</td><td>{w.fullName}</td><td>{w.placed}</td></tr>)}</tbody></table><button onClick={() => navigate("/")}>Log out</button></main>;
}
 
export default App;
