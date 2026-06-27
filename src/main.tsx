import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { BarChart3, CalendarCheck, Clock, CreditCard, FileText, MapPin, MessageCircle, Phone, Receipt, Search, ShoppingCart, Star, Users } from "lucide-react";
import clsx from "clsx";
import "./styles.css";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api" });
const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", { autoConnect: true });

type Category = { _id: string; name: string; slug: string };
type MenuItem = { _id: string; name: string; description: string; category: Category; variants: { name: string; price: number }[]; veg: boolean };
type CartLine = { item: MenuItem; variant: string; quantity: number; toppings: { name: string; price: number }[]; unitPrice?: number; notes?: string };
type Order = { _id: string; orderNumber: string; customer: { name: string; phone: string; address?: string; tableNumber?: string }; type: string; items: CartLine[]; status: string; total: number; createdAt: string };
type StaffUser = { _id: string; name: string; username?: string; email: string; role: string; active?: boolean };

const categoryTiles = [
  ["Pizza", "🍕"],
  ["Burgers", "🍔"],
  ["Sandwiches", "🥪"],
  ["Pasta", "🍝"],
  ["Fries & Snacks", "🍟"],
  ["Shakes", "🥤"],
  ["Mojito", "🍹"],
  ["Drinks", "🧋"],
  ["Desserts", "🍰"]
];

const fallbackItems: MenuItem[] = [
  { _id: "margherita", name: "Margherita", description: "Classic cheese & tomato.", category: { _id: "pizza", name: "Pizza", slug: "pizza" }, variants: [{ name: "Regular", price: 149 }], veg: true },
  { _id: "farmhouse", name: "Farmhouse", description: "Onion, capsicum, tomato, mushroom.", category: { _id: "pizza", name: "Pizza", slug: "pizza" }, variants: [{ name: "Regular", price: 199 }], veg: true },
  { _id: "paneer-tikka", name: "Paneer Tikka Pizza", description: "Spiced paneer, onion, capsicum.", category: { _id: "pizza", name: "Pizza", slug: "pizza" }, variants: [{ name: "Regular", price: 229 }], veg: true },
  { _id: "cheese-burst", name: "Cheese Burst Special", description: "Loaded with extra molten cheese.", category: { _id: "pizza", name: "Pizza", slug: "pizza" }, variants: [{ name: "Regular", price: 279 }], veg: true },
  { _id: "aloo-tikki", name: "Aloo Tikki Burger", description: "Crispy potato patty, lettuce, mayo.", category: { _id: "burger", name: "Burgers", slug: "burgers" }, variants: [{ name: "Single", price: 59 }], veg: true },
  { _id: "veg-cheese", name: "Veg Cheese Burger", description: "Veg patty with melted cheese slice.", category: { _id: "burger", name: "Burgers", slug: "burgers" }, variants: [{ name: "Single", price: 89 }], veg: true },
  { _id: "paneer-maharaja", name: "Paneer Maharaja", description: "Double paneer patty, special sauce.", category: { _id: "burger", name: "Burgers", slug: "burgers" }, variants: [{ name: "Single", price: 139 }], veg: true },
  { _id: "chicken-crunch", name: "Chicken Crunch Burger", description: "Crispy fried chicken, slaw, mayo.", category: { _id: "burger", name: "Burgers", slug: "burgers" }, variants: [{ name: "Single", price: 149 }], veg: false },
  { _id: "veg-grilled", name: "Veg Grilled Sandwich", description: "Grilled with cheese & veggies.", category: { _id: "sandwich", name: "Sandwiches", slug: "sandwiches" }, variants: [{ name: "Single", price: 79 }], veg: true },
  { _id: "bombay-sandwich", name: "Bombay Masala Sandwich", description: "Spiced potato, chutney, cheese.", category: { _id: "sandwich", name: "Sandwiches", slug: "sandwiches" }, variants: [{ name: "Single", price: 99 }], veg: true },
  { _id: "paneer-sandwich", name: "Paneer Tikka Sandwich", description: "Marinated paneer, mint chutney.", category: { _id: "sandwich", name: "Sandwiches", slug: "sandwiches" }, variants: [{ name: "Single", price: 119 }], veg: true },
  { _id: "red-sauce", name: "Red Sauce Pasta", description: "Penne in tangy tomato sauce.", category: { _id: "pasta", name: "Pasta", slug: "pasta" }, variants: [{ name: "Single", price: 139 }], veg: true },
  { _id: "white-sauce", name: "White Sauce Pasta", description: "Creamy alfredo with herbs.", category: { _id: "pasta", name: "Pasta", slug: "pasta" }, variants: [{ name: "Single", price: 159 }], veg: true },
  { _id: "mix-sauce", name: "Mix Sauce Pasta", description: "Best of both worlds.", category: { _id: "pasta", name: "Pasta", slug: "pasta" }, variants: [{ name: "Single", price: 169 }], veg: true },
  { _id: "salted-fries", name: "Salted Fries", description: "Golden crispy fries.", category: { _id: "fries", name: "Fries & Snacks", slug: "fries-snacks" }, variants: [{ name: "Single", price: 79 }], veg: true },
  { _id: "peri-peri-fries", name: "Peri Peri Fries", description: "Spicy peri peri seasoning.", category: { _id: "fries", name: "Fries & Snacks", slug: "fries-snacks" }, variants: [{ name: "Single", price: 99 }], veg: true },
  { _id: "loaded-fries", name: "Cheesy Loaded Fries", description: "Fries topped with cheese sauce.", category: { _id: "fries", name: "Fries & Snacks", slug: "fries-snacks" }, variants: [{ name: "Single", price: 139 }], veg: true },
  { _id: "momos", name: "Chilli Garlic Momos (6)", description: "Steamed momos tossed in chilli garlic.", category: { _id: "fries", name: "Fries & Snacks", slug: "fries-snacks" }, variants: [{ name: "Single", price: 109 }], veg: true },
  { _id: "chocolate-shake", name: "Chocolate Shake", description: "Rich chocolate with ice cream.", category: { _id: "shakes", name: "Shakes", slug: "shakes" }, variants: [{ name: "Single", price: 119 }], veg: true },
  { _id: "strawberry-shake", name: "Strawberry Shake", description: "Fresh strawberry blend.", category: { _id: "shakes", name: "Shakes", slug: "shakes" }, variants: [{ name: "Single", price: 119 }], veg: true },
  { _id: "oreo-shake", name: "Oreo Shake", description: "Cookies & cream goodness.", category: { _id: "shakes", name: "Shakes", slug: "shakes" }, variants: [{ name: "Single", price: 139 }], veg: true },
  { _id: "kitkat-shake", name: "Kitkat Shake", description: "Crunchy chocolate wafer shake.", category: { _id: "shakes", name: "Shakes", slug: "shakes" }, variants: [{ name: "Single", price: 149 }], veg: true },
  { _id: "mint-mojito", name: "Classic Mint Mojito", description: "Lime, mint, soda.", category: { _id: "mojito", name: "Mojito", slug: "mojito" }, variants: [{ name: "Single", price: 89 }], veg: true },
  { _id: "blue-mojito", name: "Blue Magic Mojito", description: "Blue curacao mocktail.", category: { _id: "mojito", name: "Mojito", slug: "mojito" }, variants: [{ name: "Single", price: 109 }], veg: true },
  { _id: "watermelon-mojito", name: "Watermelon Mojito", description: "Crushed watermelon, mint.", category: { _id: "mojito", name: "Mojito", slug: "mojito" }, variants: [{ name: "Single", price: 109 }], veg: true },
  { _id: "cold-coffee", name: "Cold Coffee", description: "Chilled coffee with ice cream.", category: { _id: "drinks", name: "Drinks", slug: "drinks" }, variants: [{ name: "Single", price: 99 }], veg: true },
  { _id: "masala-lemonade", name: "Masala Lemonade", description: "Tangy spiced nimbu pani.", category: { _id: "drinks", name: "Drinks", slug: "drinks" }, variants: [{ name: "Single", price: 49 }], veg: true },
  { _id: "bubble-tea", name: "Bubble Tea", description: "Tapioca pearls in milk tea.", category: { _id: "drinks", name: "Drinks", slug: "drinks" }, variants: [{ name: "Single", price: 129 }], veg: true },
  { _id: "brownie", name: "Chocolate Brownie", description: "Warm brownie with ice cream.", category: { _id: "desserts", name: "Desserts", slug: "desserts" }, variants: [{ name: "Single", price: 119 }], veg: true },
  { _id: "waffle-sundae", name: "Waffle Sundae", description: "Belgian waffle, ice cream, syrup.", category: { _id: "desserts", name: "Desserts", slug: "desserts" }, variants: [{ name: "Single", price: 159 }], veg: true }
];

