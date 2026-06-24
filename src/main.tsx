import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { BarChart3, Bike, CalendarCheck, ChefHat, Clock, CreditCard, FileText, MapPin, Menu as MenuIcon, MessageCircle, Phone, Receipt, Search, ShoppingCart, Star, Users } from "lucide-react";
import clsx from "clsx";
import "./styles.css";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api" });
const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", { autoConnect: true });

type Category = { _id: string; name: string; slug: string };
type MenuItem = { _id: string; name: string; description: string; category: Category; variants: { name: string; price: number }[]; veg: boolean };
type CartLine = { item: MenuItem; variant: string; quantity: number; toppings: { name: string; price: number }[]; notes?: string };
type Order = { _id: string; orderNumber: string; customer: { name: string; phone: string; address?: string; tableNumber?: string }; type: string; items: CartLine[]; status: string; total: number; createdAt: string };

function useApi<T>(path: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  useEffect(() => {
    api.get(path).then((res) => setData(res.data)).catch(() => setData(fallback));
  }, [path]);
  return [data, setData] as const;
}

function Header() {
  const nav = [["/", "Home"], ["/menu", "Menu"], ["/checkout", "Cart"], ["/track", "Track"], ["/admin", "Admin"], ["/kitchen", "Kitchen"], ["/employee", "Employee"]];
  return <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/95 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
      <Link to="/" className="flex items-center gap-2 font-black text-brand-ink"><ChefHat className="text-brand-red" /> Hungry Point - Duraha</Link>
      <nav className="hidden gap-1 md:flex">{nav.map(([href, label]) => <NavLink key={href} to={href} className={({ isActive }) => clsx("rounded-full px-3 py-2 text-sm font-semibold", isActive ? "bg-brand-red text-white" : "text-stone-700 hover:bg-orange-50")}>{label}</NavLink>)}</nav>
      <a className="btn-primary" href="tel:+919876543210"><Phone size={16} /> Call</a>
    </div>
  </header>;
}

