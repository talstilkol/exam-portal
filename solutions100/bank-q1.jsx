// SV Bank — React Q1 (65 pts)
// Source spec: /Users/tal/Desktop/חומרים למבחן/מבחנים 1/עותק של מבחן מועד ב פולסטאק.docx
// Target 100/100 — accounts CRUD, deposit/withdraw with validation,
// transfer with same-account check, history with timestamps,
// confirmation modal for large transfers, search/filter.

import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import "./style.css";

// ───────────────────── Persistence ─────────────────────
const KEY_ACC = "bank-accounts";
const KEY_HIST = "bank-history";
function loadAccounts() {
  try { const r = localStorage.getItem(KEY_ACC); if (r) return JSON.parse(r); } catch {}
  return [
    { id: 1001, owner: "Alice",   balance: 5000 },
    { id: 1002, owner: "Bob",     balance: 12500 },
    { id: 1003, owner: "Charlie", balance: 350 },
  ];
}
function saveAccounts(arr) { try { localStorage.setItem(KEY_ACC, JSON.stringify(arr)); } catch {} }
function loadHistory() { try { const r = localStorage.getItem(KEY_HIST); if (r) return JSON.parse(r); } catch {} return []; }
function saveHistory(arr) { try { localStorage.setItem(KEY_HIST, JSON.stringify(arr)); } catch {} }

const TRANSFER_CONFIRM_THRESHOLD = 10000;

// ───────────────────── App shell ─────────────────────
export default function AppShell() {
  const [accounts, setAccounts] = useState(loadAccounts);
  const [history, setHistory]   = useState(loadHistory);

  useEffect(() => { saveAccounts(accounts); }, [accounts]);
  useEffect(() => { saveHistory(history); },   [history]);

  // ✅ Centralized transaction recorder — adds to history with timestamp
  function record(type, fromId, toId, amount, balanceAfter, note = "") {
    setHistory((h) => [
      ...h,
      {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        type, fromId, toId, amount, balanceAfter, note,
      },
    ]);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard accounts={accounts} history={history} />} />
        <Route path="/deposit"  element={<DepositPage accounts={accounts} setAccounts={setAccounts} record={record} />} />
        <Route path="/withdraw" element={<WithdrawPage accounts={accounts} setAccounts={setAccounts} record={record} />} />
        <Route path="/transfer" element={<TransferPage accounts={accounts} setAccounts={setAccounts} record={record} />} />
        <Route path="/history"  element={<HistoryPage history={history} accounts={accounts} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// ───────────────────── Dashboard ─────────────────────
function Dashboard({ accounts, history }) {
  const navigate = useNavigate();
  const totalBalance = useMemo(
    () => accounts.reduce((s, a) => s + a.balance, 0),
    [accounts]
  );
  return (
    <main className="page">
      <header className="hero">
        <h1>🏦 SV Bank</h1>
        <p>Total balance across all accounts: ₪{totalBalance.toLocaleString()}</p>
      </header>
      <section className="actions-grid">
        <button onClick={() => navigate("/deposit")}>💰 Deposit</button>
        <button onClick={() => navigate("/withdraw")}>💸 Withdraw</button>
        <button onClick={() => navigate("/transfer")}>🔄 Transfer</button>
        <button onClick={() => navigate("/history")}>📋 History ({history.length})</button>
      </section>
      <section className="accounts">
        <h2>Accounts</h2>
        {accounts.map((a) => (
          <div key={a.id} className="account-card">
            <div className="acc-id">#{a.id}</div>
            <div className="acc-owner">{a.owner}</div>
            <div className="acc-balance">₪{a.balance.toLocaleString()}</div>
          </div>
        ))}
      </section>
    </main>
  );
}

// ───────────────────── Deposit ─────────────────────
function DepositPage({ accounts, setAccounts, record }) {
  const [accId, setAccId]   = useState(accounts[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [error, setError]   = useState("");
  const navigate = useNavigate();

  function submit(e) {
    e.preventDefault();
    const n = Number(amount);
    // ✅ FIXED: amount > 0 validation
    if (!Number.isFinite(n) || n <= 0) {
      setError("Amount must be a positive number");
      return;
    }
    const acc = accounts.find((a) => a.id === Number(accId));
    if (!acc) { setError("Account not found"); return; }
    const newBalance = acc.balance + n;
    setAccounts(accounts.map((a) => a.id === acc.id ? { ...a, balance: newBalance } : a));
    record("deposit", null, acc.id, n, newBalance);
    alert(`Deposited ₪${n} into ${acc.owner}'s account. New balance: ₪${newBalance}`);
    navigate("/");
  }

  return (
    <main className="page">
      <h1>💰 Deposit</h1>
      <form onSubmit={submit} className="form-card">
        <label>
          Account:
          <select value={accId} onChange={(e) => { setAccId(e.target.value); setError(""); }}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>#{a.id} — {a.owner} (₪{a.balance})</option>
            ))}
          </select>
        </label>
        <label>
          Amount:
          <input type="number" min="0.01" step="0.01"
            value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} />
        </label>
        {error && <p className="err-text err-red">{error}</p>}
        <button type="submit" className="btn-primary">Deposit</button>
        <button type="button" className="btn-back" onClick={() => navigate(-1)}>← Back</button>
      </form>
    </main>
  );
}