const fallbackReviews = [
  { name: "Simran K.", rating: 5, comment: "The cheesy fries and oreo shake are unreal. My go-to spot in Doraha!" },
  { name: "Arjun S.", rating: 5, comment: "Fast delivery, hot pizza, great prices. Paneer Maharaja burger is superb." },
  { name: "Riya M.", rating: 4, comment: "Loved the blue mojito and waffle sundae. Cozy vibe, great staff." }
];

const extraOptions = [
  { name: "Extra cheese", price: 40 },
  { name: "Jalapenos", price: 25 },
  { name: "Olives", price: 25 },
  { name: "Paneer", price: 35 }
];

function itemBasePrice(item: MenuItem, variant: string) {
  return item.variants.find((option) => option.name === variant)?.price || item.variants[0]?.price || 0;
}

function lineUnitPrice(line: CartLine) {
  return line.unitPrice ?? itemBasePrice(line.item, line.variant) + line.toppings.reduce((sum, topping) => sum + topping.price, 0);
}

function lineTotal(line: CartLine) {
  return lineUnitPrice(line) * line.quantity;
}

function slugText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function categorySlugFor(item: MenuItem) {
  const slug = slugText(item.category.slug || item.category.name);
  if (slug === "burger") return "burgers";
  if (slug === "sandwich") return "sandwiches";
  if (slug === "fries-snacks" || slug === "fries-and-snacks") return "fries-snacks";
  return slug;
}

function displayMenuItems(apiItems: MenuItem[]) {
  if (!apiItems.length) return fallbackItems;
  const exact = new Map(apiItems.map((item) => [item.name.toLowerCase(), item]));
  const apiByCategory = apiItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const slug = categorySlugFor(item);
    acc[slug] = [...(acc[slug] || []), item];
    return acc;
  }, {});
  const usedByCategory: Record<string, number> = {};
  return fallbackItems.map((fallback) => {
    const exactMatch = exact.get(fallback.name.toLowerCase());
    if (exactMatch) return { ...fallback, _id: exactMatch._id };
    const slug = categorySlugFor(fallback);
    const nextIndex = usedByCategory[slug] || 0;
    usedByCategory[slug] = nextIndex + 1;
    const categoryMatch = apiByCategory[slug]?.[nextIndex];
    return categoryMatch ? { ...fallback, _id: categoryMatch._id } : fallback;
  });
}

function useApi<T>(path: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  useEffect(() => {
    api.get(path).then((res) => setData(res.data)).catch(() => setData(fallback));
  }, [path]);
  return [data, setData] as const;
}

