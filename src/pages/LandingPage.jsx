import React, { useState, useEffect, useRef, useCallback } from "react";
import { register, login } from "../api/auth";
import { getAllNotes } from "../api/notes";
import { getPurchaseByUserId, checkPurchase } from "../api/bundle";

const STEPS = [
  { num: "01", title: "Pay ₹39", body: "Secure one-time checkout. No account needed to start." },
  { num: "02", title: "Dashboard unlocks", body: "Your access activates immediately with the full bundle." },
  { num: "03", title: "Download anytime", body: "Come back whenever — new PDFs appear automatically." },
];

const FAQS = [
  { q: "Do I get new PDFs added later, for free?", a: "Yes — the bundle includes every future PDF at no extra cost. Once you're in, you're in for good." },
  { q: "Where do I download the PDFs?", a: "From your dashboard, right after payment. It stays available whenever you need to redownload." },
  { q: "Is this a subscription?", a: "No — it's a single ₹39 payment for lifetime access. No renewals, no hidden charges." },
];

const FAN_ANGLES = [-22, -13, -4, 5, 14, 23];
const FAN_X = [-150, -92, -32, 30, 90, 150];

function Reveal({ children, className = "", as: Tag = "div", ...rest }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? "in" : ""} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

const CHECKOUT_URL = import.meta.env.VITE_CHECKOUT_URL || null;

