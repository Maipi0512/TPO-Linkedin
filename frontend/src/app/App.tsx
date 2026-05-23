import { useState, useRef, useEffect, type JSX } from "react";
import {
  Home, Users, Briefcase, MessageSquare, Bell, User, LogOut, Search,
  MessageCircle, ThumbsUp, Send, Plus,
  CheckCircle, Clock, MapPin, Building2, GraduationCap, Star, X as XIcon,
  Paperclip, Check, CheckCheck, Edit3, Trash2,
  UserPlus, UserCheck, ArrowRight, Shield, Zap, Globe, UsersRound, ChevronLeft
} from "lucide-react";

const API_URL = "http://localhost:5000";

type Page = "home" | "auth" | "feed" | "profile" | "network" | "jobs" | "messages" | "notifications" | "groups" | "user-profile";
type AuthMode = "login" | "register" | "forgot" | "reset";

type Experience = { we_id: number; title: string; description: string | null; from_date: string; end_date: string | null; is_current: boolean; companies: { name: string } | null };
type Education = { edu_id: number; title: string; field: string | null; institution: string; from_date: string | null; end_date: string | null; is_actual: boolean };
type Skill = { level: string; skills: { skill_id: number; name: string; type: string } };
type FullProfile = UserSession & { experience: Experience[]; education: Education[]; skills: Skill[] };
type Job = {
  job_id: string; poster_user_id: string; title: string; description: string | null;
  location: string | null; modality: string; shift: string; created_at: string;
  companies: { name: string } | null;
  job_skill: { skills: { skill_id: number; name: string; type: string } }[];
};
type AppStatus = "submitted" | "in_review" | "in_process" | "successful" | "rejected" | "cancelled";
type AppHistoryEntry = { status: string; changed_at: string };
type Application = {
  application_id: string; job_id: string; user_id: string;
  status: AppStatus; applied_at: string; updated_at: string;
  jobs?: { job_id: string; title: string; companies: { name: string } | null };
  users?: { user_id: string; name: string; surname: string | null; email: string; profile_photo_url: string | null };
};

type UserSession = {
  user_id: string;
  email: string;
  name: string;
  surname: string | null;
  dni: string | null;
  profile_photo_url: string | null;
  roles: string[];
  company_id?: string | null;
};

type PostComment = {
  _id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  author_surname: string;
  text: string;
  created_at: string;
};

type Post = {
  _id: string;
  user_id: string;
  author_name: string;
  author_surname: string;
  author_photo_url: string | null;
  content: string;
  media?: { type: string; url: string } | null;
  tags: string[];
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
  comments: PostComment[];
  created_at: string;
  updated_at: string;
};

type Notification = {
  _id: string;
  user_id: string;
  type: string;
  body: string;
  ref_id: string | null;
  is_read: boolean;
  created_at: string;
};

type Group = {
  group_id: string;
  name: string;
  description: string | null;
  admin_id: string;
  created_at: string;
};

type GroupMember = {
  role: string;
  joined_at: string;
  users: { user_id: string; name: string; surname: string | null; profile_photo_url: string | null };
};

type UserGroup = {
  role: string;
  joined_at: string;
  groups: Group;
};

type GroupPost = {
  _id: string;
  user_id: string;
  author_name: string;
  author_surname: string;
  author_photo_url: string | null;
  content: string;
  created_at: string;
  likes_count: number;
  user_liked: boolean;
};