function useCart() {
  const [cart, setCartState] = useState<CartLine[]>(() => JSON.parse(localStorage.getItem("hpd-cart") || "[]"));
  const setCart = (next: CartLine[]) => {
    setCartState(next);
    localStorage.setItem("hpd-cart", JSON.stringify(next));
  };
  return [cart, setCart] as const;
}

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("hpd-token") || ""}` };
}

function currentStaff(): StaffUser | null {
  try {
    return JSON.parse(localStorage.getItem("hpd-user") || "null");
  } catch {
    return null;
  }
}

function roleHome(role?: string) {
  if (role === "KITCHEN" || role === "COOK") return "/kitchen";
  if (role === "BILL_DESK" || role === "CASHIER" || role === "ORDER_MANAGER") return "/bill-desk";
  return "/manager";
}

function menuIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("pizza") || lower.includes("margherita")) return "🍕";
  if (lower.includes("burger")) return "🍔";
  if (lower.includes("sandwich")) return "🥪";
  if (lower.includes("pasta")) return "🍝";
  if (lower.includes("fries")) return "🍟";
  if (lower.includes("momos")) return "🥟";
  if (lower.includes("shake")) return "🥤";
  if (lower.includes("mojito")) return "🍹";
  if (lower.includes("coffee")) return "☕";
  if (lower.includes("lemonade")) return "🍋";
  if (lower.includes("bubble")) return "🧋";
  if (lower.includes("brownie")) return "🍫";
  if (lower.includes("waffle")) return "🧇";
  return "🍽️";
}

function Header() {
  const [cart] = useCart();
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const nav = [["/", "Home"], ["/menu", "Menu"], ["/about", "About"], ["/login", "Staff Login"]];
  return <header className="site-header">
    <div className="landing-shell flex items-center justify-between py-4">
      <Link to="/" className="brand-mark"><span>🔥</span><b>Hungry Point<small>Duraha</small></b></Link>
      <nav className="hidden items-center gap-9 md:flex">
        {nav.map(([href, label]) => href.startsWith("#") ? <a key={href} href={href} className="nav-link">{label}</a> : <NavLink key={href} to={href} className="nav-link">{label}</NavLink>)}
      </nav>
      <Link className="cart-pill" to="/cart"><ShoppingCart size={15} /> Cart {cartCount ? <span className="cart-count">{cartCount}</span> : null}</Link>
    </div>
  </header>;
}

function Home() {
  const [apiItems] = useApi<MenuItem[]>("/menu/items?limit=8", []);
  const [apiReviews] = useApi<{ name: string; rating: number; comment: string }[]>("/reviews/public", []);
  const [cart, setCart] = useCart();
  const [customizing, setCustomizing] = useState<MenuItem | null>(null);
  const items = displayMenuItems(apiItems).slice(0, 8);
  const reviews = apiReviews.length ? apiReviews : fallbackReviews;
  const addToCart = (line: CartLine) => {
    setCart([...cart, line]);
    toast.success(`${line.item.name} added to cart`);
  };

  return <main className="landing-page">
    <section className="landing-hero">
      <div className="landing-shell hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">🔥 Now serving in Doraha</p>
          <h1>Hungry?<span>We got you.</span></h1>
          <p>Wood-fired pizzas, juicy burgers, thick shakes and bold mojitos - hot and fresh at Hungry Point - Duraha.</p>
          <div className="hero-actions">
            <Link className="btn-primary" to="/menu">Order Online <span>›</span></Link>
            <a className="btn-secondary" href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_PHONE || "919876543210"}?text=${encodeURIComponent("Hi Hungry Point - Duraha, I want to place an order.")}`}><MessageCircle size={16} /> WhatsApp</a>
            <a className="btn-secondary" href="tel:+919876543210"><Phone size={16} /> Call</a>
          </div>
          <div className="hero-meta">
            <span><Clock size={15} /> 11:00 AM - 11:00 PM</span>
            <span>Open all days</span>
            <span><Star size={15} /> 4.7 (320+ reviews)</span>
          </div>
        </div>
        <div className="hero-photo">
          <img src="https://images.unsplash.com/photo-1542834369-f10ebf06d3cb?auto=format&fit=crop&w=1100&q=85" alt="Pizza, burger, fries and drinks at Hungry Point" />
        </div>
      </div>
    </section>

    <section className="landing-shell category-strip" aria-label="Menu categories">
      {categoryTiles.map(([name, icon]) => <Link to="/menu" className="category-tile" key={name}><span>{icon}</span><b>{name}</b></Link>)}
    </section>

    <section className="landing-shell popular-section" id="menu">
      <div className="section-heading">
        <div><p className="section-kicker">Most loved</p><h2>Popular picks</h2></div>
        <Link to="/menu">See full menu →</Link>
      </div>
      <div className="popular-grid">{items.map((item) => <MenuCard key={item._id} item={item} onAdd={addToCart} onCustomize={setCustomizing} />)}</div>
    </section>

    <section className="about-band" id="about">
      <div className="landing-shell about-grid">
        <div>
          <p className="section-kicker">About us</p>
          <h2>Doraha's favourite hangout for hungry people.</h2>
          <p>At Hungry Point - Duraha, we believe great food shouldn't make you wait or break the bank. From cheesy pizzas to creamy shakes, every bite is made fresh on order with quality ingredients.</p>
          <div className="stats-row">
            <div><b>30+</b><span>Menu items</span></div>
            <div><b>320+</b><span>5★ reviews</span></div>
            <div><b>11-11</b><span>Open daily</span></div>
          </div>
        </div>
        <div className="deals-stack">
          {[
            ["Combo deal", "Pizza + Coke + Fries", "Save 20% on the trio. Use code HUNGRY20."],
            ["Free delivery", "On orders above ₹299", "Within 5 km of our Doraha kitchen."],
            ["Happy hours", "2 shakes for ₹199", "Every weekday between 4-6 PM."]
          ].map(([label, title, text]) => <div className="deal-card" key={title}><span>🎉</span><div><small>{label}</small><b>{title}</b><p>{text}</p></div></div>)}
        </div>
      </div>
    </section>

    <section className="landing-shell reviews-section">
      <p className="section-kicker">What people say</p>
      <h2>Loved by Doraha 💛</h2>
      <div className="review-grid">{reviews.slice(0, 3).map((review) => <div className="review-card" key={review.name}><div>★★★★★</div><p>"{review.comment}"</p><small>— {review.name}</small></div>)}</div>
    </section>

    <section className="landing-shell visit-card" id="contact">
      <div>
        <h2>Come visit us in Doraha.</h2>
        <p>Railway Rd, SBS Nagar, Doraha, Punjab 141421. We're right on Railway Road - you can't miss the smell of fresh pizza.</p>
        <div className="hero-actions">
          <a className="btn-primary" href="https://maps.google.com/?q=Railway+Rd+SBS+Nagar+Doraha+Punjab" target="_blank" rel="noreferrer"><MapPin size={16} /> Get directions</a>
          <a className="btn-dark-outline" href="tel:+919876543210"><Phone size={16} /> +919876543210</a>
        </div>
      </div>
      <iframe title="Hungry Point Doraha location" loading="lazy" src="https://maps.google.com/maps?q=Railway%20Rd%20SBS%20Nagar%20Doraha%20Punjab&t=&z=15&ie=UTF8&iwloc=&output=embed" />
    </section>

    <LandingFooter />
    {customizing ? <CustomizeModal item={customizing} onClose={() => setCustomizing(null)} onAdd={(line) => { addToCart(line); setCustomizing(null); }} /> : null}
  </main>;
}