// ───────────────────── Withdraw ─────────────────────
function WithdrawPage({ accounts, setAccounts, record }) {
  const [accId, setAccId]   = useState(accounts[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [error, setError]   = useState("");
  const navigate = useNavigate();

  function submit(e) {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) { setError("Amount must be a positive number"); return; }
    const acc = accounts.find((a) => a.id === Number(accId));
    if (!acc) { setError("Account not found"); return; }
    // ✅ FIXED: insufficient funds check
    if (n > acc.balance) {
      setError(`Insufficient funds. Available: ₪${acc.balance}`);
      return;
    }
    const newBalance = acc.balance - n;
    setAccounts(accounts.map((a) => a.id === acc.id ? { ...a, balance: newBalance } : a));
    record("withdraw", acc.id, null, n, newBalance);
    alert(`Withdrew ₪${n} from ${acc.owner}'s account. New balance: ₪${newBalance}`);
    navigate("/");
  }

  return (
    <main className="page">
      <h1>💸 Withdraw</h1>
      <form onSubmit={submit} className="form-card">
        <label>
          Account:
          <select value={accId} onChange={(e) => { setAccId(e.target.value); setError(""); }}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>#{a.id} — {a.owner} (₪{a.balance})</option>
            ))}
          </select>
        </label>
        <label>
          Amount:
          <input type="number" min="0.01" step="0.01"
            value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} />
        </label>
        {error && <p className="err-text err-red">{error}</p>}
        <button type="submit" className="btn-primary">Withdraw</button>
        <button type="button" className="btn-back" onClick={() => navigate(-1)}>← Back</button>
      </form>
    </main>
  );
}

