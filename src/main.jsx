import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase, isSupabaseConfigured } from "./supabase";
import "./styles.css";

const statusLabels = ["pending", "in progress", "submitted", "approved", "rejected", "revision required", "done"];
const taskTypes = ["On-Page SEO", "Backlink", "Keyword Research", "Technical SEO", "Content", "Audit"];
const priorities = ["Low", "Medium", "High", "Urgent"];

const demoProfiles = [
  { id: "demo-admin", full_name: "Admin User", email: "admin@seotaskflow.com", phone: "+1 555 0100", role: "admin", status: "approved", skill_level: "expert", created_at: new Date().toISOString() },
  { id: "demo-student-1", full_name: "Sarah Jenkins", email: "s.jenkins@example.com", phone: "+1 555 123 4567", role: "student", status: "approved", skill_level: "intermediate", created_at: new Date().toISOString() },
  { id: "demo-student-2", full_name: "Marcus Chen", email: "m.chen@example.com", phone: "+1 555 987 6543", role: "student", status: "pending", skill_level: "beginner", created_at: new Date().toISOString() },
  { id: "demo-student-3", full_name: "Elena Rodriguez", email: "elena.r@example.com", phone: "+1 555 444 3322", role: "student", status: "approved", skill_level: "expert", created_at: new Date().toISOString() }
];
const demoProjects = [
  { id: "project-1", project_name: "SEO TaskFlow", website_url: "https://seotaskflow.com", category: "SaaS", notes: "Internal product SEO", created_at: new Date().toISOString() },
  { id: "project-2", project_name: "Client Growth Hub", website_url: "https://clientgrowth.example", category: "Agency", notes: "Monthly backlink campaign", created_at: new Date().toISOString() }
];
const demoTasks = [
  { id: "task-1", student_id: "demo-student-1", project_id: "project-1", task_title: "On-Page SEO Audit", task_type: "On-Page SEO", target_url: "https://seotaskflow.com/features", posting_url: "", instructions: "Audit titles, headings, schema and internal links.", approx_time: "2h", deadline: new Date(Date.now() + 86400000 * 3).toISOString(), priority: "High", status: "submitted", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "task-2", student_id: "demo-student-1", project_id: "project-2", task_title: "Backlink Outreach", task_type: "Backlink", target_url: "https://clientgrowth.example/blog", posting_url: "", instructions: "Find relevant sites and submit outreach proof.", approx_time: "3h", deadline: new Date(Date.now() + 86400000 * 7).toISOString(), priority: "Medium", status: "in progress", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "task-3", student_id: "demo-student-3", project_id: "project-1", task_title: "Keyword Research Q3", task_type: "Keyword Research", target_url: "https://seotaskflow.com", posting_url: "", instructions: "Build keyword clusters for product pages.", approx_time: "4h", deadline: new Date(Date.now() - 86400000).toISOString(), priority: "Urgent", status: "done", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];
const demoSubmissions = [
  { id: "sub-1", task_id: "task-1", student_id: "demo-student-1", submission_url: "https://docs.example/audit", screenshot_url: "", notes: "Submitted audit with action list.", time_spent: "1h 45m", status: "submitted", submitted_at: new Date().toISOString() }
];
const demoRatings = [
  { id: "rating-1", task_id: "task-3", student_id: "demo-student-3", rating: 5, remarks: "Excellent keyword grouping and intent notes.", created_at: new Date().toISOString() }
];

const AuthContext = createContext(null);
const DataContext = createContext(null);
const ToastContext = createContext(null);

function Icon({ children, className = "" }) {
  return <span className={`material-symbols-outlined ${className}`}>{children}</span>;
}

function useToast() {
  return useContext(ToastContext);
}

function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const notify = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  };
  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast && (
        <div className={`fixed right-4 top-4 z-[100] rounded-lg px-4 py-3 text-sm font-semibold shadow-level-2 ${toast.type === "error" ? "bg-error text-white" : "bg-secondary text-white"}`}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const loadProfile = async (user) => {
    if (!user || !isSupabaseConfigured) return null;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setProfile(data || null);
    return data;
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setProfile(demoProfiles[0]);
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      await loadProfile(nextSession?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email, password, role) => {
    if (!isSupabaseConfigured) {
      const found = demoProfiles.find((p) => p.email.toLowerCase() === email.toLowerCase() && p.role === role) || (role === "admin" ? demoProfiles[0] : demoProfiles[1]);
      if (found.role === "student" && found.status !== "approved") throw new Error("Your account is still pending approval.");
      setProfile(found);
      return found;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const nextProfile = await loadProfile(data.user);
    if (!nextProfile || nextProfile.role !== role) {
      await supabase.auth.signOut();
      throw new Error(`This account is not registered as ${role}.`);
    }
    if (role === "student" && nextProfile.status !== "approved") {
      await supabase.auth.signOut();
      throw new Error("Your account is still pending approval.");
    }
    return nextProfile;
  };

  const signOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const value = useMemo(() => ({ session, profile, loading, signIn, signOut, setProfile }), [session, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  return useContext(AuthContext);
}

function DataProvider({ children }) {
  const notify = useToast();
  const [profiles, setProfiles] = useState(demoProfiles);
  const [projects, setProjects] = useState(demoProjects);
  const [tasks, setTasks] = useState(demoTasks);
  const [submissions, setSubmissions] = useState(demoSubmissions);
  const [ratings, setRatings] = useState(demoRatings);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    const [p, pr, t, s, r] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("submissions").select("*").order("submitted_at", { ascending: false }),
      supabase.from("ratings").select("*").order("created_at", { ascending: false })
    ]);
    setLoading(false);
    if (p.error || pr.error || t.error || s.error || r.error) {
      notify("Could not load Supabase data. Check schema and RLS policies.", "error");
      return;
    }
    setProfiles(p.data || []);
    setProjects(pr.data || []);
    setTasks(t.data || []);
    setSubmissions(s.data || []);
    setRatings(r.data || []);
  };

  useEffect(() => {
    refresh();
  }, []);

  const upsertRow = async (table, row, setter) => {
    const payload = row.id ? row : { ...row, id: crypto.randomUUID() };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from(table).upsert(payload).select().single();
      if (error) throw error;
      setter((items) => [data, ...items.filter((item) => item.id !== data.id)]);
      return data;
    }
    setter((items) => [payload, ...items.filter((item) => item.id !== payload.id)]);
    return payload;
  };

  const deleteRow = async (table, id, setter) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    }
    setter((items) => items.filter((item) => item.id !== id));
  };

  const updateStatus = async (table, id, status) => {
    const setters = { profiles: setProfiles, tasks: setTasks, submissions: setSubmissions };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from(table).update({ status, updated_at: table === "tasks" ? new Date().toISOString() : undefined }).eq("id", id).select().single();
      if (error) throw error;
      setters[table]((items) => items.map((item) => (item.id === id ? data : item)));
      return;
    }
    setters[table]((items) => items.map((item) => (item.id === id ? { ...item, status, updated_at: new Date().toISOString() } : item)));
  };

  const uploadScreenshot = async (file, path) => {
    if (!file) return "";
    if (!isSupabaseConfigured) return "";
    const { data, error } = await supabase.storage.from("submission-screenshots").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("submission-screenshots").getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const value = {
    profiles,
    projects,
    tasks,
    submissions,
    ratings,
    loading,
    refresh,
    saveProject: (row) => upsertRow("projects", row, setProjects),
    saveTask: (row) => upsertRow("tasks", { ...row, updated_at: new Date().toISOString() }, setTasks),
    saveSubmission: (row) => upsertRow("submissions", row, setSubmissions),
    saveRating: (row) => upsertRow("ratings", row, setRatings),
    deleteProject: (id) => deleteRow("projects", id, setProjects),
    deleteTask: (id) => deleteRow("tasks", id, setTasks),
    deleteProfile: (id) => deleteRow("profiles", id, setProfiles),
    updateStatus,
    uploadScreenshot
  };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function useData() {
  return useContext(DataContext);
}

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);
  return path;
}