// ─── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, onLogout, user }: { page: Page; setPage: (p: Page) => void; onLogout: () => void; user: UserSession | null }) {
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchCounts = () => {
      fetch(`${API_URL}/notifications/${user.user_id}/unread-count`)
        .then((r) => r.ok ? r.json() : { unread: 0 })
        .then((data) => setUnreadNotifs(data.unread ?? 0))
        .catch(() => {});
      fetch(`${API_URL}/messages/${user.user_id}/unread-count`)
        .then((r) => r.ok ? r.json() : { unread: 0 })
        .then((data) => setUnreadMsgs(data.unread ?? 0))
        .catch(() => {});
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [user?.user_id, page]);

  const navItems = [
    { id: "feed" as Page, icon: Home, label: "Inicio" },
    { id: "network" as Page, icon: Users, label: "Mi Red" },
    { id: "jobs" as Page, icon: Briefcase, label: "Empleos" },
    { id: "groups" as Page, icon: UsersRound, label: "Grupos" },
    { id: "messages" as Page, icon: MessageSquare, label: "Mensajes", badge: unreadMsgs > 0 ? unreadMsgs : undefined },
    { id: "notifications" as Page, icon: Bell, label: "Notificaciones", badge: unreadNotifs > 0 ? unreadNotifs : undefined },
    { id: "profile" as Page, icon: User, label: "Mi Perfil" },
  ];

  return (
    <aside role="complementary" aria-label="Menú lateral" className="w-64 min-h-screen flex flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)] shrink-0">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4 border-b border-[var(--sidebar-border)]">
        <span className="font-display text-2xl font-semibold tracking-tight text-white">
          Link<span className="text-[var(--sidebar-primary)]">Pro</span>
        </span>
      </div>

      {/* User mini-card */}
      <div
        className="flex items-center gap-3 px-4 py-4 mx-3 mt-4 rounded-xl cursor-pointer hover:bg-[var(--sidebar-accent)] transition-colors"
        onClick={() => setPage("profile")}
      >
        {user?.profile_photo_url ? (
          <img src={user.profile_photo_url} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-[var(--sidebar-primary)]/60" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[var(--sidebar-primary)] flex items-center justify-center text-white font-bold text-sm ring-2 ring-[var(--sidebar-primary)]/60">
            {user ? user.name[0].toUpperCase() : "?"}
          </div>
        )}
        <div className="overflow-hidden">
          <p className="text-sm font-semibold text-white truncate">
            {user ? `${user.name}${user.surname ? " " + user.surname : ""}` : "Usuario"}
          </p>
          <p className="text-xs text-slate-400 truncate capitalize">
            {user ? user.roles.join(" · ") : ""}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Navegación principal" className="flex-1 px-3 mt-2 space-y-1">
        {navItems.map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            aria-label={label}
            aria-current={page === id ? "page" : undefined}
            onClick={() => setPage(id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              page === id
                ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] shadow-md"
                : "text-slate-300 hover:bg-[var(--sidebar-accent)] hover:text-white"
            }`}
          >
            <Icon size={18} aria-hidden="true" />
            <span className="flex-1 text-left">{label}</span>
            {badge && page !== id && (
              <span aria-label={`${badge} sin leer`} className="text-xs bg-rose-500 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none">
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-[var(--sidebar-accent)] hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

// ─── Landing Page ────────────────────────────────────────────────────────────
function LandingPage({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const features = [
    { icon: Users, title: "Conectate profesionalmente", desc: "Construí tu red de contactos con recomendaciones basadas en contactos en común y empresas compartidas." },
    { icon: Briefcase, title: "Encontrá tu próximo empleo", desc: "Buscá ofertas con matching automático de habilidades y postulate con un clic conservando tu historial." },
    { icon: MessageSquare, title: "Mensajería en tiempo real", desc: "Chats directos y grupales con estado de mensajes, sin necesidad de recargar la página." },
    { icon: Zap, title: "Notificaciones instantáneas", desc: "Enterate al instante de likes, comentarios, nuevas conexiones y cambios en tus postulaciones." },
    { icon: Shield, title: "Seguridad y privacidad", desc: "Contraseñas con bcrypt, sesiones con expiración configurable y gestión de datos bajo WCAG 2.1." },
    { icon: Globe, title: "Grupos temáticos", desc: "Participá en foros de tu industria, publicá contenido y moderá tu propio grupo." },
  ];

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5 bg-card border-b border-border sticky top-0 z-10">
        <span className="font-display text-2xl font-semibold text-primary">
          Link<span className="text-[var(--accent)]">Pro</span>
        </span>
        <div className="flex items-center gap-3">
          <button onClick={onLogin} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
            Iniciar sesión
          </button>
          <button
            onClick={onRegister}
            className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            Registrarse gratis
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1400&h=600&fit=crop&auto=format"
            alt="Profesionales trabajando"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
        </div>
        <div className="relative max-w-5xl mx-auto px-8 py-28 grid grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[var(--accent)] font-semibold text-sm tracking-widest uppercase mb-4">Red profesional</p>
            <h1 className="font-display text-5xl font-semibold text-white leading-tight mb-6">
              Tu carrera,<br />
              <em className="not-italic text-[var(--accent)]">tu próximo paso.</em>
            </h1>
            <p className="text-slate-200 text-lg leading-relaxed mb-8">
              Conectate con profesionales, encontrá empleos con matching de habilidades y hacé crecer tu red en la plataforma diseñada para el mercado laboral argentino.
            </p>
            <button
              onClick={onRegister}
              className="inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-foreground)] font-bold px-8 py-4 rounded-xl text-base hover:opacity-90 transition-opacity"
            >
              Comenzar ahora <ArrowRight size={18} />
            </button>
          </div>
          <div />
        </div>
      </section>

      {/* Stats */}
      <section className="bg-card border-y border-border py-10">
        <div className="max-w-5xl mx-auto px-8 grid grid-cols-4 gap-8 text-center">
          {[
            { value: "+500K", label: "Profesionales" },
            { value: "+12K", label: "Empresas" },
            { value: "+45K", label: "Ofertas activas" },
            { value: "99.5%", label: "Disponibilidad" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl font-semibold text-primary">{s.value}</p>
              <p className="text-muted-foreground text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl font-semibold text-foreground mb-3">Todo lo que necesitás en un solo lugar</h2>
          <p className="text-muted-foreground">Diseñado para candidatos y empresas que buscan conexiones reales.</p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card p-6 rounded-2xl border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Icon size={20} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20 text-center">
        <h2 className="font-display text-3xl font-semibold text-white mb-4">¿Listo para dar el siguiente paso?</h2>
        <p className="text-slate-300 mb-8 max-w-md mx-auto">Unite gratis hoy y empezá a conectarte con los profesionales que van a impulsar tu carrera.</p>
        <button
          onClick={onRegister}
          className="bg-[var(--accent)] text-[var(--accent-foreground)] font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity"
        >
          Crear cuenta gratuita
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 text-center text-sm text-muted-foreground">
        <span className="font-display text-base font-semibold text-primary mr-2">LinkPro</span>
        © 2025 · Bentivegna · Escudero · Rodríguez M. · Rodríguez Me.
      </footer>
    </div>
  );
}

// ─── Auth Page ───────────────────────────────────────────────────────────────
function AuthPage({ onLogin, initialMode }: { onLogin: (user: UserSession) => void; initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode ?? "login");
  const [form, setForm] = useState({ name: "", surname: "", dni: "", email: "", password: "", role: "candidato", company_name: "", company_slogan: "" });
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [shownCode, setShownCode] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (m: AuthMode) => { setMode(m); setError(""); setSuccess(""); setShownCode(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (mode === "forgot") {
      if (!form.email) { setError("Ingresá tu email."); return; }
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/auth/forgot-password`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        });
        const json = await res.json();
        if (json.code) {
          setShownCode(json.code);
          setSuccess("Código generado. Copialo y usalo para restablecer tu contraseña.");
        } else {
          setSuccess("Si el email está registrado, se generará un código.");
        }
      } catch { setError("Error de conexión con el servidor."); }
      finally { setLoading(false); }
      return;
    }

    if (mode === "reset") {
      if (!resetToken || !form.password) { setError("Completá el token y la nueva contraseña."); return; }
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/auth/reset-password`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resetToken, password: form.password }),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error || "Error inesperado."); return; }
        setSuccess("¡Contraseña actualizada! Ahora podés iniciar sesión.");
        setTimeout(() => switchMode("login"), 2000);
      } catch { setError("Error de conexión con el servidor."); }
      finally { setLoading(false); }
      return;
    }

    if (!form.email || !form.password) { setError("Completá todos los campos requeridos."); return; }
    if (mode === "register" && !form.name) { setError("Ingresá tu nombre."); return; }

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Error inesperado."); return; }
      onLogin(json as UserSession);
    } catch { setError("No se pudo conectar con el servidor. ¿Está corriendo el backend?"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden flex-col justify-end p-12">
        <img
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=900&fit=crop&auto=format"
          alt="Profesionales"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative z-10">
          <span className="font-display text-3xl font-semibold text-white">
            Link<span className="text-[var(--accent)]">Pro</span>
          </span>
          <p className="text-slate-300 mt-4 text-lg leading-relaxed max-w-sm">
            La red profesional que conecta talento con oportunidades reales en el mercado argentino.
          </p>
          <div className="mt-8 space-y-3">
            {["Matching automático de habilidades (RF5)", "Recomendaciones de contactos (RF6)", "Notificaciones en tiempo real (RF4)"].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle size={16} className="text-[var(--accent)] shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <span className="font-display text-2xl font-semibold text-primary">Link<span className="text-[var(--accent)]">Pro</span></span>
          </div>
          <h2 className="font-display text-3xl font-semibold text-foreground mb-1">
            {mode === "login" ? "Bienvenido de vuelta" : mode === "register" ? "Crear tu cuenta" : mode === "forgot" ? "Recuperar contraseña" : "Nueva contraseña"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {mode === "login" ? "Ingresá tus credenciales para continuar." : mode === "register" ? "Completá el formulario para empezar." : mode === "forgot" ? "Te enviamos un código de 6 dígitos a tu email." : "Ingresá el código de 6 dígitos recibido y tu nueva contraseña."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registro */}
            {mode === "register" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Nombre <span className="text-destructive">*</span></label>
                    <input type="text" placeholder="Valentina" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Apellido</label>
                    <input type="text" placeholder="Bentivegna" value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">DNI</label>
                  <input type="text" placeholder="12345678" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition" />
                </div>
              </>
            )}

            {/* Reset: token */}
            {mode === "reset" && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Código de 6 dígitos</label>
                <input type="text" placeholder="123456" maxLength={6} value={resetToken} onChange={(e) => setResetToken(e.target.value.replace(/\D/g, ""))} className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition font-mono tracking-[0.5em] text-center text-xl" />
              </div>
            )}

            {/* Email (login, register, forgot) */}
            {mode !== "reset" && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
                <input type="email" placeholder="valentina@ejemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition" />
              </div>
            )}

            {/* Contraseña (login, register, reset) */}
            {mode !== "forgot" && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">{mode === "reset" ? "Nueva contraseña" : "Contraseña"}</label>
                <input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition" />
              </div>
            )}

            {/* Roles (solo register) */}
            {mode === "register" && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Rol</label>
                  <div className="flex gap-3">
                    {["candidato", "poster"].map((r) => (
                      <button key={r} type="button" onClick={() => setForm({ ...form, role: r, company_name: "", company_slogan: "" })} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${form.role === r ? "bg-primary text-primary-foreground border-primary" : "bg-input-background border-border text-muted-foreground hover:border-primary/40"}`}>{r === "candidato" ? "Candidato" : "Empresa / Poster"}</button>
                    ))}
                  </div>
                </div>
                {form.role === "poster" && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Nombre de empresa <span className="text-destructive">*</span></label>
                      <input type="text" placeholder="Ej: Globant, MercadoLibre..." value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Slogan de empresa</label>
                      <input type="text" placeholder="Ej: Transformamos el comercio" value={form.company_slogan} onChange={(e) => setForm({ ...form, company_slogan: e.target.value })} className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition" />
                    </div>
                  </>
                )}
              </>
            )}

            {error && <p className="text-sm text-destructive bg-destructive/10 px-4 py-2.5 rounded-xl">{error}</p>}
            {success && <p className="text-sm text-green-700 bg-green-100 px-4 py-2.5 rounded-xl">{success}</p>}
            {shownCode && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-amber-700 mb-1">Tu código de verificación</p>
                <p className="font-mono text-2xl font-bold tracking-[0.4em] text-amber-900">{shownCode}</p>
                <p className="text-xs text-amber-600 mt-1">Copialo y usalo en "Restablecer contraseña"</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity mt-2 disabled:opacity-60">
              {loading ? "Cargando..." : mode === "login" ? "Iniciar sesión" : mode === "register" ? "Crear cuenta" : mode === "forgot" ? "Enviar enlace" : "Guardar contraseña"}
            </button>
          </form>

          {mode === "login" && (
            <p onClick={() => switchMode("forgot")} className="text-center text-sm text-primary mt-4 cursor-pointer hover:underline">¿Olvidaste tu contraseña?</p>
          )}
          {mode === "forgot" && (
            <p onClick={() => switchMode("reset")} className="text-center text-sm text-primary mt-4 cursor-pointer hover:underline">Ya tengo el token →</p>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {(mode === "login" || mode === "forgot" || mode === "reset") ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
            <button onClick={() => switchMode(mode === "register" ? "login" : "register")} className="text-primary font-semibold hover:underline">
              {mode === "register" ? "Iniciar sesión" : "Registrarse"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feed Page ────────────────────────────────────────────────────────────────
function FeedPage({ user, onViewProfile }: { user: UserSession; onViewProfile: (id: string) => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [newTags, setNewTags] = useState("");
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/posts?user_id=${user.user_id}`);
      if (res.ok) setPosts(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const handlePost = async () => {
    if (!newPost.trim() || posting) return;
    setPosting(true);
    try {
      const tags = newTags.split(",").map(t => t.trim()).filter(Boolean);
      const res = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          author_name: user.name,
          author_surname: user.surname,
          author_photo_url: user.profile_photo_url,
          content: newPost.trim(),
          tags,
        }),
      });
      if (res.ok) {
        const created: Post = await res.json();
        setPosts(prev => [created, ...prev]);
        setNewPost("");
        setNewTags("");
      }
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    const res = await fetch(`${API_URL}/posts/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, likes_count: data.likes_count, user_liked: data.user_liked } : p
      ));
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("¿Eliminar este post?")) return;
    const res = await fetch(`${API_URL}/posts/${postId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id }),
    });
    if (res.ok) setPosts(prev => prev.filter(p => p._id !== postId));
  };

  const toggleComments = (postId: string) => {
    setOpenComments(prev => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  };

  const handleComment = async (postId: string) => {
    const text = (commentTexts[postId] || "").trim();
    if (!text) return;
    const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.user_id,
        author_name: user.name,
        author_surname: user.surname,
        text,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts(prev => prev.map(p =>
        p._id === postId
          ? { ...p, comments: [...p.comments, data.comment], comments_count: data.comments_count }
          : p
      ));
      setCommentTexts(prev => ({ ...prev, [postId]: "" }));
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    const res = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts(prev => prev.map(p =>
        p._id === postId
          ? { ...p, comments: p.comments.filter(c => c._id !== commentId), comments_count: data.comments_count }
          : p
      ));
    }
  };

  const userInitials = (name: string, surname: string) =>
    `${name[0] ?? ""}${surname[0] ?? ""}`.toUpperCase();

  const avatarFallback = (name: string, surname: string, photoUrl: string | null) => {
    if (photoUrl) return <img src={photoUrl} alt={name} className="w-full h-full rounded-full object-cover" />;
    return (
      <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
        {userInitials(name, surname)}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
      {/* Composer */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 shrink-0">
            {avatarFallback(user.name, user.surname ?? "", user.profile_photo_url)}
          </div>
          <div className="flex-1 space-y-2">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="¿Qué querés compartir hoy?"
              rows={2}
              className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
            <input
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="Tags separados por coma (ej: React, Python)"
              className="w-full bg-input-background rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handlePost}
            disabled={!newPost.trim() || posting}
            className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {posting ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </div>

      {/* Posts */}
      {loading && (
        <div className="text-center text-sm text-muted-foreground py-8">Cargando publicaciones...</div>
      )}
      {!loading && posts.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-8">
          Aún no hay publicaciones. ¡Sé el primero en compartir algo!
        </div>
      )}
      {posts.map((post) => {
        const isOwner = post.user_id === user.user_id;
        const commentsOpen = openComments.has(post._id);

        return (
          <article key={post._id} className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => onViewProfile(post.user_id)} className="w-11 h-11 shrink-0 rounded-full focus:outline-none hover:opacity-80 transition-opacity">
                    {avatarFallback(post.author_name, post.author_surname, post.author_photo_url)}
                  </button>
                  <div>
                    <button onClick={() => onViewProfile(post.user_id)} className="font-semibold text-sm text-foreground hover:underline text-left">
                      {post.author_name} {post.author_surname}
                    </button>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      {new Date(post.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleDelete(post._id)}
                    className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-muted transition-colors"
                    title="Eliminar post"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {post.tags.map((t) => (
                    <span key={t} className="text-xs text-primary font-medium">#{t}</span>
                  ))}
                </div>
              )}
            </div>

            {post.media?.url && (
              <img src={post.media.url} alt="Media" className="w-full h-52 object-cover" />
            )}

            <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>{post.likes_count} {post.likes_count === 1 ? "reacción" : "reacciones"}</span>
              <button onClick={() => toggleComments(post._id)} className="hover:underline">
                {post.comments_count} {post.comments_count === 1 ? "comentario" : "comentarios"}
              </button>
            </div>

            <div className="px-4 py-1 border-t border-border flex">
              {([
                { reaction: "like" as const, icon: ThumbsUp, label: "Me gusta" },
                { reaction: null, icon: MessageCircle, label: "Comentar" },
              ]).map(({ reaction, icon: Icon, label }) => {
                const active = reaction ? post.user_liked : commentsOpen;
                return (
                  <button
                    key={label}
                    aria-label={reaction ? (post.user_liked ? "Quitar me gusta" : "Me gusta") : (commentsOpen ? "Cerrar comentarios" : "Comentar")}
                    aria-pressed={active}
                    onClick={() => reaction ? handleLike(post._id) : toggleComments(post._id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon size={15} aria-hidden="true" className={active ? "fill-primary/20 stroke-primary" : ""} />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Comments section */}
            {commentsOpen && (
              <div className="border-t border-border px-4 py-3 space-y-3">
                {post.comments.map((c) => (
                  <div key={c._id} className="flex items-start gap-2.5">
                    <div className="w-8 h-8 shrink-0">
                      {avatarFallback(c.author_name, c.author_surname, null)}
                    </div>
                    <div className="flex-1 bg-muted rounded-xl px-3 py-2">
                      <p className="text-xs font-semibold text-foreground">
                        {c.author_name} {c.author_surname}
                      </p>
                      <p className="text-xs text-foreground mt-0.5">{c.text}</p>
                    </div>
                    {c.user_id === user.user_id && (
                      <button
                        onClick={() => handleDeleteComment(post._id, c._id)}
                        className="text-muted-foreground hover:text-destructive mt-1"
                      >
                        <XIcon size={12} />
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 shrink-0">
                    {avatarFallback(user.name, user.surname ?? "", user.profile_photo_url)}
                  </div>
                  <input
                    value={commentTexts[post._id] ?? ""}
                    onChange={(e) => setCommentTexts(prev => ({ ...prev, [post._id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleComment(post._id)}
                    placeholder="Escribí un comentario..."
                    className="flex-1 bg-input-background rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={() => handleComment(post._id)}
                    disabled={!(commentTexts[post._id] ?? "").trim()}
                    className="text-primary disabled:opacity-30"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage({ user, onUserUpdate }: { user: UserSession; onUserUpdate: (u: UserSession) => void }) {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", surname: "", dni: "" });
  const [saving, setSaving] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Forms para agregar items
  const [deletingPhoto, setDeletingPhoto] = useState(false);

  const handlePhotoDelete = async () => {
    if (deletingPhoto || !profile?.profile_photo_url) return;
    setDeletingPhoto(true);
    const res = await fetch(`${API_URL}/profile/${user.user_id}/photo`, { method: "DELETE" });
    if (res.ok) {
      onUserUpdate({ ...user, profile_photo_url: null });
      load();
    }
    setDeletingPhoto(false);
  };

  const [showExpForm, setShowExpForm] = useState(false);
  const [showEduForm, setShowEduForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [newExp, setNewExp] = useState({ title: "", company_name: "", description: "", from_date: "", end_date: "", is_current: false });
  const [newEdu, setNewEdu] = useState({ title: "", field: "", institution: "", from_date: "", end_date: "", is_actual: false });
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillType, setNewSkillType] = useState("técnica");
  const [newSkillLevel, setNewSkillLevel] = useState("Principiante");

  const load = async () => {
    const res = await fetch(`${API_URL}/profile/${user.user_id}`);
    if (res.ok) {
      const data: FullProfile = await res.json();
      setProfile(data);
      setEditForm({ name: data.name, surname: data.surname ?? "", dni: data.dni ?? "" });
    }
  };

  useEffect(() => { load(); }, [user.user_id]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("photo", file);
    const res = await fetch(`${API_URL}/profile/${user.user_id}/photo`, { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      onUserUpdate({ ...user, profile_photo_url: url });
      load();
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json.error || "No se pudo subir la foto. Verificá que el bucket 'avatars' exista en Supabase Storage y sea público.");
    }
  };

  const saveBasicInfo = async () => {
    setSaving(true);
    await fetch(`${API_URL}/profile/${user.user_id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    onUserUpdate({ ...user, name: editForm.name, surname: editForm.surname || null });
    setSaving(false);
    setEditing(false);
    load();
  };

  const addExperience = async () => {
    await fetch(`${API_URL}/profile/${user.user_id}/experience`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newExp),
    });
    setShowExpForm(false);
    setNewExp({ title: "", company_name: "", description: "", from_date: "", end_date: "", is_current: false });
    load();
  };

  const deleteExperience = async (we_id: number) => {
    await fetch(`${API_URL}/profile/${user.user_id}/experience/${we_id}`, { method: "DELETE" });
    load();
  };

  const addEducation = async () => {
    await fetch(`${API_URL}/profile/${user.user_id}/education`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEdu),
    });
    setShowEduForm(false);
    setNewEdu({ title: "", field: "", institution: "", from_date: "", end_date: "", is_actual: false });
    load();
  };

  const deleteEducation = async (edu_id: number) => {
    await fetch(`${API_URL}/profile/${user.user_id}/education/${edu_id}`, { method: "DELETE" });
    load();
  };

  const addSkill = async () => {
    if (!newSkillName.trim()) return;
    await fetch(`${API_URL}/profile/${user.user_id}/skills`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSkillName.trim(), type: newSkillType, level: newSkillLevel }),
    });
    setShowSkillForm(false);
    setNewSkillName("");
    setNewSkillType("técnica");
    load();
  };

  const removeSkill = async (skill_id: number) => {
    await fetch(`${API_URL}/profile/${user.user_id}/skills/${skill_id}`, { method: "DELETE" });
    load();
  };

  if (!profile) return <div className="flex justify-center py-20 text-muted-foreground text-sm">Cargando perfil...</div>;

  const inputCls = "w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition";
  const labelCls = "text-xs font-medium text-foreground block mb-1";

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
      {/* Header card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary to-primary/70 relative">
          <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&h=200&fit=crop&auto=format" alt="cover" className="w-full h-full object-cover opacity-40" />
        </div>
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="relative inline-block group">
            <label className="cursor-pointer">
              {profile.profile_photo_url
                ? <img src={profile.profile_photo_url} alt={profile.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-card group-hover:opacity-70 transition" />
                : <div className="w-24 h-24 rounded-full bg-primary/20 ring-4 ring-card flex items-center justify-center text-3xl font-bold text-primary group-hover:opacity-70 transition">{profile.name[0]}</div>
              }
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
                <span className="bg-black/50 text-white text-xs rounded-full px-2 py-1">{profile.profile_photo_url ? "Cambiar foto" : "Agregar foto"}</span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
            {profile.profile_photo_url && (
              <button
                onClick={handlePhotoDelete}
                disabled={deletingPhoto}
                title="Eliminar foto"
                className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-destructive/80 disabled:opacity-50 z-10"
              >
                <XIcon size={12} />
              </button>
            )}
          </div>

          <div className="mt-3 flex items-start justify-between">
            <div className="flex-1">
              {editing ? (
                <div className="space-y-2 mr-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={labelCls}>Nombre</label><input className={inputCls} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
                    <div><label className={labelCls}>Apellido</label><input className={inputCls} value={editForm.surname} onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })} /></div>
                  </div>
                  <div><label className={labelCls}>DNI</label><input className={inputCls} value={editForm.dni} onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })} /></div>
                </div>
              ) : (
                <>
                  <h1 className="font-display text-2xl font-semibold text-foreground">{profile.name} {profile.surname}</h1>
                  {profile.dni && <p className="text-xs text-muted-foreground mt-0.5">DNI: {profile.dni}</p>}
                  <p className="text-muted-foreground text-sm mt-0.5">{profile.email}</p>
                  <div className="flex gap-2 mt-2">
                    {profile.roles.map((r) => <span key={r} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium capitalize">{r}</span>)}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => editing ? saveBasicInfo() : setEditing(true)}
              disabled={saving}
              className="flex items-center gap-2 text-sm border border-border px-4 py-2 rounded-xl hover:bg-muted transition-colors text-foreground disabled:opacity-50 shrink-0"
            >
              <Edit3 size={14} />
              {editing ? (saving ? "Guardando..." : "Guardar") : "Editar"}
            </button>
          </div>
        </div>
      </div>

      {user.roles.includes("candidato") && <>
      {/* Experiencia */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><Building2 size={16} className="text-primary" /> Experiencia</h2>
          <button onClick={() => setShowExpForm(!showExpForm)} className="text-primary"><Plus size={18} /></button>
        </div>

        {showExpForm && (
          <div className="mb-4 p-4 bg-muted rounded-xl space-y-2 border border-border">
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Cargo *</label><input className={inputCls} placeholder="Full Stack Developer" value={newExp.title} onChange={(e) => setNewExp({ ...newExp, title: e.target.value })} /></div>
              <div><label className={labelCls}>Empresa</label><input className={inputCls} placeholder="Ej: Google, Globant..." value={newExp.company_name} onChange={(e) => setNewExp({ ...newExp, company_name: e.target.value })} /></div>
            </div>
            <div><label className={labelCls}>Desde *</label><input type="date" className={inputCls} value={newExp.from_date} onChange={(e) => setNewExp({ ...newExp, from_date: e.target.value })} /></div>
            <div><label className={labelCls}>Descripción</label><input className={inputCls} placeholder="Descripción del rol" value={newExp.description} onChange={(e) => setNewExp({ ...newExp, description: e.target.value })} /></div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={newExp.is_current} onChange={(e) => setNewExp({ ...newExp, is_current: e.target.checked })} />
                Trabajo actual
              </label>
              {!newExp.is_current && <div className="flex-1"><label className={labelCls}>Hasta</label><input type="date" className={inputCls} value={newExp.end_date} onChange={(e) => setNewExp({ ...newExp, end_date: e.target.value })} /></div>}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowExpForm(false)} className="text-sm text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-border transition-colors">Cancelar</button>
              <button onClick={addExperience} className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity">Guardar</button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {profile.experience.length === 0 && <p className="text-sm text-muted-foreground">Sin experiencia cargada aún.</p>}
          {profile.experience.map((exp) => (
            <div key={exp.we_id} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Building2 size={18} className="text-primary" /></div>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">{exp.title}</p>
                <p className="text-xs text-muted-foreground">{exp.companies?.name ?? "Empresa no vinculada"} · {exp.from_date?.slice(0, 7)} – {exp.is_current ? "Presente" : exp.end_date?.slice(0, 7) ?? "?"}</p>
                {exp.description && <p className="text-xs text-muted-foreground mt-1">{exp.description}</p>}
                {exp.is_current && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">Actual</span>}
              </div>
              <button onClick={() => deleteExperience(exp.we_id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Educación */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><GraduationCap size={16} className="text-primary" /> Educación</h2>
          <button onClick={() => setShowEduForm(!showEduForm)} className="text-primary"><Plus size={18} /></button>
        </div>

        {showEduForm && (
          <div className="mb-4 p-4 bg-muted rounded-xl space-y-2 border border-border">
            <div><label className={labelCls}>Título *</label><input className={inputCls} placeholder="Lic. en Sistemas" value={newEdu.title} onChange={(e) => setNewEdu({ ...newEdu, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Institución *</label><input className={inputCls} placeholder="UTN Buenos Aires" value={newEdu.institution} onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })} /></div>
              <div><label className={labelCls}>Campo de estudio</label><input className={inputCls} placeholder="Informática" value={newEdu.field} onChange={(e) => setNewEdu({ ...newEdu, field: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Desde</label><input type="date" className={inputCls} value={newEdu.from_date} onChange={(e) => setNewEdu({ ...newEdu, from_date: e.target.value })} /></div>
              <div><label className={labelCls}>Hasta</label><input type="date" className={inputCls} value={newEdu.end_date} onChange={(e) => setNewEdu({ ...newEdu, end_date: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={newEdu.is_actual} onChange={(e) => setNewEdu({ ...newEdu, is_actual: e.target.checked })} />
              En curso actualmente
            </label>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowEduForm(false)} className="text-sm text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-border transition-colors">Cancelar</button>
              <button onClick={addEducation} className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity">Guardar</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {profile.education.length === 0 && <p className="text-sm text-muted-foreground">Sin educación cargada aún.</p>}
          {profile.education.map((edu) => (
            <div key={edu.edu_id} className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm text-foreground">{edu.title}</p>
                <p className="text-xs text-muted-foreground">{edu.institution}{edu.field ? ` · ${edu.field}` : ""} · {edu.from_date?.slice(0, 7) ?? "?"} – {edu.is_actual ? "En curso" : edu.end_date?.slice(0, 7) ?? "?"}</p>
                {edu.is_actual && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1 inline-block">En curso</span>}
              </div>
              <button onClick={() => deleteEducation(edu.edu_id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Habilidades */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><Star size={16} className="text-primary" /> Habilidades</h2>
          <button onClick={() => setShowSkillForm(!showSkillForm)} className="text-primary"><Plus size={18} /></button>
        </div>

        {showSkillForm && (
          <div className="mb-4 p-4 bg-muted rounded-xl space-y-2 border border-border">
            <div>
              <label className={labelCls}>Habilidad *</label>
              <input
                className={inputCls}
                placeholder="Ej: React, Excel, Liderazgo..."
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Tipo</label>
                <select className={inputCls} value={newSkillType} onChange={(e) => setNewSkillType(e.target.value)}>
                  <option value="técnica">Técnica</option>
                  <option value="blanda">Blanda</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Nivel</label>
                <select className={inputCls} value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value)}>
                  {["Principiante", "Intermedio", "Avanzado"].map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowSkillForm(false)} className="text-sm text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-border transition-colors">Cancelar</button>
              <button onClick={addSkill} disabled={!newSkillName.trim()} className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">Agregar</button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {profile.skills.length === 0 && <p className="text-sm text-muted-foreground">Sin habilidades cargadas aún.</p>}
          {profile.skills.map((s) => (
            <span key={s.skills.skill_id} className="bg-secondary text-secondary-foreground text-sm px-3 py-1.5 rounded-xl font-medium flex items-center gap-2">
              {s.skills.name}
              <span className="text-xs text-muted-foreground">· {s.level}</span>
              <button onClick={() => removeSkill(s.skills.skill_id)} className="text-muted-foreground hover:text-destructive transition-colors ml-1"><XIcon size={12} /></button>
            </span>
          ))}
        </div>
      </div>
      </>}

      {/* RF2 — Gestión de roles */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2"><Shield size={16} className="text-primary" /> Roles</h2>
        <p className="text-xs text-muted-foreground mb-3">Tus roles activos condicionan las funcionalidades disponibles.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {user.roles.map((r) => (
            <span key={r} className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full capitalize">
              {r}
              {user.roles.length > 1 && (
                <button
                  title={`Desactivar rol ${r}`}
                  onClick={async () => {
                    const res = await fetch(`${API_URL}/auth/remove-role`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ user_id: user.user_id, role: r }),
                    });
                    if (res.ok) { const data = await res.json(); onUserUpdate({ ...user, roles: data.roles }); }
                  }}
                  className="ml-0.5 hover:text-destructive transition-colors leading-none"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
        {!user.roles.includes("candidato") && (
          <button onClick={async () => {
            const res = await fetch(`${API_URL}/auth/add-role`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: user.user_id, role: "candidato" }) });
            if (res.ok) { const data = await res.json(); onUserUpdate({ ...user, roles: data.roles }); }
          }} className="text-sm border border-border rounded-xl px-4 py-2 hover:bg-muted transition-colors mr-2">
            Agregar rol Candidato
          </button>
        )}
        {!user.roles.includes("poster") && (
          <button onClick={async () => {
            const res = await fetch(`${API_URL}/auth/add-role`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: user.user_id, role: "poster" }) });
            if (res.ok) { const data = await res.json(); onUserUpdate({ ...user, roles: data.roles }); }
          }} className="text-sm border border-border rounded-xl px-4 py-2 hover:bg-muted transition-colors">
            Agregar rol Poster
          </button>
        )}
      </div>

      {/* RNF10 — Eliminar cuenta */}
      <div className="bg-card rounded-2xl border border-destructive/30 p-5">
        <h2 className="font-semibold text-destructive mb-1 flex items-center gap-2"><Shield size={16} /> Zona de peligro</h2>
        <p className="text-xs text-muted-foreground mb-3">Eliminar tu cuenta borra permanentemente todos tus datos: perfil, postulaciones, empleos y publicaciones.</p>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="text-sm bg-destructive/10 text-destructive border border-destructive/30 rounded-xl px-4 py-2 hover:bg-destructive/20 transition-colors font-semibold">
            Eliminar mi cuenta
          </button>
        ) : (
          <div className="space-y-3 mt-2">
            <p className="text-sm text-destructive font-medium">¿Estás seguro? Esta acción no se puede deshacer.</p>
            <input
              type="password"
              placeholder="Ingresá tu contraseña para confirmar"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full bg-input-background border border-destructive/40 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-destructive/20 transition"
            />
            {deleteError && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{deleteError}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); }} className="text-sm text-muted-foreground px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors">
                Cancelar
              </button>
              <button
                disabled={!deletePassword || deleting}
                onClick={async () => {
                  setDeleting(true);
                  setDeleteError("");
                  try {
                    const res = await fetch(`${API_URL}/auth/delete-account/${user.user_id}`, {
                      method: "DELETE", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ password: deletePassword }),
                    });
                    if (res.ok) { window.location.reload(); return; }
                    const d = await res.json().catch(() => ({}));
                    setDeleteError(d.error || "Error al eliminar la cuenta.");
                  } catch { setDeleteError("No se pudo conectar con el servidor."); }
                  setDeleting(false);
                }}
                className="text-sm bg-destructive text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 font-semibold"
              >
                {deleting ? "Eliminando..." : "Confirmar eliminación"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Network Page ─────────────────────────────────────────────────────────────
type Neo4jUser = { user_id: string; name: string; surname: string; photo_url: string };
type Suggestion = { user: Neo4jUser; mutuals: number; reason?: string | null };
type PendingRequest = { user: Neo4jUser; created_at: string };
type JobMatch = { job_id: string; matching_skills: string[]; match_count: number };

function NetworkPage({ user, onNavigate, onViewProfile }: { user: UserSession; onNavigate: (page: Page, jobId?: string) => void; onViewProfile: (id: string) => void }) {
  const [tab, setTab] = useState<"connections" | "pending" | "suggestions" | "job-matches">("connections");
  const [connections, setConnections] = useState<Neo4jUser[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [jobDetails, setJobDetails] = useState<Record<string, Job>>({});
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [connRes, pendRes, sugRes, sentRes, matchRes, jobsRes] = await Promise.all([
        fetch(`${API_URL}/connections/${user.user_id}`),
        fetch(`${API_URL}/connections/${user.user_id}/pending`),
        fetch(`${API_URL}/connections/${user.user_id}/suggestions`),
        fetch(`${API_URL}/connections/${user.user_id}/sent`),
        fetch(`${API_URL}/connections/${user.user_id}/job-matches`),
        fetch(`${API_URL}/jobs`),
      ]);
      if (connRes.ok) setConnections(await connRes.json());
      if (pendRes.ok) setPending(await pendRes.json());
      if (sugRes.ok) setSuggestions(await sugRes.json());
      if (matchRes.ok) setJobMatches(await matchRes.json());
      if (jobsRes.ok) {
        const jobs: Job[] = await jobsRes.json();
        setJobDetails(Object.fromEntries(jobs.map((j) => [j.job_id, j])));
      }
      if (sentRes.ok) {
        const sent: Neo4jUser[] = await sentRes.json();
        setSentIds(new Set(sent.map((u) => u.user_id)));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleConnect = async (toUserId: string) => {
    const res = await fetch(`${API_URL}/connections/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_user_id: user.user_id, to_user_id: toUserId }),
    });
    if (res.ok) setSentIds((prev) => new Set([...prev, toUserId]));
  };

  const handleAccept = async (fromUserId: string) => {
    const res = await fetch(`${API_URL}/connections/accept`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_user_id: fromUserId, to_user_id: user.user_id }),
    });
    if (res.ok) loadAll();
  };

  const handleReject = async (fromUserId: string) => {
    const res = await fetch(`${API_URL}/connections/reject`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_user_id: fromUserId, to_user_id: user.user_id }),
    });
    if (res.ok) setPending((prev) => prev.filter((p) => p.user.user_id !== fromUserId));
  };

  const handleRemove = async (otherId: string) => {
    const res = await fetch(`${API_URL}/connections/remove`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id, other_user_id: otherId }),
    });
    if (res.ok) setConnections((prev) => prev.filter((c) => c.user_id !== otherId));
  };

  const avatar = (u: Neo4jUser) => u.photo_url ? (
    <img src={u.photo_url} alt={u.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
  ) : (
    <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">{u.name[0]}</div>
  );

  const fullName = (u: Neo4jUser) => `${u.name}${u.surname ? ` ${u.surname}` : ""}`;

  const filteredConn = connections.filter((c) => fullName(c).toLowerCase().includes(search.toLowerCase()));
  const filteredSug = suggestions.filter((s) => fullName(s.user).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {([ ["connections", `Conexiones (${connections.length})`], ["pending", `Solicitudes${pending.length ? ` (${pending.length})` : ""}`], ["suggestions", "Sugerencias"], ["job-matches", `Empleos recomendados${jobMatches.length ? ` (${jobMatches.length})` : ""}`] ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-muted-foreground text-sm py-8">Cargando...</p>}

      {/* Mis conexiones */}
      {!loading && tab === "connections" && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <UserCheck size={17} className="text-primary" /> Mis conexiones
            </h2>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="bg-input-background border border-border rounded-xl pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 w-40" />
            </div>
          </div>
          {filteredConn.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Aún no tenés conexiones.</p>
          ) : (
            <div className="space-y-3">
              {filteredConn.map((c) => (
                <div key={c.user_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                  <button onClick={() => onViewProfile(c.user_id)} className="shrink-0 hover:opacity-80 transition-opacity rounded-full">{avatar(c)}</button>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => onViewProfile(c.user_id)} className="font-semibold text-sm text-foreground truncate hover:underline text-left">{fullName(c)}</button>
                  </div>
                  <button onClick={() => handleRemove(c.user_id)} className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors">
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Solicitudes recibidas */}
      {!loading && tab === "pending" && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <UserPlus size={17} className="text-primary" /> Solicitudes de conexión
          </h2>
          {pending.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No tenés solicitudes pendientes.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((p) => (
                <div key={p.user.user_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                  <button onClick={() => onViewProfile(p.user.user_id)} className="shrink-0 hover:opacity-80 transition-opacity rounded-full">{avatar(p.user)}</button>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => onViewProfile(p.user.user_id)} className="font-semibold text-sm text-foreground truncate hover:underline text-left">{fullName(p.user)}</button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAccept(p.user.user_id)} className="text-xs bg-primary text-primary-foreground rounded-lg px-3 py-1.5 font-semibold hover:opacity-90 transition-opacity">
                      Aceptar
                    </button>
                    <button onClick={() => handleReject(p.user.user_id)} className="text-xs border border-border rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-muted transition-colors">
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sugerencias */}
      {!loading && tab === "suggestions" && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <UserPlus size={17} className="text-primary" /> Personas que quizás conozcas
            </h2>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="bg-input-background border border-border rounded-xl pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 w-40" />
            </div>
          </div>
          {filteredSug.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No hay sugerencias disponibles.</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filteredSug.map(({ user: s, mutuals, reason }) => (
                <div key={s.user_id} className="border border-border rounded-2xl overflow-hidden text-center hover:shadow-md transition-shadow">
                  <div className="h-14 bg-gradient-to-r from-primary/20 to-primary/10" />
                  <div className="-mt-7 pb-4 px-3">
                    <button onClick={() => onViewProfile(s.user_id)} className="block mx-auto hover:opacity-80 transition-opacity">
                      {s.photo_url ? (
                        <img src={s.photo_url} alt={s.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-card" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg ring-2 ring-card">{s.name[0]}</div>
                      )}
                    </button>
                    <button onClick={() => onViewProfile(s.user_id)} className="font-semibold text-sm text-foreground mt-2 leading-tight hover:underline block mx-auto">{fullName(s)}</button>
                    {mutuals > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{mutuals} contacto{mutuals !== 1 ? "s" : ""} en común</p>
                    )}
                    {mutuals === 0 && reason === "misma empresa" && (
                      <p className="text-xs text-muted-foreground mt-1">Trabajaron en la misma empresa</p>
                    )}
                    <button
                      onClick={() => handleConnect(s.user_id)}
                      disabled={sentIds.has(s.user_id)}
                      className={`w-full mt-3 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${sentIds.has(s.user_id) ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:opacity-90"}`}
                    >
                      {sentIds.has(s.user_id) ? "Solicitud enviada" : "Conectar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empleos recomendados por Neo4j */}
      {!loading && tab === "job-matches" && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
            <Zap size={17} className="text-primary" /> Empleos recomendados por tus habilidades
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Calculado por Neo4j cruzando tus skills con los requerimientos de cada oferta.</p>
          {jobMatches.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">
              Agregá habilidades a tu perfil para ver empleos recomendados.
            </p>
          ) : (
            <div className="space-y-3">
              {jobMatches.map((m) => {
                const job = jobDetails[m.job_id];
                return (
                  <div
                    key={m.job_id}
                    onClick={() => onNavigate("jobs", m.job_id)}
                    className="flex items-start gap-3 p-4 rounded-xl border border-border hover:bg-muted hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Briefcase size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {job ? job.title : "Cargando..."}
                      </p>
                      {job?.companies?.name && (
                        <p className="text-xs text-muted-foreground mt-0.5">{job.companies.name}</p>
                      )}
                      {job?.location && (
                        <p className="text-xs text-muted-foreground">{job.location} · {job.modality}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {m.matching_skills.map((s) => (
                          <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap">
                        {m.match_count} match{m.match_count !== 1 ? "es" : ""}
                      </span>
                      <ArrowRight size={14} className="text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Jobs Page ────────────────────────────────────────────────────────────────
function JobsPage({ user, pendingJobId, onClearPendingJob }: { user: UserSession; pendingJobId?: string | null; onClearPendingJob?: () => void }) {
  const [tab, setTab] = useState<"explore" | "applications" | "posted">("explore");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<Job | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [postedSelected, setPostedSelected] = useState<Job | null>(null);
  const [postedApplicants, setPostedApplicants] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [applying, setApplying] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newJob, setNewJob] = useState({ title: "", description: "", location: "", company_name: "", modality: "hibrido", shift: "mañana", employment_type: "full-time", working_hours: "", skill_names: [] as string[] });
  const [skillInput, setSkillInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [appHistories, setAppHistories] = useState<Record<string, AppHistoryEntry[]>>({});
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editJobForm, setEditJobForm] = useState({ title: "", description: "", location: "", modality: "hibrido", shift: "full-time", employment_type: "full-time" });
  const [savingJob, setSavingJob] = useState(false);

  const isCandidate = user.roles.includes("candidato");
  const isPoster = user.roles.includes("poster");

  useEffect(() => {
    if (isCandidate) fetch(`${API_URL}/profile/${user.user_id}`).then((r) => r.ok ? r.json() : null).then((d) => d && setProfile(d));
  }, [user.user_id]);

  const loadJobs = async (q?: string) => {
    const term = q !== undefined ? q : search;
    const params = term.trim() ? `?q=${encodeURIComponent(term.trim())}` : "";
    const res = await fetch(`${API_URL}/jobs${params}`);
    if (res.ok) {
      const data: Job[] = await res.json();
      setJobs(data);
      if (data.length > 0) setSelected((prev) => prev ?? data[0]);
    }
  };

  const loadMyApplications = async () => {
    const res = await fetch(`${API_URL}/jobs/user/${user.user_id}/applications`);
    if (res.ok) {
      const data: Application[] = await res.json();
      setMyApplications(data);
      setAppliedIds(new Set(data.map((a) => a.job_id)));
    }
  };

  const cancelApplication = async (app_id: string) => {
    await fetch(`${API_URL}/jobs/applications/${app_id}`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id }),
    });
    await loadMyApplications();
  };

  const loadPostedJobs = async () => {
    const res = await fetch(`${API_URL}/jobs/user/${user.user_id}/posted`);
    if (res.ok) setPostedJobs(await res.json());
  };

  const loadApplicants = async (job_id: string) => {
    const res = await fetch(`${API_URL}/jobs/${job_id}/applications`);
    if (res.ok) setPostedApplicants(await res.json());
  };

  const toggleAppHistory = async (app_id: string) => {
    if (expandedAppId === app_id) { setExpandedAppId(null); return; }
    setExpandedAppId(app_id);
    if (!appHistories[app_id]) {
      const res = await fetch(`${API_URL}/jobs/applications/${app_id}/history`);
      if (res.ok) {
        const data = await res.json();
        setAppHistories((prev) => ({ ...prev, [app_id]: data }));
      }
    }
  };

  useEffect(() => {
    loadJobs();
    loadMyApplications();
    if (isPoster) loadPostedJobs();
    const interval = setInterval(() => {
      loadJobs();
      loadMyApplications();
      if (isPoster) loadPostedJobs();
    }, 15000);
    return () => clearInterval(interval);
  }, [user.user_id]);

  // Debounced re-fetch when search term changes
  useEffect(() => {
    const t = setTimeout(() => loadJobs(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!pendingJobId || jobs.length === 0) return;
    const job = jobs.find((j) => j.job_id === pendingJobId);
    if (job) { setTab("explore"); setSelected(job); onClearPendingJob?.(); }
  }, [pendingJobId, jobs]);

  useEffect(() => {
    if (!postedSelected) return;
    const interval = setInterval(() => loadApplicants(postedSelected.job_id), 15000);
    return () => clearInterval(interval);
  }, [postedSelected?.job_id]);

  const handleApply = async () => {
    if (!selected || applying) return;
    setApplying(true);
    const res = await fetch(`${API_URL}/jobs/${selected.job_id}/apply`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id }),
    });
    if (res.ok) { setAppliedIds((prev) => new Set([...prev, selected.job_id])); await loadMyApplications(); }
    setApplying(false);
  };

  const updateAppStatus = async (app_id: string, status: string) => {
    await fetch(`${API_URL}/jobs/applications/${app_id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (postedSelected) loadApplicants(postedSelected.job_id);
  };

  const resetCreateForm = () => {
    setShowCreateForm(false);
    setCreating(false);
    setCreateError("");
    setSkillInput("");
    setNewJob({ title: "", description: "", location: "", company_name: "", modality: "hibrido", shift: "mañana", employment_type: "full-time", working_hours: "", skill_names: [] });
  };

  const createJob = async () => {
    if (!newJob.title.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch(`${API_URL}/jobs`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newJob, user_id: user.user_id, company_id: user.company_id ?? null }),
      });
      const json = await res.json();
      if (res.ok) {
        resetCreateForm();
        await loadPostedJobs();
        await loadJobs();
      } else {
        setCreateError(json.error || `Error ${res.status}: ${JSON.stringify(json)}`);
      }
    } catch (e) {
      setCreateError("No se pudo conectar con el servidor.");
    } finally {
      setCreating(false);
    }
  };

  const deleteJob = async (job_id: string) => {
    await fetch(`${API_URL}/jobs/${job_id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id }),
    });
    setPostedSelected(null);
    setPostedApplicants([]);
    await loadPostedJobs();
    await loadJobs();
  };

  const toggleJobActive = async (job: Job) => {
    await fetch(`${API_URL}/jobs/${job.job_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id, is_active: !job.is_active }),
    });
    await loadPostedJobs();
    await loadJobs();
  };

  const startEditJob = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    setEditingJob(job);
    setEditJobForm({ title: job.title, description: job.description ?? "", location: job.location ?? "", modality: job.modality, shift: job.shift || "mañana", employment_type: (job as any).employment_type ?? "full-time" });
  };

  const saveEditJob = async () => {
    if (!editingJob) return;
    setSavingJob(true);
    await fetch(`${API_URL}/jobs/${editingJob.job_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id, ...editJobForm }),
    });
    setSavingJob(false);
    setEditingJob(null);
    await loadPostedJobs();
    await loadJobs();
  };

  const filtered = jobs.filter((j) =>
    filter === "all" || (filter === "remote" && j.modality === "remoto")
  );

  const inputCls = "w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition";
  const labelCls = "text-xs font-medium text-foreground block mb-1";

  const STATUS_LABEL: Record<string, string> = {
    submitted: "Enviada", in_review: "En revisión", in_process: "En proceso",
    successful: "Aceptada", rejected: "Rechazada", cancelled: "Cancelada",
  };
  const STATUS_CLS: Record<string, string> = {
    submitted: "bg-yellow-100 text-yellow-700",
    in_review: "bg-blue-100 text-blue-700",
    in_process: "bg-purple-100 text-purple-700",
    successful: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-muted text-muted-foreground line-through",
  };
  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CLS[status] ?? "bg-muted text-muted-foreground"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: "explore" as const, label: "Explorar empleos", show: true },
          { id: "applications" as const, label: "Mis postulaciones", show: isCandidate },
          { id: "posted" as const, label: "Mis ofertas", show: isPoster },
        ].filter((t) => t.show).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Explorar ── */}
      {tab === "explore" && (
        <>
          <div className="bg-card rounded-2xl border border-border p-4 flex gap-3 items-center">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título, empresa o ubicación..." className="w-full bg-input-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition" />
            </div>
            <div className="flex gap-2">
              {[["all", "Todas"], ["remote", "Remoto"]].map(([val, label]) => (
                <button key={val} onClick={() => setFilter(val)} className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors ${filter === val ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{label}</button>
              ))}
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <Briefcase size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No hay ofertas disponibles aún.</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-2 space-y-3">
                {filtered.length === 0
                  ? <p className="text-sm text-muted-foreground text-center py-8">Sin resultados.</p>
                  : filtered.map((job) => (
                    <div key={job.job_id} onClick={() => setSelected(job)} className={`bg-card rounded-2xl border cursor-pointer transition-all p-4 hover:shadow-md ${selected?.job_id === job.job_id ? "border-primary shadow-md" : "border-border"}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Briefcase size={18} className="text-primary" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground leading-tight truncate">{job.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{job.companies?.name ?? "Empresa no indicada"}</p>
                          {job.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin size={10} />{job.location}</p>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${job.modality === "remoto" ? "bg-green-100 text-green-700" : "bg-secondary text-secondary-foreground"}`}>{job.modality}</span>
                        <span className="text-xs text-muted-foreground">{job.created_at?.slice(0, 10)}</span>
                      </div>
                    </div>
                  ))}
              </div>

              {selected && (
                <div className="col-span-3 bg-card rounded-2xl border border-border p-6 h-fit sticky top-4">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Briefcase size={24} className="text-primary" /></div>
                    <div className="flex-1">
                      <h2 className="font-display text-xl font-semibold text-foreground">{selected.title}</h2>
                      <p className="text-muted-foreground text-sm mt-0.5">{selected.companies?.name ?? "Empresa no indicada"}{selected.location ? ` · ${selected.location}` : ""}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full capitalize">{selected.shift}</span>
                        <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full capitalize">{selected.modality}</span>
                        <span className="text-xs text-muted-foreground">{selected.created_at?.slice(0, 10)}</span>
                      </div>
                    </div>
                  </div>
                  {selected.description && <p className="text-sm text-foreground leading-relaxed mb-4">{selected.description}</p>}
                  {selected.job_skill?.length > 0 && (() => {
                    const userSkillNames = new Set((profile?.skills ?? []).map((s) => s.skills.name.toLowerCase()));
                    const required = selected.job_skill.map(({ skills: s }) => s);
                    const matched = required.filter((s) => userSkillNames.has(s.name.toLowerCase()));
                    const pct = Math.round((matched.length / required.length) * 100);
                    return (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-foreground">Habilidades requeridas</p>
                          {isCandidate && (
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pct >= 70 ? "bg-green-100 text-green-700" : pct >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                              {pct}% compatible ({matched.length}/{required.length})
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-5">
                          {required.map((s) => (
                            <span key={s.skill_id} className={`text-xs px-3 py-1.5 rounded-xl font-medium ${userSkillNames.has(s.name.toLowerCase()) ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"}`}>
                              {s.name}{userSkillNames.has(s.name.toLowerCase()) ? " ✓" : ""}
                            </span>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                  {isCandidate && (
                    <button onClick={handleApply} disabled={appliedIds.has(selected.job_id) || applying} className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${appliedIds.has(selected.job_id) ? "bg-green-100 text-green-700 cursor-default" : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"}`}>
                      {appliedIds.has(selected.job_id) ? "✓ Ya te postulaste" : applying ? "Enviando..." : "Postularme ahora"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Mis postulaciones ── */}
      {tab === "applications" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Mis postulaciones</h2>
          </div>
          {myApplications.length === 0 ? (
            <div className="p-12 text-center"><Briefcase size={28} className="text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Aún no te postulaste a ninguna oferta.</p></div>
          ) : (
            <div className="divide-y divide-border">
              {myApplications.map((app) => {
                const isExpanded = expandedAppId === app.application_id;
                const history = appHistories[app.application_id] ?? [];
                return (
                  <div key={app.application_id}>
                    <div
                      className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => toggleAppHistory(app.application_id)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Briefcase size={16} className="text-primary" /></div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">{app.jobs?.title ?? "Oferta"}</p>
                        <p className="text-xs text-muted-foreground">{app.jobs?.companies?.name ?? "Empresa no indicada"}</p>
                        <p className="text-xs text-muted-foreground">{app.updated_at?.slice(0, 10)}</p>
                      </div>
                      <StatusBadge status={app.status} />
                      {app.status !== "cancelled" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); cancelApplication(app.application_id); }}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1.5 ml-1 shrink-0"
                          title="Cancelar postulación"
                          aria-label="Cancelar postulación"
                        ><Trash2 size={14} /></button>
                      )}
                      <span className="text-xs text-muted-foreground">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                    {isExpanded && (
                      <div className="px-5 pb-4 bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground mb-3">Historial de estados</p>
                        {history.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Sin historial registrado aún.</p>
                        ) : (
                          <ol className="relative border-l border-border ml-2 space-y-3">
                            {history.map((h, i) => (
                              <li key={i} className="ml-4">
                                <span className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-primary border-2 border-card" />
                                <StatusBadge status={h.status} />
                                <span className="ml-2 text-xs text-muted-foreground">{h.changed_at?.slice(0, 16).replace("T", " ")}</span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Mis ofertas (poster) ── */}
      {tab === "posted" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Mis ofertas publicadas</h2>
              <button onClick={() => showCreateForm ? resetCreateForm() : setShowCreateForm(true)} className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
                <Plus size={15} /> Nueva oferta
              </button>
            </div>

            {showCreateForm && (
              <div className="mb-4 p-4 bg-muted rounded-xl border border-border space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>Título *</label><input className={inputCls} placeholder="Ej: Senior React Developer" value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} /></div>
                  <div><label className={labelCls}>Empresa</label><input className={inputCls} placeholder="Nombre de la empresa" value={newJob.company_name} onChange={(e) => setNewJob({ ...newJob, company_name: e.target.value })} /></div>
                </div>
                <div><label className={labelCls}>Descripción</label><textarea rows={3} className={inputCls + " resize-none"} placeholder="Descripción del puesto..." value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} /></div>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className={labelCls}>Ubicación</label><input className={inputCls} placeholder="Buenos Aires" value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} /></div>
                  <div>
                    <label className={labelCls}>Modalidad</label>
                    <select className={inputCls} value={newJob.modality} onChange={(e) => setNewJob({ ...newJob, modality: e.target.value })}>
                      {["remoto", "hibrido", "presencial"].map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Turno</label>
                    <select className={inputCls} value={newJob.shift} onChange={(e) => setNewJob({ ...newJob, shift: e.target.value })}>
                      {["mañana", "tarde", "noche"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={labelCls}>Tipo de empleo</label>
                    <select className={inputCls} value={newJob.employment_type} onChange={(e) => setNewJob({ ...newJob, employment_type: e.target.value })}>
                      {["full-time", "part-time", "freelance"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Horas semanales</label><input className={inputCls} type="number" min={1} max={60} placeholder="40" value={newJob.working_hours} onChange={(e) => setNewJob({ ...newJob, working_hours: e.target.value })} /></div>
                </div>
                <div>
                  <label className={labelCls}>Habilidades requeridas</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newJob.skill_names.map((name) => (
                      <span key={name} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full flex items-center gap-1">
                        {name}
                        <button type="button" onClick={() => setNewJob({ ...newJob, skill_names: newJob.skill_names.filter((n) => n !== name) })}><XIcon size={10} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className={inputCls}
                      placeholder="Ej: React, Python, Liderazgo..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const name = skillInput.trim();
                          if (name && !newJob.skill_names.includes(name))
                            setNewJob({ ...newJob, skill_names: [...newJob.skill_names, name] });
                          setSkillInput("");
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const name = skillInput.trim();
                        if (name && !newJob.skill_names.includes(name))
                          setNewJob({ ...newJob, skill_names: [...newJob.skill_names, name] });
                        setSkillInput("");
                      }}
                      className="text-sm bg-muted text-foreground px-3 py-2 rounded-xl hover:bg-border transition-colors shrink-0"
                    >
                      + Agregar
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Presioná Enter o hacé clic en "+ Agregar" para cada habilidad.</p>
                </div>
                {createError && (
                  <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{createError}</p>
                )}
                <div className="flex gap-2 justify-end">
                  <button onClick={resetCreateForm} className="text-sm text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-border transition-colors">Cancelar</button>
                  <button onClick={createJob} disabled={creating} className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60">{creating ? "Publicando..." : "Publicar oferta"}</button>
                </div>
              </div>
            )}

            {postedJobs.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-6">No publicaste ninguna oferta aún.</p>
              : (
                <div className="space-y-3">
                  {postedJobs.map((job) => (
                    <div key={job.job_id}>
                      <div onClick={() => { if (editingJob?.job_id !== job.job_id) { setPostedSelected(job); loadApplicants(job.job_id); } }} className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${postedSelected?.job_id === job.job_id ? "border-primary bg-primary/5" : "border-border"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-foreground truncate">{job.title}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${job.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                                {job.is_active ? "Activo" : "Inactivo"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{job.location ?? "Sin ubicación"} · {job.modality} · {job.shift}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={(e) => startEditJob(e, job)} className="text-muted-foreground hover:text-primary transition-colors p-1.5" title="Editar oferta"><Edit3 size={14} /></button>
                            <button onClick={(e) => { e.stopPropagation(); toggleJobActive(job); }} className="text-xs border border-border rounded-lg px-2 py-1 hover:bg-muted transition-colors text-muted-foreground">
                              {job.is_active ? "Desactivar" : "Activar"}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteJob(job.job_id); }} className="text-muted-foreground hover:text-destructive transition-colors p-1.5"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                      {editingJob?.job_id === job.job_id && (
                        <div className="mt-1 p-4 bg-muted rounded-xl border border-primary/30 space-y-3" onClick={(e) => e.stopPropagation()}>
                          <p className="text-xs font-semibold text-foreground">Editar oferta</p>
                          <div><label className={labelCls}>Título *</label><input className={inputCls} value={editJobForm.title} onChange={(e) => setEditJobForm({ ...editJobForm, title: e.target.value })} /></div>
                          <div><label className={labelCls}>Descripción</label><textarea rows={2} className={inputCls + " resize-none"} value={editJobForm.description} onChange={(e) => setEditJobForm({ ...editJobForm, description: e.target.value })} /></div>
                          <div className="grid grid-cols-3 gap-2">
                            <div><label className={labelCls}>Ubicación</label><input className={inputCls} value={editJobForm.location} onChange={(e) => setEditJobForm({ ...editJobForm, location: e.target.value })} /></div>
                            <div>
                              <label className={labelCls}>Modalidad</label>
                              <select className={inputCls} value={editJobForm.modality} onChange={(e) => setEditJobForm({ ...editJobForm, modality: e.target.value })}>
                                {["remoto", "hibrido", "presencial"].map((m) => <option key={m}>{m}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>Turno</label>
                              <select className={inputCls} value={editJobForm.shift} onChange={(e) => setEditJobForm({ ...editJobForm, shift: e.target.value })}>
                                {["mañana", "tarde", "noche"].map((t) => <option key={t}>{t}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingJob(null)} className="text-sm text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-border transition-colors">Cancelar</button>
                            <button onClick={saveEditJob} disabled={savingJob || !editJobForm.title.trim()} className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity">{savingJob ? "Guardando..." : "Guardar cambios"}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>

          {postedSelected && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground text-sm">Postulantes: {postedSelected.title}</h3>
              </div>
              {postedApplicants.length === 0
                ? <div className="p-8 text-center"><p className="text-sm text-muted-foreground">Sin postulaciones aún.</p></div>
                : (
                  <div className="divide-y divide-border">
                    {postedApplicants.map((app) => (
                      <div key={app.application_id} className="flex items-center gap-4 px-5 py-4">
                        {app.users?.profile_photo_url
                          ? <img src={app.users.profile_photo_url} alt={app.users.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                          : <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">{app.users?.name?.[0] ?? "?"}</div>
                        }
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-foreground">{app.users ? `${app.users.name}${app.users.surname ? " " + app.users.surname : ""}` : "Usuario"}</p>
                          <p className="text-xs text-muted-foreground">{app.users?.email}</p>
                          <p className="text-xs text-muted-foreground">{app.updated_at?.slice(0, 10)}</p>
                        </div>
                        <StatusBadge status={app.status} />
                        <div className="flex gap-1.5">
                          {app.status !== "in_review" && <button onClick={() => updateAppStatus(app.application_id, "in_review")} className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-200 transition-colors">Revisar</button>}
                          {app.status !== "successful" && <button onClick={() => updateAppStatus(app.application_id, "successful")} className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-200 transition-colors">Aceptar</button>}
                          {app.status !== "rejected" && <button onClick={() => updateAppStatus(app.application_id, "rejected")} className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-lg hover:bg-red-200 transition-colors">Rechazar</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Messages Page ────────────────────────────────────────────────────────────
type Conversation = {
  conversation_id: string;
  other_user_id: string;
  other_name: string;
  other_photo: string | null;
  last_message: string;
  last_sent_at: string;
};
type ChatMessage = {
  _id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  sent_at: string;
  is_read: boolean;
  edited?: boolean;
};

function MessagesPage({ user }: { user: UserSession }) {
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [allUsers, setAllUsers] = useState<Neo4jUser[]>([]);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [groupMsgText, setGroupMsgText] = useState("");
  const [sendingGroupMsg, setSendingGroupMsg] = useState(false);
  const [groupMsgError, setGroupMsgError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const groupBottomRef = useRef<HTMLDivElement>(null);

  const loadConvos = async () => {
    const res = await fetch(`${API_URL}/messages/${user.user_id}/conversations`);
    if (res.ok) setConvos(await res.json());
  };

  const loadMessages = async (convo_id: string) => {
    const res = await fetch(`${API_URL}/messages/conversation/${convo_id}`);
    if (res.ok) setMessages(await res.json());
    fetch(`${API_URL}/messages/conversation/${convo_id}/read`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id }),
    });
  };

  const loadGroupMessages = async (group_id: string) => {
    const res = await fetch(`${API_URL}/groups/${group_id}/messages`);
    if (res.ok) setGroupMessages(await res.json());
  };

  const sendGroupMessage = async () => {
    if (!groupMsgText.trim() || !selectedGroup || sendingGroupMsg) return;
    setSendingGroupMsg(true);
    setGroupMsgError("");
    try {
      const res = await fetch(`${API_URL}/groups/${selectedGroup.group_id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, body: groupMsgText.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setGroupMsgError(d.error || `Error ${res.status}`);
        return;
      }
      setGroupMsgText("");
      await loadGroupMessages(selectedGroup.group_id);
    } catch {
      setGroupMsgError("No se pudo conectar con el servidor.");
    } finally {
      setSendingGroupMsg(false);
    }
  };

  const selectGroupChat = (g: Group) => {
    setSelectedGroup(g);
    setSelected(null);
    setMessages([]);
    setGroupMessages([]);
    setShowNewChat(false);
  };

  useEffect(() => {
    loadConvos();
    fetch(`${API_URL}/connections/${user.user_id}`)
      .then((r) => r.ok ? r.json() : []).then(setAllUsers);
    fetch(`${API_URL}/groups/user/${user.user_id}`)
      .then((r) => r.ok ? r.json() : []).then(setUserGroups);
    const interval = setInterval(loadConvos, 10000);
    return () => clearInterval(interval);
  }, [user.user_id]);

  useEffect(() => {
    if (!selectedGroup) return;
    loadGroupMessages(selectedGroup.group_id);
    const interval = setInterval(() => loadGroupMessages(selectedGroup.group_id), 5000);
    return () => clearInterval(interval);
  }, [selectedGroup?.group_id]);

  useEffect(() => { groupBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [groupMessages]);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.conversation_id);
    const interval = setInterval(() => loadMessages(selected.conversation_id), 5000);
    return () => clearInterval(interval);
  }, [selected?.conversation_id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const selectConvo = (c: Conversation) => { setSelected(c); setShowNewChat(false); };

  const startChat = (u: Neo4jUser) => {
    const existing = convos.find((c) => c.other_user_id === u.user_id);
    if (existing) { selectConvo(existing); return; }
    const fake: Conversation = {
      conversation_id: [user.user_id, u.user_id].sort().join("_"),
      other_user_id: u.user_id,
      other_name: `${u.name} ${u.surname || ""}`.trim(),
      other_photo: u.photo_url || null,
      last_message: "",
      last_sent_at: "",
    };
    setSelected(fake);
    setMessages([]);
    setShowNewChat(false);
  };

  const sendMessage = async () => {
    if (!text.trim() || !selected || sending) return;
    setSending(true);
    const res = await fetch(`${API_URL}/messages/send`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_user_id: user.user_id, to_user_id: selected.other_user_id, body: text.trim() }),
    });
    if (res.ok) {
      setText("");
      await loadMessages(selected.conversation_id);
      await loadConvos();
    }
    setSending(false);
  };

  const saveEdit = async (msgId: string) => {
    if (!editingBody.trim()) return;
    await fetch(`${API_URL}/messages/message/${msgId}/edit`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id, body: editingBody.trim() }),
    });
    setEditingMsgId(null);
    if (selected) await loadMessages(selected.conversation_id);
  };

  const filteredUsers = allUsers.filter((u) =>
    `${u.name} ${u.surname}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 h-[calc(100vh-4rem)]">
      <div className="bg-card rounded-2xl border border-border h-full flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-foreground">Mensajes</p>
              <button onClick={() => setShowNewChat(!showNewChat)} className="text-primary hover:opacity-80 transition-opacity" title="Nuevo mensaje">
                <Plus size={18} />
              </button>
            </div>
            {showNewChat && (
              <input
                autoFocus
                placeholder="Buscar usuario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-input-background rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition"
              />
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {showNewChat ? (
              filteredUsers.length === 0
                ? <p className="text-xs text-muted-foreground text-center py-6">Sin usuarios encontrados.</p>
                : filteredUsers.map((u) => (
                  <div key={u.user_id} onClick={() => startChat(u)} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted transition-colors">
                    {u.photo_url
                      ? <img src={u.photo_url} alt={u.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      : <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">{u.name[0]}</div>
                    }
                    <p className="text-sm font-medium text-foreground truncate">{u.name} {u.surname}</p>
                  </div>
                ))
            ) : (
              <>
                {convos.length === 0 && userGroups.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageSquare size={28} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Todavía no tenés mensajes.<br />Presioná + para iniciar uno.</p>
                  </div>
                ) : (
                  <>
                    {convos.map((c) => (
                      <div key={c.conversation_id} onClick={() => { selectConvo(c); setSelectedGroup(null); }}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted ${selected?.conversation_id === c.conversation_id ? "bg-muted" : ""}`}
                      >
                        {c.other_photo
                          ? <img src={c.other_photo} alt={c.other_name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                          : <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">{c.other_name[0]}</div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{c.other_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.last_message || "Sin mensajes aún"}</p>
                        </div>
                        {c.last_sent_at && <p className="text-xs text-muted-foreground shrink-0">{c.last_sent_at.slice(11, 16)}</p>}
                      </div>
                    ))}
                    {userGroups.length > 0 && (
                      <>
                        <div className="px-4 py-2 border-t border-border mt-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Grupos</p>
                        </div>
                        {userGroups.map(({ groups: g }) => (
                          <div key={g.group_id} onClick={() => selectGroupChat(g)}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted ${selectedGroup?.group_id === g.group_id ? "bg-muted" : ""}`}
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <UsersRound size={18} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{g.name}</p>
                              <p className="text-xs text-muted-foreground">Grupo</p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Chat */}
        {!selected && !selectedGroup ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <MessageSquare size={40} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Seleccioná una conversación o iniciá una nueva.</p>
          </div>
        ) : selectedGroup ? (
          <div className="flex-1 flex flex-col">
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <UsersRound size={16} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{selectedGroup.name}</p>
                <p className="text-xs text-muted-foreground">Grupo</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {groupMessages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">Nadie escribió aún. ¡Sé el primero!</p>
              )}
              {groupMessages.map((msg) => {
                const isMe = msg.sender_id === user.user_id;
                return (
                  <div key={msg._id} className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && (
                      msg.sender_photo
                        ? <img src={msg.sender_photo} alt={msg.sender_name} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                        : <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-0.5">{msg.sender_name[0]}</div>
                    )}
                    <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                      {!isMe && <p className="text-xs font-semibold text-primary mb-1">{msg.sender_name}</p>}
                      <p className="leading-relaxed">{msg.body}</p>
                      <p className={`text-xs mt-1 text-right ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.sent_at.slice(11, 16)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={groupBottomRef} />
            </div>
            <div className="p-4 border-t border-border space-y-2">
              {groupMsgError && (
                <p className="text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg">{groupMsgError}</p>
              )}
              <div className="flex items-center gap-3">
                <input
                  value={groupMsgText}
                  onChange={(e) => { setGroupMsgText(e.target.value); setGroupMsgError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendGroupMessage()}
                  placeholder={`Escribir en ${selectedGroup.name}...`}
                  className="flex-1 bg-input-background rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                />
                <button onClick={sendGroupMessage} disabled={!groupMsgText.trim() || sendingGroupMsg}
                  className="bg-primary text-primary-foreground p-2.5 rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-3">
              {selected!.other_photo
                ? <img src={selected!.other_photo} alt={selected!.other_name} className="w-9 h-9 rounded-full object-cover" />
                : <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">{selected!.other_name[0]}</div>
              }
              <p className="font-semibold text-foreground text-sm">{selected!.other_name}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">Empezá la conversación enviando un mensaje.</p>
              )}
              {messages.map((msg) => {
                const isMe = msg.sender_id === user.user_id;
                const isEditing = editingMsgId === msg._id;
                return (
                  <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                    <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <input
                            autoFocus
                            value={editingBody}
                            onChange={(e) => setEditingBody(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(msg._id); if (e.key === "Escape") setEditingMsgId(null); }}
                            className="w-full bg-white/20 rounded-lg px-2 py-1 text-sm outline-none text-primary-foreground placeholder-primary-foreground/60"
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingMsgId(null)} className="text-xs text-primary-foreground/70 hover:text-primary-foreground">Cancelar</button>
                            <button onClick={() => saveEdit(msg._id)} className="text-xs font-semibold text-primary-foreground">Guardar</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="leading-relaxed">{msg.body}</p>
                          {msg.edited && <span className="text-xs opacity-60 italic">(editado)</span>}
                          <div className="flex items-center justify-end gap-1 mt-1">
                            {isMe && (
                              <button
                                onClick={() => { setEditingMsgId(msg._id); setEditingBody(msg.body); }}
                                className="opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity mr-1"
                                title="Editar mensaje"
                              >
                                <Edit3 size={11} className="text-primary-foreground" />
                              </button>
                            )}
                            <span className={`text-xs ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.sent_at.slice(11, 16)}</span>
                            {isMe && (msg.is_read ? <CheckCheck size={12} className="text-primary-foreground/60" /> : <Check size={12} className="text-primary-foreground/60" />)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-border flex items-center gap-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Escribir mensaje..."
                className="flex-1 bg-input-background rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
              />
              <button onClick={sendMessage} disabled={!text.trim() || sending}
                className="bg-primary text-primary-foreground p-2.5 rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity">
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notifications Page ───────────────────────────────────────────────────────
function NotificationsPage({ user }: { user: UserSession }) {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/notifications/${user.user_id}`);
      if (res.ok) setNotifs(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    // RNF6: actualización automática cada 30 s sin recargar la página
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [user.user_id]);

  const markAllRead = async () => {
    await fetch(`${API_URL}/notifications/${user.user_id}/read-all`, { method: "PUT" });
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await fetch(`${API_URL}/notifications/${id}/read`, { method: "PUT" });
    setNotifs((prev) => prev.map((n) => n._id === id ? { ...n, is_read: true } : n));
  };

  const iconMap: Record<string, typeof Bell> = {
    like: ThumbsUp, comment: MessageCircle, application_update: Briefcase,
    connection_request: UserPlus, connection_accepted: UserCheck,
    group_join: UsersRound, group_promoted: Shield, group_message: MessageSquare,
  };

  const unread = notifs.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Bell size={17} className="text-primary" />
            Notificaciones
            {unread > 0 && <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">{unread} nuevas</span>}
          </h2>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-sm text-primary font-medium hover:underline">
              Marcar todas como leídas
            </button>
          )}
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : notifs.length === 0 ? (
            <div className="p-12 text-center">
              <Bell size={28} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No tenés notificaciones aún.</p>
            </div>
          ) : notifs.map((n) => {
            const Icon = iconMap[n.type] || Bell;
            return (
              <div
                key={n._id}
                onClick={() => markRead(n._id)}
                className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-muted ${!n.is_read ? "bg-primary/5" : ""}`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${!n.is_read ? "font-medium text-foreground" : "text-foreground"}`}>{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock size={10} /> {new Date(n.created_at).toLocaleString("es-AR")}
                  </p>
                </div>
                {!n.is_read && <div className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 mt-1.5" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type GroupMessage = {
  _id: string;
  group_id: string;
  sender_id: string;
  sender_name: string;
  sender_photo: string;
  body: string;
  sent_at: string;
};

// ─── Groups Page ─────────────────────────────────────────────────────────────
function GroupsPage({ user, onViewProfile }: { user: UserSession; onViewProfile: (id: string) => void }) {
  const [tab, setTab] = useState<"explore" | "mine">("explore");
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<UserGroup[]>([]);
  const [selected, setSelected] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [detailTab, setDetailTab] = useState<"members" | "posts">("members");
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [postingGroup, setPostingGroup] = useState(false);

  const inputCls = "w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition";
  const labelCls = "text-xs font-medium text-foreground block mb-1";

  const loadAll = async () => {
    setLoading(true);
    const [allRes, myRes] = await Promise.all([
      fetch(`${API_URL}/groups`),
      fetch(`${API_URL}/groups/user/${user.user_id}`),
    ]);
    if (allRes.ok) setAllGroups(await allRes.json());
    if (myRes.ok) {
      const data: UserGroup[] = await myRes.json();
      setMyGroups(data);
      setMyGroupIds(new Set(data.map((g) => g.groups.group_id)));
    }
    setLoading(false);
  };

  const loadMembers = async (group_id: string) => {
    const res = await fetch(`${API_URL}/groups/${group_id}/members`);
    if (res.ok) setMembers(await res.json());
  };

  const loadGroupPosts = async (group_id: string) => {
    const res = await fetch(`${API_URL}/groups/${group_id}/posts?user_id=${user.user_id}`);
    if (res.ok) setGroupPosts(await res.json());
  };

  const createGroupPost = async () => {
    if (!selected || !newPostContent.trim() || postingGroup) return;
    setPostingGroup(true);
    const res = await fetch(`${API_URL}/groups/${selected.group_id}/posts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id, content: newPostContent.trim() }),
    });
    if (res.ok) { setNewPostContent(""); await loadGroupPosts(selected.group_id); }
    setPostingGroup(false);
  };

  const toggleGroupPostLike = async (post: GroupPost) => {
    await fetch(`${API_URL}/posts/${post._id}/like`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id, author_name: user.name }),
    });
    if (selected) await loadGroupPosts(selected.group_id);
  };

  const deleteGroupPost = async (post_id: string) => {
    if (!selected) return;
    await fetch(`${API_URL}/groups/${selected.group_id}/posts/${post_id}`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id }),
    });
    if (selected) await loadGroupPosts(selected.group_id);
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, [user.user_id]);

  useEffect(() => {
    if (!selected) return;
    const interval = setInterval(() => loadMembers(selected.group_id), 15000);
    return () => clearInterval(interval);
  }, [selected?.group_id]);

  const promoteMember = async (target_user_id: string) => {
    if (!selected) return;
    await fetch(`${API_URL}/groups/${selected.group_id}/members/${target_user_id}/promote`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id }),
    });
    await loadMembers(selected.group_id);
  };

  const demoteMember = async (target_user_id: string) => {
    if (!selected) return;
    await fetch(`${API_URL}/groups/${selected.group_id}/members/${target_user_id}/demote`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id }),
    });
    await loadMembers(selected.group_id);
  };

  const kickMember = async (target_user_id: string) => {
    if (!selected) return;
    await fetch(`${API_URL}/groups/${selected.group_id}/members/${target_user_id}/kick`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id }),
    });
    await loadMembers(selected.group_id);
    await loadAll();
  };

  const selectGroup = (g: Group) => {
    setSelected(g);
    setDetailTab("members");
    loadMembers(g.group_id);
    loadGroupPosts(g.group_id);
  };

  const handleJoin = async () => {
    if (!selected || joining) return;
    setJoining(true);
    const res = await fetch(`${API_URL}/groups/${selected.group_id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id }),
    });
    if (res.ok) {
      await loadAll();
      await loadMembers(selected.group_id);
    }
    setJoining(false);
  };

  const handleLeave = async () => {
    if (!selected) return;
    const res = await fetch(`${API_URL}/groups/${selected.group_id}/leave`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id }),
    });
    if (res.ok) {
      await loadAll();
      await loadMembers(selected.group_id);
    }
  };

  const handleCreate = async () => {
    if (!newGroup.name.trim()) return;
    setCreating(true);
    const res = await fetch(`${API_URL}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newGroup, user_id: user.user_id }),
    });
    if (res.ok) {
      setNewGroup({ name: "", description: "" });
      setShowCreate(false);
      await loadAll();
    }
    setCreating(false);
  };

  const displayGroups = tab === "explore" ? allGroups : myGroups.map((g) => g.groups);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { id: "explore" as const, label: "Explorar grupos" },
            { id: "mine" as const, label: "Mis grupos" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
          <Plus size={15} /> Crear grupo
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <p className="font-semibold text-foreground text-sm">Nuevo grupo</p>
          <div><label className={labelCls}>Nombre *</label><input className={inputCls} placeholder="Ej: Desarrolladores Buenos Aires" value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} /></div>
          <div><label className={labelCls}>Descripción / Tema</label><textarea rows={2} className={inputCls + " resize-none"} placeholder="De qué trata el grupo..." value={newGroup.description} onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })} /></div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="text-sm text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-border transition-colors">Cancelar</button>
            <button onClick={handleCreate} disabled={creating || !newGroup.name.trim()} className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity">{creating ? "Creando..." : "Crear"}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Cargando...</div>
      ) : displayGroups.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <UsersRound size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{tab === "mine" ? "Todavía no pertenecés a ningún grupo." : "No hay grupos aún. ¡Creá el primero!"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {/* Lista */}
          <div className="col-span-2 space-y-3">
            {displayGroups.map((g) => (
              <div key={g.group_id} onClick={() => selectGroup(g)} className={`bg-card rounded-2xl border cursor-pointer transition-all p-4 hover:shadow-md ${selected?.group_id === g.group_id ? "border-primary shadow-md" : "border-border"}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <UsersRound size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{g.name}</p>
                    {g.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{g.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      {myGroupIds.has(g.group_id) && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Miembro</span>
                      )}
                      {g.admin_id === user.user_id && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Admin</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detalle */}
          {selected && (
            <div className="col-span-3 bg-card rounded-2xl border border-border p-6 h-fit sticky top-4">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <UsersRound size={24} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-semibold text-foreground">{selected.name}</h2>
                  {selected.description && <p className="text-muted-foreground text-sm mt-1">{selected.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{members.length} {members.length === 1 ? "miembro" : "miembros"}</p>
                </div>
              </div>

              {/* Botón unirse / salir */}
              {selected.admin_id !== user.user_id && (
                myGroupIds.has(selected.group_id) ? (
                  <button onClick={handleLeave} className="w-full mb-4 py-2.5 rounded-xl text-sm font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors">
                    Salir del grupo
                  </button>
                ) : (
                  <button onClick={handleJoin} disabled={joining} className="w-full mb-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity">
                    {joining ? "Uniéndose..." : "Unirme al grupo"}
                  </button>
                )
              )}

              {/* Tabs: Miembros | Publicaciones */}
              <div className="flex gap-1 bg-muted rounded-xl p-1 mb-3">
                {([["members", "Miembros"], ["posts", "Publicaciones"]] as const).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setDetailTab(id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${detailTab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {detailTab === "members" && (
                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                  {members.map((m) => {
                    const isAdmin = selected.admin_id === user.user_id || members.find((me) => me.users.user_id === user.user_id)?.role === "admin";
                    const isPrimaryAdmin = m.users.user_id === selected.admin_id;
                    const isSelf = m.users.user_id === user.user_id;
                    const canPromote = isAdmin && !isSelf && !isPrimaryAdmin && m.role !== "admin";
                    const canDemote = isAdmin && !isSelf && !isPrimaryAdmin && m.role === "admin";
                    const canKick = isAdmin && !isSelf && !isPrimaryAdmin;
                    return (
                      <div key={m.users.user_id} className="flex items-center gap-3">
                        <button onClick={() => onViewProfile(m.users.user_id)} className="shrink-0 hover:opacity-80 transition-opacity rounded-full">
                          {m.users.profile_photo_url ? (
                            <img src={m.users.profile_photo_url} alt={m.users.name} className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">{m.users.name[0]}</div>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <button onClick={() => onViewProfile(m.users.user_id)} className="text-sm font-medium text-foreground truncate hover:underline text-left">{m.users.name}{m.users.surname ? ` ${m.users.surname}` : ""}</button>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {canPromote && (
                            <button
                              onClick={() => promoteMember(m.users.user_id)}
                              className="text-xs text-primary border border-primary/30 rounded-lg px-2 py-0.5 hover:bg-primary/10 transition-colors"
                              title="Hacer administrador"
                            >
                              Hacer admin
                            </button>
                          )}
                          {canDemote && (
                            <button
                              onClick={() => demoteMember(m.users.user_id)}
                              className="text-xs text-yellow-700 border border-yellow-300 rounded-lg px-2 py-0.5 hover:bg-yellow-50 transition-colors"
                              title="Quitar rol de administrador"
                            >
                              Quitar admin
                            </button>
                          )}
                          {canKick && (
                            <button
                              onClick={() => kickMember(m.users.user_id)}
                              className="text-xs text-destructive border border-destructive/30 rounded-lg px-2 py-0.5 hover:bg-destructive/10 transition-colors"
                              title="Expulsar del grupo"
                            >
                              Expulsar
                            </button>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {m.role === "admin" ? "Admin" : "Miembro"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {detailTab === "posts" && (
                <div className="space-y-3 mb-4">
                  {myGroupIds.has(selected.group_id) && (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Escribe algo para el grupo..."
                        rows={3}
                        className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        onClick={() => createGroupPost()}
                        disabled={postingGroup || !newPostContent.trim()}
                        className="self-end px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {postingGroup ? "Publicando..." : "Publicar"}
                      </button>
                    </div>
                  )}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {groupPosts.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No hay publicaciones en este grupo aún.</p>
                    ) : (
                      groupPosts.map((gp) => (
                        <div key={gp._id} className="bg-muted/30 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              {gp.author_photo_url
                                ? <img src={gp.author_photo_url} alt={gp.author_name} className="w-7 h-7 rounded-full object-cover" />
                                : gp.author_name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">{gp.author_name}{gp.author_surname ? ` ${gp.author_surname}` : ""}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(gp.created_at).toLocaleDateString("es-AR")}</p>
                            </div>
                            {(gp.user_id === user.user_id || selected.admin_id === user.user_id || members.find((me) => me.users.user_id === user.user_id)?.role === "admin") && (
                              <button
                                onClick={() => deleteGroupPost(gp._id)}
                                className="text-destructive hover:bg-destructive/10 rounded-lg p-1 transition-colors"
                                title="Eliminar publicación"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{gp.content}</p>
                          <button
                            onClick={() => toggleGroupPostLike(gp)}
                            className={`flex items-center gap-1 text-xs transition-colors ${gp.user_liked ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"}`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            {gp.likes_count > 0 && <span>{gp.likes_count}</span>}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── User Profile Page (read-only) ───────────────────────────────────────────
function UserProfilePage({ viewedId, currentUser, onBack, onViewProfile }: {
  viewedId: string;
  currentUser: UserSession;
  onBack: () => void;
  onViewProfile: (id: string) => void;
}) {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [connected, setConnected] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/profile/${viewedId}`).then((r) => r.ok ? r.json() : null).then((d) => d && setProfile(d));
    fetch(`${API_URL}/connections/${currentUser.user_id}`).then((r) => r.ok ? r.json() : []).then((list: { user_id: string }[]) => {
      setConnected(list.some((u) => u.user_id === viewedId));
    });
    fetch(`${API_URL}/connections/${currentUser.user_id}/sent`).then((r) => r.ok ? r.json() : []).then((list: { user_id: string }[]) => {
      setSent(list.some((u) => u.user_id === viewedId));
    });
  }, [viewedId]);

  const handleConnect = async () => {
    if (sending || connected || sent) return;
    setSending(true);
    const res = await fetch(`${API_URL}/connections/request`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_user_id: currentUser.user_id, to_user_id: viewedId }),
    });
    if (res.ok) setSent(true);
    setSending(false);
  };

  if (!profile) return <div className="flex justify-center py-20 text-muted-foreground text-sm">Cargando perfil...</div>;

  const isSelf = viewedId === currentUser.user_id;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
        <ChevronLeft size={16} /> Volver
      </button>

      {/* Header */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary to-primary/70 relative">
          <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&h=200&fit=crop&auto=format" alt="cover" className="w-full h-full object-cover opacity-40" />
        </div>
        <div className="px-6 pb-6 -mt-12 relative">
          {profile.profile_photo_url
            ? <img src={profile.profile_photo_url} alt={profile.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-card" />
            : <div className="w-24 h-24 rounded-full bg-primary/20 ring-4 ring-card flex items-center justify-center text-3xl font-bold text-primary">{profile.name[0]}</div>
          }
          <div className="mt-3 flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold text-foreground">{profile.name} {profile.surname}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{profile.email}</p>
              <div className="flex gap-2 mt-2">
                {profile.roles.map((r) => <span key={r} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium capitalize">{r}</span>)}
              </div>
            </div>
            {!isSelf && (
              connected ? (
                <span className="text-sm text-green-700 bg-green-100 px-4 py-2 rounded-xl font-medium">Contacto</span>
              ) : (
                <button onClick={handleConnect} disabled={sent || sending} className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity font-semibold">
                  {sending ? "Enviando..." : sent ? "Solicitud enviada" : "Conectar"}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Experiencia */}
      {profile.experience.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Briefcase size={16} className="text-primary" /> Experiencia</h2>
          <div className="space-y-3">
            {profile.experience.map((e) => (
              <div key={e.we_id} className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Briefcase size={14} className="text-primary" /></div>
                <div>
                  <p className="font-medium text-sm text-foreground">{e.title}</p>
                  {e.companies?.name && <p className="text-xs text-muted-foreground">{e.companies.name}</p>}
                  <p className="text-xs text-muted-foreground">{e.from_date?.slice(0, 7)}{e.is_current ? " · Actualidad" : e.end_date ? ` · ${e.end_date.slice(0, 7)}` : ""}</p>
                  {e.description && <p className="text-xs text-foreground/70 mt-1">{e.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Educación */}
      {profile.education.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2"><GraduationCap size={16} className="text-primary" /> Educación</h2>
          <div className="space-y-3">
            {profile.education.map((e) => (
              <div key={e.edu_id} className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><GraduationCap size={14} className="text-primary" /></div>
                <div>
                  <p className="font-medium text-sm text-foreground">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.institution}{e.field ? ` · ${e.field}` : ""}</p>
                  {(e.from_date || e.end_date) && <p className="text-xs text-muted-foreground">{e.from_date?.slice(0, 7)}{e.is_actual ? " · Actualidad" : e.end_date ? ` · ${e.end_date.slice(0, 7)}` : ""}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habilidades */}
      {profile.skills.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Zap size={16} className="text-primary" /> Habilidades</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span key={s.skills.skill_id} className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full font-medium">
                {s.skills.name} · {s.level}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [authInitialMode, setAuthInitialMode] = useState<AuthMode>("login");
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  const handleLogin = (user: UserSession) => { setCurrentUser(user); setPage("feed"); };
  const handleLogout = () => { setCurrentUser(null); setPage("home"); };
  const handleNavigate = (p: Page, jobId?: string) => { setPage(p); if (jobId) setPendingJobId(jobId); };
  const handleViewUser = (userId: string) => { setViewingUserId(userId); setPage("user-profile"); };

  if (!currentUser) {
    if (page === "home") return (
      <LandingPage
        onLogin={() => { setAuthInitialMode("login"); setPage("auth"); }}
        onRegister={() => { setAuthInitialMode("register"); setPage("auth"); }}
      />
    );
    return <AuthPage onLogin={handleLogin} initialMode={authInitialMode} />;
  }

  const pageComponents: Record<string, JSX.Element> = {
    feed: <FeedPage user={currentUser} onViewProfile={handleViewUser} />,
    profile: <ProfilePage user={currentUser} onUserUpdate={setCurrentUser} />,
    network: <NetworkPage user={currentUser} onNavigate={handleNavigate} onViewProfile={handleViewUser} />,
    jobs: <JobsPage user={currentUser!} pendingJobId={pendingJobId} onClearPendingJob={() => setPendingJobId(null)} />,
    groups: <GroupsPage user={currentUser} onViewProfile={handleViewUser} />,
    messages: <MessagesPage user={currentUser!} />,
    "user-profile": viewingUserId ? <UserProfilePage viewedId={viewingUserId} currentUser={currentUser} onBack={() => setPage("network")} onViewProfile={handleViewUser} /> : <></>,
    notifications: <NotificationsPage user={currentUser} />,
  };

  const mobileNavItems = [
    { id: "feed" as Page, icon: Home, label: "Inicio" },
    { id: "network" as Page, icon: Users, label: "Red" },
    { id: "jobs" as Page, icon: Briefcase, label: "Empleos" },
    { id: "messages" as Page, icon: MessageSquare, label: "Mensajes" },
    { id: "profile" as Page, icon: User, label: "Perfil" },
  ];

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Sidebar — solo desktop */}
      <div className="hidden md:block">
        <Sidebar page={page} setPage={setPage} onLogout={handleLogout} user={currentUser} />
      </div>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0" role="main">
        {pageComponents[page] ?? <FeedPage user={currentUser} />}
      </main>

      {/* Bottom nav — solo móvil (RNF5) */}
      <nav aria-label="Navegación principal" className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border flex items-center justify-around py-1 z-50">
        {mobileNavItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            aria-label={label}
            aria-current={page === id ? "page" : undefined}
            onClick={() => setPage(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${page === id ? "text-primary" : "text-muted-foreground"}`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