function MenuCard({ item, onAdd, onCustomize }: { item: MenuItem; onAdd: (line: CartLine) => void; onCustomize?: (item: MenuItem) => void }) {
  const variant = item.variants?.[0] || { name: "Single", price: 99 };
  const customize = /pizza|shake/i.test(`${item.name} ${item.category.name}`);
  const handleClick = () => {
    if (customize && onCustomize) {
      onCustomize(item);
      return;
    }
    onAdd({ item, variant: variant.name, quantity: 1, toppings: [], unitPrice: variant.price });
  };
  return <div className="menu-card">
    <div className="menu-art"><span className={item.veg ? "veg-dot" : "nonveg-dot"} /><em>{menuIcon(item.name)}</em><small>Popular</small></div>
    <div className="p-4"><b>{item.name}</b><p className="mt-1 line-clamp-2 text-sm text-stone-600">{item.description}</p><div className="mt-4 flex items-center justify-between"><span className="font-black text-brand-red">₹{variant.price}</span><button className="btn-small" onClick={handleClick}>{customize ? "Customize" : "+ Add"}</button></div></div>
  </div>;
}

function CustomizeModal({ item, onAdd, onClose }: { item: MenuItem; onAdd: (line: CartLine) => void; onClose: () => void }) {
  const base = item.variants?.[0]?.price || 99;
  const sizeOptions = /pizza/i.test(`${item.name} ${item.category.name}`)
    ? [{ name: "Regular (7\")", price: base }, { name: "Medium (10\")", price: base + 80 }, { name: "Large (12\")", price: base + 160 }]
    : [{ name: "Regular", price: base }, { name: "Large", price: base + 50 }];
  const [variant, setVariant] = useState(sizeOptions[0]);
  const [extras, setExtras] = useState<{ name: string; price: number }[]>([]);
  const [quantity, setQuantity] = useState(1);
  const total = (variant.price + extras.reduce((sum, extra) => sum + extra.price, 0)) * quantity;
  const toggleExtra = (extra: { name: string; price: number }) => {
    setExtras((current) => current.some((entry) => entry.name === extra.name) ? current.filter((entry) => entry.name !== extra.name) : [...current, extra]);
  };

  return <div className="modal-backdrop" role="dialog" aria-modal="true">
    <div className="customize-modal">
      <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
      <div className="customize-head"><span>{menuIcon(item.name)}</span><div><b>{item.name}</b><p>{item.description}</p></div></div>
      <div className="customize-section"><small>Size</small>{sizeOptions.map((option, index) => <button key={option.name} className={clsx("choice-row", variant.name === option.name && "choice-active")} onClick={() => setVariant(option)}><span><i />{option.name}</span><b>{index === 0 ? "—" : `+₹${option.price - base}`}</b></button>)}</div>
      <div className="customize-section"><small>Add extras</small>{extraOptions.map((extra) => <label key={extra.name} className="choice-row"><span><input type="checkbox" checked={extras.some((entry) => entry.name === extra.name)} onChange={() => toggleExtra(extra)} />{extra.name}</span><b>+₹{extra.price}</b></label>)}</div>
      <div className="customize-footer">
        <div className="qty-stepper"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)}>+</button></div>
        <button className="btn-primary modal-add" onClick={() => onAdd({ item, variant: variant.name, quantity, toppings: extras, unitPrice: variant.price + extras.reduce((sum, extra) => sum + extra.price, 0) })}>Add • ₹{total}</button>
      </div>
    </div>
  </div>;
}

function CartPanel({ cart, setCart }: { cart: CartLine[]; setCart: (next: CartLine[]) => void }) {
  const total = cart.reduce((sum, line) => sum + lineTotal(line), 0);
  return <aside className="panel h-fit lg:sticky lg:top-20"><h3 className="mb-3 flex items-center gap-2 text-xl font-black"><ShoppingCart /> Cart</h3>{cart.length === 0 ? <p className="empty">No items added yet.</p> : cart.map((line, index) => <div className="cart-line" key={`${line.item._id}-${index}`}><div><b>{line.item.name}</b><p>{line.variant} x {line.quantity}</p></div><button onClick={() => setCart(cart.filter((_, i) => i !== index))}>Remove</button></div>)}<div className="mt-4 flex items-center justify-between text-lg font-black"><span>Total</span><span>₹{total}</span></div><Link className="btn-primary mt-4 w-full justify-center" to="/checkout">Checkout</Link></aside>;
}

