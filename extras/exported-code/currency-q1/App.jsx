import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./style.css";
 
class Currency {
  constructor(type, value) {
    this.type = type;
    this.value = Number(value);
  }
  updateValue(newValue) {
    this.value = Number(newValue);
  }
}
 
const defaults = [new Currency("DOLLAR", 4), new Currency("EURO", 5), new Currency("SHEKEL", 1)];
 
function App() {
  const [currencies, setCurrencies] = useState(defaults);
  const [history, setHistory] = useState([]);
  return <BrowserRouter><Routes>
    <Route path="/" element={<Exchange currencies={currencies} history={history} setHistory={setHistory} />} />
    <Route path="/update" element={<Update currencies={currencies} setCurrencies={setCurrencies} />} />
  </Routes></BrowserRouter>;
}
 
function Exchange({ currencies, history, setHistory }) {
  const [form, setForm] = useState({ amount: "", from: "", to: "" });
  const [showList, setShowList] = useState(false);
  const navigate = useNavigate();
  const canStart = form.amount !== "" && form.from && form.to;
  function convert() {
    const from = currencies.find(c => c.type === form.from);
    const to = currencies.find(c => c.type === form.to);
    const amount = Number(form.amount);
    const result = amount * from.value / to.value;
    const item = { id: Date.now(), amount, result, from: from.type, to: to.type };
    setHistory([...history, item]);
    alert(`${amount} ${from.type} = ${result} ${to.type}`);
  }
  return <main className="calculator"><h1>Exchange</h1><input type="number" step="any" placeholder="type" onChange={e => setForm({ ...form, amount: e.target.value })} />
    <label>From:<select onChange={e => setForm({ ...form, from: e.target.value })}><option value="">type</option>{currencies.map(c => <option key={c.type}>{c.type}</option>)}</select></label>
    <label>To:<select onChange={e => setForm({ ...form, to: e.target.value })}><option value="">type</option>{currencies.map(c => <option key={c.type}>{c.type}</option>)}</select></label>
    <button disabled={!canStart} onClick={convert}>start</button><button onClick={() => navigate("/update")}>Update</button><button onClick={() => location.href = "https://facebook.com"}>Share on FACEBOOK</button><button onClick={() => setShowList(!showList)}>View your exchange list</button>
    {showList && history.map((h, index) => <article key={h.id}>#{index + 1}<br/>From {h.from} To {h.to}<br/>{h.amount} = {h.result}<button onClick={() => setHistory(history.filter(x => x.id !== h.id))}>X</button></article>)}
  </main>;
}
 
function Update({ currencies, setCurrencies }) {
  const [form, setForm] = useState({ type: "", value: "" });
  const navigate = useNavigate();
  const disabled = !form.type || !form.value;
  function submit() {
    if (!/^[A-Za-z]+$/.test(form.type)) return alert("Type must be English letters only");
    const value = Number(form.value);
    if (!Number.isFinite(value)) return alert("Value must be number");
    const type = form.type.toUpperCase();
    const exists = currencies.some(c => c.type === type);
    setCurrencies(exists ? currencies.map(c => c.type === type ? new Currency(type, value) : c) : [...currencies, new Currency(type, value)]);
  }
  return <main><h1>UPDATE</h1><table><tbody>{currencies.map(c => <tr key={c.type}><td>{c.type}</td><td>{c.value}</td></tr>)}</tbody></table><input placeholder="Type" onChange={e => setForm({ ...form, type: e.target.value })} /><input type="number" placeholder="New Value" onChange={e => setForm({ ...form, value: e.target.value })} /><button disabled={disabled} onClick={submit}>UPDATE</button><button onClick={() => navigate("/")}>BACK</button></main>;
}
 
export default App;