function LinkButton({ to, children, className = "" }) {
  return <button className={className} onClick={() => navigate(to)} type="button">{children}</button>;
}

function StatusBadge({ status }) {
  const key = (status || "pending").toLowerCase();
  const map = {
    pending: "bg-[#7A869A]/10 text-[#5E6C84] border-[#7A869A]/20",
    "in progress": "bg-[#0052CC]/10 text-[#0052CC] border-[#0052CC]/20",
    submitted: "bg-[#6554C0]/10 text-[#6554C0] border-[#6554C0]/20",
    approved: "bg-[#36B37E]/10 text-[#006c47] border-[#36B37E]/20",
    rejected: "bg-[#DE350B]/10 text-[#DE350B] border-[#DE350B]/20",
    "revision required": "bg-[#FFAB00]/10 text-[#974F0C] border-[#FFAB00]/20",
    done: "bg-[#36B37E]/10 text-[#006c47] border-[#36B37E]/20",
    active: "bg-[#36B37E]/10 text-[#006c47] border-[#36B37E]/20"
  };
  return <span className={`inline-flex items-center rounded-md border px-2 py-1 text-label-bold font-label-bold capitalize ${map[key] || map.pending}`}><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />{key}</span>;
}

function ProjectTag({ project }) {
  const colors = ["bg-primary-fixed text-on-primary-fixed", "bg-secondary-container text-on-secondary-container", "bg-tertiary-fixed text-on-tertiary-fixed", "bg-error-container text-on-error-container"];
  const index = project?.project_name?.length % colors.length || 0;
  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${colors[index]}`}>{project?.project_name || "Unassigned"}</span>;
}

function EmptyState({ icon = "inbox", title, body }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-xl text-center">
      <Icon className="mb-2 text-4xl text-outline">{icon}</Icon>
      <h3 className="text-h3 font-h3 text-on-surface">{title}</h3>
      <p className="mt-1 max-w-md text-body-md text-on-surface-variant">{body}</p>
    </div>
  );
}

function LoadingBar({ show }) {
  return show ? <div className="h-1 w-full overflow-hidden bg-primary-fixed"><div className="h-full w-1/3 animate-pulse bg-primary" /></div> : null;
}

function PublicLanding() {
  return (
    <main className="bg-background text-on-background">
      <section className="relative overflow-hidden bg-surface-container-lowest px-lg pb-2xl pt-3xl lg:pb-3xl lg:pt-32">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-surface-container-low to-surface-bright opacity-50" />
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-2xl lg:grid-cols-2">
          <div className="flex flex-col gap-lg">
            <div className="inline-flex w-max items-center rounded-full border border-primary-fixed bg-primary-fixed/30 px-3 py-1 text-label-bold font-label-bold text-on-primary-fixed-variant">
              <Icon className="mr-2 text-[16px]">rocket_launch</Icon> New Features Released
            </div>
            <h1 className="font-h1 text-h1 text-on-background lg:text-5xl lg:leading-tight">Manage SEO Tasks, Track Progress, and Improve Team Performance</h1>
            <p className="max-w-xl text-body-lg font-body-lg text-on-surface-variant">A systematic platform for assigning SEO tasks, tracking submissions, and generating transparent reports for agencies and high-performance teams.</p>
            <div className="mt-sm flex flex-col gap-md sm:flex-row">
              <LinkButton to="/admin/login" className="flex items-center justify-center rounded-lg bg-primary px-lg py-3 text-body-md font-body-md text-on-primary shadow-sm transition-shadow hover:bg-primary/90 hover:shadow-md">Admin Login</LinkButton>
              <LinkButton to="/student/login" className="flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest px-lg py-3 text-body-md font-body-md text-on-surface transition-colors hover:bg-surface-container-low">Student Login</LinkButton>
              <LinkButton to="/student/signup" className="flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low px-lg py-3 text-body-md font-body-md text-on-surface transition-colors hover:bg-surface-container">Join as Student</LinkButton>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-level-2">
            <img alt="Dashboard Interface" className="h-auto w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiIZJHvn37j1DpsI3W6uWZ55S8ik0NTck3oRzl85ssGB70hNZgX-DlOZK0ZgxNULAuhjMo9b0AfkBxlk8CM6K62F_S6AwkBqaepuW_33e6xz9-b9WT5kkHUkti8T7e1R33KCtMzga5UA-cXsd3gXhlwe6SVJdknB6tuaibSNuUrrdIMjUFeRWuLO-t2efUQAur1UaKc6shiOL_WFOdum3-EhJgt2-NRRLBA9acCRwMWCFIjL73EoFHCu2AZIJbvcskEiEe5eKNDA" />
          </div>
        </div>
      </section>
      <section className="bg-surface-container-low px-lg py-3xl">
        <div className="mx-auto max-w-7xl">
          <div className="mb-2xl text-center">
            <h2 className="mb-md text-h2 font-h2 text-on-background">Systematic Workflow Control</h2>
            <p className="mx-auto max-w-2xl text-body-lg text-on-surface-variant">Everything you need to manage your SEO task pipeline, from assignment to final reporting, without the cognitive overload.</p>
          </div>
          <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
            {[
              ["assignment", "SEO Task Assignment", "Distribute specialized SEO tasks across your team with precision. Set deadlines, attach resources, and monitor the pipeline."],
              ["trending_up", "Student Progress Tracking", "Real-time visibility into individual performance metrics and completion rates."],
              ["rate_review", "Admin Review & Ratings", "Evaluate submissions systematically, provide feedback, and maintain quality control standards."],
              ["picture_as_pdf", "PDF/Excel Reports", "Generate professional, agency-ready reports in multiple formats with a single click."],
              ["share", "WhatsApp Report Sharing", "Instantly dispatch reports directly to clients or stakeholders via WhatsApp integration."]
            ].map(([icon, title, body], index) => (
              <div key={title} className={`${index === 0 ? "md:col-span-2" : ""} rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-level-1`}>
                <div className="mb-md flex h-12 w-12 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed"><Icon>{icon}</Icon></div>
                <h3 className="mb-sm text-h3 font-h3 text-on-background">{title}</h3>
                <p className="text-body-md text-on-surface-variant">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer className="border-t border-outline-variant/10 bg-inverse-surface px-lg py-2xl text-inverse-on-surface">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-xl md:flex-row">
          <div><div className="mb-lg flex items-center gap-sm"><Icon className="text-inverse-primary">task_alt</Icon><span className="text-h3 font-h3 text-white">SEO TaskFlow</span></div><p className="max-w-sm text-body-md text-inverse-on-surface/70">Systematic SEO task management for high-performance agencies and educational cohorts.</p></div>
          <p className="text-body-sm text-inverse-on-surface/50">© 2026 SEO TaskFlow. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

function LoginPage({ role }) {
  const { signIn } = useAuth();
  const notify = useToast();
  const [form, setForm] = useState({ email: role === "admin" ? "admin@seotaskflow.com" : "s.jenkins@example.com", password: "" });
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const profile = await signIn(form.email, form.password, role);
      notify(`Logged in as ${profile.full_name || profile.email}`);
      navigate(role === "admin" ? "/admin/dashboard" : "/student/dashboard");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  };
  const isAdmin = role === "admin";
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-container-low p-md antialiased">
      <div className={`w-full ${isAdmin ? "max-w-md" : "max-w-md rounded-xl border border-surface-variant bg-surface-container-lowest p-xl shadow-level-1"} relative overflow-hidden`}>
        {!isAdmin && <div className="absolute left-0 top-0 h-1 w-full bg-primary" />}
        <div className="mb-xl flex flex-col items-center text-center">
          <div className={`${isAdmin ? "mb-md h-12 w-12 bg-primary text-on-primary" : "mb-sm text-primary"} flex items-center justify-center gap-sm rounded-lg`}>
            <Icon className={isAdmin ? "text-3xl" : "text-[28px]"}>{isAdmin ? "analytics" : "dataset"}</Icon>
            {!isAdmin && <span className="text-h3 font-h3 tracking-tight">SEO TaskFlow</span>}
          </div>
          {isAdmin && <h1 className="text-h1 font-black tracking-tighter text-primary">SEO TaskFlow</h1>}
          <p className="mt-xs text-body-md text-on-surface-variant">{isAdmin ? "Enterprise Admin Portal" : "Sign in to manage your assignments and submissions."}</p>
        </div>
        <div className={isAdmin ? "w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-xl shadow-level-1" : ""}>
          <div className="mb-lg"><h2 className="text-h3 font-h3 text-on-surface">{isAdmin ? "Sign In" : "Student Portal"}</h2><p className="mt-xs text-body-sm text-on-surface-variant">Enter your credentials to continue.</p></div>
          <form className="flex flex-col gap-md" onSubmit={submit}>
            <Field label="Email Address" icon="mail" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} placeholder={`${role}@example.com`} />
            <Field label="Password" icon="lock" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} placeholder="••••••••" />
            <button className="mt-sm flex w-full items-center justify-center gap-sm rounded-lg bg-primary px-lg py-3 text-label-bold font-label-bold text-on-primary shadow-sm transition-all hover:bg-primary-fixed-variant disabled:opacity-60" disabled={loading} type="submit">
              {loading ? "Signing in..." : `Login as ${isAdmin ? "Admin" : "Student"}`} <Icon className="text-lg">arrow_forward</Icon>
            </button>
          </form>
          <div className="mt-xl border-t border-outline-variant/30 pt-lg text-center">
            {isAdmin ? <p className="text-body-sm text-on-surface-variant">Not an administrator? <LinkButton to="/student/login" className="ml-xs text-label-bold font-label-bold text-primary">Login as Student</LinkButton></p> : <div className="flex flex-col gap-md"><LinkButton to="/student/signup" className="text-body-sm text-on-surface-variant hover:text-primary">Join as Student (Request Access)</LinkButton><LinkButton to="/admin/login" className="text-body-sm text-on-surface-variant hover:text-secondary">Login as Admin</LinkButton></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, icon, required = true }) {
  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label-bold font-label-bold text-on-surface">{label}</span>
      <span className="relative flex items-center">
        {icon && <Icon className="absolute left-md text-[18px] text-outline">{icon}</Icon>}
        <input required={required} type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${icon ? "pl-2xl" : "pl-md"} w-full rounded-lg border border-outline-variant bg-surface px-md py-[10px] text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`} />
      </span>
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label-bold font-label-bold text-on-surface">{label}</span>
      <select className="w-full rounded-lg border border-outline-variant bg-surface px-md py-[10px] text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={value || ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function SignupPage() {
  const notify = useToast();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", skill_level: "", message: "", password: "" });
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password || crypto.randomUUID(),
          options: {
            data: {
              full_name: form.full_name,
              phone: form.phone,
              skill_level: form.skill_level,
              message: form.message,
              role: "student",
              status: "pending"
            }
          }
        });
        if (error) throw error;
        const userId = data.user?.id;
        if (userId && data.session) {
          const { password: _password, ...profileFields } = form;
          const { error: profileError } = await supabase.from("profiles").upsert({ id: userId, ...profileFields, role: "student", status: "pending", created_at: new Date().toISOString() });
          if (profileError) throw profileError;
        }
      }
      notify("Signup request submitted. Admin approval is required before login.");
      navigate("/student/login");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-md sm:p-lg">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-md md:flex-row">
        <div className="relative hidden overflow-hidden bg-primary p-xl text-on-primary md:flex md:w-5/12 md:flex-col md:justify-between">
          <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent opacity-60" />
          <div className="relative z-10">
            <div className="mb-3xl flex items-center gap-sm"><Icon className="text-[32px]">analytics</Icon><span className="text-h3 font-h3 tracking-tight">SEO TaskFlow</span></div>
            <h2 className="mb-md text-h1 font-h1">Master Your Workflow.</h2>
            <p className="max-w-sm text-body-lg text-on-primary-container opacity-90">Join the systematic platform designed for high-performance SEO agencies and professionals.</p>
          </div>
        </div>
        <div className="flex w-full flex-col justify-center p-lg sm:p-xl md:w-7/12 md:p-2xl">
          <div className="mb-xl"><h1 className="mb-xs text-h2 font-h2 text-on-surface">Student Signup Request</h1><p className="text-body-md text-on-surface-variant">Submit your details to request access to the student environment.</p></div>
          <form className="space-y-md" onSubmit={submit}>
            <Field label="Full Name" value={form.full_name} onChange={(full_name) => setForm({ ...form, full_name })} placeholder="Jane Doe" />
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
              <Field label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} placeholder="jane@example.com" />
              <Field label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} placeholder="+1 555 000 0000" required={false} />
            </div>
            <Field label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} placeholder="Set a password for after approval" />
            <SelectField label="Skill Level" value={form.skill_level} onChange={(skill_level) => setForm({ ...form, skill_level })} options={["beginner", "intermediate", "expert"]} />
            <label className="flex flex-col gap-xs"><span className="text-label-bold font-label-bold">Message</span><textarea className="min-h-24 rounded-lg border border-outline-variant bg-surface px-md py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Briefly describe your goals..." /></label>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-label-bold font-label-bold text-on-primary shadow-sm transition-all hover:bg-primary-fixed-variant disabled:opacity-60" disabled={loading} type="submit">{loading ? "Submitting..." : "Submit Request"} <Icon className="text-[18px]">arrow_forward</Icon></button>
          </form>
          <div className="mt-xl border-t border-outline-variant/30 pt-lg text-center"><p className="text-body-md text-on-surface-variant">Already have an account? <LinkButton to="/student/login" className="ml-1 text-label-bold font-label-bold text-primary">Login</LinkButton></p></div>
        </div>
      </div>
    </div>
  );
}