function CartPage() {
  const [cart, setCart] = useCart();
  const subtotal = cart.reduce((sum, line) => sum + lineTotal(line), 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;
  const updateQty = (index: number, quantity: number) => setCart(cart.map((line, lineIndex) => lineIndex === index ? { ...line, quantity: Math.max(1, quantity) } : line));

  return <main className="cart-page">
    <section className="landing-shell cart-layout">
      <div>
        <h1>Your cart</h1>
        <p>{cart.length} item(s) ready to go.</p>
        <div className="cart-list">
          {cart.length ? cart.map((line, index) => <div className="cart-card" key={`${line.item._id}-${index}`}>
            <div className="cart-food-icon">{menuIcon(line.item.name)}</div>
            <div className="cart-card-main"><b>{line.item.name}</b><span>{line.variant}{line.toppings.length ? ` • ${line.toppings.map((topping) => topping.name).join(", ")}` : ""}</span><div className="qty-stepper mini"><button onClick={() => updateQty(index, line.quantity - 1)}>−</button><span>{line.quantity}</span><button onClick={() => updateQty(index, line.quantity + 1)}>+</button></div></div>
            <div className="cart-card-side"><b>₹{lineTotal(line)}</b><button onClick={() => setCart(cart.filter((_, lineIndex) => lineIndex !== index))}>Remove</button></div>
          </div>) : <div className="empty">Your cart is empty. Add something tasty from the menu.</div>}
        </div>
      </div>
      <aside className="bill-card">
        <h2>Bill summary</h2>
        <p><span>Subtotal</span><b>₹{subtotal}</b></p>
        <p><span>Tax (5%)</span><b>₹{tax}</b></p>
        <div><span>Total</span><b>₹{total}</b></div>
        <Link className={clsx("btn-primary", !cart.length && "disabled-link")} to={cart.length ? "/checkout" : "/menu"}>{cart.length ? "Proceed to checkout" : "Add items first"}</Link>
        <Link className="btn-secondary cart-more" to="/menu">Add more items</Link>
      </aside>
    </section>
  </main>;
}

function MenuPage() {
  const [apiItems] = useApi<MenuItem[]>("/menu/items", []);
  const [cart, setCart] = useCart();
  const [active, setActive] = useState("all");
  const [search, setSearch] = useState("");
  const [customizing, setCustomizing] = useState<MenuItem | null>(null);
  const displayItems = displayMenuItems(apiItems);
  const normalizedSearch = search.trim().toLowerCase();
  const categories = categoryTiles.map(([name, icon]) => ({ name, icon, slug: slugText(name) }));
  const filteredItems = displayItems.filter((item) => {
    const categorySlug = item.category.slug || item.category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const matchesCategory = active === "all" || categorySlug === active;
    const matchesSearch = !normalizedSearch || `${item.name} ${item.description} ${item.category.name}`.toLowerCase().includes(normalizedSearch);
    return matchesCategory && matchesSearch;
  });
  const grouped = categories.map((category) => ({
    ...category,
    items: filteredItems.filter((item) => (item.category.slug || item.category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")) === category.slug)
  })).filter((category) => category.items.length);
  const addToCart = (line: CartLine) => {
    setCart([...cart, line]);
    toast.success(`${line.item.name} added to cart`);
  };

  return <main className="menu-page">
    <section className="menu-hero">
      <div className="landing-shell">
        <p className="section-kicker">Our menu</p>
        <h1>Pick your hunger.</h1>
        <div className="menu-search"><Search size={18} /><input placeholder="Search pizza, fries, shakes..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      </div>
    </section>

    <div className="menu-tabs-wrap">
      <div className="landing-shell menu-tabs">
        <button className={clsx("menu-tab", active === "all" && "menu-tab-active")} onClick={() => setActive("all")}>⭐ All</button>
        {categories.map((category) => <button key={category.slug} className={clsx("menu-tab", active === category.slug && "menu-tab-active")} onClick={() => setActive(category.slug)}>{category.icon} {category.name}</button>)}
      </div>
    </div>

    <section className="landing-shell menu-sections">
      {grouped.length ? grouped.map((category) => <div className="menu-category-section" key={category.slug}>
        <h2>{category.icon} {category.name}</h2>
        <div className="menu-page-grid">{category.items.map((item) => <MenuCard key={item._id} item={item} onAdd={addToCart} onCustomize={setCustomizing} />)}</div>
      </div>) : <div className="empty menu-empty">No menu items found. Try another search.</div>}
    </section>

    <LandingFooter />
    {customizing ? <CustomizeModal item={customizing} onClose={() => setCustomizing(null)} onAdd={(line) => { addToCart(line); setCustomizing(null); }} /> : null}
  </main>;
}

function AboutPage() {
  const [apiReviews] = useApi<{ name: string; rating: number; comment: string }[]>("/reviews/public", []);
  const reviews = apiReviews.length ? apiReviews : fallbackReviews;

  return <main className="about-page">
    <section className="about-band about-page-band">
      <div className="landing-shell about-grid">
        <div>
          <p className="section-kicker">About us</p>
          <h2>Doraha's favourite hangout for hungry people.</h2>
          <p>At Hungry Point - Duraha, we believe great food shouldn't make you wait or break the bank. From cheesy pizzas to creamy shakes, every bite is made fresh on order with quality ingredients - the way we'd serve our own family.</p>
          <div className="stats-row">
            <div><b>30+</b><span>Menu items</span></div>
            <div><b>320+</b><span>5★ reviews</span></div>
            <div><b>11-11</b><span>Open daily</span></div>
          </div>
        </div>
        <div className="deals-stack">
          {[
            ["Combo deal", "Pizza + Coke + Fries", "Save 20% on the trio. Use code HUNGRY20."],
            ["Free delivery", "On orders above ₹299", "Within 5 km of our Doraha kitchen."],
            ["Happy hours", "2 shakes for ₹199", "Every weekday between 4-6 PM."]
          ].map(([label, title, text]) => <div className="deal-card" key={title}><span>🎉</span><div><small>{label}</small><b>{title}</b><p>{text}</p></div></div>)}
        </div>
      </div>
    </section>

    <section className="landing-shell reviews-section">
      <p className="section-kicker">What people say</p>
      <h2>Loved by Doraha 💛</h2>
      <div className="review-grid">{reviews.slice(0, 3).map((review) => <div className="review-card" key={review.name}><div>★★★★★</div><p>"{review.comment}"</p><small>— {review.name}</small></div>)}</div>
    </section>

    <section className="landing-shell visit-card" id="contact">
      <div>
        <h2>Come visit us in Doraha.</h2>
        <p>Railway Rd, SBS Nagar, Doraha, Punjab 141421. We're right on Railway Road - you can't miss the smell of fresh pizza.</p>
        <div className="hero-actions">
          <a className="btn-primary" href="https://maps.google.com/?q=Railway+Rd+SBS+Nagar+Doraha+Punjab" target="_blank" rel="noreferrer"><MapPin size={16} /> Get directions</a>
          <a className="btn-dark-outline" href="tel:+919876543210"><Phone size={16} /> +919876543210</a>
        </div>
      </div>
      <iframe title="Hungry Point Doraha location" loading="lazy" src="https://maps.google.com/maps?q=Railway%20Rd%20SBS%20Nagar%20Doraha%20Punjab&t=&z=15&ie=UTF8&iwloc=&output=embed" />
    </section>

    <LandingFooter />
  </main>;
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
  return <main className="mx-auto max-w-3xl px-4 py-8"><div className="panel"><h1>Live Order Tracking</h1><input className="input" placeholder="Paste order ID" value={id} onChange={(e) => setId(e.target.value)} />{order ? <div className="status-board"><b>{order.orderNumber}</b><span className="badge">{order.status}</span><p>Total: ₹{order.total}</p></div> : <p className="empty">Enter an order ID to track live status.</p>}</div></main>;
}

function Login() {
  const [username, setUsername] = useState("manager");
  const [password, setPassword] = useState("HungryPoint@123");
  const [loading, setLoading] = useState(false);
  const login = async () => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      localStorage.setItem("hpd-token", res.data.token);
      localStorage.setItem("hpd-user", JSON.stringify(res.data.user));
      toast.success(`Welcome ${res.data.user.name}`);
      location.href = roleHome(res.data.user.role);
    } catch {
      toast.error("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };
  return <main className="staff-login-page">
    <div className="staff-login-card">
      <p className="section-kicker">Staff login</p>
      <h1>Hungry Point control panel</h1>
      <input className="input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="btn-primary w-full justify-center" disabled={loading} onClick={login}>{loading ? "Signing in..." : "Login"}</button>
      <div className="login-hints"><b>Demo logins</b><span>manager / HungryPoint@123</span><span>billdesk / HungryPoint@123</span><span>kitchen / HungryPoint@123</span></div>
    </div>
  </main>;
}

function useStaffApi<T>(path: string, fallback: T) {
  const token = localStorage.getItem("hpd-token");
  const [data, setData] = useState<T>(fallback);
  useEffect(() => { api.get(path, { headers: { Authorization: `Bearer ${token}` } }).then((res) => setData(res.data)).catch(() => {}); }, [path, token]);
  return [data, setData] as const;
}

function RequireStaff({ roles, children }: { roles?: string[]; children: React.ReactNode }) {
  const staff = currentStaff();
  if (!staff || !localStorage.getItem("hpd-token")) return <main className="staff-login-page"><div className="staff-login-card"><h1>Login required</h1><p>Please login to continue.</p><Link className="btn-primary" to="/login">Go to login</Link></div></main>;
  if (roles?.length && !roles.includes(staff.role)) return <main className="staff-login-page"><div className="staff-login-card"><h1>Access denied</h1><p>Your role cannot open this screen.</p><Link className="btn-primary" to={roleHome(staff.role)}>Go to your panel</Link></div></main>;
  return <>{children}</>;
}

function DashboardShell({ title, children }: { title: string; children: React.ReactNode }) {
  const links = [["/manager", "Manager"], ["/bill-desk", "Bill Desk"], ["/kitchen", "Kitchen"], ["/admin", "Dashboard"], ["/employee", "Employee"]];
  return <main className="min-h-screen bg-stone-50"><div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 md:grid-cols-[220px_1fr]"><aside className="panel h-fit"><b>Hungry Point</b>{links.map(([href, label]) => <Link className="side-link" key={href} to={href}>{label}</Link>)}</aside><section className="space-y-5"><h1>{title}</h1>{children}</section></div></main>;
}

function ManagementGrid() {
  const modules = ["Orders", "Menu Categories", "Menu Items", "Offers/Coupons", "Employees", "Attendance", "Salary", "Salary Slips", "Customers", "Reviews", "Reports", "Settings"];
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{modules.map((module) => <div className="panel compact" key={module}>{module}<button className="btn-small mt-3">Manage</button></div>)}</div>;
}

function OrdersBoard() {
  const [orders, setOrders] = useStaffApi<Order[]>("/orders", []);
  useEffect(() => { socket.on("order:new", (order: Order) => setOrders([order, ...orders])); return () => { socket.off("order:new"); }; }, [orders, setOrders]);
  return <div className="panel"><h2>Recent Orders</h2><div className="table">{orders.slice(0, 8).map((order) => <div className="row" key={order._id}><span>{order.orderNumber}</span><span>{order.customer?.name}</span><span className="badge">{order.status}</span><span>₹{order.total}</span></div>)}</div></div>;
}

function Admin() {
  const [summary] = useStaffApi<any>("/reports/summary", {});
  const cards = [["Today Sales", summary.todaySales || 0, <CreditCard />], ["Total Orders", summary.totalOrders || 0, <Receipt />], ["Employees", summary.employees || 0, <Users />], ["Retention", "30 days", <FileText />]];
  return <DashboardShell title="Admin Dashboard"><div className="grid gap-4 md:grid-cols-4">{cards.map(([label, value, icon]) => <div className="panel" key={String(label)}><div className="flex justify-between text-brand-red">{icon}<BarChart3 /></div><p className="mt-4 text-sm">{label}</p><b className="text-2xl">{value}</b></div>)}</div><ManagementGrid /><OrdersBoard /></DashboardShell>;
}

function POS() {
  const [items] = useApi<MenuItem[]>("/menu/items", []);
  const [cart, setCart] = useCart();
  return <DashboardShell title="POS Billing"><div className="grid gap-6 lg:grid-cols-[1fr_360px]"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <MenuCard key={item._id} item={item} onAdd={(line) => setCart([...cart, line])} />)}</div><CartPanel cart={cart} setCart={setCart} /></div></DashboardShell>;
}

function BillDeskPOS() {
  const [apiItems] = useApi<MenuItem[]>("/menu/items", []);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState({ name: "Walk-in", phone: "", tableNumber: "", address: "", type: "DINE_IN", paymentMethod: "CASH" });
  const items = displayMenuItems(apiItems);
  const subtotal = cart.reduce((sum, line) => sum + lineTotal(line), 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;
  const addLine = (item: MenuItem) => {
    const variant = item.variants[0] || { name: "Single", price: 0 };
    setCart((current) => [...current, { item, variant: variant.name, quantity: 1, toppings: [], unitPrice: variant.price }]);
  };
  const updateQty = (index: number, quantity: number) => setCart(cart.map((line, lineIndex) => lineIndex === index ? { ...line, quantity: Math.max(1, quantity) } : line));
  const placeOrder = async () => {
    if (!cart.length) return toast.error("Add items first");
    const res = await api.post("/orders", {
      customer,
      type: customer.type,
      taxRate: 5,
      paymentMethod: customer.paymentMethod,
      items: cart.map((line) => ({ menuItem: line.item._id, variant: line.variant, quantity: line.quantity, toppings: line.toppings }))
    });
    toast.success(`Order placed: ${res.data.orderNumber}`);
    setCart([]);
  };
  return <RequireStaff roles={["BILL_DESK", "CASHIER", "ORDER_MANAGER", "MANAGER", "SUPER_ADMIN", "HEAD_OFFICE_ADMIN"]}>
    <DashboardShell title="Bill Desk - Pet Pooja Style Order">
      <div className="pos-layout">
        <section>
          <div className="pos-customer-panel">
            <input placeholder="Customer name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
            <input placeholder="Phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
            <input placeholder="Table no." value={customer.tableNumber} onChange={(e) => setCustomer({ ...customer, tableNumber: e.target.value })} />
            <select value={customer.type} onChange={(e) => setCustomer({ ...customer, type: e.target.value })}><option value="DINE_IN">Dine-in</option><option value="TAKEAWAY">Takeaway</option><option value="DELIVERY">Delivery</option></select>
          </div>
          <div className="pos-menu-grid">{items.map((item) => <button className="pos-item" key={item._id} onClick={() => addLine(item)}><span>{menuIcon(item.name)}</span><b>{item.name}</b><small>₹{item.variants[0]?.price || 0}</small></button>)}</div>
        </section>
        <aside className="pos-cart">
          <h2>Current order</h2>
          {cart.map((line, index) => <div className="pos-line" key={`${line.item._id}-${index}`}><div><b>{line.item.name}</b><small>{line.variant}</small></div><div className="qty-stepper mini"><button onClick={() => updateQty(index, line.quantity - 1)}>−</button><span>{line.quantity}</span><button onClick={() => updateQty(index, line.quantity + 1)}>+</button></div><strong>₹{lineTotal(line)}</strong><button onClick={() => setCart(cart.filter((_, lineIndex) => lineIndex !== index))}>Remove</button></div>)}
          {!cart.length ? <p className="empty">Tap menu items to build an order.</p> : null}
          <div className="pos-total"><span>Subtotal</span><b>₹{subtotal}</b></div>
          <div className="pos-total"><span>Tax</span><b>₹{tax}</b></div>
          <div className="pos-grand"><span>Total</span><b>₹{total}</b></div>
          <button className="btn-primary w-full justify-center" onClick={placeOrder}>Place order to kitchen</button>
        </aside>
      </div>
    </DashboardShell>
  </RequireStaff>;
}

function ManagerPanel() {
  const [users, setUsers] = useStaffApi<StaffUser[]>("/admin/users", []);
  const [categories, setCategories] = useStaffApi<any[]>("/admin/categories", []);
  const [items, setItems] = useStaffApi<any[]>("/admin/items", []);
  const [orders] = useStaffApi<Order[]>("/orders", []);
  const [userForm, setUserForm] = useState({ name: "", username: "", email: "", password: "HungryPoint@123", role: "BILL_DESK" });
  const [catForm, setCatForm] = useState({ name: "", slug: "" });
  const [itemForm, setItemForm] = useState({ name: "", price: 99, category: "" });

  const createUser = async () => {
    const res = await api.post("/admin/users", userForm, { headers: authHeaders() });
    setUsers([res.data, ...users]);
    setUserForm({ name: "", username: "", email: "", password: "HungryPoint@123", role: "BILL_DESK" });
    toast.success("User created");
  };
  const createCategory = async () => {
    const slug = catForm.slug || slugText(catForm.name);
    const res = await api.post("/admin/categories", { ...catForm, slug }, { headers: authHeaders() });
    setCategories([res.data, ...categories]);
    setCatForm({ name: "", slug: "" });
    toast.success("Category created");
  };
  const createItem = async () => {
    const category = itemForm.category || categories[0]?._id;
    if (!category) return toast.error("Create a category first");
    const res = await api.post("/admin/items", { name: itemForm.name, category, description: "Manager added item", variants: [{ name: "Single", price: Number(itemForm.price) }], veg: true, available: true }, { headers: authHeaders() });
    setItems([res.data, ...items]);
    setItemForm({ name: "", price: 99, category: "" });
    toast.success("Item created");
  };
  const remove = async (path: string, id: string, setter: (next: any[]) => void, list: any[]) => {
    await api.delete(`/admin/${path}/${id}`, { headers: authHeaders() });
    setter(list.filter((entry) => entry._id !== id));
  };

  return <RequireStaff roles={["MANAGER", "SUPER_ADMIN", "HEAD_OFFICE_ADMIN"]}>
    <DashboardShell title="Manager Controller">
      <div className="manager-grid">
        <section className="manager-card"><h2>Users</h2><input placeholder="Name" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} /><input placeholder="Username" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} /><input placeholder="Email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} /><select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}><option value="BILL_DESK">Bill Desk</option><option value="KITCHEN">Kitchen</option><option value="MANAGER">Manager</option></select><button className="btn-small" onClick={createUser}>Create user</button><ManagerList rows={users} onDelete={(id) => remove("users", id, setUsers, users)} /></section>
        <section className="manager-card"><h2>Categories</h2><input placeholder="Category name" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} /><input placeholder="Slug" value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} /><button className="btn-small" onClick={createCategory}>Create category</button><ManagerList rows={categories} onDelete={(id) => remove("categories", id, setCategories, categories)} /></section>
        <section className="manager-card"><h2>Items</h2><input placeholder="Item name" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} /><input placeholder="Price" type="number" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })} /><select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select><button className="btn-small" onClick={createItem}>Create item</button><ManagerList rows={items} onDelete={(id) => remove("items", id, setItems, items)} /></section>
        <section className="manager-card manager-orders"><h2>Orders</h2>{orders.slice(0, 12).map((order) => <div className="manager-row" key={order._id}><span>{order.orderNumber}</span><b>{order.status}</b><em>₹{order.total}</em></div>)}</section>
      </div>
    </DashboardShell>
  </RequireStaff>;
}

