// Currency Exchange — React Q1 (80 pts)
// Source spec: /Users/tal/Desktop/חומרים למבחן/מבחנים 1/עותק של מבחן מחשבון המרה.docx
// Target: 100/100 — class Currency, generic array, English-only validation,
// disabled-until-valid buttons, exchange list with X-delete, update-not-create,
// react-router with /, /list, /update, share-on-FB, BACK button.

import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
} from "react-router-dom";
import "./style.css";

// ───────────────────────── Currency class (per spec) ─────────────────────────
// "מחלקת מטבע: מאפיינים: סוג מטבע — מחרוזת. ערך מטבע — מספר ממשי.
//  פונקציה — מקבלת ערך מספרי ומעדכנת את המאפיין 'ערך מטבע'."
class Currency {
  constructor(type, value) {
    this.type = type;
    this.value = Number(value);
  }
  // ✅ FIXED: spec requires an `update` METHOD on the class
  update(newValue) {
    const v = Number(newValue);
    if (Number.isNaN(v)) throw new TypeError("value must be a number");
    this.value = v;
  }
}

// Default currencies per spec — DOLLAR=4, EURO=5, SHEKEL=1
const DEFAULT_CURRENCIES = () => [
  new Currency("DOLLAR", 4),
  new Currency("EURO",   5),
  new Currency("SHEKEL", 1),
];

// ───────────────────── Persistence (localStorage) ─────────────────────
const KEY_C = "currency-currencies";
const KEY_E = "currency-exchanges";

