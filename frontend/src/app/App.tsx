import { useState, useRef, useEffect, type JSX } from "react";
import {
  Home, Users, Briefcase, MessageSquare, Bell, User, LogOut, Search,
  Heart, MessageCircle, Share2, ThumbsUp, Send, Plus, ChevronRight,
  CheckCircle, Clock, MapPin, Building2, GraduationCap, Star, X as XIcon,
  MoreHorizontal, Paperclip, Smile, Check, CheckCheck, Edit3, Trash2,
  UserPlus, UserCheck, Filter, ArrowRight, Shield, Zap, Globe, Lock
} from "lucide-react";

const API_URL = "http://localhost:5000";

type Page = "home" | "auth" | "feed" | "profile" | "network" | "jobs" | "messages" | "notifications";
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
type AppStatus = "submitted" | "in_review" | "in_process" | "successful" | "rejected";
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

const ME = {
  id: 1,
  name: "Valentina Bentivegna",
  headline: "Desarrolladora Full Stack · React & Node.js",
  location: "Buenos Aires, Argentina",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format",
  connections: 312,
  role: ["candidato", "poster"] as string[],
};

const POSTS = [
  {
    id: 1,
    author: { name: "Lucía Fernández", headline: "Product Manager · Mercado Libre", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=48&h=48&fit=crop&auto=format" },
    time: "hace 2 horas",
    content: "Acabo de terminar de leer 'Inspired' de Marty Cagan y me parece uno de los mejores libros sobre Product Management que existen. Si están pensando en hacer la transición a PM, es una lectura obligatoria. ¿Alguno lo leyó? ¿Qué otros libros recomendarían?",
    likes: 87,
    comments: 14,
    liked: false,
    tags: ["ProductManagement", "Libros"],
  },
  {
    id: 2,
    author: { name: "Matías Gómez", headline: "Tech Lead · Globant", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&auto=format" },
    time: "hace 5 horas",
    content: "Hoy lanzamos en producción nuestra nueva arquitectura de microservicios. Seis meses de trabajo del equipo, muchos cafés y algún que otro viernes noche. El resultado: latencia reducida un 40%, y un sistema mucho más resiliente. Enormemente orgulloso de cada integrante del equipo.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=300&fit=crop&auto=format",
    likes: 234,
    comments: 31,
    liked: true,
    tags: ["Microservicios", "Arquitectura", "DevOps"],
  },
  {
    id: 3,
    author: { name: "Camila Rodríguez", headline: "UX Designer · Despegar", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop&auto=format" },
    time: "hace 1 día",
    content: "El diseño centrado en el usuario no es solo hacer pantallas bonitas. Es entender profundamente los problemas de las personas y construir soluciones que realmente los resuelvan. Esta semana hicimos 12 entrevistas con usuarios y aprendí más que en meses de research secundario.",
    likes: 156,
    comments: 22,
    liked: false,
    tags: ["UX", "UserResearch", "Design"],
  },
];

const CONNECTIONS = [
  { id: 1, name: "Morena Escudero", headline: "Data Scientist · Accenture", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=56&h=56&fit=crop&auto=format", mutuals: 18, company: "Accenture" },
  { id: 2, name: "Megan Rodríguez", headline: "Backend Engineer · MercadoPago", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=56&h=56&fit=crop&auto=format", mutuals: 24, company: "MercadoPago" },
  { id: 3, name: "Melanie Rodríguez", headline: "DevOps Engineer · AWS", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=56&h=56&fit=crop&auto=format", mutuals: 9, company: "AWS" },
];

const SUGGESTIONS = [
  { id: 4, name: "Diego Herrera", headline: "iOS Developer · Naranja X", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=56&h=56&fit=crop&auto=format", mutuals: 7 },
  { id: 5, name: "Ana Paula Silva", headline: "QA Engineer · Santander", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=56&h=56&fit=crop&auto=format", mutuals: 3 },
  { id: 6, name: "Facundo Torres", headline: "Mobile Dev · OLX", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=56&h=56&fit=crop&auto=format", mutuals: 11 },
];


const CONVERSATIONS = [
  {
    id: 1, name: "Matías Gómez", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&auto=format",
    lastMessage: "Perfecto, hablamos el lunes entonces 👍", time: "10:42", unread: 0,
    messages: [
      { id: 1, from: "them", text: "Hola Valentina! Vi tu perfil y me parece muy interesante tu experiencia.", time: "lun 9:15", status: "read" },
      { id: 2, from: "me", text: "¡Hola Matías! Muchas gracias, también veo que tienen proyectos muy interesantes en Globant.", time: "lun 9:45", status: "read" },
      { id: 3, from: "them", text: "Exacto. Te quería comentar que tenemos una posición abierta que creo que te puede interesar.", time: "lun 10:00", status: "read" },
      { id: 4, from: "me", text: "Me interesa mucho. ¿Podemos hablar esta semana?", time: "lun 10:20", status: "read" },
      { id: 5, from: "them", text: "Perfecto, hablamos el lunes entonces 👍", time: "lun 10:42", status: "read" },
    ],
  },
  {
    id: 2, name: "Lucía Fernández", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=48&h=48&fit=crop&auto=format",
    lastMessage: "¿Viste el artículo de Nielsen Norman?", time: "ayer", unread: 2,
    messages: [
      { id: 1, from: "them", text: "Val! ¿Cómo estás? Hace tiempo que no hablamos.", time: "ayer 14:00", status: "read" },
      { id: 2, from: "me", text: "¡Lucía! Todo bien, bastante ocupada con el nuevo proyecto. Vos?", time: "ayer 14:30", status: "read" },
      { id: 3, from: "them", text: "¿Viste el artículo de Nielsen Norman?", time: "ayer 18:00", status: "sent" },
    ],
  },
  {
    id: 3, name: "Grupo: Tech BuenosAires", avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=48&h=48&fit=crop&auto=format",
    lastMessage: "Diego: ¿Alguien va al meetup de Vue?", time: "mar", unread: 5,
    messages: [
      { id: 1, from: "other", sender: "Ana", text: "Buenas! Alguien tiene info del próximo hackathon?", time: "mar 11:00", status: "read" },
      { id: 2, from: "other", sender: "Facundo", text: "Creo que es el 15. Lo busco y lo comparto.", time: "mar 11:15", status: "read" },
      { id: 3, from: "other", sender: "Diego", text: "¿Alguien va al meetup de Vue?", time: "mar 16:00", status: "sent" },
    ],
  },
];

const NOTIFICATIONS = [
  { id: 1, type: "connection", text: "Diego Herrera te envió una solicitud de conexión", time: "hace 30 min", read: false, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&auto=format" },
  { id: 2, type: "like", text: "Matías Gómez y 12 personas más reaccionaron a tu publicación", time: "hace 2 horas", read: false, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&auto=format" },
  { id: 3, type: "comment", text: "Lucía Fernández comentó en tu publicación: '¡Excelente punto!'", time: "hace 3 horas", read: false, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&auto=format" },
  { id: 4, type: "job", text: "Tu postulación a Senior React Developer en Globant cambió a In Review", time: "ayer", read: true, avatar: "https://images.unsplash.com/photo-1568598035424-7070b67317d2?w=40&h=40&fit=crop&auto=format" },
  { id: 5, type: "connection", text: "Ana Paula Silva aceptó tu solicitud de conexión", time: "ayer", read: true, avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=40&h=40&fit=crop&auto=format" },
  { id: 6, type: "message", text: "Tienes un nuevo mensaje de Camila Rodríguez", time: "hace 2 días", read: true, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&auto=format" },
];

// ─── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, onLogout, user }: { page: Page; setPage: (p: Page) => void; onLogout: () => void; user: UserSession | null }) {
  const navItems = [
    { id: "feed" as Page, icon: Home, label: "Inicio" },
    { id: "network" as Page, icon: Users, label: "Mi Red" },
    { id: "jobs" as Page, icon: Briefcase, label: "Empleos" },
    { id: "messages" as Page, icon: MessageSquare, label: "Mensajes", badge: 7 },
    { id: "notifications" as Page, icon: Bell, label: "Notificaciones", badge: 3 },
    { id: "profile" as Page, icon: User, label: "Mi Perfil" },
  ];

  return (
    <aside className="w-64 min-h-screen flex flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)] shrink-0">
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
      <nav className="flex-1 px-3 mt-2 space-y-1">
        {navItems.map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              page === id
                ? "bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] shadow-md"
                : "text-slate-300 hover:bg-[var(--sidebar-accent)] hover:text-white"
            }`}
          >
            <Icon size={18} />
            <span className="flex-1 text-left">{label}</span>
            {badge && page !== id && (
              <span className="text-xs bg-rose-500 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none">
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
  const [form, setForm] = useState({ name: "", surname: "", dni: "", email: "", password: "", role: "candidato", company_name: "" });
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
                      <button key={r} type="button" onClick={() => setForm({ ...form, role: r, company_name: "" })} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${form.role === r ? "bg-primary text-primary-foreground border-primary" : "bg-input-background border-border text-muted-foreground hover:border-primary/40"}`}>{r === "candidato" ? "Candidato" : "Empresa / Poster"}</button>
                    ))}
                  </div>
                </div>
                {form.role === "poster" && (
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Nombre de empresa <span className="text-destructive">*</span></label>
                    <input type="text" placeholder="Ej: Globant, MercadoLibre..." value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="w-full bg-input-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition" />
                  </div>
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
function FeedPage({ user }: { user: UserSession }) {
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

  useEffect(() => { load(); }, []);

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
                  <div className="w-11 h-11 shrink-0">
                    {avatarFallback(post.author_name, post.author_surname, post.author_photo_url)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {post.author_name} {post.author_surname}
                    </p>
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
                    onClick={() => reaction ? handleLike(post._id) : toggleComments(post._id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon size={15} className={active ? "fill-primary/20 stroke-primary" : ""} />
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

  // Forms para agregar items
  const [showExpForm, setShowExpForm] = useState(false);
  const [showEduForm, setShowEduForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [newExp, setNewExp] = useState({ title: "", description: "", from_date: "", end_date: "", is_current: false });
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
    setNewExp({ title: "", description: "", from_date: "", end_date: "", is_current: false });
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
          <label className="cursor-pointer group relative inline-block">
            {profile.profile_photo_url
              ? <img src={profile.profile_photo_url} alt={profile.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-card group-hover:opacity-80 transition" />
              : <div className="w-24 h-24 rounded-full bg-primary/20 ring-4 ring-card flex items-center justify-center text-3xl font-bold text-primary">{profile.name[0]}</div>
            }
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <span className="bg-black/50 text-white text-xs rounded-full px-2 py-1">Cambiar foto</span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>

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
              <div><label className={labelCls}>Desde *</label><input type="date" className={inputCls} value={newExp.from_date} onChange={(e) => setNewExp({ ...newExp, from_date: e.target.value })} /></div>
            </div>
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
    </div>
  );
}

// ─── Network Page ─────────────────────────────────────────────────────────────
function NetworkPage() {
  const [connected, setConnected] = useState<number[]>([]);
  const [search, setSearch] = useState("");

  const filtered = SUGGESTIONS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.headline.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Connections */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserCheck size={17} className="text-primary" />
          Mis conexiones <span className="text-muted-foreground font-normal text-sm">({CONNECTIONS.length})</span>
        </h2>
        <div className="space-y-3">
          {CONNECTIONS.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
              <img src={c.avatar} alt={c.name} className="w-12 h-12 rounded-full object-cover" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.headline}</p>
                <p className="text-xs text-muted-foreground">{c.mutuals} contactos en común</p>
              </div>
              <button className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                Ver perfil <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <UserPlus size={17} className="text-primary" />
            Personas que quizás conozcas
          </h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="bg-input-background border border-border rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition w-44"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="border border-border rounded-2xl overflow-hidden text-center hover:shadow-md transition-shadow">
              <div className="h-14 bg-gradient-to-r from-primary/20 to-primary/10" />
              <div className="-mt-7 pb-4 px-3">
                <img src={s.avatar} alt={s.name} className="w-14 h-14 rounded-full object-cover mx-auto ring-2 ring-card" />
                <p className="font-semibold text-sm text-foreground mt-2 leading-tight">{s.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{s.headline}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.mutuals} en común</p>
                <button
                  onClick={() => setConnected((prev) => prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id])}
                  className={`w-full mt-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    connected.includes(s.id)
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  {connected.includes(s.id) ? "Solicitud enviada" : "Conectar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Jobs Page ────────────────────────────────────────────────────────────────
function JobsPage({ user }: { user: UserSession }) {
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
  const [newJob, setNewJob] = useState({ title: "", description: "", location: "", modality: "hibrido", shift: "full-time", skill_names: [] as string[] });
  const [skillInput, setSkillInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const isCandidate = user.roles.includes("candidato");
  const isPoster = user.roles.includes("poster");

  const loadJobs = async () => {
    const res = await fetch(`${API_URL}/jobs`);
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

  const loadPostedJobs = async () => {
    const res = await fetch(`${API_URL}/jobs/user/${user.user_id}/posted`);
    if (res.ok) setPostedJobs(await res.json());
  };

  const loadApplicants = async (job_id: string) => {
    const res = await fetch(`${API_URL}/jobs/${job_id}/applications`);
    if (res.ok) setPostedApplicants(await res.json());
  };

  useEffect(() => {
    loadJobs();
    loadMyApplications();
    if (isPoster) loadPostedJobs();
  }, [user.user_id]);

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
    setNewJob({ title: "", description: "", location: "", modality: "hibrido", shift: "full-time", skill_names: [] });
  };

  const createJob = async () => {
    if (!newJob.title.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch(`${API_URL}/jobs`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newJob, user_id: user.user_id, company_id: user.company_id ?? null, skill_names: newJob.skill_names }),
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
    await fetch(`${API_URL}/jobs/${job_id}`, { method: "DELETE" });
    setPostedSelected(null);
    setPostedApplicants([]);
    await loadPostedJobs();
    await loadJobs();
  };

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchSearch = j.title.toLowerCase().includes(q) || (j.companies?.name ?? "").toLowerCase().includes(q) || (j.location ?? "").toLowerCase().includes(q);
    const matchFilter = filter === "all" || (filter === "remote" && j.modality === "remoto");
    return matchSearch && matchFilter;
  });

  const inputCls = "w-full bg-input-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition";
  const labelCls = "text-xs font-medium text-foreground block mb-1";

  const STATUS_LABEL: Record<string, string> = {
    submitted: "Enviada", in_review: "En revisión", in_process: "En proceso",
    successful: "Aceptada", rejected: "Rechazada",
  };
  const STATUS_CLS: Record<string, string> = {
    submitted: "bg-yellow-100 text-yellow-700",
    in_review: "bg-blue-100 text-blue-700",
    in_process: "bg-purple-100 text-purple-700",
    successful: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
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
                  {selected.job_skill?.length > 0 && (
                    <>
                      <p className="text-sm font-semibold text-foreground mb-2">Habilidades requeridas</p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {selected.job_skill.map(({ skills: s }) => (
                          <span key={s.skill_id} className="text-xs px-3 py-1.5 rounded-xl font-medium bg-primary/10 text-primary">{s.name}</span>
                        ))}
                      </div>
                    </>
                  )}
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
              {myApplications.map((app) => (
                <div key={app.application_id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Briefcase size={16} className="text-primary" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{app.jobs?.title ?? "Oferta"}</p>
                    <p className="text-xs text-muted-foreground">{app.jobs?.companies?.name ?? "Empresa no indicada"}</p>
                    <p className="text-xs text-muted-foreground">{app.updated_at?.slice(0, 10)}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
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
                <div><label className={labelCls}>Título *</label><input className={inputCls} placeholder="Ej: Senior React Developer" value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} /></div>
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
                    <label className={labelCls}>Tipo</label>
                    <select className={inputCls} value={newJob.shift} onChange={(e) => setNewJob({ ...newJob, shift: e.target.value })}>
                      {["full-time", "part-time", "freelance"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
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
                    <div key={job.job_id} onClick={() => { setPostedSelected(job); loadApplicants(job.job_id); }} className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${postedSelected?.job_id === job.job_id ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm text-foreground">{job.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{job.location ?? "Sin ubicación"} · {job.modality} · {job.shift}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteJob(job.job_id); }} className="text-muted-foreground hover:text-destructive transition-colors p-1.5"><Trash2 size={14} /></button>
                      </div>
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
function MessagesPage() {
  const [selected, setSelected] = useState(CONVERSATIONS[0]);
  const [text, setText] = useState("");
  const [convos, setConvos] = useState(CONVERSATIONS);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selected]);

  const sendMessage = () => {
    if (!text.trim()) return;
    setConvos((prev) => prev.map((c) =>
      c.id === selected.id
        ? { ...c, messages: [...c.messages, { id: Date.now(), from: "me", text, time: "ahora", status: "sent" }], lastMessage: text }
        : c
    ));
    setSelected((s) => ({ ...s, messages: [...s.messages, { id: Date.now(), from: "me", text, time: "ahora", status: "sent" }] }));
    setText("");
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 h-[calc(100vh-4rem)]">
      <div className="bg-card rounded-2xl border border-border h-full flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <p className="font-semibold text-foreground mb-3">Mensajes</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input placeholder="Buscar..." className="w-full bg-input-background rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {convos.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted ${selected.id === c.id ? "bg-muted" : ""}`}
              >
                <div className="relative shrink-0">
                  <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                  {c.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center leading-none">{c.unread}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">{c.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-3">
            <img src={selected.avatar} alt={selected.name} className="w-9 h-9 rounded-full object-cover" />
            <p className="font-semibold text-foreground text-sm">{selected.name}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selected.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                  msg.from === "me"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}>
                  {"sender" in msg && msg.sender && <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender}</p>}
                  <p className="leading-relaxed">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`text-xs ${msg.from === "me" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</span>
                    {msg.from === "me" && (msg.status === "read" ? <CheckCheck size={12} className="text-primary-foreground/60" /> : <Check size={12} className="text-primary-foreground/60" />)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t border-border flex items-center gap-3">
            <button className="text-muted-foreground hover:text-foreground transition-colors p-2"><Paperclip size={17} /></button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Escribir mensaje..."
              className="flex-1 bg-input-background rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim()}
              className="bg-primary text-primary-foreground p-2.5 rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Notifications Page ───────────────────────────────────────────────────────
function NotificationsPage() {
  const [notifs, setNotifs] = useState(NOTIFICATIONS);

  const markAllRead = () => setNotifs(notifs.map((n) => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifs(notifs.map((n) => n.id === id ? { ...n, read: true } : n));

  const iconMap: Record<string, typeof Bell> = {
    connection: UserPlus, like: ThumbsUp, comment: MessageCircle, job: Briefcase, message: MessageSquare,
  };

  const unread = notifs.filter((n) => !n.read).length;

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
          {notifs.map((n) => {
            const Icon = iconMap[n.type] || Bell;
            return (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-muted ${!n.read ? "bg-primary/3" : ""}`}
              >
                <div className="relative shrink-0">
                  <img src={n.avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                    n.type === "connection" ? "bg-primary" : n.type === "job" ? "bg-[var(--accent)]" : "bg-slate-500"
                  }`}>
                    <Icon size={10} className="text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${!n.read ? "font-medium text-foreground" : "text-foreground"}`}>{n.text}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock size={10} /> {n.time}</p>
                </div>
                {!n.read && <div className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 mt-1.5" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [authInitialMode, setAuthInitialMode] = useState<AuthMode>("login");

  const handleLogin = (user: UserSession) => { setCurrentUser(user); setPage("feed"); };
  const handleLogout = () => { setCurrentUser(null); setPage("home"); };

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
    feed: <FeedPage user={currentUser} />,
    profile: <ProfilePage user={currentUser} onUserUpdate={setCurrentUser} />,
    network: <NetworkPage />,
    jobs: <JobsPage user={currentUser!} />,
    messages: <MessagesPage />,
    notifications: <NotificationsPage />,
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar page={page} setPage={setPage} onLogout={handleLogout} user={currentUser} />
      <main className="flex-1 overflow-y-auto">
        {pageComponents[page] ?? <FeedPage user={currentUser} />}
      </main>
    </div>
  );
}