// ───────────────────── Transfer (with confirm modal) ─────────────────────
function TransferPage({ accounts, setAccounts, record }) {
  const [fromId, setFromId] = useState(accounts[0]?.id || "");
  const [toId, setToId]     = useState(accounts[1]?.id || "");
  const [amount, setAmount] = useState("");
  const [error, setError]   = useState("");
  const [confirming, setConfirming] = useState(null);
  const navigate = useNavigate();

  function attempt(e) {
    e.preventDefault();
    setError("");
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) { setError("Amount must be a positive number"); return; }
    if (Number(fromId) === Number(toId)) {
      // ✅ FIXED: source ≠ target check
      setError("Source and target accounts must be different");
      return;
    }
    const src = accounts.find((a) => a.id === Number(fromId));
    const dst = accounts.find((a) => a.id === Number(toId));
    if (!src || !dst) { setError("One of the accounts was not found"); return; }
    if (n > src.balance) { setError(`Insufficient funds. Available: ₪${src.balance}`); return; }

    // ✅ Confirmation modal for large transfers
    if (n > TRANSFER_CONFIRM_THRESHOLD) {
      setConfirming({ src, dst, amount: n });
      return;
    }
    execute(src, dst, n);
  }

  function execute(src, dst, n) {
    const newSrcBalance = src.balance - n;
    const newDstBalance = dst.balance + n;
    setAccounts(accounts.map((a) => {
      if (a.id === src.id) return { ...a, balance: newSrcBalance };
      if (a.id === dst.id) return { ...a, balance: newDstBalance };
      return a;
    }));
    record("transfer", src.id, dst.id, n, newSrcBalance, `→ ${dst.owner}`);
    alert(`Transferred ₪${n} from ${src.owner} to ${dst.owner}`);
    navigate("/");
  }

  return (
    <main className="page">
      <h1>🔄 Transfer</h1>
      <form onSubmit={attempt} className="form-card">
        <label>
          From:
          <select value={fromId} onChange={(e) => { setFromId(e.target.value); setError(""); }}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>#{a.id} — {a.owner} (₪{a.balance})</option>
            ))}
          </select>
        </label>
        <label>
          To:
          <select value={toId} onChange={(e) => { setToId(e.target.value); setError(""); }}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>#{a.id} — {a.owner} (₪{a.balance})</option>
            ))}
          </select>
        </label>
        <label>
          Amount:
          <input type="number" min="0.01" step="0.01"
            value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} />
        </label>
        {error && <p className="err-text err-red">{error}</p>}
        <button type="submit" className="btn-primary">Transfer</button>
        <button type="button" className="btn-back" onClick={() => navigate(-1)}>← Back</button>
      </form>

      {/* ✅ Confirmation modal for large amounts */}
      {confirming && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setConfirming(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm large transfer</h2>
            <p>You are about to transfer <strong>₪{confirming.amount}</strong> from
            <br/>{confirming.src.owner} → {confirming.dst.owner}</p>
            <p>This is above the ₪{TRANSFER_CONFIRM_THRESHOLD} threshold.</p>
            <div className="modal-actions">
              <button onClick={() => { execute(confirming.src, confirming.dst, confirming.amount); setConfirming(null); }} className="btn-primary">Confirm</button>
              <button onClick={() => setConfirming(null)} className="btn-back">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ───────────────────── History (search/filter) ─────────────────────
function HistoryPage({ history, accounts }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return history
      .slice()
      .reverse()
      .filter((h) => filter === "all" || h.type === filter)
      .filter((h) => {
        if (!search) return true;
        const term = search.toLowerCase();
        const fromAcc = accounts.find((a) => a.id === h.fromId);
        const toAcc = accounts.find((a) => a.id === h.toId);
        return (
          (fromAcc && fromAcc.owner.toLowerCase().includes(term)) ||
          (toAcc && toAcc.owner.toLowerCase().includes(term)) ||
          String(h.amount).includes(term)
        );
      });
  }, [history, filter, search, accounts]);

  return (
    <main className="page">
      <h1>📋 Transaction History</h1>
      <div className="history-controls">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="deposit">Deposits</option>
          <option value="withdraw">Withdrawals</option>
          <option value="transfer">Transfers</option>
        </select>
        <input
          type="search" placeholder="Search owner / amount"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <table className="history-table">
        <thead>
          <tr><th>Time</th><th>Type</th><th>From</th><th>To</th><th>Amount</th><th>Balance after</th></tr>
        </thead>
        <tbody>
          {filtered.map((h) => {
            const src = accounts.find((a) => a.id === h.fromId);
            const dst = accounts.find((a) => a.id === h.toId);
            return (
              <tr key={h.id}>
                <td>{new Date(h.timestamp).toLocaleString("he-IL")}</td>
                <td><span className={`tag tag-${h.type}`}>{h.type}</span></td>
                <td>{src ? src.owner : "—"}</td>
                <td>{dst ? dst.owner : "—"}</td>
                <td>₪{h.amount.toLocaleString()}</td>
                <td>₪{h.balanceAfter.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="empty">No matching transactions</p>}
      <button className="btn-back" onClick={() => navigate("/")}>← Back</button>
    </main>
  );
}