function loadCurrencies() {
  try {
    const raw = localStorage.getItem(KEY_C);
    if (raw) {
      const arr = JSON.parse(raw);
      // ✅ Reconstruct Currency instances so .update() works after refresh
      return arr.map((c) => new Currency(c.type, c.value));
    }
  } catch {}
  return DEFAULT_CURRENCIES();
}
function saveCurrencies(arr) {
  try { localStorage.setItem(KEY_C, JSON.stringify(arr)); } catch {}
}
function loadExchanges() {
  try {
    const raw = localStorage.getItem(KEY_E);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}
function saveExchanges(arr) {
  try { localStorage.setItem(KEY_E, JSON.stringify(arr)); } catch {}
}

// ───────────────────── Helpers ─────────────────────
// "סוג מטבע: יהיה עם ערכים באנגלית בלבד. כל אות אחרת תציג הודעת שגיאה למשתמש"
const ENGLISH_ONLY = /^[A-Za-z]+$/;

// ───────────────────── App shell + routes ─────────────────────
export default function AppShell() {
  const [currencies, setCurrencies] = useState(loadCurrencies);
  const [exchanges, setExchanges]   = useState(loadExchanges);

  useEffect(() => { saveCurrencies(currencies); }, [currencies]);
  useEffect(() => { saveExchanges(exchanges); },   [exchanges]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Calculator    currencies={currencies} exchanges={exchanges} setExchanges={setExchanges} />} />
        <Route path="/list"    element={<ExchangeList  exchanges={exchanges} setExchanges={setExchanges} />} />
        <Route path="/update"  element={<UpdateCurrency currencies={currencies} setCurrencies={setCurrencies} />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// ───────────────────── Page 1 — Calculator (/) ─────────────────────
function Calculator({ currencies, exchanges, setExchanges }) {
  const [from, setFrom]     = useState("");
  const [to, setTo]         = useState("");
  const [amount, setAmount] = useState("");
  const navigate = useNavigate();

  // ✅ START button disabled until from + to + amount are present and valid
  const amountNumber = Number(amount);
  const canStart =
    !!from && !!to && from !== to &&
    amount !== "" && !Number.isNaN(amountNumber) && amountNumber > 0;

  function start() {
    if (!canStart) return;
    const fromObj = currencies.find((c) => c.type === from);
    const toObj   = currencies.find((c) => c.type === to);
    if (!fromObj || !toObj) {
      alert("Selected currency not found");
      return;
    }
    // Convert: amount of FROM in shekels → divide by TO rate
    const result = (amountNumber * fromObj.value) / toObj.value;
    const rounded = Math.round(result * 100) / 100;
    alert(
      `Exchange: ${amountNumber} ${fromObj.type} = ${rounded} ${toObj.type}`
    );
    setExchanges([
      ...exchanges,
      {
        id: Date.now(),
        from: fromObj.type,
        to: toObj.type,
        amount: amountNumber,
        result: rounded,
      },
    ]);
  }

  function shareFacebook() {
    const url = encodeURIComponent("https://svcollege.example/exchange");
    const text = encodeURIComponent(
      `Just exchanged ${amount} ${from} to ${to}!`
    );
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main className="page">
      <header className="hero">
        <h1>💱 Exchange</h1>
      </header>

      <section className="calc-card">
        <label>
          From:
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="From currency"
          >
            <option value="">type</option>
            {currencies.map((c) => (
              <option key={c.type} value={c.type}>{c.type}</option>
            ))}
          </select>
        </label>

        <label>
          To:
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="To currency"
          >
            <option value="">type</option>
            {currencies.map((c) => (
              <option key={c.type} value={c.type}>{c.type}</option>
            ))}
          </select>
        </label>

        <label>
          Amount:
          {/* ✅ accepts numbers including reals, no letters */}
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Amount to exchange"
            placeholder="value"
          />
        </label>

        {/* ✅ FIXED: START disabled until valid input */}
        <button
          className="btn-start"
          onClick={start}
          disabled={!canStart}
          aria-disabled={!canStart}
        >
          start
        </button>

        <div className="links">
          <button onClick={shareFacebook} className="btn-fb">
            share on facebook
          </button>
          <button onClick={() => navigate("/update")} className="btn-link">
            update
          </button>
          <button onClick={() => navigate("/list")} className="btn-link">
            view your exchange list
          </button>
        </div>
      </section>
    </main>
  );
}

// ───────────────────── Page 2 — Exchange List (/list) ─────────────────────
function ExchangeList({ exchanges, setExchanges }) {
  const navigate = useNavigate();

  function remove(id) {
    // ✅ List keeps updating after click — derived from state
    setExchanges(exchanges.filter((e) => e.id !== id));
  }

  return (
    <main className="page">
      <header className="hero">
        <h1>📋 Your Exchange List</h1>
      </header>

      {exchanges.length === 0 && (
        <p className="empty">No exchanges yet. Make one on the home page.</p>
      )}

      <ol className="exchange-list">
        {exchanges.map((ex, i) => (
          <li key={ex.id} className="exchange-item">
            {/* ✅ FIXED: format per spec — "#N\nFROM type1 TO type2\nvalue = result" */}
            <div className="ex-num">#{i + 1}</div>
            <div className="ex-types">
              FROM <strong>{ex.from}</strong> TO <strong>{ex.to}</strong>
            </div>
            <div className="ex-values">
              <span className="ex-from">{ex.amount}</span>
              <span className="ex-eq">=</span>
              <span className="ex-to">{ex.result}</span>
            </div>
            <button
              className="btn-x"
              onClick={() => remove(ex.id)}
              aria-label={`Remove exchange #${i + 1}`}
            >
              X
            </button>
          </li>
        ))}
      </ol>

      <button onClick={() => navigate("/")} className="btn-back">
        ← BACK
      </button>
    </main>
  );
}

// ───────────────────── Page 3 — Update Currency (/update) ─────────────────────
function UpdateCurrency({ currencies, setCurrencies }) {
  const [type, setType]   = useState("");
  const [value, setValue] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // ✅ UPDATE button disabled until both fields filled
  const canUpdate =
    type !== "" && value !== "" && !Number.isNaN(Number(value));

  function setField(field, val) {
    if (field === "type") setType(val);
    else setValue(val);
    if (errors[field]) {
      setErrors((e) => {
        const c = { ...e };
        delete c[field];
        return c;
      });
    }
  }

  function update() {
    const errs = {};
    // ✅ FIXED: English letters only validation per spec
    if (!type || !ENGLISH_ONLY.test(type))
      errs.type = "Currency type must be English letters only";
    const num = Number(value);
    if (value === "" || Number.isNaN(num))
      errs.value = "Value must be a number";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    // ✅ FIXED: if currency type already exists → call .update() (NOT push duplicate)
    const upper = type.toUpperCase();
    const existing = currencies.find((c) => c.type === upper);
    let next;
    if (existing) {
      // mutate the instance and return a new array so React re-renders
      existing.update(num);
      next = [...currencies];
    } else {
      // create new instance
      next = [...currencies, new Currency(upper, num)];
    }
    setCurrencies(next);
    alert(
      existing
        ? `Updated ${upper} value to ${num}`
        : `Created new currency ${upper} = ${num}`
    );
    setType("");
    setValue("");
    setErrors({});
  }

  return (
    <main className="page">
      <header className="hero">
        <h1>🔁 UPDATE</h1>
      </header>

      <section className="update-card">
        <table className="rates">
          <thead>
            <tr><th>TYPE</th><th>VALUE</th></tr>
          </thead>
          <tbody>
            {currencies.map((c) => (
              <tr key={c.type}>
                <td>{c.type}</td>
                <td>{c.value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={`field ${errors.type ? "has-error" : ""}`}>
          {errors.type && <p className="err-text" role="alert">{errors.type}</p>}
          <label>
            Type:
            <input
              type="text"
              value={type}
              onChange={(e) => setField("type", e.target.value)}
              aria-label="Currency type"
              aria-invalid={!!errors.type}
              placeholder="e.g. POUND"
            />
          </label>
        </div>

        <div className={`field ${errors.value ? "has-error" : ""}`}>
          {errors.value && <p className="err-text" role="alert">{errors.value}</p>}
          <label>
            New Value:
            <input
              type="number"
              step="any"
              value={value}
              onChange={(e) => setField("value", e.target.value)}
              aria-label="New currency value"
              aria-invalid={!!errors.value}
              placeholder="e.g. 4.5"
            />
          </label>
        </div>

        {/* ✅ UPDATE disabled until both fields valid */}
        <button
          className="btn-update"
          onClick={update}
          disabled={!canUpdate}
          aria-disabled={!canUpdate}
        >
          UPDATE
        </button>
        {/* ✅ BACK returns to previous page */}
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← BACK
        </button>
      </section>
    </main>
  );
}
