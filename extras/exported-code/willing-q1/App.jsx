import { useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./style.css";
 
const startVolunteers = [
  { id: 1, title: "Help Animals", city: "Telaviv", description: "Volunteer with animals" },
  { id: 2, title: "Food Boxes", city: "Haifa", description: "Pack food boxes" },
  { id: 3, title: "Beach Clean", city: "Telaviv", description: "Clean the beach" }
];
 
function App() {
  const [items, setItems] = useState(startVolunteers);
  return <BrowserRouter><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/add" element={<Add items={items} setItems={setItems} />} />
    <Route path="/find" element={<Find items={items} />} />
    <Route path="/all" element={<All items={items} setItems={setItems} />} />
  </Routes></BrowserRouter>;
}
 
function Home() {
  const navigate = useNavigate();
  return <main className="center"><h1>WILLING</h1><button onClick={() => navigate("/add")}>הוספת התנדבות</button><button onClick={() => navigate("/find")}>מצא התנדבות</button></main>;
}
 
function Add({ items, setItems }) {
  const [form, setForm] = useState({ title: "", city: "", description: "" });
  const navigate = useNavigate();
  function create() {
    if (!form.title || form.title.length > 20) return alert("Title must be 1-20 chars");
    if (!/^[A-Za-z]+$/.test(form.city)) return alert("City must contain English letters only without spaces or symbols");
    if (!form.description || form.description.length > 200) return alert("Description must be 1-200 chars");
    setItems([...items, { ...form, id: Date.now() }]);
    navigate("/");
  }
  return <main><h1>Add Volunteer</h1><input placeholder="title" onChange={e => setForm({ ...form, title: e.target.value })} /><input placeholder="city" onChange={e => setForm({ ...form, city: e.target.value })} /><textarea placeholder="description" onChange={e => setForm({ ...form, description: e.target.value })} /><button onClick={create}>Create</button></main>;
}
 
function Find({ items }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const navigate = useNavigate();
  const cities = [...new Set(items.map(i => i.city))];
  function search() {
    if (name.length <= 2) return alert("Name must be longer than 2 chars");
    if (!city) return alert("Choose city");
    sessionStorage.setItem("volunteer-city", city);
    navigate("/all");
  }
  return <main><h1>Find Volunteer</h1><input placeholder="Volunteer name" onChange={e => setName(e.target.value)} /><select onChange={e => setCity(e.target.value)}><option value="">Choose city</option>{cities.map(c => <option key={c}>{c}</option>)}</select><button onClick={search}>Search</button></main>;
}
 
function All({ items, setItems }) {
  const city = sessionStorage.getItem("volunteer-city") || "";
  const [selected, setSelected] = useState([]);
  const navigate = useNavigate();
  const shown = items.filter(i => i.city === city);
  function toggle(id) {
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }
  function approve() {
    setItems(items.filter(i => !selected.includes(i.id)));
    navigate("/");
  }
  return <main><h1>All in {city}</h1>{shown.map(i => <article key={i.id} onClick={() => toggle(i.id)} className={selected.includes(i.id) ? "selected" : ""}><h2>{i.title}</h2>{selected.includes(i.id) && <p>{i.description}</p>}</article>)}<button onClick={approve}>Approve</button></main>;
}
 
export default App;