function Home() {
  const [items] = useApi<MenuItem[]>("/menu/items?limit=8", []);
  const [reviews] = useApi<{ name: string; rating: number; comment: string }[]>("/reviews/public", []);
  return <main>
    <section className="hero">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-[1fr_0.9fr] md:py-24">
        <div className="space-y-6">
          <p className="eyebrow">Railway Rd, SBS Nagar, Doraha, Punjab</p>
          <h1>Hungry Point - Duraha</h1>
          <p className="max-w-xl text-lg text-stone-700">Fast food cafe for pizzas, burgers, sandwiches, pasta, fries, shakes, mojitos, desserts, takeaway, delivery, dine-in, and quick POS billing.</p>
          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary" to="/menu"><ShoppingCart size={18} /> Order Online</Link>
            <a className="btn-secondary" href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_PHONE || "919876543210"}?text=${encodeURIComponent("Hi Hungry Point - Duraha, I want to place an order.")}`}><MessageCircle size={18} /> WhatsApp</a>
          </div>
          <div className="grid max-w-lg grid-cols-3 gap-3">
            {["Open 10 AM - 11 PM", "Fresh fast food", "Invoice for 30 days"].map((text) => <div className="metric" key={text}>{text}</div>)}
          </div>
        </div>
        <div className="food-board">
          {["Pizza", "Burger", "Mojito", "Fries"].map((name, index) => <div className={`food-tile tile-${index}`} key={name}><span>{name}</span></div>)}
        </div>
      </div>
    </section>
    <Section title="Menu Preview" icon={<MenuIcon />}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.slice(0, 8).map((item) => <MenuCard key={item._id} item={item} onAdd={() => toast.success(`${item.name} added from menu page`)} />)}</div>
    </Section>
    <Section title="Offers" icon={<Star />}>
      <div className="grid gap-4 md:grid-cols-3">{["HPD10 - 10% off above Rs. 199", "SNACK50 - Rs. 50 off above Rs. 299", "WhatsApp bill links valid for 30 days"].map((offer) => <div className="panel" key={offer}>{offer}</div>)}</div>
    </Section>
    <Section title="Reviews" icon={<Star />}>
      <div className="grid gap-4 md:grid-cols-2">{reviews.map((review) => <div className="panel" key={review.name}><div className="text-brand-orange">★★★★★</div><b>{review.name}</b><p>{review.comment}</p></div>)}</div>
    </Section>
    <Section title="Find Us" icon={<MapPin />}>
      <div className="grid gap-4 md:grid-cols-2"><div className="panel"><b>Hungry Point - Duraha</b><p>Railway Rd, SBS Nagar, Doraha, Punjab</p><p>Open: 10:00 AM - 11:00 PM</p></div><iframe className="h-72 w-full rounded-lg border-0" loading="lazy" src="https://maps.google.com/maps?q=Railway%20Rd%20SBS%20Nagar%20Doraha%20Punjab&t=&z=15&ie=UTF8&iwloc=&output=embed" /></div>
    </Section>
  </main>;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="mx-auto max-w-7xl px-4 py-10"><h2 className="mb-5 flex items-center gap-2 text-2xl font-black">{icon}{title}</h2>{children}</section>;
}

function MenuCard({ item, onAdd }: { item: MenuItem; onAdd: (line: CartLine) => void }) {
  const variant = item.variants?.[0] || { name: "Single", price: 99 };
  return <div className="menu-card">
    <div className="menu-art">{item.name.split(" ")[0]}</div>
    <div className="p-4"><b>{item.name}</b><p className="mt-1 line-clamp-2 text-sm text-stone-600">{item.description}</p><div className="mt-4 flex items-center justify-between"><span className="font-black text-brand-red">Rs. {variant.price}</span><button className="btn-small" onClick={() => onAdd({ item, variant: variant.name, quantity: 1, toppings: [] })}>Add</button></div></div>
  </div>;
}

function MenuPage() {
  const [categories] = useApi<Category[]>("/menu/categories", []);
  const [items] = useApi<MenuItem[]>("/menu/items", []);
  const [cart, setCart] = useCart();
  const [active, setActive] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = items.filter((item) => (active === "all" || item.category?._id === active) && item.name.toLowerCase().includes(search.toLowerCase()));
  return <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
    <section>
      <div className="toolbar"><div className="search"><Search size={18} /><input placeholder="Search pizza, burger, shake..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
      <div className="mb-5 flex gap-2 overflow-auto"><button className={clsx("chip", active === "all" && "chip-active")} onClick={() => setActive("all")}>All</button>{categories.map((cat) => <button key={cat._id} className={clsx("chip", active === cat._id && "chip-active")} onClick={() => setActive(cat._id)}>{cat.name}</button>)}</div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <MenuCard key={item._id} item={item} onAdd={(line) => { setCart([...cart, line]); toast.success("Added to cart"); }} />)}</div>
    </section>
    <CartPanel cart={cart} setCart={setCart} />
  </main>;
}

function useCart() {
  const [cart, setCartState] = useState<CartLine[]>(() => JSON.parse(localStorage.getItem("hpd-cart") || "[]"));
  const setCart = (next: CartLine[]) => { setCartState(next); localStorage.setItem("hpd-cart", JSON.stringify(next)); };
  return [cart, setCart] as const;
}

function CartPanel({ cart, setCart }: { cart: CartLine[]; setCart: (next: CartLine[]) => void }) {
  const total = cart.reduce((sum, line) => sum + line.quantity * (line.item.variants.find((v) => v.name === line.variant)?.price || 0), 0);
  return <aside className="panel h-fit lg:sticky lg:top-20"><h3 className="mb-3 flex items-center gap-2 text-xl font-black"><ShoppingCart /> Cart</h3>{cart.length === 0 ? <p className="empty">No items added yet.</p> : cart.map((line, index) => <div className="cart-line" key={`${line.item._id}-${index}`}><div><b>{line.item.name}</b><p>{line.variant} x {line.quantity}</p></div><button onClick={() => setCart(cart.filter((_, i) => i !== index))}>Remove</button></div>)}<div className="mt-4 flex items-center justify-between text-lg font-black"><span>Total</span><span>Rs. {total}</span></div><Link className="btn-primary mt-4 w-full justify-center" to="/checkout">Checkout</Link></aside>;
}

function Checkout() {
  const [cart, setCart] = useCart();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "", tableNumber: "", type: "TAKEAWAY", couponCode: "" });
  const placeOrder = async () => {
    const res = await api.post("/orders", { ...customer, customer, type: customer.type, couponCode: customer.couponCode, items: cart.map((line) => ({ menuItem: line.item._id, variant: line.variant, quantity: line.quantity, toppings: line.toppings })) });
    setCart([]);
    toast.success(`Order ${res.data.orderNumber} placed`);
    navigate(`/track?id=${res.data._id}`);
  };
  return <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:grid-cols-2"><div className="panel"><h1>Checkout</h1>{["name", "phone", "address", "tableNumber", "couponCode"].map((field) => <input key={field} className="input" placeholder={field} value={(customer as any)[field]} onChange={(e) => setCustomer({ ...customer, [field]: e.target.value })} />)}<select className="input" value={customer.type} onChange={(e) => setCustomer({ ...customer, type: e.target.value })}><option value="DINE_IN">Dine-in</option><option value="TAKEAWAY">Takeaway</option><option value="DELIVERY">Delivery</option></select><button className="btn-primary w-full justify-center" disabled={!cart.length} onClick={placeOrder}>Place Order</button></div><CartPanel cart={cart} setCart={setCart} /></main>;
}

function Track() {
  const [id, setId] = useState(new URLSearchParams(location.search).get("id") || "");
  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => { if (id) api.get(`/orders/${id}`).then((res) => setOrder(res.data)); }, [id]);
  useEffect(() => { socket.on("order:status", (next: Order) => next._id === id && setOrder(next)); return () => { socket.off("order:status"); }; }, [id]);
  return <main className="mx-auto max-w-3xl px-4 py-8"><div className="panel"><h1>Live Order Tracking</h1><input className="input" placeholder="Paste order ID" value={id} onChange={(e) => setId(e.target.value)} />{order ? <div className="status-board"><b>{order.orderNumber}</b><span className="badge">{order.status}</span><p>Total: Rs. {order.total}</p></div> : <p className="empty">Enter an order ID to track live status.</p>}</div></main>;
}

function Login() {
  const [email, setEmail] = useState("superadmin@hungrypoint.local");
  const [otp, setOtp] = useState("");
  const request = async () => { const res = await api.post("/auth/request-otp", { email }); toast.success(res.data.devOtp ? `Dev OTP: ${res.data.devOtp}` : "OTP sent"); };
  const verify = async () => { const res = await api.post("/auth/verify-otp", { email, otp }); localStorage.setItem("hpd-token", res.data.token); toast.success("Logged in"); location.href = "/admin"; };
  return <main className="mx-auto max-w-md px-4 py-10"><div className="panel"><h1>Staff Login</h1><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} /><button className="btn-secondary w-full justify-center" onClick={request}>Send OTP</button><input className="input" placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} /><button className="btn-primary w-full justify-center" onClick={verify}>Verify OTP</button></div></main>;
}

function useStaffApi<T>(path: string, fallback: T) {
  const token = localStorage.getItem("hpd-token");
  const [data, setData] = useState<T>(fallback);
  useEffect(() => { api.get(path, { headers: { Authorization: `Bearer ${token}` } }).then((res) => setData(res.data)).catch(() => {}); }, [path, token]);
  return [data, setData] as const;
}

function Admin() {
  const [summary] = useStaffApi<any>("/reports/summary", {});
  const cards = [["Today Sales", summary.todaySales || 0, <CreditCard />], ["Total Orders", summary.totalOrders || 0, <Receipt />], ["Employees", summary.employees || 0, <Users />], ["Retention", "30 days", <FileText />]];
  return <DashboardShell title="Admin Dashboard"><div className="grid gap-4 md:grid-cols-4">{cards.map(([label, value, icon]) => <div className="panel" key={String(label)}><div className="flex justify-between text-brand-red">{icon}<BarChart3 /></div><p className="mt-4 text-sm">{label}</p><b className="text-2xl">{value}</b></div>)}</div><ManagementGrid /><OrdersBoard /></DashboardShell>;
}

function DashboardShell({ title, children }: { title: string; children: React.ReactNode }) {
  const links = [["/admin", "Dashboard"], ["/pos", "POS Billing"], ["/kitchen", "Kitchen"], ["/employee", "Employee"]];
  return <main className="min-h-screen bg-stone-50"><div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 md:grid-cols-[220px_1fr]"><aside className="panel h-fit"><b>Hungry Point</b>{links.map(([href, label]) => <Link className="side-link" key={href} to={href}>{label}</Link>)}</aside><section className="space-y-5"><h1>{title}</h1>{children}</section></div></main>;
}

function ManagementGrid() {
  const modules = ["Orders", "Menu Categories", "Menu Items", "Offers/Coupons", "Employees", "Attendance", "Salary", "Salary Slips", "Customers", "Reviews", "Reports", "Settings"];
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{modules.map((module) => <div className="panel compact" key={module}>{module}<button className="btn-small mt-3">Manage</button></div>)}</div>;
}

function OrdersBoard() {
  const [orders, setOrders] = useStaffApi<Order[]>("/orders", []);
  useEffect(() => { socket.on("order:new", (order: Order) => setOrders([order, ...orders])); return () => { socket.off("order:new"); }; }, [orders, setOrders]);
  return <div className="panel"><h2>Recent Orders</h2><div className="table">{orders.slice(0, 8).map((order) => <div className="row" key={order._id}><span>{order.orderNumber}</span><span>{order.customer?.name}</span><span className="badge">{order.status}</span><span>Rs. {order.total}</span></div>)}</div></div>;
}

function POS() {
  const [items] = useApi<MenuItem[]>("/menu/items", []);
  const [cart, setCart] = useCart();
  return <DashboardShell title="POS Billing"><div className="grid gap-6 lg:grid-cols-[1fr_360px]"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <MenuCard key={item._id} item={item} onAdd={(line) => setCart([...cart, line])} />)}</div><CartPanel cart={cart} setCart={setCart} /></div></DashboardShell>;
}

function Kitchen() {
  const [orders, setOrders] = useStaffApi<Order[]>("/orders?status=PENDING", []);
  const update = async (order: Order, status: string) => { const token = localStorage.getItem("hpd-token"); const res = await api.patch(`/orders/${order._id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } }); setOrders(orders.map((o) => o._id === order._id ? res.data : o)); };
  useEffect(() => { socket.on("order:new", (order: Order) => { new Audio("/notify.mp3").play().catch(() => {}); setOrders((prev) => [order, ...prev]); }); return () => { socket.off("order:new"); }; }, []);
  return <DashboardShell title="Kitchen Display"><div className="grid gap-4 lg:grid-cols-3">{orders.map((order) => <div className="kitchen-card" key={order._id}><div className="flex justify-between"><b>{order.orderNumber}</b><span className="badge">{order.status}</span></div><p>{order.type} {order.customer?.tableNumber || order.customer?.address}</p>{order.items?.map((line: any, i: number) => <div className="cart-line" key={i}><span>{line.quantity} x {line.name || line.item?.name}</span><b>{line.variant}</b></div>)}<div className="mt-4 grid grid-cols-3 gap-2">{["ACCEPTED", "PREPARING", "READY"].map((status) => <button className="btn-small" key={status} onClick={() => update(order, status)}>{status}</button>)}</div></div>)}</div></DashboardShell>;
}

function Employee() {
  return <DashboardShell title="Employee Portal"><div className="grid gap-4 md:grid-cols-3">{[["My Profile", <Users />], ["My Attendance", <CalendarCheck />], ["My Salary Slips", <FileText />]].map(([label, icon]) => <div className="panel" key={String(label)}>{icon}<h2>{label}</h2><button className="btn-small">View</button></div>)}</div></DashboardShell>;
}

function App() {
  return <BrowserRouter><Toaster position="top-right" /><Header /><Routes><Route path="/" element={<Home />} /><Route path="/menu" element={<MenuPage />} /><Route path="/checkout" element={<Checkout />} /><Route path="/track" element={<Track />} /><Route path="/login" element={<Login />} /><Route path="/admin" element={<Admin />} /><Route path="/pos" element={<POS />} /><Route path="/kitchen" element={<Kitchen />} /><Route path="/employee" element={<Employee />} /></Routes><footer className="border-t bg-brand-ink px-4 py-8 text-center text-white">Hungry Point - Duraha · Railway Rd, SBS Nagar, Doraha, Punjab · Fast food cafe and restaurant</footer></BrowserRouter>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