export default function LandingPage({ user, setUser, onNavigate }) {
  const [termStarted, setTermStarted] = useState(false);
  const [lineVisible, setLineVisible] = useState([false, false, false, false]);
  const [fanShown, setFanShown] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authMsg, setAuthMsg] = useState("");

  const [purchaseStatus, setPurchaseStatus] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);

  const termRef = useRef(null);
  const fanRef = useRef(null);
  const buyRef = useRef(null);

  useEffect(() => {
    getAllNotes()
      .then((res) => setNotes(res.data))
      .catch(() => {})
      .finally(() => setNotesLoading(false));
  }, []);

  useEffect(() => {
    if (user.token && user.email) {
      checkPurchase(user.email)
        .then((res) => setPurchaseStatus(res.data))
        .catch(() => {});
    }
  }, [user]);

  const isLoggedIn = !!user.token;
  const displayCards = notes.length > 0
    ? notes.filter((n) => n.active).map((n, i) => ({
        tag: n.title,
        ttl: n.description,
        pages: n.pdfUrl ? "PDF Available" : "Coming soon",
        v: n.price > 0 ? `₹${n.price}` : "Free",
        thumbnailUrl: n.thumbnailUrl,
      }))
    : [];

  const cardsToShow = displayCards.length > 0 ? displayCards : [];

  useEffect(() => {
    const el = termRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTermStarted(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!termStarted) return;
    const timers = [0, 1, 2, 3].map((i) =>
      setTimeout(() => {
        setLineVisible((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 450 * (i + 1))
    );
    return () => timers.forEach(clearTimeout);
  }, [termStarted]);

  useEffect(() => {
    const el = fanRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setFanShown(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const scrollToBuy = useCallback(() => {
    buyRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const cardTransform = (i) => {
    const base = `translateX(-50%) translateX(${FAN_X[i]}px)`;
    if (hoveredCard === i) {
      return `${base} rotate(0deg) translateY(-14px) scale(1.05)`;
    }
    return `${base} rotate(${FAN_ANGLES[i]}deg) translateY(${Math.abs(FAN_ANGLES[i]) * 1.4}px)`;
  };

  const handleAuthInput = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthMsg("");
    try {
      if (authMode === "login") {
        const res = await login({ email: authForm.email, password: authForm.password });
        const { token, email: em, role, userId } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("email", em);
        localStorage.setItem("role", role);
        if (userId) localStorage.setItem("userId", userId);
        setUser({ email: em, token, role, userId });
        setShowAuth(false);
        setAuthForm({ name: "", email: "", password: "" });
        if (role === "ROLE_ADMIN") {
          onNavigate("adminDashboard");
        }
      } else {
        const res = await register({ name: authForm.name, email: authForm.email, password: authForm.password });
        setAuthMsg(res.data);
        if (res.data === "Registration Successful") {
          setAuthMode("login");
          setAuthForm({ name: "", email: "", password: "" });
        }
      }
    } catch (err) {
      setAuthMsg(err.response?.data || "Something went wrong");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    setUser({ email: null, token: null, role: null, userId: null });
    setPurchaseStatus(null);
    setShowDashboard(false);
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === "login" ? "register" : "login");
    setAuthMsg("");
  };

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setAuthMsg("");
    setAuthForm({ name: "", email: "", password: "" });
    setShowAuth(true);
  };

  return (
    <div className="kkn-root">
      <style>{`
        .kkn-root{
          --bg:#16261F;
          --surface:#1E332A;
          --surface-2:#243D32;
          --border:#33513F;
          --text:#F3F1E7;
          --text-dim:#A9BBAF;
          --accent:#E8C468;
          --accent-soft:#F0D98A;
          --accent-dim:#6B5726;
          --on-accent:#16261F;
          --radius:14px;
          --font-mono:'JetBrains Mono', monospace;
          --font-sans:'Inter', sans-serif;
          --font-display:'Kalam', cursive;
          background:var(--bg);
          color:var(--text);
          font-family:var(--font-sans);
          overflow-x:hidden;
          -webkit-font-smoothing:antialiased;
          position:relative;
          min-height:100vh;
        }
        .kkn-root *{margin:0;padding:0;box-sizing:border-box;}
        .kkn-root ::selection{background:var(--accent);color:var(--on-accent);}

        .kkn-root .bgGrid{
          content:"";
          position:fixed;inset:0;
          background-image:
            linear-gradient(rgba(232,196,104,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,196,104,0.035) 1px, transparent 1px);
          background-size:48px 48px;
          pointer-events:none;
          z-index:0;
          mask-image:radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%);
        }
        .kkn-root .bgDust{
          content:"";position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.05;
          background-image:radial-gradient(circle at 20% 30%, #fff 0.5px, transparent 0.5px),
                            radial-gradient(circle at 70% 60%, #fff 0.5px, transparent 0.5px);
          background-size:3px 3px, 4px 4px;
        }

        .kkn-root .wrap{max-width:1120px;margin:0 auto;padding:0 24px;position:relative;z-index:1;}

        .kkn-root nav{
          position:sticky;top:0;z-index:50;
          background:rgba(22,38,31,0.75);
          backdrop-filter:blur(10px);
          border-bottom:1px solid var(--border);
        }
        .kkn-root nav .wrap{display:flex;align-items:center;justify-content:space-between;height:68px;}
        .kkn-root .logo{
          font-family:var(--font-mono);font-weight:700;font-size:16px;
          display:flex;align-items:center;gap:8px;letter-spacing:-0.02em;
        }
        .kkn-root .logo .dot{width:8px;height:8px;background:var(--accent);border-radius:2px;
          box-shadow:0 0 12px var(--accent);}
        .kkn-root .logo .brand{color:var(--text);}
        .kkn-root .logo .brand span{color:var(--accent);}
        .kkn-root .navlinks{display:flex;gap:32px;font-family:var(--font-mono);font-size:13px;color:var(--text-dim);align-items:center;}
        .kkn-root .navlinks a{color:inherit;text-decoration:none;transition:color .2s;cursor:pointer;}
        .kkn-root .navlinks a:hover{color:var(--accent);}
        .kkn-root .nav-cta{
          font-family:var(--font-mono);font-size:13px;font-weight:600;
          background:var(--accent);color:var(--on-accent);padding:8px 16px;border-radius:8px;
          text-decoration:none;transition:transform .15s, box-shadow .15s;
          border:none;cursor:pointer;
        }
        .kkn-root .nav-cta:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(232,196,104,0.35);}
        .kkn-root .nav-btn{
          font-family:var(--font-mono);font-size:13px;font-weight:600;
          background:transparent;color:var(--text-dim);padding:8px 16px;border-radius:8px;
          border:1px solid var(--border);cursor:pointer;transition:color .2s, border-color .2s;
        }
        .kkn-root .nav-btn:hover{color:var(--accent);border-color:var(--accent);}
        @media (max-width:720px){
          .kkn-root .navlinks{gap:16px;}
          .kkn-root .logo .brand{font-size:13.5px;}
          .kkn-root nav .wrap{height:58px;}
          .kkn-root .nav-cta,.kkn-root .nav-btn{padding:6px 10px;font-size:11px;}
        }

        .kkn-root .hero{padding:88px 0 64px;}
        .kkn-root .eyebrow{
          font-family:var(--font-mono);font-size:12px;color:var(--accent);
          letter-spacing:0.14em;text-transform:uppercase;
          display:flex;align-items:center;gap:10px;margin-bottom:20px;
        }
        .kkn-root .eyebrow::before{content:"";width:20px;height:1px;background:var(--accent);}
        .kkn-root h1{
          font-family:var(--font-display);font-weight:700;letter-spacing:-0.01em;
          font-size:clamp(32px, 5.2vw, 58px);
          line-height:1.06;
          max-width:820px;
        }
        .kkn-root h1 .accent{color:var(--accent);}
        .kkn-root .hero-sub{
          font-size:17px;color:var(--text-dim);max-width:560px;margin-top:22px;line-height:1.6;
        }
        .kkn-root .hero-actions{display:flex;align-items:center;gap:18px;margin-top:34px;flex-wrap:wrap;}

        .kkn-root .btn-buy{
          font-family:var(--font-mono);font-weight:700;font-size:15px;
          background:var(--accent);color:var(--on-accent);border:none;
          padding:16px 30px;border-radius:10px;cursor:pointer;
          display:inline-flex;align-items:center;gap:10px;
          transition:transform .15s, box-shadow .15s;
          position:relative;
        }
        .kkn-root .btn-buy:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(232,196,104,0.4);}
        .kkn-root .btn-buy:active{transform:translateY(0);}
        .kkn-root .btn-buy .arrow{transition:transform .2s;display:inline-block;}
        .kkn-root .btn-buy:hover .arrow{transform:translateX(3px);}

        .kkn-root .price-tag{font-family:var(--font-mono);font-size:13px;color:var(--text-dim);}
        .kkn-root .price-tag .old{text-decoration:line-through;opacity:0.5;margin-right:6px;}
        .kkn-root .price-tag .new{color:var(--accent);font-weight:700;font-size:15px;}

        .kkn-root .badge{
          font-family:var(--font-mono);font-size:11px;padding:4px 10px;
          border-radius:20px;background:var(--accent-dim);color:var(--accent);
          display:inline-block;
        }

        .kkn-root .terminal{
          margin-top:56px;
          background:var(--surface);
          border:1px solid var(--border);
          border-radius:var(--radius);
          overflow:hidden;
          box-shadow:0 30px 80px -20px rgba(0,0,0,0.6);
          max-width:720px;
        }
        .kkn-root .term-bar{
          display:flex;align-items:center;gap:8px;
          padding:12px 16px;border-bottom:1px solid var(--border);
          background:var(--surface-2);
        }
        .kkn-root .term-bar .tdot{width:10px;height:10px;border-radius:50%;}
        .kkn-root .term-bar .tdot:nth-child(1){background:#ff5f56;}
        .kkn-root .term-bar .tdot:nth-child(2){background:#ffbd2e;}
        .kkn-root .term-bar .tdot:nth-child(3){background:#27c93f;}
        .kkn-root .term-title{
          font-family:var(--font-mono);font-size:12px;color:var(--text-dim);
          margin-left:8px;
        }
        .kkn-root .term-body{
          padding:22px 24px 26px;
          font-family:var(--font-mono);font-size:13.5px;line-height:1.9;
          min-height:190px;
        }

        .kkn-root .section{padding:88px 0;border-top:1px solid var(--border);}
        .kkn-root .section-head{margin-bottom:48px;}
        .kkn-root .section-eyebrow{
          font-family:var(--font-mono);font-size:12px;color:var(--accent);
          letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;
        }
        .kkn-root .section-title{
          font-family:var(--font-display);font-weight:700;font-size:clamp(22px,3vw,32px);
          letter-spacing:-0.01em;
        }
        .kkn-root .section-sub{color:var(--text-dim);margin-top:10px;font-size:15px;max-width:520px;}

        .kkn-root .fan-wrap{
          display:flex;justify-content:center;padding:40px 0 20px;
          perspective:1400px;
        }
        .kkn-root .fan{position:relative;width:100%;max-width:640px;height:280px;}
        .kkn-root .pdf-card{
          position:absolute;top:0;left:50%;width:190px;height:250px;
          background:var(--surface);border:1px solid var(--border);
          border-radius:10px;padding:18px;
          transform-origin:bottom center;
          transition:transform .45s cubic-bezier(.2,.8,.2,1), box-shadow .45s;
          box-shadow:0 20px 40px -14px rgba(0,0,0,0.55);
          opacity:0;
        }
        .kkn-root .pdf-card.show{opacity:1;}
        .kkn-root .pdf-card:hover{box-shadow:0 30px 60px -12px rgba(232,196,104,0.18);z-index:10 !important;}
        .kkn-root .pdf-card .tag{
          font-family:var(--font-mono);font-size:10px;color:var(--accent);
          letter-spacing:0.08em;text-transform:uppercase;margin-bottom:14px;
        }
        .kkn-root .pdf-card .ttl{font-family:var(--font-mono);font-weight:700;font-size:14.5px;line-height:1.35;color:var(--text);}
        .kkn-root .pdf-card .meta{
          position:absolute;bottom:16px;left:18px;right:18px;
          display:flex;justify-content:space-between;
          font-family:var(--font-mono);font-size:10.5px;color:var(--text-dim);
          border-top:1px solid var(--border);padding-top:10px;
        }
        .kkn-root .pdf-card .glyph{
          position:absolute;top:16px;right:16px;width:22px;height:22px;
          border:1px solid var(--accent-dim);border-radius:4px;
          display:flex;align-items:center;justify-content:center;
          font-family:var(--font-mono);font-size:9px;color:var(--accent);
        }
        .kkn-root .pdf-card .card-thumb{
          margin-bottom:10px;border-radius:8px;overflow:hidden;
          background:var(--surface-2);aspect-ratio:1.4;
        }
        .kkn-root .pdf-card .card-thumb img{
          width:100%;height:100%;object-fit:cover;display:block;
        }

        .kkn-root .price-card{
          background:linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%);
          border:1px solid var(--border);
          border-radius:20px;padding:48px;position:relative;overflow:hidden;
        }
        .kkn-root .price-card::after{
          content:"";position:absolute;top:-60%;right:-20%;width:60%;height:220%;
          background:radial-gradient(circle, rgba(232,196,104,0.10), transparent 65%);
        }
        .kkn-root .price-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:48px;align-items:center;position:relative;z-index:1;}
        .kkn-root .price-big{font-family:var(--font-mono);font-weight:800;font-size:56px;color:var(--accent);line-height:1;}
        .kkn-root .price-old{font-family:var(--font-mono);color:var(--text-dim);text-decoration:line-through;font-size:16px;margin-bottom:6px;}
        .kkn-root .feature-list{list-style:none;margin-top:22px;}
        .kkn-root .feature-list li{
          display:flex;align-items:flex-start;gap:10px;
          font-size:14.5px;color:var(--text-dim);margin-bottom:12px;
        }
        .kkn-root .feature-list li .check{color:var(--accent);font-family:var(--font-mono);font-weight:700;}
        .kkn-root .price-panel{border-left:1px solid var(--border);padding-left:48px;}

        .kkn-root .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
        .kkn-root .step{
          border:1px solid var(--border);border-radius:14px;padding:28px;
          background:var(--surface);transition:border-color .2s, transform .2s;
        }
        .kkn-root .step:hover{border-color:var(--accent-dim);transform:translateY(-3px);}
        .kkn-root .step .num{font-family:var(--font-mono);color:var(--accent);font-size:13px;margin-bottom:14px;}
        .kkn-root .step h3{font-family:var(--font-mono);font-size:16px;margin-bottom:8px;}
        .kkn-root .step p{color:var(--text-dim);font-size:14px;line-height:1.6;}

        .kkn-root .faq-item{border-bottom:1px solid var(--border);padding:22px 0;cursor:pointer;}
        .kkn-root .faq-q{display:flex;justify-content:space-between;align-items:center;font-family:var(--font-mono);font-weight:600;font-size:15px;}
        .kkn-root .faq-q .plus{color:var(--accent);transition:transform .25s;font-size:18px;display:inline-block;}
        .kkn-root .faq-item.open .plus{transform:rotate(45deg);}
        .kkn-root .faq-a{
          max-height:0;overflow:hidden;transition:max-height .3s ease, padding .3s ease;
          color:var(--text-dim);font-size:14.5px;line-height:1.7;
        }
        .kkn-root .faq-item.open .faq-a{max-height:200px;padding-top:14px;}

        .kkn-root footer{border-top:1px solid var(--border);padding:40px 0;}
        .kkn-root footer .wrap{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;}
        .kkn-root footer .fmark{font-family:var(--font-mono);font-size:13px;color:var(--text-dim);}
        .kkn-root footer .fmark span{color:var(--accent);}
        .kkn-root .fsocial{display:flex;gap:20px;font-family:var(--font-mono);font-size:13px;}
        .kkn-root .fsocial a{color:var(--text-dim);text-decoration:none;transition:color .2s;}
        .kkn-root .fsocial a:hover{color:var(--accent);}

        .kkn-root .reveal{opacity:0;transform:translateY(18px);transition:opacity .6s ease, transform .6s ease;}
        .kkn-root .reveal.in{opacity:1;transform:translateY(0);}

        .kkn-overlay{
          position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:100;
          display:flex;align-items:center;justify-content:center;
          padding:24px;backdrop-filter:blur(4px);
        }
        .kkn-modal{
          background:var(--surface);border:1px solid var(--border);
          border-radius:20px;padding:36px;width:100%;max-width:420px;
          position:relative;
        }
        .kkn-modal h2{
          font-family:var(--font-display);font-size:24px;margin-bottom:6px;
        }
        .kkn-modal .sub{
          color:var(--text-dim);font-size:14px;margin-bottom:24px;
        }
        .kkn-modal .field{margin-bottom:16px;}
        .kkn-modal label{
          font-family:var(--font-mono);font-size:11px;color:var(--text-dim);
          display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.06em;
        }
        .kkn-modal input{
          width:100%;padding:10px 14px;border-radius:8px;
          background:var(--surface-2);border:1px solid var(--border);
          color:var(--text);font-family:var(--font-mono);font-size:14px;
          outline:none;transition:border-color .2s;
        }
        .kkn-modal input:focus{border-color:var(--accent);}
        .kkn-modal .btn-submit{
          width:100%;padding:12px;border-radius:8px;
          background:var(--accent);color:var(--on-accent);
          font-family:var(--font-mono);font-weight:700;font-size:14px;
          border:none;cursor:pointer;transition:opacity .2s;
          margin-top:8px;
        }
        .kkn-modal .btn-submit:hover{opacity:0.9;}
        .kkn-modal .switch{
          text-align:center;margin-top:16px;
          font-size:13px;color:var(--text-dim);
        }
        .kkn-modal .switch a{color:var(--accent);cursor:pointer;text-decoration:underline;}
        .kkn-modal .msg{
          font-family:var(--font-mono);font-size:12px;padding:8px 12px;
          border-radius:6px;margin-bottom:16px;
        }
        .kkn-modal .msg.err{background:rgba(255,95,86,0.15);color:#ff5f56;}
        .kkn-modal .msg.ok{background:rgba(39,201,63,0.15);color:#27c93f;}
        .kkn-modal .close{
          position:absolute;top:16px;right:20px;
          background:none;border:none;color:var(--text-dim);font-size:22px;cursor:pointer;
          font-family:var(--font-mono);
        }
        .kkn-modal .close:hover{color:var(--text);}

        .kkn-dashboard{
          padding:48px 0;
        }
        .kkn-dashboard .grid{
          display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;
          margin-top:24px;
        }
        .kkn-dashboard .note-card{
          background:var(--surface);border:1px solid var(--border);
          border-radius:12px;padding:20px;transition:border-color .2s;
        }
        .kkn-dashboard .note-card:hover{border-color:var(--accent-dim);}
        .kkn-dashboard .note-card .nttl{
          font-family:var(--font-mono);font-weight:700;font-size:14px;margin-bottom:6px;
        }
        .kkn-dashboard .note-card .ndesc{
          color:var(--text-dim);font-size:13px;line-height:1.5;margin-bottom:12px;
        }
        .kkn-dashboard .note-card .nlink{
          font-family:var(--font-mono);font-size:12px;color:var(--accent);
          text-decoration:none;display:inline-flex;align-items:center;gap:4px;
        }
        .kkn-dashboard .note-card .nlink:hover{text-decoration:underline;}

        @media (max-width:760px){
          .kkn-root .price-grid{grid-template-columns:1fr;}
          .kkn-root .steps{grid-template-columns:1fr;}
          .kkn-root .price-panel{border-left:none;border-top:1px solid var(--border);padding-left:0;padding-top:32px;}
        }
        @media (max-width:680px){
          .kkn-root .wrap{padding:0 18px;}
          .kkn-root .hero{padding:48px 0 36px;}
          .kkn-root h1{font-size:clamp(26px,7.8vw,34px);line-height:1.14;}
          .kkn-root .hero-sub{font-size:14.5px;margin-top:16px;}
          .kkn-root .eyebrow{font-size:11px;margin-bottom:14px;}
          .kkn-root .hero-actions{flex-direction:column;align-items:stretch;gap:14px;margin-top:26px;}
          .kkn-root .btn-buy{width:100%;justify-content:center;padding:15px 22px;font-size:14px;}
          .kkn-root .price-tag{text-align:center;}
          .kkn-root .terminal{margin-top:32px;border-radius:10px;}
          .kkn-root .term-bar{padding:10px 12px;}
          .kkn-root .term-title{font-size:11px;}
          .kkn-root .term-body{
            padding:16px 14px 20px;
            font-size:11.5px;line-height:1.85;
            min-height:auto;white-space:normal;word-break:break-word;
          }
          .kkn-root .section{padding:56px 0;}
          .kkn-root .price-card{padding:26px 20px;border-radius:16px;}
          .kkn-root .price-big{font-size:42px;}
          .kkn-root .feature-list li{font-size:13.5px;}
          .kkn-root .step{padding:20px;}
          .kkn-root .step h3{font-size:15px;}
          .kkn-root .step p{font-size:13.5px;}
          .kkn-root .section-title{font-size:22px;}
          .kkn-root .section-sub{font-size:13.5px;}
          .kkn-root .faq-q{font-size:14px;}
          .kkn-root footer .wrap{flex-direction:column;align-items:flex-start;}
          .kkn-root .fan-wrap{padding:16px 0 8px;perspective:none;}
          .kkn-root .fan{height:auto;max-width:100%;}
          .kkn-root .pdf-card{
            position:static !important;
            width:100% !important;height:auto !important;min-height:150px;
            transform:none !important;padding:16px;margin:0;
          }
          .kkn-root .pdf-card:hover{transform:none !important;box-shadow:0 20px 40px -14px rgba(0,0,0,0.55) !important;}
          .kkn-root .fan{display:grid !important;grid-template-columns:repeat(2,1fr);gap:12px;}
          .kkn-root .pdf-card .meta{position:static;margin-top:16px;border-top:1px solid var(--border);padding-top:10px;}
          .kkn-root .pdf-card .tag{margin-bottom:10px;}
          .kkn-root .pdf-card .ttl{font-size:13px;}
        }
        @media (max-width:420px){
          .kkn-root .fan{grid-template-columns:1fr 1fr;gap:10px;}
          .kkn-root .pdf-card{padding:14px;min-height:130px;}
          .kkn-root .pdf-card .ttl{font-size:12.5px;}
          .kkn-root .pdf-card .glyph{width:18px;height:18px;font-size:8px;top:12px;right:12px;}
        }
        @media (max-width:380px){
          .kkn-root .term-body{font-size:10.5px;}
        }
        .kkn-root .term-body .prompt{color:var(--accent);}
        .kkn-root .term-line{color:var(--text-dim);opacity:0;transition:opacity .3s;}
        .kkn-root .term-line.show{opacity:1;}
        .kkn-root .term-line .hl{color:var(--text);}
        .kkn-root .term-line .y{color:var(--accent);font-weight:600;}
        .kkn-root .cursor{display:inline-block;width:8px;height:15px;background:var(--accent);
          vertical-align:middle;animation:kkn-blink 1s steps(1) infinite;}
        @keyframes kkn-blink{50%{opacity:0;}}
        @media (prefers-reduced-motion: reduce){
          .kkn-root *{animation-duration:0.001ms !important;transition-duration:0.001ms !important;}
        }
      `}</style>

      <div className="bgGrid" />
      <div className="bgDust" />

      <nav>
        <div className="wrap">
          <div className="logo">
            <span className="dot"></span>
            <span className="brand">codewith<span>_kk</span> / notes</span>
          </div>
          <div className="navlinks">
            <a href="#bundle">Bundle</a>
            <a href="#how">How it works</a>
            <a href="#faq">FAQ</a>
            {isLoggedIn ? (
              <>
                <span className="badge">{user.email}</span>
                <button className="nav-btn" onClick={() => onNavigate("dashboard")}>
                  Dashboard
                </button>
                <button className="nav-btn" onClick={() => onNavigate("profile")}>
                  Profile
                </button>
                <button className="nav-btn" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <a onClick={() => openAuthModal("login")}>Login</a>
                <button className="nav-cta" onClick={() => openAuthModal("register")}>
                  Sign Up
                </button>
              </>
            )}
          </div>
          {!isLoggedIn && (
            <button className="nav-cta" onClick={scrollToBuy} style={{ display: "none" }}>
              Get Access — ₹39
            </button>
          )}
        </div>
      </nav>

      {showDashboard && isLoggedIn ? (
        <section className="section kkn-dashboard">
          <div className="wrap">
            <div className="section-eyebrow">Dashboard</div>
            <div className="section-title">
              {purchaseStatus ? "Your Notes Library" : "Waiting for purchase"}
            </div>
            <p className="section-sub">
              {purchaseStatus
                ? "Download any PDF from your bundle — new ones appear automatically."
                : "Purchase the bundle to unlock your dashboard."}
            </p>
            {purchaseStatus && notes.length > 0 && (
              <div className="grid">
                {notes.filter((n) => n.active).map((note) => (
                  <div className="note-card" key={note.id}>
                    <div className="nttl">{note.title}</div>
                    <div className="ndesc">{note.description}</div>
                    {note.pdfUrl ? (
                      <a className="nlink" href={note.pdfUrl} target="_blank" rel="noopener noreferrer">
                        Download PDF →
                      </a>
                    ) : (
                      <span style={{ color: "var(--text-dim)", fontSize: 12 }}>Coming soon</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="hero">
            <div className="wrap">
              <div className="eyebrow">Premium Notes Bundle</div>
              <h1>
                All your Java &amp; Spring Boot notes,<br />
                in <span className="accent">one unlock.</span>
              </h1>
              <p className="hero-sub">
                One payment. Every PDF codewith_kk has made — and every one still coming.
                Lifetime access, downloadable anytime from your dashboard.
              </p>
              <div className="hero-actions">
                <button className="btn-buy" onClick={scrollToBuy}>
                  Unlock the bundle — ₹39 <span className="arrow">→</span>
                </button>
                <div className="price-tag">
                  <span className="old">₹499</span>
                  <span className="new">₹39 today</span>
                </div>
              </div>
              <div className="terminal reveal in" ref={termRef}>
                <div className="term-bar">
                  <span className="tdot"></span><span className="tdot"></span><span className="tdot"></span>
                  <span className="term-title">bash — kk-notes</span>
                </div>
                <div className="term-body">
                  <div className="term-line show"><span className="prompt">$</span> ./unlock-bundle --plan=premium</div>
                  <div className={`term-line ${lineVisible[0] ? "show" : ""}`}>
                    → scanning archive<span className="hl">... {notesLoading ? "scanning..." : `${notes.length} PDFs found`}</span>
                  </div>
                  <div className={`term-line ${lineVisible[1] ? "show" : ""}`}>
                    → topics: <span className="hl">Java, Spring Boot, DSA, SQL, REST APIs</span>
                  </div>
                  <div className={`term-line ${lineVisible[2] ? "show" : ""}`}>
                    → access: <span className="y">lifetime</span> · updates: <span className="y">included forever</span>
                  </div>
                  <div className={`term-line ${lineVisible[3] ? "show" : ""}`}>
                    → price: <span className="y">₹39</span> <span className="cursor"></span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section" id="bundle">
            <div className="wrap">
              <Reveal className="section-head">
                <div className="section-eyebrow">What's inside / {notes.length} PDFs</div>
                <div className="section-title">Notes that are actually current.</div>
                <p className="section-sub">
                  Every PDF is written and formatted for real interview prep — not filler.
                  New topics get added regularly, and they're already yours.
                </p>
              </Reveal>
              <div className="fan-wrap">
                <div className="fan" ref={fanRef}>
                  {(cardsToShow.length > 0 ? cardsToShow : Array(6).fill(null)).map((card, i) => (
                    <div
                      key={card ? card.tag : i}
                      className={`pdf-card ${fanShown ? "show" : ""}`}
                      style={{
                        transform: fanShown ? cardTransform(i) : undefined,
                        zIndex: i,
                        transitionDelay: fanShown ? `${i * 90}ms` : "0ms",
                      }}
                      onMouseEnter={() => setHoveredCard(i)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div className="tag">{card ? card.tag : "Loading..."}</div>
                      {card?.thumbnailUrl && (
                        <div className="card-thumb">
                          <img src={card.thumbnailUrl} alt={card.tag} />
                        </div>
                      )}
                      <div className="ttl">{card ? card.ttl : "Fetching notes"}</div>
                      <div className="meta">
                        <span>{card ? card.pages : ""}</span>
                        <span>{card ? card.v : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="section" id="buy" ref={buyRef}>
            <div className="wrap">
              <Reveal className="price-card">
                <div className="price-grid">
                  <div>
                    <div className="section-eyebrow">One-time payment</div>
                    <div className="price-old">₹499</div>
                    <div className="price-big">₹39</div>
                    <ul className="feature-list">
                      <li><span className="check">✓</span> Every current PDF, unlocked instantly</li>
                      <li><span className="check">✓</span> Every future PDF, at no extra cost</li>
                      <li><span className="check">✓</span> Lifetime access — no renewals, no expiry</li>
                      <li><span className="check">✓</span> Download anytime from your dashboard</li>
                    </ul>
                  </div>
                  <div className="price-panel">
                    <p style={{ color: "var(--text-dim)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                      Pay once. Your dashboard unlocks immediately and stays yours — no subscriptions,
                      no re-buying when new notes drop.
                    </p>
                    <button
                      className="btn-buy"
                      style={{ width: "100%", justifyContent: "center", textDecoration: "none", border: "none" }}
                      onClick={() => isLoggedIn ? onNavigate("dashboard") : openAuthModal("login")}
                    >
                      Buy Now — ₹39 <span className="arrow">→</span>
                    </button>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          <section className="section" id="how">
            <div className="wrap">
              <Reveal className="section-head">
                <div className="section-eyebrow">Process</div>
                <div className="section-title">From payment to PDFs in under a minute.</div>
              </Reveal>
              <div className="steps">
                {STEPS.map((step) => (
                  <Reveal className="step" key={step.num}>
                    <div className="num">{step.num}</div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          <section className="section" id="faq">
            <div className="wrap">
              <Reveal className="section-head">
                <div className="section-eyebrow">Questions</div>
                <div className="section-title">Before you unlock</div>
              </Reveal>
              <div className="faqs">
                {FAQS.map((item, i) => (
                  <Reveal
                    as="div"
                    className={`faq-item ${openFaq === i ? "open" : ""}`}
                    key={item.q}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <div className="faq-q">
                      {item.q}
                      <span className="plus">+</span>
                    </div>
                    <div className="faq-a">{item.a}</div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <footer>
        <div className="wrap">
          <div className="fmark">codewith<span>_kk</span> notes — built for people who actually code.</div>
          <div className="fsocial">
            <a href="#">YouTube</a>
            <a href="#">Instagram</a>
            <a href="#">Telegram</a>
          </div>
        </div>
      </footer>

      {showAuth && (
        <div className="kkn-overlay" onClick={() => setShowAuth(false)}>
          <div className="kkn-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setShowAuth(false)}>✕</button>
            <h2>{authMode === "login" ? "Welcome back" : "Create account"}</h2>
            <p className="sub">
              {authMode === "login"
                ? "Sign in to access your dashboard."
                : "Sign up to unlock premium notes."}
            </p>
            {authMsg && (
              <div className={`msg ${authMsg.includes("Successful") ? "ok" : "err"}`}>
                {authMsg}
              </div>
            )}
            <form onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <div className="field">
                  <label>Name</label>
                  <input name="name" value={authForm.name} onChange={handleAuthInput} required />
                </div>
              )}
              <div className="field">
                <label>Email</label>
                <input name="email" type="email" value={authForm.email} onChange={handleAuthInput} required />
              </div>
              <div className="field">
                <label>Password</label>
                <input name="password" type="password" value={authForm.password} onChange={handleAuthInput} required minLength={6} />
              </div>
              <button className="btn-submit" type="submit">
                {authMode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>
            <div className="switch">
              {authMode === "login" ? (
                <>Don't have an account? <a onClick={switchAuthMode}>Sign up</a></>
              ) : (
                <>Already have an account? <a onClick={switchAuthMode}>Sign in</a></>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