function Shell({ role, title, children }) {
  const { signOut, profile } = useAuth();
  const path = usePath();
  const nav = role === "admin" ? [
    ["/admin/dashboard", "dashboard", "Dashboard"],
    ["/admin/students", "group", "Students"],
    ["/admin/tasks", "assignment", "Task Management"],
    ["/admin/submissions", "send_and_archive", "Submissions"],
    ["/admin/projects", "language", "Projects/Websites"],
    ["/admin/reports", "analytics", "Reports"],
    ["/admin/settings", "settings", "Settings"]
  ] : [
    ["/student/dashboard", "dashboard", "Dashboard"],
    ["/student/tasks", "assignment", "My Tasks"],
    ["/student/performance", "trending_up", "Performance"],
    ["/student/settings", "settings", "Settings"]
  ];
  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-slate-200 bg-slate-50 py-4 md:flex">
        <div className="mb-8 flex items-center gap-3 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-lg font-bold text-white">S</div>
          <div><h1 className="text-lg font-black tracking-tighter text-blue-700">SEO TaskFlow</h1><p className="text-body-sm text-slate-500">{role === "admin" ? "Enterprise Admin" : "Student Portal"}</p></div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4">
          {nav.map(([to, icon, label]) => {
            const active = path === to;
            return <button key={to} className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-body-md transition-colors ${active ? "border-r-4 border-blue-700 bg-blue-50 font-bold text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-blue-700"}`} onClick={() => navigate(to)}><Icon>{icon}</Icon>{label}</button>;
          })}
        </nav>
        <div className="mt-auto space-y-1 px-4">
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-body-md text-slate-600 hover:bg-slate-100 hover:text-blue-700"><Icon>help_outline</Icon>Help</button>
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-body-md text-slate-600 hover:bg-slate-100 hover:text-blue-700" onClick={signOut}><Icon>logout</Icon>Logout</button>
        </div>
      </aside>
      <main className="flex h-screen flex-1 flex-col overflow-hidden md:ml-64">
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
          <div className="flex items-center gap-3"><button className="md:hidden" onClick={() => navigate(role === "admin" ? "/admin/dashboard" : "/student/dashboard")}><Icon>menu</Icon></button><h2 className="text-h2 font-h2 text-on-surface">{title}</h2></div>
          <div className="flex items-center gap-4"><button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-50"><Icon>notifications</Icon><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-error" /></button><div className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant bg-surface-container-high text-sm font-bold">{(profile?.full_name || "U").slice(0, 2).toUpperCase()}</div></div>
        </header>
        <div className="flex-1 overflow-y-auto p-lg">{children}</div>
      </main>
    </div>
  );
}

function Guard({ role, children }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background"><LoadingBar show /><div className="p-xl">Loading...</div></div>;
  if (!profile || profile.role !== role || (role === "student" && profile.status !== "approved")) {
    navigate(role === "admin" ? "/admin/login" : "/student/login");
    return null;
  }
  return children;
}

function Card({ title, value, meta, icon, accent = "text-on-surface" }) {
  return <div className="flex h-32 flex-col justify-between rounded-xl border border-outline-variant bg-surface p-md shadow-level-1"><p className="text-label-bold font-label-bold uppercase text-on-surface-variant">{title}</p><p className={`text-h1 font-h1 ${accent}`}>{value}</p><div className="flex items-center text-body-sm text-outline">{icon && <Icon className="mr-1 text-[16px]">{icon}</Icon>}{meta}</div></div>;
}

function AdminDashboard() {
  const { profiles, tasks, ratings, submissions, loading } = useData();
  const students = profiles.filter((p) => p.role === "student");
  const avgRating = ratings.length ? (ratings.reduce((sum, r) => sum + Number(r.rating || 0), 0) / ratings.length).toFixed(1) : "0.0";
  return (
    <Shell role="admin" title="Dashboard Overview">
      <LoadingBar show={loading} />
      <div className="mx-auto max-w-7xl space-y-lg">
        <div className="grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card title="Total Students" value={students.length} meta="+ active cohort" icon="trending_up" />
          <Card title="Pending Approvals" value={students.filter((p) => p.status === "pending").length} meta="Action needed" icon="pending_actions" />
          <Card title="Total Tasks" value={tasks.length} meta="Across all projects" icon="assignment" />
          <Card title="Completed Tasks" value={tasks.filter((t) => ["done", "approved"].includes(t.status)).length} meta="Approved or done" accent="text-[#36B37E]" />
          <Card title="In Progress" value={tasks.filter((t) => t.status === "in progress").length} meta="Currently active" accent="text-[#0052CC]" />
          <Card title="Average Rating" value={avgRating} meta="Quality score" icon="star" />
        </div>
        <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
          <div className="rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between"><h3 className="text-h3 font-h3">Weekly Performance Overview</h3><LinkButton to="/admin/reports" className="flex items-center text-label-bold font-label-bold text-primary">View Full Report <Icon className="ml-1 text-[16px]">arrow_forward</Icon></LinkButton></div>
            <div className="relative flex h-64 items-end overflow-hidden rounded-lg border border-outline-variant/50 bg-surface-container-low p-4 pt-10">
              <div className="absolute left-4 top-4 text-body-sm text-outline">Task Completion Velocity</div>
              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100"><path d="M0,80 Q10,70 20,60 T40,40 T60,50 T80,20 T100,10" fill="none" stroke="#0052CC" strokeWidth="2" /><path d="M0,80 Q10,70 20,60 T40,40 T60,50 T80,20 T100,10 L100,100 L0,100 Z" fill="#0052CC" opacity="0.1" /></svg>
            </div>
          </div>
          <Activity submissions={submissions} tasks={tasks} profiles={profiles} />
        </div>
      </div>
    </Shell>
  );
}

function Activity({ submissions, tasks, profiles }) {
  const rows = submissions.slice(0, 6);
  return <div className="flex h-full flex-col rounded-xl border border-outline-variant bg-surface shadow-level-1"><div className="border-b border-outline-variant/50 p-lg"><h3 className="text-h3 font-h3">Recent Activity</h3></div><ul className="flex-1 divide-y divide-outline-variant/30">{rows.length ? rows.map((s) => { const task = tasks.find((t) => t.id === s.task_id); const student = profiles.find((p) => p.id === s.student_id); return <li key={s.id} className="flex gap-3 p-md hover:bg-surface-container-low"><div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700"><Icon className="text-[18px]">publish</Icon></div><div><p className="text-body-md"><b>{student?.full_name || "Student"}</b> submitted <span className="font-semibold text-primary">{task?.task_title}</span></p><div className="mt-1 flex items-center gap-2"><StatusBadge status={s.status} /><span className="text-body-sm text-outline">{new Date(s.submitted_at).toLocaleDateString()}</span></div></div></li>; }) : <li className="p-md"><EmptyState title="No activity yet" body="Submissions and reviews will appear here." /></li>}</ul></div>;
}

function StudentsPage() {
  const data = useData();
  const notify = useToast();
  const students = data.profiles.filter((p) => p.role === "student");
  const approve = async (student, status) => { await data.updateStatus("profiles", student.id, status); notify(`${student.full_name} marked ${status}.`); };
  return (
    <Shell role="admin" title="Students">
      <div className="mb-lg flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-h1 font-h1">Students</h1><p className="mt-1 text-body-md text-on-surface-variant">Manage enrolled SEO students, track progress, and review submissions.</p></div><button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-label-bold font-label-bold text-on-primary shadow-sm"><Icon className="text-[18px]">add</Icon>Add Student</button></div>
      <div className="overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest shadow-level-1"><div className="overflow-x-auto"><table className="sheet-table"><thead><tr><th>Student Name</th><th>Contact Info</th><th>Status</th><th>Task Progress</th><th>Avg Rating</th><th className="text-right">Actions</th></tr></thead><tbody>{students.map((student) => { const studentTasks = data.tasks.filter((t) => t.student_id === student.id); const done = studentTasks.filter((t) => ["done", "approved"].includes(t.status)).length; const studentRatings = data.ratings.filter((r) => r.student_id === student.id); const avg = studentRatings.length ? (studentRatings.reduce((s, r) => s + Number(r.rating), 0) / studentRatings.length).toFixed(1) : "-"; return <tr key={student.id}><td><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/50 bg-surface-container font-bold text-primary">{student.full_name?.slice(0, 2).toUpperCase()}</div><div><div className="font-semibold">{student.full_name}</div><div className="text-body-sm text-on-surface-variant">ID: {student.id.slice(0, 8)}</div></div></div></td><td><div className="text-body-sm"><div className="flex items-center gap-1.5"><Icon className="text-[14px] text-on-surface-variant">mail</Icon>{student.email}</div><div className="flex items-center gap-1.5 text-on-surface-variant"><Icon className="text-[14px]">phone</Icon>{student.phone || "-"}</div></div></td><td><StatusBadge status={student.status === "approved" ? "active" : student.status} /></td><td><div className="max-w-[160px]"><div className="mb-2 flex justify-between text-body-sm"><span className="font-medium">{done} / {studentTasks.length}</span><span className="text-on-surface-variant">{studentTasks.length ? Math.round((done / studentTasks.length) * 100) : 0}%</span></div><div className="h-1.5 rounded-full bg-surface-container-high"><div className="h-full rounded-full bg-secondary" style={{ width: `${studentTasks.length ? (done / studentTasks.length) * 100 : 0}%` }} /></div></div></td><td><div className="flex items-center gap-1 font-semibold"><Icon className="text-[16px] text-tertiary-container">star</Icon>{avg}</div></td><td className="text-right"><div className="flex justify-end gap-1"><button title="Approve" className="rounded-md p-1.5 text-on-surface-variant hover:bg-secondary/10 hover:text-secondary" onClick={() => approve(student, "approved")}><Icon className="text-[20px]">check_circle</Icon></button><button title="Reject" className="rounded-md p-1.5 text-on-surface-variant hover:bg-error/10 hover:text-error" onClick={() => approve(student, "rejected")}><Icon className="text-[20px]">cancel</Icon></button><button title="Delete" className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-container" onClick={() => data.deleteProfile(student.id)}><Icon className="text-[20px]">delete</Icon></button></div></td></tr>; })}</tbody></table></div>{!students.length && <div className="p-lg"><EmptyState title="No students found" body="Signup requests will appear here for approval." /></div>}</div>
    </Shell>
  );
}

function ProjectForm({ onSave, initial = {} }) {
  const [form, setForm] = useState(initial);
  return <form className="grid grid-cols-1 gap-md rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, created_at: form.created_at || new Date().toISOString() }); setForm({}); }}><Field label="Project Name" value={form.project_name} onChange={(project_name) => setForm({ ...form, project_name })} /><Field label="Website URL" value={form.website_url} onChange={(website_url) => setForm({ ...form, website_url })} /><Field label="Category" value={form.category} onChange={(category) => setForm({ ...form, category })} required={false} /><Field label="Notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} required={false} /><button className="rounded-lg bg-primary px-4 py-3 text-label-bold font-label-bold text-on-primary md:col-span-2">Save Project</button></form>;
}

function ProjectsPage() {
  const data = useData();
  const notify = useToast();
  return <Shell role="admin" title="Projects/Websites"><div className="space-y-lg"><ProjectForm onSave={async (row) => { await data.saveProject(row); notify("Project saved."); }} /><div className="grid grid-cols-1 gap-md md:grid-cols-2 xl:grid-cols-3">{data.projects.map((project) => <div key={project.id} className="rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1"><div className="mb-md flex items-start justify-between"><ProjectTag project={project} /><button onClick={() => data.deleteProject(project.id)}><Icon className="text-error">delete</Icon></button></div><h3 className="text-h3 font-h3">{project.project_name}</h3><a className="mt-1 block break-all text-body-sm text-primary" href={project.website_url} target="_blank" rel="noreferrer">{project.website_url}</a><p className="mt-md text-body-md text-on-surface-variant">{project.notes}</p></div>)}</div></div></Shell>;
}

function TaskForm({ initial = {}, onSave }) {
  const { profiles, projects } = useData();
  const students = profiles.filter((p) => p.role === "student" && p.status === "approved");
  const [form, setForm] = useState({ priority: "Medium", status: "pending", ...initial });
  return <form className="grid grid-cols-1 gap-md rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, created_at: form.created_at || new Date().toISOString() }); setForm({ priority: "Medium", status: "pending" }); }}><Field label="Task Title" value={form.task_title} onChange={(task_title) => setForm({ ...form, task_title })} /><SelectField label="Task Type" value={form.task_type} onChange={(task_type) => setForm({ ...form, task_type })} options={taskTypes} /><SelectField label="Assign Student" value={form.student_id} onChange={(student_id) => setForm({ ...form, student_id })} options={students.map((s) => s.id)} /><SelectField label="Project" value={form.project_id} onChange={(project_id) => setForm({ ...form, project_id })} options={projects.map((p) => p.id)} /><Field label="Target URL" value={form.target_url} onChange={(target_url) => setForm({ ...form, target_url })} /><Field label="Posting URL" value={form.posting_url} onChange={(posting_url) => setForm({ ...form, posting_url })} required={false} /><Field label="Approx Time" value={form.approx_time} onChange={(approx_time) => setForm({ ...form, approx_time })} /><Field label="Deadline" type="datetime-local" value={form.deadline?.slice(0, 16)} onChange={(deadline) => setForm({ ...form, deadline: new Date(deadline).toISOString() })} /><SelectField label="Priority" value={form.priority} onChange={(priority) => setForm({ ...form, priority })} options={priorities} /><SelectField label="Status" value={form.status} onChange={(status) => setForm({ ...form, status })} options={statusLabels} /><label className="md:col-span-2 flex flex-col gap-xs"><span className="text-label-bold font-label-bold">Instructions</span><textarea className="min-h-24 rounded-lg border border-outline-variant bg-surface px-md py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={form.instructions || ""} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></label><button className="rounded-lg bg-primary px-4 py-3 text-label-bold font-label-bold text-on-primary md:col-span-2">Save Task</button></form>;
}

function TasksPage() {
  const data = useData();
  const notify = useToast();
  return <Shell role="admin" title="Task Management"><div className="space-y-lg"><TaskForm onSave={async (task) => { await data.saveTask(task); notify("Task saved."); }} /><TasksTable admin /></div></Shell>;
}

function TasksTable({ studentId, admin = false }) {
  const data = useData();
  const notify = useToast();
  const rows = data.tasks.filter((task) => !studentId || task.student_id === studentId);
  if (!rows.length) return <EmptyState title="No tasks found" body="Assigned SEO tasks will appear here." />;
  return <div className="overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest shadow-level-1"><div className="overflow-x-auto"><table className="sheet-table"><thead><tr><th>Task</th><th>Student</th><th>Website</th><th>Deadline</th><th>Priority</th><th>Status</th><th className="text-right">Actions</th></tr></thead><tbody>{rows.map((task) => { const project = data.projects.find((p) => p.id === task.project_id); const student = data.profiles.find((p) => p.id === task.student_id); return <tr key={task.id}><td><button className="font-semibold text-primary" onClick={() => navigate(admin ? `/admin/tasks/${task.id}` : `/student/tasks/${task.id}`)}>{task.task_title}</button><div className="text-body-sm text-on-surface-variant">{task.task_type}</div></td><td>{student?.full_name || "-"}</td><td><ProjectTag project={project} /></td><td>{task.deadline ? new Date(task.deadline).toLocaleDateString() : "-"}</td><td>{task.priority}</td><td><StatusBadge status={task.status} /></td><td className="text-right">{admin ? <div className="flex justify-end gap-1"><button onClick={async () => { await data.updateStatus("tasks", task.id, "in progress"); notify("Task status updated."); }}><Icon>play_arrow</Icon></button><button onClick={() => data.deleteTask(task.id)}><Icon className="text-error">delete</Icon></button></div> : <button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white" onClick={() => navigate(`/student/tasks/${task.id}`)}>Open</button>}</td></tr>; })}</tbody></table></div></div>;
}

function TaskDetail({ id, studentMode = false }) {
  const data = useData();
  const task = data.tasks.find((t) => t.id === id);
  const notify = useToast();
  if (!task) return <Shell role={studentMode ? "student" : "admin"} title="Task Detail"><EmptyState title="Task not found" body="The selected task does not exist." /></Shell>;
  const project = data.projects.find((p) => p.id === task.project_id);
  return <Shell role={studentMode ? "student" : "admin"} title="Task Detail"><div className="grid grid-cols-1 gap-lg lg:grid-cols-3"><div className="rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1 lg:col-span-2"><div className="mb-md flex items-start justify-between gap-3"><div><h1 className="text-h1 font-h1">{task.task_title}</h1><p className="mt-1 text-body-md text-on-surface-variant">{task.task_type}</p></div><StatusBadge status={task.status} /></div><div className="grid grid-cols-1 gap-md md:grid-cols-2"><Info label="Project" value={<ProjectTag project={project} />} /><Info label="Target URL" value={task.target_url} /><Info label="Posting URL" value={task.posting_url || "-"} /><Info label="Approx Time" value={task.approx_time} /><Info label="Deadline" value={task.deadline ? new Date(task.deadline).toLocaleString() : "-"} /><Info label="Priority" value={task.priority} /></div><div className="mt-lg"><h3 className="mb-sm text-h3 font-h3">Instructions</h3><p className="whitespace-pre-line rounded-lg bg-surface-container-low p-md text-body-md text-on-surface-variant">{task.instructions}</p></div></div><div>{studentMode ? <SubmitTask task={task} /> : <AdminReviewPanel task={task} />}</div></div></Shell>;
}

function Info({ label, value }) {
  return <div><p className="text-label-bold font-label-bold uppercase text-on-surface-variant">{label}</p><div className="mt-1 break-all text-body-md text-on-surface">{value}</div></div>;
}

function SubmitTask({ task }) {
  const data = useData();
  const { profile } = useAuth();
  const notify = useToast();
  const [form, setForm] = useState({ submission_url: "", notes: "", time_spent: "", file: null });
  const submit = async (e) => {
    e.preventDefault();
    try {
      const screenshot_url = await data.uploadScreenshot(form.file, `${profile.id}/${task.id}-${Date.now()}-${form.file?.name || "screenshot"}`);
      await data.saveSubmission({ task_id: task.id, student_id: profile.id, submission_url: form.submission_url, screenshot_url, notes: form.notes, time_spent: form.time_spent, status: "submitted", submitted_at: new Date().toISOString() });
      await data.updateStatus("tasks", task.id, "submitted");
      notify("Task submitted for review.");
      navigate("/student/tasks");
    } catch (error) {
      notify(error.message, "error");
    }
  };
  return <form className="space-y-md rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1" onSubmit={submit}><h3 className="text-h3 font-h3">Submit Task</h3>{task.status === "pending" && <button className="w-full rounded-lg border border-outline-variant px-4 py-2 text-label-bold font-label-bold text-primary" type="button" onClick={async () => { await data.updateStatus("tasks", task.id, "in progress"); notify("Task started."); }}>Start Task</button>}<Field label="Submission URL" value={form.submission_url} onChange={(submission_url) => setForm({ ...form, submission_url })} /><Field label="Time Spent" value={form.time_spent} onChange={(time_spent) => setForm({ ...form, time_spent })} placeholder="2h 15m" /><label className="flex flex-col gap-xs"><span className="text-label-bold font-label-bold">Screenshot</span><input className="rounded-lg border border-outline-variant bg-surface px-md py-2" type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] })} /></label><label className="flex flex-col gap-xs"><span className="text-label-bold font-label-bold">Notes</span><textarea className="min-h-24 rounded-lg border border-outline-variant bg-surface px-md py-2.5" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label><button className="w-full rounded-lg bg-primary px-4 py-3 text-label-bold font-label-bold text-on-primary">Submit Work</button></form>;
}

function AdminReviewPanel({ task }) {
  const data = useData();
  const notify = useToast();
  const submission = data.submissions.find((s) => s.task_id === task.id);
  const [rating, setRating] = useState({ rating: 5, remarks: "" });
  const review = async (status) => {
    if (submission) await data.updateStatus("submissions", submission.id, status);
    await data.updateStatus("tasks", task.id, status === "approved" ? "done" : status);
    if (status === "approved") await data.saveRating({ task_id: task.id, student_id: task.student_id, rating: Number(rating.rating), remarks: rating.remarks, created_at: new Date().toISOString() });
    notify(`Submission marked ${status}.`);
  };
  return <div className="space-y-md rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1"><h3 className="text-h3 font-h3">Review Submission</h3>{submission ? <><Info label="Submission URL" value={<a className="text-primary" href={submission.submission_url} target="_blank" rel="noreferrer">{submission.submission_url}</a>} /><Info label="Time Spent" value={submission.time_spent} /><p className="rounded-lg bg-surface-container-low p-md text-body-md">{submission.notes}</p><Field label="Rating" type="number" value={rating.rating} onChange={(value) => setRating({ ...rating, rating: value })} /><Field label="Remarks" value={rating.remarks} onChange={(remarks) => setRating({ ...rating, remarks })} required={false} /><div className="grid grid-cols-1 gap-sm"><button className="rounded-lg bg-secondary px-4 py-2 text-white" onClick={() => review("approved")}>Approve Submission</button><button className="rounded-lg bg-[#FFAB00] px-4 py-2 text-on-surface" onClick={() => review("revision required")}>Send for Revision</button><button className="rounded-lg bg-error px-4 py-2 text-white" onClick={() => review("rejected")}>Reject Submission</button></div></> : <EmptyState title="No submission" body="Student submission details will appear here." />}</div>;
}

function SubmissionsPage() {
  const data = useData();
  return <Shell role="admin" title="Submissions Review"><div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-level-1"><div className="overflow-x-auto"><table className="sheet-table"><thead><tr><th>Task</th><th>Student</th><th>Submitted</th><th>Link</th><th>Status</th><th className="text-right">Action</th></tr></thead><tbody>{data.submissions.map((s) => { const task = data.tasks.find((t) => t.id === s.task_id); const student = data.profiles.find((p) => p.id === s.student_id); return <tr key={s.id}><td>{task?.task_title}</td><td>{student?.full_name}</td><td>{new Date(s.submitted_at).toLocaleString()}</td><td><a className="text-primary" href={s.submission_url} target="_blank" rel="noreferrer">Open</a></td><td><StatusBadge status={s.status} /></td><td className="text-right"><button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white" onClick={() => navigate(`/admin/tasks/${task?.id}`)}>Review</button></td></tr>; })}</tbody></table></div>{!data.submissions.length && <div className="p-lg"><EmptyState title="No submissions yet" body="Submitted SEO work will be queued for review here." /></div>}</div></Shell>;
}

function StudentDashboard() {
  const { profile } = useAuth();
  const data = useData();
  const mine = data.tasks.filter((t) => t.student_id === profile.id);
  return <Shell role="student" title="Student Dashboard"><div className="mx-auto max-w-7xl space-y-lg"><div className="grid grid-cols-1 gap-md md:grid-cols-4"><Card title="Total Tasks" value={mine.length} meta="Assigned to you" icon="assignment" /><Card title="Completed" value={mine.filter((t) => ["done", "approved"].includes(t.status)).length} meta="Reviewed work" accent="text-secondary" /><Card title="Pending" value={mine.filter((t) => t.status === "pending").length} meta="Waiting to start" /><Card title="Submitted" value={mine.filter((t) => t.status === "submitted").length} meta="Under review" /></div><TasksTable studentId={profile.id} /></div></Shell>;
}

function StudentTasksPage() {
  const { profile } = useAuth();
  return <Shell role="student" title="My Tasks"><TasksTable studentId={profile.id} /></Shell>;
}

function PerformancePage() {
  const { profile } = useAuth();
  const data = useData();
  const mine = data.tasks.filter((t) => t.student_id === profile.id);
  const ratings = data.ratings.filter((r) => r.student_id === profile.id);
  const avg = ratings.length ? (ratings.reduce((s, r) => s + Number(r.rating), 0) / ratings.length).toFixed(1) : "0.0";
  const late = mine.filter((t) => t.deadline && new Date(t.deadline) < new Date() && !["done", "approved"].includes(t.status)).length;
  return <Shell role="student" title="Performance"><div className="grid grid-cols-1 gap-md md:grid-cols-5"><Card title="Total Tasks" value={mine.length} meta="Assigned" /><Card title="Completed" value={mine.filter((t) => ["done", "approved"].includes(t.status)).length} meta="Finished" accent="text-secondary" /><Card title="Pending" value={mine.filter((t) => t.status === "pending").length} meta="Not started" /><Card title="Late Tasks" value={late} meta="Past deadline" accent="text-error" /><Card title="Average Rating" value={avg} meta="Admin score" icon="star" /></div><div className="mt-lg rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1"><h3 className="mb-md text-h3 font-h3">Ratings & Remarks</h3>{ratings.length ? ratings.map((r) => { const task = data.tasks.find((t) => t.id === r.task_id); return <div key={r.id} className="border-t border-outline-variant/30 py-md"><div className="font-semibold">{task?.task_title}</div><div className="text-[#FFAB00]">Rating: {r.rating}/5</div><p className="text-body-md text-on-surface-variant">{r.remarks}</p></div>; }) : <EmptyState title="No ratings yet" body="Approved task ratings and admin remarks will appear here." />}</div></Shell>;
}

function ReportsPage() {
  const data = useData();
  const notify = useToast();
  const [filters, setFilters] = useState({ student: "", project: "", status: "", task_type: "", from: "", to: "" });
  const rows = data.tasks.filter((task) => (!filters.student || task.student_id === filters.student) && (!filters.project || task.project_id === filters.project) && (!filters.status || task.status === filters.status) && (!filters.task_type || task.task_type === filters.task_type) && (!filters.from || new Date(task.created_at) >= new Date(filters.from)) && (!filters.to || new Date(task.created_at) <= new Date(filters.to))).map((task) => {
    const student = data.profiles.find((p) => p.id === task.student_id);
    const project = data.projects.find((p) => p.id === task.project_id);
    const submission = data.submissions.find((s) => s.task_id === task.id);
    const rating = data.ratings.find((r) => r.task_id === task.id);
    return { "Member Name": student?.full_name || "", Date: task.created_at ? new Date(task.created_at).toLocaleDateString() : "", Task: task.task_title, Website: project?.project_name || "", Link: submission?.submission_url || task.target_url || "", "Approx Time": task.approx_time || "", Status: task.status || "", Rating: rating?.rating || "", Remarks: rating?.remarks || "" };
  });
  const exportPdf = () => { const doc = new jsPDF({ orientation: "landscape" }); doc.text("SEO TaskFlow Report", 14, 14); autoTable(doc, { head: [Object.keys(rows[0] || { "Member Name": "", Date: "", Task: "", Website: "", Link: "", "Approx Time": "", Status: "", Rating: "", Remarks: "" })], body: rows.map(Object.values), startY: 20, styles: { fontSize: 8 } }); doc.save("seo-task-report.pdf"); notify("PDF report generated."); };
  const exportExcel = () => {
    const headers = Object.keys(rows[0] || { "Member Name": "", Date: "", Task: "", Website: "", Link: "", "Approx Time": "", Status: "", Rating: "", Remarks: "" });
    const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (match) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[match]);
    const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headers.map((header) => `<th style="background:#e7eeff;color:#091c35;border:1px solid #c3c6d6;padding:8px;font-weight:bold;">${escape(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row, index) => `<tr>${headers.map((header) => `<td style="border:1px solid #dfe3ec;padding:8px;background:${index % 2 ? "#f9f9ff" : "#ffffff"};">${escape(row[header])}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "seo-task-report.xls";
    link.click();
    URL.revokeObjectURL(url);
    notify("Excel report generated.");
  };
  const shareWhatsapp = () => { const summary = `SEO TaskFlow Report%0ATotal tasks: ${rows.length}%0ACompleted: ${rows.filter((r) => ["done", "approved"].includes(String(r.Status).toLowerCase())).length}`; window.open(`https://wa.me/?text=${summary}`, "_blank"); };
  return <Shell role="admin" title="Reports"><div className="space-y-lg"><div className="grid grid-cols-1 gap-md rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1 md:grid-cols-3 xl:grid-cols-6"><SelectField label="Student" value={filters.student} onChange={(student) => setFilters({ ...filters, student })} options={data.profiles.filter((p) => p.role === "student").map((p) => p.id)} /><SelectField label="Project" value={filters.project} onChange={(project) => setFilters({ ...filters, project })} options={data.projects.map((p) => p.id)} /><SelectField label="Status" value={filters.status} onChange={(status) => setFilters({ ...filters, status })} options={statusLabels} /><SelectField label="Task Type" value={filters.task_type} onChange={(task_type) => setFilters({ ...filters, task_type })} options={taskTypes} /><Field label="From" type="date" value={filters.from} onChange={(from) => setFilters({ ...filters, from })} required={false} /><Field label="To" type="date" value={filters.to} onChange={(to) => setFilters({ ...filters, to })} required={false} /></div><div className="flex flex-wrap gap-sm"><button className="rounded-lg bg-primary px-4 py-2 text-white" onClick={exportPdf}>Export PDF</button><button className="rounded-lg bg-secondary px-4 py-2 text-white" onClick={exportExcel}>Export Excel</button><button className="rounded-lg border border-outline-variant px-4 py-2" onClick={shareWhatsapp}>Share WhatsApp</button></div><div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-level-1"><div className="overflow-x-auto"><table className="sheet-table"><thead><tr>{Object.keys(rows[0] || { "Member Name": "", Date: "", Task: "", Website: "", Link: "", "Approx Time": "", Status: "", Rating: "", Remarks: "" }).map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{Object.entries(row).map(([k, v]) => <td key={k}>{k === "Status" ? <StatusBadge status={v} /> : v}</td>)}</tr>)}</tbody></table></div>{!rows.length && <div className="p-lg"><EmptyState title="No report rows" body="Adjust filters or create tasks to generate reports." /></div>}</div></div></Shell>;
}

function SettingsPage({ role }) {
  const { profile } = useAuth();
  return <Shell role={role} title="Settings"><div className="rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1"><h1 className="text-h2 font-h2">Account Settings</h1><p className="mt-2 text-on-surface-variant">Signed in as {profile?.full_name || profile?.email}. Manage Supabase Auth settings from the Supabase dashboard.</p><div className="mt-lg rounded-lg bg-surface-container-low p-md text-body-sm text-on-surface-variant">Environment: {isSupabaseConfigured ? "Supabase connected" : "Demo mode. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env."}</div></div></Shell>;
}

function AppRouter() {
  const path = usePath();
  if (path === "/") return <PublicLanding />;
  if (path === "/admin/login") return <LoginPage role="admin" />;
  if (path === "/student/login") return <LoginPage role="student" />;
  if (path === "/student/signup") return <SignupPage />;
  if (path === "/admin/dashboard") return <Guard role="admin"><AdminDashboard /></Guard>;
  if (path === "/admin/students") return <Guard role="admin"><StudentsPage /></Guard>;
  if (path === "/admin/tasks") return <Guard role="admin"><TasksPage /></Guard>;
  if (path.startsWith("/admin/tasks/")) return <Guard role="admin"><TaskDetail id={path.split("/").pop()} /></Guard>;
  if (path === "/admin/submissions") return <Guard role="admin"><SubmissionsPage /></Guard>;
  if (path === "/admin/projects") return <Guard role="admin"><ProjectsPage /></Guard>;
  if (path === "/admin/reports") return <Guard role="admin"><ReportsPage /></Guard>;
  if (path === "/admin/settings") return <Guard role="admin"><SettingsPage role="admin" /></Guard>;
  if (path === "/student/dashboard") return <Guard role="student"><StudentDashboard /></Guard>;
  if (path === "/student/tasks") return <Guard role="student"><StudentTasksPage /></Guard>;
  if (path.startsWith("/student/tasks/")) return <Guard role="student"><TaskDetail id={path.split("/").pop()} studentMode /></Guard>;
  if (path === "/student/performance") return <Guard role="student"><PerformancePage /></Guard>;
  if (path === "/student/settings") return <Guard role="student"><SettingsPage role="student" /></Guard>;
  return <PublicLanding />;
}

function App() {
  return <ToastProvider><AuthProvider><DataProvider><AppRouter /></DataProvider></AuthProvider></ToastProvider>;
}

createRoot(document.getElementById("root")).render(<App />);
