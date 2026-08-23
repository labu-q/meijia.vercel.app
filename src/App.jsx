import { useEffect, useMemo, useState } from 'react';
import { expenseCategories, incomeCategories } from './data/defaultData';
import { loadData, saveData } from './lib/storage';

const today = () => new Date().toISOString().slice(0, 10);
const money = (value) => `¥${Number(value || 0).toFixed(2)}`;
const navItems = [
  ['home', '⌂', '首页'], ['book', '＋', '记账'], ['customers', '♙', '客户'], ['team', '♧', '技师'], ['mine', '◉', '我的'],
];

function Modal({ title, children, onClose }) {
  return <div className="overlay" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="关闭">×</button></header>{children}</section></div>;
}

function TransactionForm({ type, data, setData, onClose }) {
  const [form, setForm] = useState({ amount: '', category: type === 'income' ? incomeCategories[0] : expenseCategories[0], customerId: '', technicianId: '', note: '', payment: '微信', date: today() });
  const categories = type === 'income' ? incomeCategories : expenseCategories;
  const update = (key, value) => setForm((item) => ({ ...item, [key]: value }));
  function submit(event) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return;
    const transaction = { ...form, id: crypto.randomUUID(), amount, type };
    setData((current) => ({
      ...current,
      transactions: [transaction, ...current.transactions],
      customers: type === 'income' && form.customerId
        ? current.customers.map((customer) => customer.id === form.customerId
          ? { ...customer, visits: customer.visits + 1, total: customer.total + amount }
          : customer)
        : current.customers,
    }));
    onClose();
  }
  return <form className="entry-form" onSubmit={submit}>
    <label>金额<input inputMode="decimal" value={form.amount} onChange={(e) => update('amount', e.target.value)} placeholder="请输入金额" autoFocus required /></label>
    <label>分类<select value={form.category} onChange={(e) => update('category', e.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
    {type === 'income' && <><label>客户<select value={form.customerId} onChange={(e) => update('customerId', e.target.value)}><option value="">散客</option>{data.customers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>服务技师<select value={form.technicianId} onChange={(e) => update('technicianId', e.target.value)}><option value="">未指定</option>{data.technicians.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label></>}
    <label>支付方式<select value={form.payment} onChange={(e) => update('payment', e.target.value)}>{['微信', '支付宝', '现金', '银行卡', '储值卡'].map((item) => <option key={item}>{item}</option>)}</select></label>
    <label>日期<input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} /></label>
    <label>备注<textarea value={form.note} onChange={(e) => update('note', e.target.value)} placeholder="例如：猫眼美甲、采购甲油胶" rows="2" /></label>
    <button className="primary full" type="submit">保存记录</button>
  </form>;
}

function Dashboard({ data, openForm }) {
  const stats = useMemo(() => {
    const date = today(); const list = data.transactions.filter((item) => item.date === date);
    const income = list.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
    const expense = list.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
    const month = today().slice(0, 7);
    const monthlyIncome = data.transactions.filter((item) => item.type === 'income' && item.date.startsWith(month)).reduce((sum, item) => sum + item.amount, 0);
    return { income, expense, profit: income - expense, monthlyIncome };
  }, [data]);
  return <><section className="hero"><p>经营概览 · {today().replaceAll('-', '.')}</p><h1>今天，店里怎么样？</h1><div className="profit"><span>今日净利润</span><strong>{money(stats.profit)}</strong></div></section><section className="metrics"><article><span>今日收入</span><b>{money(stats.income)}</b></article><article><span>今日支出</span><b>{money(stats.expense)}</b></article><article><span>本月营收</span><b>{money(stats.monthlyIncome)}</b></article></section><div className="quick-actions"><button className="income-action" onClick={() => openForm('income')}><i>＋</i>添加收入</button><button className="expense-action" onClick={() => openForm('expense')}><i>−</i>添加支出</button></div><section className="section"><div className="section-title"><h2>今日流水</h2><span>{data.transactions.filter((item) => item.date === today()).length} 笔</span></div><TransactionList transactions={data.transactions.filter((item) => item.date === today()).slice(0, 5)} data={data} /></section></>;
}

function TransactionList({ transactions, data, remove }) {
  const findName = (id, list) => list.find((item) => item.id === id)?.name;
  if (!transactions.length) return <p className="blank">还没有记录</p>;
  return <div className="transaction-list">{transactions.map((item) => <article className="transaction" key={item.id}><div className={`type-dot ${item.type}`}>{item.type === 'income' ? '收' : '支'}</div><div className="transaction-info"><b>{item.category}</b><small>{item.note || findName(item.customerId, data.customers) || '暂无备注'} · {item.payment}</small></div><div className={item.type === 'income' ? 'amount income-text' : 'amount expense-text'}>{item.type === 'income' ? '+' : '-'}{money(item.amount)}</div>{remove && <button className="remove" onClick={() => remove(item.id)} aria-label="删除记录">×</button>}</article>)}</div>;
}

function Flow({ data, setData }) {
  const [filter, setFilter] = useState('all');
  const list = data.transactions.filter((item) => filter === 'all' || item.type === filter);
  const remove = (id) => setData((current) => ({ ...current, transactions: current.transactions.filter((item) => item.id !== id) }));
  return <section className="section page-section"><h1>收支流水</h1><div className="filters">{[['all', '全部'], ['income', '收入'], ['expense', '支出']].map(([id, label]) => <button key={id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{label}</button>)}</div><TransactionList transactions={list} data={data} remove={remove} /></section>;
}

function Bookkeeping({ data, setData, openForm }) {
  const [filter, setFilter] = useState('all');
  const list = data.transactions.filter((item) => filter === 'all' || item.type === filter);
  const income = data.transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expense = data.transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const remove = (id) => setData((current) => ({ ...current, transactions: current.transactions.filter((item) => item.id !== id) }));
  return <section className="book-page">
    <div className="book-summary"><span>累计结余</span><strong>{money(income - expense)}</strong><div><small>总收入 {money(income)}</small><small>总支出 {money(expense)}</small></div></div>
    <div className="book-actions"><button onClick={() => openForm('income')}><i>↓</i><span>记收入</span><small>服务、售卡、零售</small></button><button onClick={() => openForm('expense')}><i>↑</i><span>记支出</span><small>采购、房租、工资</small></button></div>
    <div className="section page-section"><div className="section-title"><h2>账本明细</h2><span>可删除记录</span></div><div className="filters">{[['all', '全部'], ['income', '收入'], ['expense', '支出']].map(([id, label]) => <button key={id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{label}</button>)}</div><TransactionList transactions={list} data={data} remove={remove} /></div>
  </section>;
}

function Customers({ data, setData }) {
  const [adding, setAdding] = useState(false); const [form, setForm] = useState({ name: '', phone: '', note: '' });
  function save(event) { event.preventDefault(); if (!form.name.trim()) return; setData((current) => ({ ...current, customers: [{ ...form, id: crypto.randomUUID(), visits: 0, total: 0 }, ...current.customers] })); setAdding(false); setForm({ name: '', phone: '', note: '' }); }
  return <section className="section page-section"><div className="heading-row"><h1>客户管理</h1><button className="small-primary" onClick={() => setAdding(true)}>＋ 新客户</button></div>{data.customers.length ? <div className="customer-list">{data.customers.map((item) => <article className="customer" key={item.id}><div className="avatar">{item.name[0]}</div><div><b>{item.name}</b><small>{item.phone || '未填写手机号'} · 到店 {item.visits} 次</small><small>{item.note || '暂无备注'}</small></div><strong>{money(item.total)}</strong></article>)}</div> : <EmptyState icon="♙" title="还没有客户" text="点击右上角“新客户”创建第一位客户。" />}{adding && <Modal title="新增客户" onClose={() => setAdding(false)}><form className="entry-form" onSubmit={save}><label>姓名<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus /></label><label>手机号<input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label>备注<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows="2" /></label><button className="primary full">保存客户</button></form></Modal>}</section>;
}

function Team({ data, setData }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', commission: '0.4' });
  const scores = data.technicians.map((person) => { const orders = data.transactions.filter((item) => item.type === 'income' && item.technicianId === person.id); const sales = orders.reduce((sum, item) => sum + item.amount, 0); return { ...person, sales, orders: orders.length, bonus: sales * person.commission }; });
  function save(event) {
    event.preventDefault();
    const name = form.name.trim(); const commission = Number(form.commission);
    if (!name || Number.isNaN(commission) || commission < 0 || commission > 1) return;
    setData((current) => ({ ...current, technicians: [{ id: crypto.randomUUID(), name, commission }, ...current.technicians] }));
    setAdding(false); setForm({ name: '', commission: '0.4' });
  }
  return <section className="section page-section"><div className="heading-row"><h1>技师业绩</h1><button className="small-primary" onClick={() => setAdding(true)}>＋ 新增技师</button></div><p className="subtitle">本月服务收入与预估提成</p>{scores.length ? <div className="team-list">{scores.map((item) => <article className="technician" key={item.id}><div className="avatar purple">{item.name[0]}</div><div className="tech-main"><b>{item.name}</b><small>完成 {item.orders} 单 · 提成 {(item.commission * 100).toFixed(0)}%</small><div className="bar"><i style={{ width: `${Math.min(100, item.sales / 8)}%` }} /></div></div><div className="tech-money"><b>{money(item.sales)}</b><small>提成 {money(item.bonus)}</small></div></article>)}</div> : <EmptyState icon="♧" title="还没有技师" text="点击右上角“新增技师”创建第一位技师。" />}{adding && <Modal title="新增技师" onClose={() => setAdding(false)}><form className="entry-form" onSubmit={save}><label>技师姓名<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例如：小美" required autoFocus /></label><label>提成比例<select value={form.commission} onChange={(event) => setForm({ ...form, commission: event.target.value })}>{[['0.2', '20%'], ['0.3', '30%'], ['0.4', '40%'], ['0.5', '50%'], ['0.6', '60%']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="primary full">保存技师</button></form></Modal>}</section>;
}

function EmptyState({ icon = '✦', title, text }) {
  return <div className="empty-state"><i>{icon}</i><b>{title}</b><p>{text}</p></div>;
}

function Mine({ data, setData }) {
  const [editing, setEditing] = useState(false);
  const [shopName, setShopName] = useState(data.shop?.name || '小鹿美甲工作室');
  const totalIncome = data.transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const currentShopName = data.shop?.name || '小鹿美甲工作室';
  function saveShop(event) { event.preventDefault(); const name = shopName.trim(); if (!name) return; setData((current) => ({ ...current, shop: { ...current.shop, name } })); setEditing(false); }
  return <section className="mine-page"><button className="shop-card" onClick={() => { setShopName(currentShopName); setEditing(true); }}><div className="shop-logo">甲</div><div><small>我的店铺</small><h1>{currentShopName}</h1><p>经营数据已安全保存到本机</p></div><span>›</span></button><div className="mine-stats"><article><b>{data.customers.length}</b><span>客户</span></article><article><b>{data.technicians.length}</b><span>技师</span></article><article><b>{money(totalIncome)}</b><span>累计营收</span></article></div><div className="setting-list"><button onClick={() => { setShopName(currentShopName); setEditing(true); }}><i>▣</i><span>店铺资料</span><b>›</b></button><button><i>◫</i><span>收支分类管理</span><b>›</b></button><button><i>⇩</i><span>数据备份与导出</span><b>›</b></button><button><i>?</i><span>使用帮助</span><b>›</b></button></div><p className="version">甲·账本 v1.0 · 数据仅保存在当前设备</p>{editing && <Modal title="店铺资料" onClose={() => setEditing(false)}><form className="entry-form" onSubmit={saveShop}><label>店铺名称<input value={shopName} onChange={(event) => setShopName(event.target.value)} placeholder="请输入店铺名称" required autoFocus /></label><button className="primary full">保存店铺资料</button></form></Modal>}</section>;
}

export default function App() {
  const [data, setData] = useState(loadData); const [page, setPage] = useState('home'); const [modal, setModal] = useState(null);
  useEffect(() => saveData(data), [data]);
  const content = page === 'home' ? <Dashboard data={data} openForm={setModal} /> : page === 'book' ? <Bookkeeping data={data} setData={setData} openForm={setModal} /> : page === 'flow' ? <Flow data={data} setData={setData} /> : page === 'customers' ? <Customers data={data} setData={setData} /> : page === 'team' ? <Team data={data} setData={setData} /> : <Mine data={data} setData={setData} />;
  return <div className="app"><header className="topbar"><div className="brand"><span>✦</span><b>甲·账本</b></div><button className="profile" aria-label="店铺账户">店</button></header><main>{content}</main>{modal && <Modal title={modal === 'income' ? '添加收入订单' : '添加支出记录'} onClose={() => setModal(null)}><TransactionForm type={modal} data={data} setData={setData} onClose={() => setModal(null)} /></Modal>}<nav className="bottom-nav">{navItems.map(([id, icon, label]) => <button key={id} className={page === id ? 'selected' : ''} onClick={() => setPage(id)}><i>{icon}</i><span>{label}</span></button>)}</nav></div>;
}