function ManagerList({ rows, onDelete }: { rows: any[]; onDelete: (id: string) => void }) {
  return <div className="manager-list">{rows.slice(0, 8).map((row) => <div className="manager-row" key={row._id}><span>{row.name || row.email || row.orderNumber}</span><b>{row.role || row.slug || row.status || ""}</b><button onClick={() => onDelete(row._id)}>Delete</button></div>)}</div>;
}

function Kitchen() {
  const [orders, setOrders] = useStaffApi<Order[]>("/orders?status=PENDING", []);
  const update = async (order: Order, status: string) => { const token = localStorage.getItem("hpd-token"); const res = await api.patch(`/orders/${order._id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } }); setOrders(orders.map((o) => o._id === order._id ? res.data : o)); };
  useEffect(() => { socket.on("order:new", (order: Order) => { new Audio("/notify.mp3").play().catch(() => {}); setOrders((prev) => [order, ...prev]); }); return () => { socket.off("order:new"); }; }, []);
  return <RequireStaff roles={["KITCHEN", "COOK", "MANAGER", "SUPER_ADMIN", "HEAD_OFFICE_ADMIN"]}>
    <DashboardShell title="Kitchen Display"><div className="grid gap-4 lg:grid-cols-3">{orders.map((order) => <div className="kitchen-card" key={order._id}><div className="flex justify-between"><b>{order.orderNumber}</b><span className="badge">{order.status}</span></div><p>{order.type} {order.customer?.tableNumber || order.customer?.address}</p>{order.items?.map((line: any, i: number) => <div className="cart-line" key={i}><span>{line.quantity} x {line.name || line.item?.name}</span><b>{line.variant}</b></div>)}<div className="mt-4 grid grid-cols-3 gap-2">{["ACCEPTED", "PREPARING", "READY"].map((status) => <button className="btn-small" key={status} onClick={() => update(order, status)}>{status}</button>)}</div></div>)}</div></DashboardShell>
  </RequireStaff>;
}

function Employee() {
  return <DashboardShell title="Employee Portal"><div className="grid gap-4 md:grid-cols-3">{[["My Profile", <Users />], ["My Attendance", <CalendarCheck />], ["My Salary Slips", <FileText />]].map(([label, icon]) => <div className="panel" key={String(label)}>{icon}<h2>{label}</h2><button className="btn-small">View</button></div>)}</div></DashboardShell>;
}

function LandingFooter() {
  return <footer className="landing-footer">
    <div className="landing-shell footer-grid">
      <div><Link to="/" className="brand-mark footer-brand"><span>🔥</span><b>Hungry Point - Duraha</b></Link><p>Punjab's tastiest fast food, hot and fresh.</p></div>
      <div><b>Visit us</b><p>📍 Railway Rd, SBS Nagar, Doraha, Punjab 141421</p><p>🕘 11:00 AM - 11:00 PM · Open all days</p></div>
      <div><b>Order now</b><p>📞 +919876543210</p><p>💬 WhatsApp us</p><a href="https://maps.google.com/?q=Railway+Rd+SBS+Nagar+Doraha+Punjab">Get directions →</a></div>
    </div>
    <div className="footer-bottom">© 2026 Hungry Point - Duraha. All rights reserved.</div>
  </footer>;
}

function App() {
  return <BrowserRouter><Toaster position="top-right" /><Header /><Routes><Route path="/" element={<Home />} /><Route path="/menu" element={<MenuPage />} /><Route path="/about" element={<AboutPage />} /><Route path="/cart" element={<CartPage />} /><Route path="/checkout" element={<Checkout />} /><Route path="/track" element={<Track />} /><Route path="/login" element={<Login />} /><Route path="/manager" element={<ManagerPanel />} /><Route path="/bill-desk" element={<BillDeskPOS />} /><Route path="/admin" element={<Admin />} /><Route path="/pos" element={<POS />} /><Route path="/kitchen" element={<Kitchen />} /><Route path="/employee" element={<Employee />} /></Routes></BrowserRouter>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
