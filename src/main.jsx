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
  { id: "demo-manager-1", full_name: "Ayesha Manager", email: "manager@example.com", phone: "+1 555 0101", role: "manager", status: "approved", skill_level: "expert", created_at: new Date().toISOString() },
  { id: "demo-employee-1", full_name: "Sarah Jenkins", email: "s.jenkins@example.com", phone: "+1 555 123 4567", role: "employee", status: "approved", skill_level: "intermediate", created_at: new Date().toISOString() },
  { id: "demo-employee-2", full_name: "Marcus Chen", email: "m.chen@example.com", phone: "+1 555 987 6543", role: "employee", status: "pending", skill_level: "beginner", created_at: new Date().toISOString() },
  { id: "demo-employee-3", full_name: "Elena Rodriguez", email: "elena.r@example.com", phone: "+1 555 444 3322", role: "employee", status: "approved", skill_level: "expert", created_at: new Date().toISOString() }
];
const demoProjects = [
  { id: "project-1", project_name: "SEO TaskFlow", website_url: "https://seotaskflow.com", category: "SaaS", notes: "Internal product SEO", created_at: new Date().toISOString() },
  { id: "project-2", project_name: "Client Growth Hub", website_url: "https://clientgrowth.example", category: "Agency", notes: "Monthly backlink campaign", created_at: new Date().toISOString() }
];
const demoTasks = [
  { id: "task-1", student_id: "demo-employee-1", manager_id: "demo-manager-1", assigned_by: "demo-admin", project_id: "project-1", task_title: "On-Page SEO Audit", task_type: "On-Page SEO", target_url: "https://seotaskflow.com/features", posting_url: "", instructions: "Audit titles, headings, schema and internal links.", approx_time: "2h", deadline: new Date(Date.now() + 86400000 * 3).toISOString(), priority: "High", status: "submitted", payment_amount: 2500, payment_status: "pending", progress_percent: 80, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "task-2", student_id: "demo-employee-1", manager_id: "demo-manager-1", assigned_by: "demo-manager-1", project_id: "project-2", task_title: "Backlink Outreach", task_type: "Backlink", target_url: "https://clientgrowth.example/blog", posting_url: "", instructions: "Find relevant sites and submit outreach proof.", approx_time: "3h", deadline: new Date(Date.now() + 86400000 * 7).toISOString(), priority: "Medium", status: "in progress", payment_amount: 1800, payment_status: "pending", progress_percent: 45, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "task-3", student_id: "demo-employee-3", manager_id: "", assigned_by: "demo-admin", project_id: "project-1", task_title: "Keyword Research Q3", task_type: "Keyword Research", target_url: "https://seotaskflow.com", posting_url: "", instructions: "Build keyword clusters for product pages.", approx_time: "4h", deadline: new Date(Date.now() - 86400000).toISOString(), priority: "Urgent", status: "done", payment_amount: 3200, payment_status: "released", progress_percent: 100, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];
const demoSubmissions = [
  { id: "sub-1", task_id: "task-1", student_id: "demo-employee-1", submission_url: "https://docs.example/audit", screenshot_url: "", notes: "Submitted audit with action list.", time_spent: "1h 45m", status: "submitted", submitted_at: new Date().toISOString() }
];
const demoRatings = [
  { id: "rating-1", task_id: "task-3", student_id: "demo-employee-3", rating: 5, remarks: "Excellent keyword grouping and intent notes.", created_at: new Date().toISOString() }
];
const demoProgressUpdates = [
  { id: "progress-1", task_id: "task-2", employee_id: "demo-employee-1", progress_percent: 45, notes: "Completed outreach sheet and started submissions.", update_date: new Date().toISOString().slice(0, 10), created_at: new Date().toISOString() }
];
const demoPayments = [
  { id: "payment-1", task_id: "task-3", employee_id: "demo-employee-3", released_by: "demo-admin", amount: 3200, method: "JazzCash", transaction_number: "JC-928811", screenshot_url: "", status: "released", released_at: new Date().toISOString() }
];
const demoAttendance = [
  { id: "attendance-1", employee_id: "demo-employee-1", attendance_date: new Date().toISOString().slice(0, 10), check_in_at: `${new Date().toISOString().slice(0, 10)}T09:12:00`, check_out_at: "", status: "late", notes: "Client call before check-in.", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "attendance-2", employee_id: "demo-employee-3", attendance_date: new Date().toISOString().slice(0, 10), check_in_at: `${new Date().toISOString().slice(0, 10)}T08:55:00`, check_out_at: `${new Date().toISOString().slice(0, 10)}T17:20:00`, status: "present", notes: "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "attendance-3", employee_id: "demo-employee-1", attendance_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), check_in_at: `${new Date(Date.now() - 86400000).toISOString().slice(0, 10)}T09:00:00`, check_out_at: `${new Date(Date.now() - 86400000).toISOString().slice(0, 10)}T18:05:00`, status: "present", notes: "", created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString() }
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

function isApprovedAccount(profile) {
  return profile?.status === "approved" || profile?.status === "active";
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
  const authLoadId = React.useRef(0);

  const loadProfile = async (user) => {
    if (!user || !isSupabaseConfigured) return null;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) {
      console.error("Profile lookup failed", error);
      setProfile((current) => current || null);
      throw new Error(`Profile lookup failed: ${error.message}`);
    }
    setProfile(data || null);
    return data;
  };

  const withTimeout = (promise, message = "Login request timed out. Please try again.") =>
    Promise.race([
      promise,
      new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error(message)), 15000);
      })
    ]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setProfile(demoProfiles[0]);
      setLoading(false);
      return;
    }
    const initialLoadId = ++authLoadId.current;
    supabase.auth.getSession().then(async ({ data }) => {
      if (initialLoadId !== authLoadId.current) return;
      setSession(data.session);
      if (data.session?.user) {
        try {
          await loadProfile(data.session.user);
        } catch (error) {
          console.error(error);
        }
      } else {
        setProfile((current) => current || null);
      }
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      authLoadId.current += 1;
      setSession(nextSession);
      if (nextSession?.user) {
        window.setTimeout(() => {
          loadProfile(nextSession.user).catch((error) => console.error(error));
        }, 0);
      } else {
        setProfile(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email, password, role) => {
    authLoadId.current += 1;
    if (!isSupabaseConfigured) {
      const found = demoProfiles.find((p) => p.email.toLowerCase() === email.toLowerCase() && p.role === role) || (role === "admin" ? demoProfiles[0] : demoProfiles[1]);
      if (["employee", "manager"].includes(found.role) && !isApprovedAccount(found)) throw new Error("Your account is still pending approval.");
      setProfile(found);
      return found;
    }
    const { data, error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }));
    if (error) throw error;
    const nextProfile = await withTimeout(loadProfile(data.user), "Login succeeded, but profile loading timed out. Please check Supabase policies.");
    if (!nextProfile || nextProfile.role !== role) {
      await supabase.auth.signOut();
      throw new Error(!nextProfile ? "Login succeeded, but no profile row exists for this user. Create/approve the profile in Supabase." : `This account is registered as ${nextProfile.role}, not ${role}.`);
    }
    if (["employee", "manager"].includes(role) && !isApprovedAccount(nextProfile)) {
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
  const { profile } = useAuth();
  const [profiles, setProfiles] = useState(demoProfiles);
  const [projects, setProjects] = useState(demoProjects);
  const [tasks, setTasks] = useState(demoTasks);
  const [submissions, setSubmissions] = useState(demoSubmissions);
  const [ratings, setRatings] = useState(demoRatings);
  const [progressUpdates, setProgressUpdates] = useState(demoProgressUpdates);
  const [payments, setPayments] = useState(demoPayments);
  const [attendanceRecords, setAttendanceRecords] = useState(demoAttendance);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!isSupabaseConfigured || !profile) return;
    setLoading(true);
    const [p, pr, t, s, r] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("submissions").select("*").order("submitted_at", { ascending: false }),
      supabase.from("ratings").select("*").order("created_at", { ascending: false })
    ]);
    const [u, pay, att] = await Promise.all([
      supabase.from("task_progress_updates").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").order("released_at", { ascending: false }),
      supabase.from("attendance_records").select("*").order("attendance_date", { ascending: false })
    ]);
    setLoading(false);
    if (p.error || pr.error || t.error || s.error || r.error) {
      console.error("Core Supabase data load failed", { profiles: p.error, projects: pr.error, tasks: t.error, submissions: s.error, ratings: r.error });
      notify("Could not load Supabase data. Check schema and RLS policies.", "error");
      return;
    }
    const optionalErrors = [
      ["task_progress_updates", u.error],
      ["payments", pay.error],
      ["attendance_records", att.error]
    ].filter(([, error]) => error);
    if (optionalErrors.length) {
      console.warn("Optional Supabase tables could not load", Object.fromEntries(optionalErrors));
      notify(`Some modules need database migration: ${optionalErrors.map(([table]) => table).join(", ")}`, "error");
    }
    setProfiles(p.data || []);
    setProjects(pr.data || []);
    setTasks(t.data || []);
    setSubmissions(s.data || []);
    setRatings(r.data || []);
    setProgressUpdates(u.error ? [] : (u.data || []));
    setPayments(pay.error ? [] : (pay.data || []));
    setAttendanceRecords(att.error ? [] : (att.data || []));
  };

  useEffect(() => {
    if (isSupabaseConfigured && !profile) {
      setProfiles([]);
      setProjects([]);
      setTasks([]);
      setSubmissions([]);
      setRatings([]);
      setProgressUpdates([]);
      setPayments([]);
      setAttendanceRecords([]);
      return;
    }
    refresh();
  }, [profile?.id, profile?.role, profile?.status]);

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

  const updateProfile = async (id, patch) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("profiles").update(patch).eq("id", id).select().single();
      if (error) throw error;
      setProfiles((items) => items.map((item) => (item.id === id ? data : item)));
      return data;
    }
    const nextProfile = { ...(profiles.find((item) => item.id === id) || {}), ...patch };
    setProfiles((items) => items.map((item) => (item.id === id ? nextProfile : item)));
    return nextProfile;
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

  const uploadPaymentProof = async (file, path) => {
    if (!file) return "";
    if (file.size > 102400) throw new Error("Payment proof image must be 100KB or less.");
    if (!isSupabaseConfigured) return "";
    const { data, error } = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const value = {
    profiles,
    projects,
    tasks,
    submissions,
    ratings,
    progressUpdates,
    payments,
    attendanceRecords,
    loading,
    refresh,
    saveProject: (row) => upsertRow("projects", row, setProjects),
    saveProfile: (row) => upsertRow("profiles", row, setProfiles),
    updateProfile,
    saveTask: (row) => upsertRow("tasks", { ...row, updated_at: new Date().toISOString() }, setTasks),
    saveSubmission: (row) => upsertRow("submissions", row, setSubmissions),
    saveRating: (row) => upsertRow("ratings", row, setRatings),
    saveProgress: (row) => upsertRow("task_progress_updates", row, setProgressUpdates),
    savePayment: (row) => upsertRow("payments", row, setPayments),
    saveAttendance: (row) => upsertRow("attendance_records", { ...row, updated_at: new Date().toISOString() }, setAttendanceRecords),
    deleteProject: (id) => deleteRow("projects", id, setProjects),
    deleteTask: (id) => deleteRow("tasks", id, setTasks),
    deleteProfile: (id) => deleteRow("profiles", id, setProfiles),
    updateStatus,
    uploadScreenshot,
    uploadPaymentProof
  };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function useData() {
  return useContext(DataContext);
}

function getNotificationSummary(role, profile, data) {
  if (!data || !profile) return { count: 0, label: "No notifications", path: "/" };
  if (role === "admin") {
    const employeeApprovals = data.profiles.filter((person) => ["employee", "manager"].includes(person.role) && person.status === "pending").length;
    const pendingReviews = data.submissions.filter((submission) => String(submission.status).toLowerCase() === "submitted").length
      + data.tasks.filter((task) => task.final_forwarded_to_admin && String(task.status).toLowerCase() === "submitted").length;
    const paymentsPending = data.tasks.filter((task) => ["done", "approved"].includes(String(task.status).toLowerCase()) && task.payment_status !== "released").length;
    const parts = [];
    if (pendingReviews) parts.push(`${pendingReviews} pending review${pendingReviews === 1 ? "" : "s"}`);
    if (paymentsPending) parts.push(`${paymentsPending} payment${paymentsPending === 1 ? "" : "s"} pending`);
    if (employeeApprovals) parts.push(`${employeeApprovals} employee approval${employeeApprovals === 1 ? "" : "s"}`);
    return { count: pendingReviews + paymentsPending + employeeApprovals, label: parts.length ? parts.join(", ") : "No pending admin actions", path: "/admin/inbox" };
  }
  if (role === "manager") {
    const teamTasks = data.tasks.filter((task) => task.manager_id === profile.id || task.assigned_by === profile.id);
    const submitted = teamTasks.filter((task) => String(task.status).toLowerCase() === "submitted" && !task.final_forwarded_to_admin).length;
    const revisions = teamTasks.filter((task) => String(task.status).toLowerCase() === "revision required").length;
    const parts = [];
    if (submitted) parts.push(`${submitted} team submission${submitted === 1 ? "" : "s"}`);
    if (revisions) parts.push(`${revisions} revision item${revisions === 1 ? "" : "s"}`);
    return { count: submitted + revisions, label: parts.length ? parts.join(", ") : "No pending manager actions", path: "/manager/submissions" };
  }
  const myTasks = data.tasks.filter((task) => task.student_id === profile.id);
  const revisions = myTasks.filter((task) => String(task.status).toLowerCase() === "revision required").length;
  const pending = myTasks.filter((task) => ["pending", "in progress"].includes(String(task.status).toLowerCase())).length;
  const parts = [];
  if (revisions) parts.push(`${revisions} revision required`);
  if (pending) parts.push(`${pending} active task${pending === 1 ? "" : "s"}`);
  return { count: revisions + pending, label: parts.length ? parts.join(", ") : "No pending employee actions", path: "/employee/tasks" };
}

function getLatestTaskProgress(task, progressUpdates) {
  const updates = progressUpdates
    .filter((update) => update.task_id === task.id)
    .sort((a, b) => new Date(b.created_at || b.update_date) - new Date(a.created_at || a.update_date));
  return Number(updates[0]?.progress_percent ?? task.progress_percent ?? 0);
}

function toDateKey(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function toTimeInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toTimeString().slice(0, 5);
}

function buildLocalDateTime(dateValue, timeValue) {
  if (!dateValue) return "";
  return new Date(`${dateValue}T${timeValue || "23:59"}:00`).toISOString();
}

function minutesBetween(start, end) {
  if (!start || !end) return 0;
  const diff = new Date(end) - new Date(start);
  return Number.isFinite(diff) && diff > 0 ? Math.round(diff / 60000) : 0;
}

function formatWorkMinutes(minutes) {
  if (!minutes) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${String(mins).padStart(2, "0")}m`;
}

function attendanceStatusFor(checkInAt, lateAfter = "09:15") {
  if (!checkInAt) return "absent";
  const checkIn = new Date(checkInAt);
  const [hour, minute] = lateAfter.split(":").map(Number);
  const limit = new Date(checkIn);
  limit.setHours(hour || 9, minute || 15, 0, 0);
  return checkIn > limit ? "late" : "present";
}

function getAttendanceRows(data, { role, profile, filters = {} }) {
  const employees = data.profiles.filter((person) => {
    if (person.role !== "employee") return false;
    if (role === "manager") {
      return data.tasks.some((task) => (task.manager_id === profile.id || task.assigned_by === profile.id) && task.student_id === person.id);
    }
    if (role === "employee") return person.id === profile.id;
    return true;
  });
  const from = filters.from || "";
  const to = filters.to || "";
  return data.attendanceRecords
    .filter((record) => employees.some((employee) => employee.id === record.employee_id))
    .filter((record) => !filters.employee || record.employee_id === filters.employee)
    .filter((record) => !filters.status || record.status === filters.status)
    .filter((record) => !from || record.attendance_date >= from)
    .filter((record) => !to || record.attendance_date <= to)
    .sort((a, b) => new Date(b.attendance_date || b.created_at) - new Date(a.attendance_date || a.created_at))
    .map((record) => ({
      ...record,
      employee: employees.find((employee) => employee.id === record.employee_id),
      workMinutes: Number(record.work_minutes ?? minutesBetween(record.check_in_at, record.check_out_at))
    }));
}

function buildManagerForwardSummary(task, data, remarks) {
  const employee = data.profiles.find((person) => person.id === task.student_id);
  const submission = data.submissions.find((item) => item.task_id === task.id);
  return [
    `Employee: ${employee?.full_name || "-"}`,
    `Task: ${task.task_title || "-"}`,
    "Progress: 100%",
    `Manager Remarks: ${remarks || task.manager_remarks || "-"}`,
    `Submission Link: ${submission?.submission_url || task.posting_url || task.target_url || "-"}`,
    `Payment Amount: Rs. ${Number(task.payment_amount || 0)}`
  ].join("\n");
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
    active: "bg-[#36B37E]/10 text-[#006c47] border-[#36B37E]/20",
    inactive: "bg-[#7A869A]/10 text-[#5E6C84] border-[#7A869A]/20",
    present: "bg-[#36B37E]/10 text-[#006c47] border-[#36B37E]/20",
    late: "bg-[#FFAB00]/10 text-[#974F0C] border-[#FFAB00]/20",
    absent: "bg-[#DE350B]/10 text-[#DE350B] border-[#DE350B]/20"
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
  const { tasks, submissions } = useData();
  const doneCount = tasks.filter((task) => ["done", "approved"].includes(String(task.status).toLowerCase())).length;
  const reviewCount = submissions.filter((submission) => ["submitted", "revision required"].includes(String(submission.status).toLowerCase())).length;
  const pendingCount = tasks.filter((task) => ["pending", "in progress"].includes(String(task.status).toLowerCase())).length;

  return (
    <main className="bg-background text-on-background">
      <section className="relative overflow-hidden bg-surface-container-lowest px-lg pb-2xl pt-3xl lg:pb-3xl lg:pt-32">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-surface-container-low to-surface-bright opacity-50" />
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-2xl lg:grid-cols-2">
          <div className="flex flex-col gap-lg">
            <div className="w-max rounded-xl border border-primary-fixed bg-primary-fixed/40 px-4 py-2 shadow-level-1">
              <span className="brand-pulse text-h2 font-black tracking-tight text-primary">SwiftRankSolution</span>
            </div>
            <h1 className="font-h1 text-h1 text-on-background lg:text-5xl lg:leading-tight">Manage SEO Tasks, Track Progress, and Improve Team Performance</h1>
            <p className="max-w-xl text-body-lg font-body-lg text-on-surface-variant">A systematic platform for assigning SEO tasks, tracking submissions, and generating transparent reports for agencies and high-performance teams.</p>
            <div className="mt-sm flex flex-col gap-md sm:flex-row">
              <LinkButton to="/admin/login" className="flex items-center justify-center rounded-lg bg-primary px-lg py-3 text-body-md font-body-md text-on-primary shadow-sm transition-shadow hover:bg-primary/90 hover:shadow-md">Admin Login</LinkButton>
              <LinkButton to="/employee/login" className="flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest px-lg py-3 text-body-md font-body-md text-on-surface transition-colors hover:bg-surface-container-low">Employee Login</LinkButton>
              <LinkButton to="/employee/signup" className="flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low px-lg py-3 text-body-md font-body-md text-on-surface transition-colors hover:bg-surface-container">Join as Employee</LinkButton>
            </div>
          </div>
          <HeroDashboardPreview stats={{ done: doneCount, review: reviewCount, pending: pendingCount }} />
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
          <p className="text-body-sm text-inverse-on-surface/50">© 2026 SEO TaskFlow. All rights reserved. Developed by <a className="font-semibold text-inverse-primary underline-offset-4 hover:underline" href="https://muhammadabdullahwali.vercel.app/" target="_blank" rel="noreferrer">Muhammad Abdullah</a></p>
        </div>
      </footer>
    </main>
  );
}

function HeroDashboardPreview({ stats }) {
  return (
    <div className="hero-preview relative min-h-[420px] overflow-hidden rounded-xl border border-outline-variant/30 bg-[#050b0d] p-xl shadow-level-2 lg:min-h-[520px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(0,82,204,0.16),transparent_28%),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:auto,18px_18px]" />
      <div className="relative z-10 mx-auto max-w-[620px] pt-xl text-[#dfe8ff]">
        <div className="mb-xl flex items-center justify-between">
          <div>
            <p className="text-h3 font-h3 text-white">SEO Work</p>
            <p className="mt-1 text-body-sm text-white/45">Live task velocity overview</p>
          </div>
          <div className="flex items-center gap-sm text-white/50">
            <Icon className="text-[20px]">notifications</Icon>
            <Icon className="text-[20px]">more_horiz</Icon>
          </div>
        </div>
        <div className="space-y-md">
          {[
            ["Keyword mapping", "Submitted", "92%"],
            ["Technical audit", "In progress", "68%"],
            ["Backlink outreach", "Pending", "35%"]
          ].map(([title, status, progress]) => (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-md" key={title}>
              <div className="mb-sm flex items-center justify-between gap-md">
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="text-body-sm text-white/45">{status}</p>
                </div>
                <span className="text-body-sm font-semibold text-[#65dca4]">{progress}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#1d9bf0]" style={{ width: progress }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2xl grid grid-cols-3 gap-md">
          {[
            [stats.done, "Done"],
            [stats.review, "In review"],
            [stats.pending, "Pending"]
          ].map(([value, label]) => (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-md text-center" key={label}>
              <p className="text-h3 font-h3 text-white">{value}</p>
              <p className="mt-1 text-body-sm text-white/45">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginPage({ role }) {
  const { signIn, profile, loading: authLoading } = useAuth();
  const notify = useToast();
  const roleLabel = role === "admin" ? "Admin" : role === "manager" ? "Manager" : "Employee";
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const profile = await signIn(form.email, form.password, role);
      notify(`Logged in as ${profile.full_name || profile.email}`);
      navigate(role === "admin" ? "/admin/dashboard" : role === "manager" ? "/manager/dashboard" : "/employee/dashboard");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  };
  const isAdmin = role === "admin";
  useEffect(() => {
    if (!authLoading && profile?.role === role && (role === "admin" || profile.status === "approved")) {
      navigate(role === "admin" ? "/admin/dashboard" : role === "manager" ? "/manager/dashboard" : "/employee/dashboard");
    }
  }, [authLoading, profile, role]);

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
          <p className="mt-xs text-body-md text-on-surface-variant">{isAdmin ? "Enterprise Admin Portal" : `Sign in to manage your ${roleLabel.toLowerCase()} assignments and submissions.`}</p>
        </div>
        <div className={isAdmin ? "w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-xl shadow-level-1" : ""}>
          <div className="mb-lg"><h2 className="text-h3 font-h3 text-on-surface">{isAdmin ? "Sign In" : `${roleLabel} Portal`}</h2><p className="mt-xs text-body-sm text-on-surface-variant">Enter your credentials to continue.</p></div>
          <form className="flex flex-col gap-md" onSubmit={submit}>
            <Field label="Email Address" icon="mail" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} placeholder={`${role}@example.com`} />
            <Field label="Password" icon="lock" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} placeholder="Enter your password" />
            <button className="mt-sm flex w-full items-center justify-center gap-sm rounded-lg bg-primary px-lg py-3 text-label-bold font-label-bold text-on-primary shadow-sm transition-all hover:bg-primary-fixed-variant disabled:opacity-60" disabled={loading} type="submit">
              {loading ? "Signing in..." : `Login as ${roleLabel}`} <Icon className="text-lg">arrow_forward</Icon>
            </button>
          </form>
          <div className="mt-xl border-t border-outline-variant/30 pt-lg text-center">
            {isAdmin ? <p className="text-body-sm text-on-surface-variant">Not an administrator? <LinkButton to="/employee/login" className="ml-xs text-label-bold font-label-bold text-primary">Login as Employee</LinkButton></p> : <div className="flex flex-col gap-md"><LinkButton to="/employee/signup" className="text-body-sm text-on-surface-variant hover:text-primary">Join as Employee (Request Access)</LinkButton><LinkButton to="/manager/login" className="text-body-sm text-on-surface-variant hover:text-primary">Login as Manager</LinkButton><LinkButton to="/admin/login" className="text-body-sm text-on-surface-variant hover:text-secondary">Login as Admin</LinkButton></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, icon, required = true }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label-bold font-label-bold text-on-surface">{label}</span>
      <span className="relative flex items-center">
        {icon && <Icon className="absolute left-md text-[18px] text-outline">{icon}</Icon>}
        <input required={required} type={isPassword && showPassword ? "text" : type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${icon ? "pl-2xl" : "pl-md"} ${isPassword ? "pr-12" : "pr-md"} w-full rounded-lg border border-outline-variant bg-surface px-md py-[10px] text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`} />
        {isPassword && (
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-md rounded-md p-1 text-outline transition-colors hover:bg-surface-container-low hover:text-primary"
            onClick={(event) => {
              event.preventDefault();
              setShowPassword((current) => !current);
            }}
            type="button"
          >
            <Icon className="text-[20px]">{showPassword ? "visibility_off" : "visibility"}</Icon>
          </button>
        )}
      </span>
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  const getValue = (option) => (typeof option === "object" ? option.value : option);
  const getLabel = (option) => (typeof option === "object" ? option.label : option);
  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label-bold font-label-bold text-on-surface">{label}</span>
      <select className="w-full rounded-lg border border-outline-variant bg-surface px-md py-[10px] text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={value || ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select</option>
        {options.map((option) => <option key={getValue(option)} value={getValue(option)}>{getLabel(option)}</option>)}
      </select>
    </label>
  );
}

function RichTextEditor({ label, value, onChange }) {
  const editorRef = React.useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const runCommand = (command, commandValue = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML || "");
  };

  const addLink = () => {
    const url = window.prompt("Paste URL");
    if (!url) return;
    const safeUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    runCommand("createLink", safeUrl);
  };

  return (
    <div className="flex flex-col gap-xs">
      <span className="text-label-bold font-label-bold text-on-surface">{label}</span>
      <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface">
        <div className="flex flex-wrap gap-xs border-b border-outline-variant/50 bg-surface-container-low p-sm">
          {[
            ["format_bold", "bold", "Bold"],
            ["format_italic", "italic", "Italic"],
            ["format_underlined", "underline", "Underline"],
            ["format_list_bulleted", "insertUnorderedList", "Bullet list"],
            ["format_list_numbered", "insertOrderedList", "Numbered list"]
          ].map(([icon, command, title]) => (
            <button className="rounded-md p-2 text-on-surface-variant hover:bg-surface-container hover:text-primary" key={command} onClick={() => runCommand(command)} title={title} type="button">
              <Icon className="text-[20px]">{icon}</Icon>
            </button>
          ))}
          <button className="rounded-md p-2 text-on-surface-variant hover:bg-surface-container hover:text-primary" onClick={addLink} title="Insert link" type="button">
            <Icon className="text-[20px]">link</Icon>
          </button>
          <button className="rounded-md p-2 text-on-surface-variant hover:bg-surface-container hover:text-primary" onClick={() => runCommand("removeFormat")} title="Clear formatting" type="button">
            <Icon className="text-[20px]">format_clear</Icon>
          </button>
        </div>
        <div
          className="rich-editor min-h-56 px-md py-3 text-body-md text-on-surface focus:outline-none"
          contentEditable
          onBlur={(event) => onChange(event.currentTarget.innerHTML)}
          onInput={(event) => onChange(event.currentTarget.innerHTML)}
          ref={editorRef}
          suppressContentEditableWarning
        />
      </div>
      <p className="text-body-sm text-on-surface-variant">Add unlimited instructions, URLs, bullets, and formatted notes.</p>
    </div>
  );
}

function PersonSearchField({ people, value, onChange, label = "Assign Active Employee", placeholder = "Type employee name or email..." }) {
  const selected = people.find((student) => student.id === value);
  const [query, setQuery] = useState(selected?.full_name || "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const nextSelected = people.find((student) => student.id === value);
    setQuery(nextSelected?.full_name || "");
  }, [value, people]);

  const filteredStudents = people
    .filter((student) => {
      const search = `${student.full_name || ""} ${student.email || ""}`.toLowerCase();
      return search.includes(query.toLowerCase());
    })
    .slice(0, 8);

  return (
    <label className="relative flex flex-col gap-xs">
      <span className="text-label-bold font-label-bold text-on-surface">{label}</span>
      <span className="relative flex items-center">
        <Icon className="absolute left-md text-[18px] text-outline">person_search</Icon>
        <input
          className="w-full rounded-lg border border-outline-variant bg-surface px-md py-[10px] pl-2xl text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (!event.target.value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          required
          value={query}
        />
      </span>
      {open && (
        <div className="absolute left-0 right-0 top-[68px] z-50 max-h-64 overflow-y-auto rounded-lg border border-outline-variant bg-white shadow-level-2">
          {filteredStudents.length ? (
            filteredStudents.map((student) => (
              <button
                className="flex w-full items-center justify-between gap-3 px-md py-3 text-left hover:bg-surface-container-low"
                key={student.id}
                onMouseDown={(event) => {
                  event.preventDefault();
                  setQuery(student.full_name || student.email);
                  onChange(student.id);
                  setOpen(false);
                }}
                type="button"
              >
                <span>
                  <span className="block font-semibold text-on-surface">{student.full_name || "Unnamed Student"}</span>
                  <span className="block text-body-sm text-on-surface-variant">{student.email}</span>
                </span>
                <StatusBadge status="active" />
              </button>
            ))
          ) : (
            <div className="px-md py-3 text-body-sm text-on-surface-variant">No active records found.</div>
          )}
        </div>
      )}
    </label>
  );
}

function ProjectSearchField({ projects, value, onChange }) {
  const selected = projects.find((project) => project.id === value);
  const [query, setQuery] = useState(selected?.project_name || "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const nextSelected = projects.find((project) => project.id === value);
    setQuery(nextSelected?.project_name || "");
  }, [value, projects]);

  const filteredProjects = projects
    .filter((project) => {
      const search = `${project.project_name || ""} ${project.website_url || ""} ${project.category || ""}`.toLowerCase();
      return search.includes(query.toLowerCase());
    })
    .slice(0, 8);

  return (
    <label className="relative flex flex-col gap-xs">
      <span className="text-label-bold font-label-bold text-on-surface">Project</span>
      <span className="relative flex items-center">
        <Icon className="absolute left-md text-[18px] text-outline">travel_explore</Icon>
        <input
          className="w-full rounded-lg border border-outline-variant bg-surface px-md py-[10px] pl-2xl text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (!event.target.value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          placeholder="Type project name, website, or category..."
          required
          value={query}
        />
      </span>
      {open && (
        <div className="absolute left-0 right-0 top-[68px] z-50 max-h-64 overflow-y-auto rounded-lg border border-outline-variant bg-white shadow-level-2">
          {filteredProjects.length ? (
            filteredProjects.map((project) => (
              <button
                className="flex w-full items-center justify-between gap-3 px-md py-3 text-left hover:bg-surface-container-low"
                key={project.id}
                onMouseDown={(event) => {
                  event.preventDefault();
                  setQuery(project.project_name || project.website_url);
                  onChange(project.id);
                  setOpen(false);
                }}
                type="button"
              >
                <span>
                  <span className="block font-semibold text-on-surface">{project.project_name || "Unnamed Project"}</span>
                  <span className="block break-all text-body-sm text-on-surface-variant">{project.website_url || project.category || "No website URL"}</span>
                </span>
                <ProjectTag project={project} />
              </button>
            ))
          ) : (
            <div className="px-md py-3 text-body-sm text-on-surface-variant">No projects found.</div>
          )}
        </div>
      )}
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
              role: "employee",
              status: "pending"
            }
          }
        });
        if (error) throw error;
        const userId = data.user?.id;
        if (userId && data.session) {
          const { password: _password, ...profileFields } = form;
          const { error: profileError } = await supabase.from("profiles").upsert({ id: userId, ...profileFields, role: "employee", status: "pending", created_at: new Date().toISOString() });
          if (profileError) throw profileError;
        }
      }
      notify("Employee request submitted. Admin approval is required before login.");
      navigate("/employee/login");
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
            <p className="max-w-sm text-body-lg text-on-primary-container opacity-90">Join the systematic platform designed for high-performance SEO teams and employees.</p>
          </div>
        </div>
        <div className="flex w-full flex-col justify-center p-lg sm:p-xl md:w-7/12 md:p-2xl">
          <div className="mb-xl"><h1 className="mb-xs text-h2 font-h2 text-on-surface">Employee Signup Request</h1><p className="text-body-md text-on-surface-variant">Submit your details to request access to the employee environment.</p></div>
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
          <div className="mt-xl border-t border-outline-variant/30 pt-lg text-center"><p className="text-body-md text-on-surface-variant">Already have an account? <LinkButton to="/employee/login" className="ml-1 text-label-bold font-label-bold text-primary">Login</LinkButton></p></div>
        </div>
      </div>
    </div>
  );
}

function Shell({ role, title, children }) {
  const { signOut, profile } = useAuth();
  const data = useData();
  const path = usePath();
  const notifications = getNotificationSummary(role, profile, data);
  const nav = role === "admin" ? [
    ["/admin/dashboard", "dashboard", "Dashboard"],
    ["/admin/inbox", "inbox", "Review Inbox"],
    ["/admin/employees", "group", "Employees"],
    ["/admin/attendance", "schedule", "Attendance"],
    ["/admin/tasks", "assignment", "Task Management"],
    ["/admin/submissions", "send_and_archive", "Submissions"],
    ["/admin/payments", "payments", "Payments"],
    ["/admin/managers", "supervisor_account", "Manager Performance"],
    ["/admin/projects", "language", "Projects/Websites"],
    ["/admin/reports", "analytics", "Reports"],
    ["/admin/settings", "settings", "Settings"]
  ] : role === "manager" ? [
    ["/manager/dashboard", "dashboard", "Dashboard"],
    ["/manager/inbox", "inbox", "Review Inbox"],
    ["/manager/tasks", "assignment", "Team Tasks"],
    ["/manager/attendance", "schedule", "Attendance"],
    ["/manager/performance", "trending_up", "Team Performance"],
    ["/manager/submissions", "send_and_archive", "Submissions"],
    ["/manager/settings", "settings", "Settings"]
  ] : [
    ["/employee/dashboard", "dashboard", "Dashboard"],
    ["/employee/attendance", "schedule", "Attendance"],
    ["/employee/tasks", "assignment", "My Tasks"],
    ["/employee/performance", "trending_up", "Performance"],
    ["/employee/settings", "settings", "Settings"]
  ];
  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-slate-200 bg-slate-50 py-4 md:flex">
        <div className="mb-8 flex items-center gap-3 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-lg font-bold text-white">S</div>
          <div><h1 className="text-lg font-black tracking-tighter text-blue-700">SEO TaskFlow</h1><p className="text-body-sm text-slate-500">{role === "admin" ? "Enterprise Admin" : role === "manager" ? "Manager Portal" : "Employee Portal"}</p></div>
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
          <div className="flex items-center gap-3"><button className="md:hidden" onClick={() => navigate(role === "admin" ? "/admin/dashboard" : role === "manager" ? "/manager/dashboard" : "/employee/dashboard")}><Icon>menu</Icon></button><h2 className="text-h2 font-h2 text-on-surface">{title}</h2></div>
          <div className="flex items-center gap-4"><button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-50" onClick={() => navigate(notifications.path)} title={notifications.label} type="button"><Icon>notifications</Icon>{notifications.count > 0 && <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[11px] font-bold leading-none text-white">{notifications.count > 99 ? "99+" : notifications.count}</span>}</button><div className="hidden max-w-[260px] truncate text-body-sm text-on-surface-variant lg:block">{notifications.label}</div><div className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant bg-surface-container-high text-sm font-bold">{(profile?.full_name || "U").slice(0, 2).toUpperCase()}</div></div>
        </header>
        <div className="flex-1 overflow-y-auto p-lg">{children}</div>
      </main>
    </div>
  );
}

function Guard({ role, children }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background"><LoadingBar show /><div className="p-xl">Loading...</div></div>;
  if (!profile || profile.role !== role || (["employee", "manager"].includes(role) && !isApprovedAccount(profile))) {
    navigate(role === "admin" ? "/admin/login" : role === "manager" ? "/manager/login" : "/employee/login");
    return null;
  }
  return children;
}

function Card({ title, value, meta, icon, accent = "text-on-surface", onClick }) {
  const content = <><p className="text-label-bold font-label-bold uppercase text-on-surface-variant">{title}</p><p className={`text-h1 font-h1 ${accent}`}>{value}</p><div className="flex items-center justify-between gap-sm text-body-sm text-outline"><span className="flex items-center">{icon && <Icon className="mr-1 text-[16px]">{icon}</Icon>}{meta}</span>{onClick && <Icon className="text-[18px] text-primary">arrow_forward</Icon>}</div></>;
  if (onClick) return <button className="flex h-32 w-full flex-col justify-between rounded-xl border border-outline-variant bg-surface p-md text-left shadow-level-1 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-level-2" onClick={onClick} type="button">{content}</button>;
  return <div className="flex h-32 flex-col justify-between rounded-xl border border-outline-variant bg-surface p-md shadow-level-1">{content}</div>;
}

function AdminDashboard() {
  const { profiles, tasks, ratings, submissions, loading } = useData();
  const employees = profiles.filter((p) => p.role === "employee");
  const pendingEmployees = employees.filter((p) => p.status === "pending").length;
  const pendingReviews = submissions.filter((submission) => String(submission.status).toLowerCase() === "submitted").length
    + tasks.filter((task) => task.final_forwarded_to_admin && String(task.status).toLowerCase() === "submitted").length;
  const pendingPayments = tasks.filter((task) => ["done", "approved"].includes(String(task.status).toLowerCase()) && task.payment_status !== "released").length;
  const inboxCount = profiles.filter((p) => ["employee", "manager"].includes(p.role) && p.status === "pending").length
    + tasks.filter((task) => task.final_forwarded_to_admin && task.status === "submitted").length
    + submissions.filter((submission) => String(submission.status).toLowerCase() === "submitted").length
    + tasks.filter((task) => ["done", "approved"].includes(String(task.status).toLowerCase()) && task.payment_status !== "released").length;
  const avgRating = ratings.length ? (ratings.reduce((sum, r) => sum + Number(r.rating || 0), 0) / ratings.length).toFixed(1) : "0.0";
  return (
    <Shell role="admin" title="Dashboard Overview">
      <LoadingBar show={loading} />
      <div className="mx-auto max-w-7xl space-y-lg">
        <div className="grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card title="Total Employees" value={employees.length} meta="+ active team" icon="trending_up" />
          <Card title="Pending Employees" value={pendingEmployees} meta="Open approvals" icon="person_add" accent="text-[#FFAB00]" onClick={() => navigate("/admin/inbox")} />
          <Card title="Pending Reviews" value={pendingReviews} meta="Review submissions" icon="rate_review" accent="text-primary" onClick={() => navigate("/admin/submissions")} />
          <Card title="Pending Payments" value={pendingPayments} meta="Open payment queue" icon="payments" accent="text-[#FFAB00]" onClick={() => navigate("/admin/payments")} />
          <Card title="Completed Tasks" value={tasks.filter((t) => ["done", "approved"].includes(t.status)).length} meta="Approved or done" accent="text-[#36B37E]" />
          <Card title="Average Rating" value={avgRating} meta="Quality score" icon="star" />
        </div>
        <button className="flex w-full items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-lg text-left shadow-level-1 transition hover:bg-primary/10" onClick={() => navigate("/admin/inbox")} type="button">
          <div>
            <h3 className="text-h3 font-h3 text-primary">Admin Review Inbox</h3>
            <p className="mt-1 text-body-md text-on-surface-variant">Employee requests, forwarded work, submissions, revisions, and pending payments in one place.</p>
          </div>
          <div className="flex items-center gap-sm rounded-full bg-primary px-md py-2 text-label-bold font-label-bold text-on-primary"><span>{inboxCount}</span><Icon>arrow_forward</Icon></div>
        </button>
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

function AdminReviewInbox() {
  const data = useData();
  const notify = useToast();
  const pendingPeople = data.profiles.filter((profile) => ["employee", "manager"].includes(profile.role) && profile.status === "pending");
  const submittedTaskIds = new Set(data.submissions.map((submission) => submission.task_id));
  const managerForwarded = data.tasks.filter((task) => task.final_forwarded_to_admin && String(task.status).toLowerCase() === "submitted");
  const directSubmissions = data.submissions.filter((submission) => {
    const task = data.tasks.find((item) => item.id === submission.task_id);
    return String(submission.status).toLowerCase() === "submitted" && !task?.final_forwarded_to_admin;
  });
  const revisionReplies = data.submissions.filter((submission) => {
    const task = data.tasks.find((item) => item.id === submission.task_id);
    return String(task?.status).toLowerCase() === "revision required" || String(submission.status).toLowerCase() === "revision required";
  });
  const paymentsPending = data.tasks.filter((task) => ["done", "approved"].includes(String(task.status).toLowerCase()) && task.payment_status !== "released");
  const taskEmployee = (task) => data.profiles.find((profile) => profile.id === task?.student_id);
  const taskProject = (task) => data.projects.find((project) => project.id === task?.project_id);
  const approvePerson = async (person) => {
    await data.updateProfile(person.id, { status: "approved", role: person.role === "student" ? "employee" : person.role });
    notify(`${person.full_name || person.email} approved.`);
  };
  const rejectPerson = async (person) => {
    await data.updateProfile(person.id, { status: "rejected" });
    notify(`${person.full_name || person.email} rejected.`);
  };
  return (
    <Shell role="admin" title="Admin Review Inbox">
      <div className="mx-auto max-w-7xl space-y-lg">
        <div className="grid grid-cols-1 gap-md md:grid-cols-5">
          <Card title="New Requests" value={pendingPeople.length} meta="Employees/managers" icon="person_add" />
          <Card title="Manager Forwarded" value={managerForwarded.length} meta="Ready for admin" icon="forward_to_inbox" />
          <Card title="Submitted Tasks" value={directSubmissions.length} meta="Direct submissions" icon="publish" />
          <Card title="Revision Replies" value={revisionReplies.length} meta="Need re-check" icon="rate_review" />
          <Card title="Payments Pending" value={paymentsPending.length} meta="Approved work" icon="payments" />
        </div>
        <InboxSection title="New Employee Requests" icon="person_add" empty="No pending employee or manager requests.">
          {pendingPeople.map((person) => <div className="grid grid-cols-1 items-center gap-md border-t border-outline-variant/30 p-md md:grid-cols-[1.5fr_1fr_1fr_auto]" key={person.id}><div><p className="font-semibold">{person.full_name || "Unnamed"}</p><p className="text-body-sm text-on-surface-variant">{person.email}</p></div><div className="text-body-sm">{person.phone || "-"}</div><StatusBadge status={person.status} /><div className="flex justify-end gap-sm"><button className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-white" onClick={() => approvePerson(person)} type="button">Approve</button><button className="rounded-lg bg-error px-3 py-2 text-xs font-semibold text-white" onClick={() => rejectPerson(person)} type="button">Reject</button></div></div>)}
        </InboxSection>
        <InboxSection title="Manager Forwarded Tasks" icon="forward_to_inbox" empty="No manager-forwarded tasks waiting for admin review.">
          {managerForwarded.map((task) => <TaskInboxRow key={task.id} task={task} employee={taskEmployee(task)} project={taskProject(task)} note={task.manager_forward_summary || task.manager_remarks || "Manager forwarded for final admin review."} actionLabel="Review Work" />)}
        </InboxSection>
        <InboxSection title="Submitted Tasks" icon="publish" empty="No direct submitted tasks.">
          {directSubmissions.map((submission) => { const task = data.tasks.find((item) => item.id === submission.task_id); return <TaskInboxRow key={submission.id} task={task} employee={taskEmployee(task)} project={taskProject(task)} note={submission.notes || submission.submission_url || "Employee submitted work."} actionLabel="Review Submission" />; })}
        </InboxSection>
        <InboxSection title="Revision Replies" icon="rate_review" empty="No revision items currently waiting.">
          {revisionReplies.map((submission) => { const task = data.tasks.find((item) => item.id === submission.task_id); return <TaskInboxRow key={submission.id} task={task} employee={taskEmployee(task)} project={taskProject(task)} note={submission.notes || task?.manager_remarks || "Revision needs review."} actionLabel="Re-check" />; })}
        </InboxSection>
        <InboxSection title="Payments Pending" icon="payments" empty="No approved work waiting for payment.">
          {paymentsPending.map((task) => <TaskInboxRow key={task.id} task={task} employee={taskEmployee(task)} project={taskProject(task)} note={`Rs. ${Number(task.payment_amount || 0)} pending release`} actionLabel="Release Payment" actionPath="/admin/payments" />)}
        </InboxSection>
      </div>
    </Shell>
  );
}

function InboxSection({ title, icon, empty, children }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-level-1"><div className="flex items-center gap-sm border-b border-outline-variant/50 bg-surface-container-low px-lg py-md"><Icon className="text-primary">{icon}</Icon><h2 className="text-h3 font-h3">{title}</h2><span className="ml-auto rounded-full bg-surface px-sm py-1 text-label-bold font-label-bold text-on-surface-variant">{items.length}</span></div>{items.length ? <div>{items}</div> : <div className="p-lg"><EmptyState title={empty} body="New items will appear here automatically." /></div>}</section>;
}

function TaskInboxRow({ task, employee, project, note, actionLabel, actionPath }) {
  if (!task) return null;
  return <div className="grid grid-cols-1 items-center gap-md border-t border-outline-variant/30 p-md md:grid-cols-[1.3fr_1fr_1fr_1.2fr_auto]"><div><button className="font-semibold text-primary" onClick={() => navigate(`/admin/tasks/${task.id}`)} type="button">{task.task_title}</button><p className="text-body-sm text-on-surface-variant">{task.task_type}</p></div><div><p>{employee?.full_name || "-"}</p><p className="text-body-sm text-on-surface-variant">{employee?.email || ""}</p></div><ProjectTag project={project} /><p className="line-clamp-2 text-body-sm text-on-surface-variant">{note}</p><div className="flex items-center justify-end gap-sm"><StatusBadge status={task.status} /><button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white" onClick={() => navigate(actionPath || `/admin/tasks/${task.id}`)} type="button">{actionLabel}</button></div></div>;
}

function StudentsPage() {
  const data = useData();
  const notify = useToast();
  const [filters, setFilters] = useState({ search: "", role: "", status: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const emptyEmployee = { full_name: "", email: "", phone: "", password: "", role: "employee", status: "approved", skill_level: "beginner", message: "Added by admin" };
  const [newEmployee, setNewEmployee] = useState(emptyEmployee);
  const employees = data.profiles
    .filter((p) => ["employee", "manager"].includes(p.role))
    .filter((p) => {
      const searchText = `${p.full_name || ""} ${p.email || ""} ${p.phone || ""} ${p.id || ""}`.toLowerCase();
      const statusValue = p.status === "approved" ? "active" : p.status;
      return (
        (!filters.search || searchText.includes(filters.search.toLowerCase())) &&
        (!filters.role || p.role === filters.role) &&
        (!filters.status || statusValue === filters.status)
      );
    });
  const approve = async (student, status) => {
    try {
      await data.updateStatus("profiles", student.id, status);
      notify(`${student.full_name} marked ${status}.`);
    } catch (error) {
      notify(error.message, "error");
    }
  };
  const setRole = async (person, role) => {
    try {
      await data.updateProfile(person.id, { role });
      notify(`${person.full_name} is now ${role}.`);
    } catch (error) {
      notify(error.message, "error");
    }
  };
  const toggleActive = async (person) => {
    const nextStatus = person.status === "approved" ? "inactive" : "approved";
    await approve(person, nextStatus);
  };
  const addEmployee = async (event) => {
    event.preventDefault();
    try {
      if (!newEmployee.full_name || !newEmployee.email) throw new Error("Name and email are required.");
      if (isSupabaseConfigured && newEmployee.password.length < 6) throw new Error("Password must be at least 6 characters.");
      if (isSupabaseConfigured) {
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: newEmployee.email,
          password: newEmployee.password,
          options: {
            data: {
              full_name: newEmployee.full_name,
              phone: newEmployee.phone,
              role: newEmployee.role,
              status: newEmployee.status,
              skill_level: newEmployee.skill_level,
              message: newEmployee.message
            }
          }
        });
        if (signupError) throw signupError;
        if (!signupData.user?.id) throw new Error("Could not create auth user.");
        await data.saveProfile({
          id: signupData.user.id,
          full_name: newEmployee.full_name,
          email: newEmployee.email,
          phone: newEmployee.phone,
          role: newEmployee.role,
          status: newEmployee.status,
          skill_level: newEmployee.skill_level,
          message: newEmployee.message,
          created_at: new Date().toISOString()
        });
      } else {
        await data.saveProfile({ id: crypto.randomUUID(), ...newEmployee, password: undefined, created_at: new Date().toISOString() });
      }
      setNewEmployee(emptyEmployee);
      setShowAddForm(false);
      notify("Employee added.");
    } catch (error) {
      notify(error.message, "error");
    }
  };
  return (
    <Shell role="admin" title="Employees">
      <div className="mb-lg flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-h1 font-h1">Employees</h1><p className="mt-1 text-body-md text-on-surface-variant">Manage employees, promote managers, track progress, and review submissions.</p></div><button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-label-bold font-label-bold text-on-primary shadow-sm" onClick={() => setShowAddForm((current) => !current)} type="button"><Icon className="text-[18px]">{showAddForm ? "close" : "add"}</Icon>{showAddForm ? "Close" : "Add Employee"}</button></div>
      {showAddForm && (
        <form className="mb-md rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1" onSubmit={addEmployee}>
          <h2 className="mb-md text-h3 font-h3">Add Employee Manually</h2>
          <div className="grid grid-cols-1 gap-md md:grid-cols-3">
            <Field label="Full Name" value={newEmployee.full_name} onChange={(full_name) => setNewEmployee({ ...newEmployee, full_name })} />
            <Field label="Email" type="email" value={newEmployee.email} onChange={(email) => setNewEmployee({ ...newEmployee, email })} />
            <Field label="Phone" value={newEmployee.phone} onChange={(phone) => setNewEmployee({ ...newEmployee, phone })} required={false} />
            <Field label="Password" type="password" value={newEmployee.password} onChange={(password) => setNewEmployee({ ...newEmployee, password })} required={isSupabaseConfigured} />
            <SelectField label="Role" value={newEmployee.role} onChange={(role) => setNewEmployee({ ...newEmployee, role })} options={["employee", "manager"]} />
            <SelectField label="Status" value={newEmployee.status} onChange={(status) => setNewEmployee({ ...newEmployee, status })} options={[{ value: "approved", label: "Active" }, { value: "pending", label: "Pending" }, { value: "inactive", label: "Inactive" }]} />
            <Field label="Skill Level" value={newEmployee.skill_level} onChange={(skill_level) => setNewEmployee({ ...newEmployee, skill_level })} required={false} />
            <Field label="Notes" value={newEmployee.message} onChange={(message) => setNewEmployee({ ...newEmployee, message })} required={false} />
            <button className="self-end rounded-lg bg-primary px-lg py-3 text-label-bold font-label-bold text-white" type="submit">Save Employee</button>
          </div>
        </form>
      )}
      <div className="mb-md grid grid-cols-1 gap-md rounded-xl border border-outline-variant/50 bg-surface p-md shadow-level-1 md:grid-cols-4">
        <label className="relative md:col-span-2">
          <Icon className="absolute left-md top-1/2 -translate-y-1/2 text-[18px] text-outline">search</Icon>
          <input className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2.5 pl-2xl pr-md text-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Search employee by name, email, phone, or ID..." value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        </label>
        <select className="rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}>
          <option value="">All roles</option>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
        </select>
        <select className="rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest shadow-level-1">
        <div className="overflow-x-auto">
          <table className="sheet-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Contact Info</th>
                <th>Role</th>
                <th>Status</th>
                <th>Task Progress</th>
                <th>Avg Rating</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((student) => {
                const studentTasks = data.tasks.filter((t) => t.student_id === student.id || t.manager_id === student.id);
                const done = studentTasks.filter((t) => ["done", "approved"].includes(t.status)).length;
                const studentRatings = data.ratings.filter((r) => r.student_id === student.id);
                const avg = studentRatings.length ? (studentRatings.reduce((s, r) => s + Number(r.rating), 0) / studentRatings.length).toFixed(1) : "-";
                return (
                  <tr key={student.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/50 bg-surface-container font-bold text-primary">{student.full_name?.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <div className="font-semibold">{student.full_name}</div>
                          <div className="text-body-sm text-on-surface-variant">ID: {student.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-body-sm">
                        <div className="flex items-center gap-1.5"><Icon className="text-[14px] text-on-surface-variant">mail</Icon>{student.email}</div>
                        <div className="flex items-center gap-1.5 text-on-surface-variant"><Icon className="text-[14px]">phone</Icon>{student.phone || "-"}</div>
                      </div>
                    </td>
                    <td><span className="capitalize">{student.role}</span></td>
                    <td><StatusBadge status={student.status === "approved" ? "active" : student.status} /></td>
                    <td>
                      <div className="max-w-[160px]">
                        <div className="mb-2 flex justify-between text-body-sm"><span className="font-medium">{done} / {studentTasks.length}</span><span className="text-on-surface-variant">{studentTasks.length ? Math.round((done / studentTasks.length) * 100) : 0}%</span></div>
                        <div className="h-1.5 rounded-full bg-surface-container-high"><div className="h-full rounded-full bg-secondary" style={{ width: `${studentTasks.length ? (done / studentTasks.length) * 100 : 0}%` }} /></div>
                      </div>
                    </td>
                    <td><div className="flex items-center gap-1 font-semibold"><Icon className="text-[16px] text-tertiary-container">star</Icon>{avg}</div></td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button title="Approve" className="cursor-pointer rounded-md p-1.5 text-on-surface-variant hover:bg-secondary/10 hover:text-secondary" onClick={() => approve(student, "approved")} type="button"><Icon className="text-[20px]">check_circle</Icon></button>
                        <button title={student.status === "approved" ? "Deactivate" : "Activate"} className="cursor-pointer rounded-md p-1.5 text-on-surface-variant hover:bg-[#FFAB00]/10 hover:text-[#974F0C]" onClick={() => toggleActive(student)} type="button"><Icon className="text-[20px]">{student.status === "approved" ? "toggle_on" : "toggle_off"}</Icon></button>
                        <button title={student.role === "manager" ? "Make Employee" : "Make Manager"} className="cursor-pointer rounded-md p-1.5 text-on-surface-variant hover:bg-primary/10 hover:text-primary" onClick={() => setRole(student, student.role === "manager" ? "employee" : "manager")} type="button"><Icon className="text-[20px]">supervisor_account</Icon></button>
                        <button title="Reject" className="cursor-pointer rounded-md p-1.5 text-on-surface-variant hover:bg-error/10 hover:text-error" onClick={() => approve(student, "rejected")} type="button"><Icon className="text-[20px]">cancel</Icon></button>
                        <button title="Delete" className="cursor-pointer rounded-md p-1.5 text-on-surface-variant hover:bg-surface-container" onClick={() => data.deleteProfile(student.id)} type="button"><Icon className="text-[20px]">delete</Icon></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!employees.length && <div className="p-lg"><EmptyState title="No employees found" body="Try a different search or status filter." /></div>}
      </div>
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
  return <Shell role="admin" title="Projects/Websites"><div className="space-y-lg"><ProjectForm onSave={async (row) => { await data.saveProject(row); notify("Project saved."); }} /><div className="grid grid-cols-1 gap-md md:grid-cols-2 xl:grid-cols-3">{data.projects.map((project) => <button key={project.id} className="rounded-xl border border-outline-variant bg-surface p-lg text-left shadow-level-1 transition hover:border-primary hover:shadow-level-2" onClick={() => navigate(`/admin/projects/${project.id}`)} type="button"><div className="mb-md flex items-start justify-between"><ProjectTag project={project} /><span className="flex gap-sm"><Icon className="text-primary">analytics</Icon><button onClick={(event) => { event.stopPropagation(); data.deleteProject(project.id); }} type="button"><Icon className="text-error">delete</Icon></button></span></div><h3 className="text-h3 font-h3">{project.project_name}</h3><span className="mt-1 block break-all text-body-sm text-primary">{project.website_url}</span><p className="mt-md text-body-md text-on-surface-variant">{project.notes}</p></button>)}</div></div></Shell>;
}

function getProjectReportRows(project, data) {
  return data.tasks.filter((task) => task.project_id === project.id).map((task) => {
    const employee = data.profiles.find((profile) => profile.id === task.student_id);
    const manager = data.profiles.find((profile) => profile.id === task.manager_id);
    const submission = data.submissions.find((item) => item.task_id === task.id);
    const rating = data.ratings.find((item) => item.task_id === task.id);
    return {
      Employee: employee?.full_name || "",
      Manager: manager?.full_name || "",
      Task: task.task_title || "",
      Type: task.task_type || "",
      Website: project.project_name || "",
      Link: submission?.submission_url || task.target_url || "",
      Progress: `${Number(task.progress_percent || 0)}%`,
      "Approx Time": task.approx_time || "",
      Status: task.status || "",
      Payment: Number(task.payment_amount || 0),
      "Payment Status": task.payment_status || "pending",
      Rating: rating?.rating || "",
      Remarks: rating?.remarks || ""
    };
  });
}

function downloadTableExcel(filename, rows) {
  const headers = Object.keys(rows[0] || { Employee: "", Manager: "", Task: "", Type: "", Website: "", Link: "", Progress: "", "Approx Time": "", Status: "", Payment: "", "Payment Status": "", Rating: "", Remarks: "" });
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (match) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[match]);
  const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headers.map((header) => `<th style="background:#e7eeff;color:#091c35;border:1px solid #c3c6d6;padding:8px;font-weight:bold;">${escape(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row, index) => `<tr>${headers.map((header) => `<td style="border:1px solid #dfe3ec;padding:8px;background:${index % 2 ? "#f9f9ff" : "#ffffff"};">${escape(row[header])}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ProjectDetailPage({ id }) {
  const data = useData();
  const notify = useToast();
  const project = data.projects.find((item) => item.id === id);
  if (!project) return <Shell role="admin" title="Project Report"><EmptyState title="Project not found" body="The selected project does not exist." /></Shell>;
  const projectTasks = data.tasks.filter((task) => task.project_id === project.id);
  const rows = getProjectReportRows(project, data);
  const done = projectTasks.filter((task) => ["done", "approved"].includes(String(task.status).toLowerCase())).length;
  const submitted = projectTasks.filter((task) => String(task.status).toLowerCase() === "submitted").length;
  const inProgress = projectTasks.filter((task) => String(task.status).toLowerCase() === "in progress").length;
  const pending = projectTasks.filter((task) => String(task.status).toLowerCase() === "pending").length;
  const avgProgress = projectTasks.length ? Math.round(projectTasks.reduce((sum, task) => sum + Number(task.progress_percent || 0), 0) / projectTasks.length) : 0;
  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text(`${project.project_name} Project Report`, 14, 14);
    doc.text(`Website: ${project.website_url || "-"}`, 14, 22);
    autoTable(doc, { head: [Object.keys(rows[0] || { Employee: "", Manager: "", Task: "", Type: "", Website: "", Link: "", Progress: "", "Approx Time": "", Status: "", Payment: "", "Payment Status": "", Rating: "", Remarks: "" })], body: rows.map(Object.values), startY: 30, styles: { fontSize: 8 } });
    doc.save(`${project.project_name || "project"}-report.pdf`);
    notify("Project PDF report generated.");
  };
  const exportExcel = () => {
    downloadTableExcel(`${project.project_name || "project"}-report.xls`, rows);
    notify("Project Excel report generated.");
  };
  return (
    <Shell role="admin" title="Project Progress">
      <div className="space-y-lg">
        <div className="flex flex-col justify-between gap-md md:flex-row md:items-start">
          <div>
            <button className="mb-sm flex items-center gap-xs text-primary" onClick={() => navigate("/admin/projects")} type="button"><Icon className="text-[18px]">arrow_back</Icon>Back to projects</button>
            <h1 className="text-h1 font-h1">{project.project_name}</h1>
            <a className="mt-1 block break-all text-primary" href={project.website_url} target="_blank" rel="noreferrer">{project.website_url}</a>
            <p className="mt-sm text-on-surface-variant">{project.notes}</p>
          </div>
          <div className="flex gap-sm">
            <button className="rounded-lg bg-primary px-4 py-2 text-white" onClick={exportPdf}>Download PDF</button>
            <button className="rounded-lg bg-secondary px-4 py-2 text-white" onClick={exportExcel}>Download Excel</button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-md md:grid-cols-5">
          <Card title="Total Tasks" value={projectTasks.length} meta="Project workload" icon="assignment" />
          <Card title="Done" value={done} meta="Completed" accent="text-secondary" />
          <Card title="Submitted" value={submitted} meta="In review" />
          <Card title="In Progress" value={inProgress} meta="Active" accent="text-primary" />
          <Card title="Avg Progress" value={`${avgProgress}%`} meta={`${pending} pending`} icon="trending_up" />
        </div>
        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <div className="rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1 lg:col-span-2">
            <h3 className="mb-md text-h3 font-h3">Graphical Progress</h3>
            <div className="space-y-md">
              {[["Done", done, "#36B37E"], ["Submitted", submitted, "#6554C0"], ["In Progress", inProgress, "#0052CC"], ["Pending", pending, "#7A869A"]].map(([label, count, color]) => {
                const width = projectTasks.length ? Math.round((count / projectTasks.length) * 100) : 0;
                return <div key={label}><div className="mb-1 flex justify-between text-body-sm"><span>{label}</span><b>{count} ({width}%)</b></div><div className="h-3 rounded-full bg-surface-container-high"><div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} /></div></div>;
              })}
            </div>
          </div>
          <div className="rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1">
            <h3 className="mb-md text-h3 font-h3">Average Completion</h3>
            <div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-full" style={{ background: `conic-gradient(#0052CC ${avgProgress}%, #e7eeff ${avgProgress}% 100%)` }}>
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white text-h1 font-h1">{avgProgress}%</div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-level-1">
          <div className="overflow-x-auto">
            <table className="sheet-table">
              <thead><tr>{Object.keys(rows[0] || { Employee: "", Manager: "", Task: "", Type: "", Website: "", Link: "", Progress: "", "Approx Time": "", Status: "", Payment: "", "Payment Status": "", Rating: "", Remarks: "" }).map((header) => <th key={header}>{header}</th>)}</tr></thead>
              <tbody>{rows.map((row, index) => <tr key={index}>{Object.entries(row).map(([key, value]) => <td key={key}>{key === "Status" || key === "Payment Status" ? <StatusBadge status={value} /> : value}</td>)}</tr>)}</tbody>
            </table>
          </div>
          {!rows.length && <div className="p-lg"><EmptyState title="No project tasks yet" body="Assign tasks to this project to see graphical progress and report rows." /></div>}
        </div>
      </div>
    </Shell>
  );
}

function TaskForm({ initial = {}, onSave, managerMode = false }) {
  const { profiles, projects } = useData();
  const { profile } = useAuth();
  const employees = profiles.filter((p) => p.role === "employee" && p.status === "approved");
  const managers = profiles.filter((p) => p.role === "manager" && p.status === "approved");
  const [form, setForm] = useState({ priority: "Medium", status: "pending", ...initial });
  const deadlineDate = toDateInputValue(form.deadline);
  const deadlineTime = toTimeInputValue(form.deadline);
  const submitTask = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      manager_id: managerMode ? profile.id : form.manager_id,
      assigned_by: profile.id,
      progress_percent: Number(form.progress_percent || 0),
      payment_amount: Number(form.payment_amount || 0),
      payment_status: form.payment_status || "pending",
      created_at: form.created_at || new Date().toISOString()
    };
    onSave(payload);
    setForm({ priority: "Medium", status: "pending" });
  };
  return (
    <form className="grid grid-cols-1 gap-md rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1 md:grid-cols-2" onSubmit={submitTask}>
      <Field label="Task Title" value={form.task_title} onChange={(task_title) => setForm({ ...form, task_title })} />
      <SelectField label="Task Type" value={form.task_type} onChange={(task_type) => setForm({ ...form, task_type })} options={taskTypes} />
      <PersonSearchField people={employees} value={form.student_id} onChange={(student_id) => setForm({ ...form, student_id })} />
      {!managerMode && <PersonSearchField people={managers} value={form.manager_id} onChange={(manager_id) => setForm({ ...form, manager_id })} label="Assign Manager (Optional)" placeholder="Type manager name or email..." />}
      <ProjectSearchField projects={projects} value={form.project_id} onChange={(project_id) => setForm({ ...form, project_id })} />
      <Field label="Payment Amount" type="number" value={form.payment_amount} onChange={(payment_amount) => setForm({ ...form, payment_amount })} required={false} />
      <Field label="Week Start" type="date" value={form.week_start || ""} onChange={(week_start) => setForm({ ...form, week_start })} required={false} />
      <Field label="Week End" type="date" value={form.week_end || ""} onChange={(week_end) => setForm({ ...form, week_end })} required={false} />
      <Field label="Target URL" value={form.target_url} onChange={(target_url) => setForm({ ...form, target_url })} />
      <Field label="Posting URL" value={form.posting_url} onChange={(posting_url) => setForm({ ...form, posting_url })} required={false} />
      <Field label="Approx Time" value={form.approx_time} onChange={(approx_time) => setForm({ ...form, approx_time })} />
      <Field label="Deadline Date" type="date" value={deadlineDate} onChange={(date) => setForm({ ...form, deadline: buildLocalDateTime(date, deadlineTime) })} />
      <Field label="Deadline Time" type="time" value={deadlineTime || "23:59"} onChange={(time) => setForm({ ...form, deadline: buildLocalDateTime(deadlineDate, time) })} required={false} />
      <SelectField label="Priority" value={form.priority} onChange={(priority) => setForm({ ...form, priority })} options={priorities} />
      <SelectField label="Status" value={form.status} onChange={(status) => setForm({ ...form, status })} options={statusLabels} />
      <div className="md:col-span-2"><RichTextEditor label="Instructions" value={form.instructions || ""} onChange={(instructions) => setForm({ ...form, instructions })} /></div>
      <button className="rounded-lg bg-primary px-4 py-3 text-label-bold font-label-bold text-on-primary md:col-span-2">Save Weekly Task</button>
    </form>
  );
}

function TasksPage() {
  const data = useData();
  const notify = useToast();
  return <Shell role="admin" title="Task Management"><div className="space-y-lg"><TaskForm onSave={async (task) => { await data.saveTask(task); notify("Task saved."); }} /><TasksTable admin /></div></Shell>;
}

function TasksTable({ studentId, admin = false }) {
  const data = useData();
  const notify = useToast();
  const { profile } = useAuth();
  const rows = data.tasks.filter((task) => !studentId || task.student_id === studentId || task.manager_id === studentId);
  if (!rows.length) return <EmptyState title="No tasks found" body="Assigned SEO tasks will appear here." />;
  return <div className="overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest shadow-level-1"><div className="overflow-x-auto"><table className="sheet-table"><thead><tr><th>Task</th><th>Employee</th><th>Manager</th><th>Website</th><th>Progress</th><th>Payment</th><th>Status</th><th className="text-right">Actions</th></tr></thead><tbody>{rows.map((task) => { const project = data.projects.find((p) => p.id === task.project_id); const student = data.profiles.find((p) => p.id === task.student_id); const manager = data.profiles.find((p) => p.id === task.manager_id); const openPath = profile.role === "admin" ? `/admin/tasks/${task.id}` : profile.role === "manager" ? `/manager/tasks/${task.id}` : `/employee/tasks/${task.id}`; const progress = getLatestTaskProgress(task, data.progressUpdates); return <tr key={task.id}><td><button className="font-semibold text-primary" onClick={() => navigate(openPath)}>{task.task_title}</button><div className="text-body-sm text-on-surface-variant">{task.task_type}</div></td><td>{student?.full_name || "-"}</td><td>{manager?.full_name || "-"}</td><td><ProjectTag project={project} /></td><td><button className="min-w-[120px] text-left" onClick={() => navigate(openPath)} type="button"><div className="mb-1 flex justify-between text-body-sm"><span>{progress}%</span><span className="text-primary">View</span></div><div className="h-1.5 rounded-full bg-surface-container-high"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div></button></td><td><div className="text-body-sm"><div>Rs. {Number(task.payment_amount || 0)}</div><StatusBadge status={task.payment_status === "released" ? "approved" : "pending"} /></div></td><td><StatusBadge status={task.status} /></td><td className="text-right">{admin || profile.role === "manager" ? <div className="flex justify-end gap-1"><button title="Open Details" onClick={() => navigate(openPath)} type="button"><Icon>visibility</Icon></button><button onClick={async () => { await data.updateStatus("tasks", task.id, "in progress"); notify("Task status updated."); }} type="button"><Icon>play_arrow</Icon></button>{profile.role === "admin" && <button onClick={() => data.deleteTask(task.id)} type="button"><Icon className="text-error">delete</Icon></button>}</div> : <button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white" onClick={() => navigate(openPath)}>Open</button>}</td></tr>; })}</tbody></table></div></div>;
}

function TaskDetail({ id, studentMode = false }) {
  const data = useData();
  const task = data.tasks.find((t) => t.id === id);
  const notify = useToast();
  const { profile } = useAuth();
  const shellRole = profile?.role || (studentMode ? "employee" : "admin");
  if (!task) return <Shell role={shellRole} title="Task Detail"><EmptyState title="Task not found" body="The selected task does not exist." /></Shell>;
  const project = data.projects.find((p) => p.id === task.project_id);
  const progress = getLatestTaskProgress(task, data.progressUpdates);
  return <Shell role={shellRole} title="Task Detail"><div className="grid min-w-0 grid-cols-1 gap-lg lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]"><div className="min-w-0 rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1"><div className="mb-md flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><h1 className="break-words text-h1 font-h1">{task.task_title}</h1><p className="mt-1 text-body-md text-on-surface-variant">{task.task_type}</p></div><StatusBadge status={task.status} /></div><RevisionNotice task={task} /><div className="grid min-w-0 grid-cols-1 gap-md md:grid-cols-2"><Info label="Project" value={<ProjectTag project={project} />} /><Info label="Target URL" value={task.target_url} /><Info label="Posting URL" value={task.posting_url || "-"} /><Info label="Approx Time" value={task.approx_time} /><Info label="Deadline" value={task.deadline ? new Date(task.deadline).toLocaleString() : "-"} /><Info label="Priority" value={task.priority} /><Info label="Payment Amount" value={`Rs. ${Number(task.payment_amount || 0)}`} /><Info label="Progress" value={`${progress}%`} /></div><div className="mt-lg min-w-0"><h3 className="mb-sm text-h3 font-h3">Instructions</h3><div className="rich-content min-w-0 rounded-lg bg-surface-container-low p-md text-body-md text-on-surface-variant" dangerouslySetInnerHTML={{ __html: task.instructions || "" }} /></div><ProgressHistory task={task} /><TaskTimeline task={task} /></div><div className="min-w-0">{shellRole === "employee" ? <SubmitTask task={task} /> : <AdminReviewPanel task={task} />}</div></div></Shell>;
}

function Info({ label, value }) {
  return <div><p className="text-label-bold font-label-bold uppercase text-on-surface-variant">{label}</p><div className="mt-1 break-all text-body-md text-on-surface">{value}</div></div>;
}

function RevisionNotice({ task }) {
  const data = useData();
  if (String(task.status).toLowerCase() !== "revision required") return null;
  const submission = data.submissions.find((item) => item.task_id === task.id);
  const requestedBy = data.profiles.find((person) => person.id === task.revision_requested_by);
  return <div className="mb-lg rounded-xl border border-[#FFAB00]/40 bg-[#FFAB00]/10 p-md"><div className="mb-sm flex flex-wrap items-center justify-between gap-sm"><div className="flex items-center gap-sm font-semibold text-[#974F0C]"><Icon>rate_review</Icon>Revision Required</div><span className="text-body-sm text-[#974F0C]">{task.revision_due_at ? `Due: ${new Date(task.revision_due_at).toLocaleString()}` : "No due date set"}</span></div><p className="text-body-md text-on-surface">{task.revision_notes || task.admin_remarks || task.manager_remarks || "Please revise the submitted work according to reviewer remarks."}</p><div className="mt-sm flex flex-wrap gap-md text-body-sm text-on-surface-variant"><span>Requested by: {requestedBy?.full_name || "Reviewer"}</span>{task.revision_requested_at && <span>Requested at: {new Date(task.revision_requested_at).toLocaleString()}</span>}{submission?.submission_url && <a className="font-semibold text-primary" href={submission.submission_url} target="_blank" rel="noreferrer">Previous submission link</a>}</div></div>;
}

function ForwardSummary({ summary }) {
  if (!summary) return null;
  return <div className="rounded-lg border border-primary/20 bg-primary/5 p-md"><h4 className="mb-sm font-semibold text-primary">Manager Forward Summary</h4><pre className="whitespace-pre-wrap font-sans text-body-sm text-on-surface-variant">{summary}</pre></div>;
}

function SubmitTask({ task }) {
  const data = useData();
  const { profile } = useAuth();
  const notify = useToast();
  const [form, setForm] = useState({ submission_url: "", notes: "", time_spent: "", progress_percent: task.progress_percent || 0, file: null });
  const saveProgress = async () => {
    await data.saveProgress({ task_id: task.id, employee_id: profile.id, progress_percent: Number(form.progress_percent || 0), notes: form.notes, update_date: new Date().toISOString().slice(0, 10), created_at: new Date().toISOString() });
    await data.saveTask({ ...task, progress_percent: Number(form.progress_percent || 0), status: Number(form.progress_percent || 0) >= 100 ? "submitted" : task.status });
    notify("Daily progress updated.");
  };
  const submit = async (e) => {
    e.preventDefault();
    try {
      const screenshot_url = await data.uploadScreenshot(form.file, `${profile.id}/${task.id}-${Date.now()}-${form.file?.name || "screenshot"}`);
      await data.saveSubmission({ task_id: task.id, student_id: profile.id, submission_url: form.submission_url, screenshot_url, notes: form.notes, time_spent: form.time_spent, status: "submitted", submitted_at: new Date().toISOString() });
      await data.saveTask({ ...task, status: "submitted", revision_notes: null, revision_due_at: null, revision_requested_by: null, revision_requested_at: null });
      notify("Task submitted for review.");
      navigate("/employee/tasks");
    } catch (error) {
      notify(error.message, "error");
    }
  };
  return <form className="space-y-md rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1" onSubmit={submit}><h3 className="text-h3 font-h3">Submit Task</h3>{task.status === "pending" && <button className="w-full rounded-lg border border-outline-variant px-4 py-2 text-label-bold font-label-bold text-primary" type="button" onClick={async () => { await data.updateStatus("tasks", task.id, "in progress"); notify("Task started."); }}>Start Task</button>}<Field label="Daily Progress %" type="number" value={form.progress_percent} onChange={(progress_percent) => setForm({ ...form, progress_percent })} /><button className="w-full rounded-lg border border-outline-variant px-4 py-2 text-label-bold font-label-bold text-primary" type="button" onClick={saveProgress}>Update Daily Progress</button><Field label="Submission URL" value={form.submission_url} onChange={(submission_url) => setForm({ ...form, submission_url })} /><Field label="Time Spent" value={form.time_spent} onChange={(time_spent) => setForm({ ...form, time_spent })} placeholder="2h 15m" /><label className="flex flex-col gap-xs"><span className="text-label-bold font-label-bold">Screenshot</span><input className="rounded-lg border border-outline-variant bg-surface px-md py-2" type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] })} /></label><label className="flex flex-col gap-xs"><span className="text-label-bold font-label-bold">Notes</span><textarea className="min-h-24 rounded-lg border border-outline-variant bg-surface px-md py-2.5" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label><button className="w-full rounded-lg bg-primary px-4 py-3 text-label-bold font-label-bold text-on-primary">Submit Work</button></form>;
}

function ProgressHistory({ task }) {
  const data = useData();
  const updates = data.progressUpdates.filter((update) => update.task_id === task.id).slice(0, 5);
  return <div className="mt-lg"><h3 className="mb-sm text-h3 font-h3">Progress Updates</h3>{updates.length ? <div className="space-y-sm">{updates.map((update) => <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-md" key={update.id}><div className="flex justify-between text-body-sm"><span>{update.update_date}</span><b>{update.progress_percent}%</b></div><p className="mt-1 text-body-md text-on-surface-variant">{update.notes || "No notes"}</p></div>)}</div> : <p className="rounded-lg bg-surface-container-low p-md text-body-md text-on-surface-variant">No daily progress yet.</p>}</div>;
}

function TaskTimeline({ task }) {
  const data = useData();
  const updates = data.progressUpdates.filter((update) => update.task_id === task.id).sort((a, b) => new Date(a.created_at || a.update_date) - new Date(b.created_at || b.update_date));
  const latestUpdate = updates[updates.length - 1];
  const submission = data.submissions.find((item) => item.task_id === task.id);
  const rating = data.ratings.find((item) => item.task_id === task.id);
  const payment = data.payments.find((item) => item.task_id === task.id && item.status === "released");
  const employee = data.profiles.find((person) => person.id === task.student_id);
  const manager = data.profiles.find((person) => person.id === task.manager_id);
  const admin = data.profiles.find((person) => person.id === (payment?.released_by || task.assigned_by));
  const rows = [
    { label: "Assigned", date: task.created_at, detail: `Task assigned to ${employee?.full_name || "employee"}${manager ? ` under ${manager.full_name}` : ""}.`, done: true, icon: "assignment_ind" },
    { label: "Employee Progress", date: latestUpdate?.created_at || latestUpdate?.update_date, detail: latestUpdate ? `${latestUpdate.progress_percent}% completed${latestUpdate.notes ? ` - ${latestUpdate.notes}` : ""}` : "No daily progress update yet.", done: updates.length > 0, icon: "trending_up" },
    { label: "Submitted", date: submission?.submitted_at, detail: submission ? (submission.submission_url || submission.notes || "Employee submitted work for review.") : "Waiting for employee submission.", done: Boolean(submission), icon: "publish" },
    { label: "Manager Remarks", date: task.manager_reviewed_at, detail: task.manager_remarks || "Waiting for manager review/remarks.", done: Boolean(task.manager_remarks || task.manager_reviewed_at || task.final_forwarded_to_admin), icon: "supervisor_account" },
    { label: "Admin Decision", date: task.admin_reviewed_at || rating?.created_at, detail: task.admin_remarks || rating?.remarks || (["done", "approved", "rejected", "revision required"].includes(String(task.status).toLowerCase()) ? `Admin marked task as ${task.status}.` : "Waiting for admin decision."), done: Boolean(task.admin_reviewed_at || rating || ["done", "approved", "rejected", "revision required"].includes(String(task.status).toLowerCase())), icon: "verified" },
    { label: "Payment Released", date: payment?.released_at, detail: payment ? `${payment.method || "Payment"} ${payment.transaction_number ? `- ${payment.transaction_number}` : ""} released by ${admin?.full_name || "admin"} for Rs. ${Number(payment.amount || task.payment_amount || 0)}.` : `Rs. ${Number(task.payment_amount || 0)} pending release.`, done: Boolean(payment), icon: "payments" }
  ];
  return <div className="mt-lg min-w-0"><h3 className="mb-md text-h3 font-h3">Task Timeline</h3><div className="min-w-0 rounded-xl border border-outline-variant/50 bg-surface-container-low p-md">{rows.map((row, index) => <div className="relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-md pb-md last:pb-0" key={row.label}>{index < rows.length - 1 && <div className={`absolute left-5 top-10 h-[calc(100%-2rem)] w-px ${row.done ? "bg-primary/40" : "bg-outline-variant"}`} />}<div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border ${row.done ? "border-primary bg-primary text-white" : "border-outline-variant bg-surface text-outline"}`}><Icon className="text-[20px]">{row.done ? "check" : row.icon}</Icon></div><div className="min-w-0 rounded-lg bg-surface p-md shadow-sm"><div className="flex min-w-0 flex-col justify-between gap-xs sm:flex-row sm:items-center"><h4 className="font-semibold">{row.label}</h4><span className="shrink-0 text-body-sm text-on-surface-variant">{row.date ? new Date(row.date).toLocaleString() : "Pending"}</span></div><p className="mt-1 min-w-0 break-all text-body-md text-on-surface-variant">{row.detail}</p></div></div>)}</div></div>;
}

function TextAreaField({ label, value, onChange, placeholder, required = false }) {
  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label-bold font-label-bold text-on-surface">{label}</span>
      <textarea required={required} className="min-h-28 rounded-lg border border-outline-variant bg-surface px-md py-2.5 text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function AdminReviewPanel({ task }) {
  const data = useData();
  const notify = useToast();
  const { profile } = useAuth();
  const submission = data.submissions.find((s) => s.task_id === task.id);
  const [rating, setRating] = useState({ rating: 5, remarks: "" });
  const [managerRemarks, setManagerRemarks] = useState(task.manager_remarks || "");
  const [revisionDueAt, setRevisionDueAt] = useState(task.revision_due_at ? task.revision_due_at.slice(0, 16) : "");
  const [payment, setPayment] = useState({ method: "JazzCash", transaction_number: "", file: null });
  const review = async (status) => {
    if (submission) await data.updateStatus("submissions", submission.id, status);
    const reviewerNotes = profile.role === "manager" ? managerRemarks : rating.remarks;
    const revisionPatch = status === "revision required" ? {
      revision_notes: reviewerNotes,
      revision_due_at: revisionDueAt ? new Date(revisionDueAt).toISOString() : null,
      revision_requested_by: profile.id,
      revision_requested_at: new Date().toISOString()
    } : {};
    if (profile.role === "manager" && status === "approved") {
      const forwardSummary = buildManagerForwardSummary(task, data, managerRemarks);
      await data.saveProgress({ task_id: task.id, employee_id: task.student_id, progress_percent: 100, notes: managerRemarks || "Manager approved and forwarded to admin.", update_date: new Date().toISOString().slice(0, 10), created_at: new Date().toISOString() });
      await data.saveTask({ ...task, status: "submitted", progress_percent: 100, final_forwarded_to_admin: true, manager_remarks: managerRemarks, manager_forward_summary: forwardSummary, manager_reviewed_at: new Date().toISOString() });
      notify("Task marked 100% complete and forwarded to admin.");
      return;
    }
    if (profile.role === "manager") {
      await data.saveTask({ ...task, ...revisionPatch, status, manager_remarks: managerRemarks, manager_reviewed_at: new Date().toISOString() });
      notify(`Task marked ${status}.`);
      return;
    }
    await data.saveTask({ ...task, ...revisionPatch, status: status === "approved" ? "done" : status, admin_remarks: rating.remarks, admin_reviewed_at: new Date().toISOString(), final_forwarded_to_admin: status === "approved" ? false : task.final_forwarded_to_admin });
    if (status === "approved") await data.saveRating({ task_id: task.id, student_id: task.student_id, rating: Number(rating.rating), remarks: rating.remarks, created_at: new Date().toISOString() });
    notify(`Admin marked task ${status}.`);
  };
  const releasePayment = async () => {
    const screenshot_url = await data.uploadPaymentProof(payment.file, `${task.student_id}/${task.id}-${Date.now()}-${payment.file?.name || "payment-proof"}`);
    await data.savePayment({ task_id: task.id, employee_id: task.student_id, released_by: profile.id, amount: Number(task.payment_amount || 0), method: payment.method, transaction_number: payment.transaction_number, screenshot_url, status: "released", released_at: new Date().toISOString() });
    await data.saveTask({ ...task, payment_status: "released" });
    notify("Payment released.");
  };
  return <div className="space-y-md rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1"><h3 className="text-h3 font-h3">Review Submission</h3>{submission ? <><Info label="Submission URL" value={<a className="text-primary" href={submission.submission_url} target="_blank" rel="noreferrer">{submission.submission_url}</a>} /><Info label="Time Spent" value={submission.time_spent} /><p className="rounded-lg bg-surface-container-low p-md text-body-md">{submission.notes}</p></> : task.final_forwarded_to_admin ? <p className="rounded-lg bg-surface-container-low p-md text-body-md text-on-surface-variant">Manager forwarded this task to admin review without a separate submission link.</p> : profile.role === "manager" ? <p className="rounded-lg bg-surface-container-low p-md text-body-md text-on-surface-variant">Review the employee progress and add manager remarks before forwarding to admin.</p> : <EmptyState title="No submission" body="Employee submission details will appear here." />}{task.manager_forward_summary && <ForwardSummary summary={task.manager_forward_summary} />}{task.manager_remarks && <Info label="Manager Remarks" value={task.manager_remarks} />}{profile.role === "manager" ? <TextAreaField label="Manager Remarks / Revision Fixes" value={managerRemarks} onChange={setManagerRemarks} placeholder="Write exactly what employee needs to fix before resubmitting..." /> : <><Field label="Rating" type="number" value={rating.rating} onChange={(value) => setRating({ ...rating, rating: value })} /><TextAreaField label="Admin Remarks / Revision Fixes" value={rating.remarks || task.admin_remarks || ""} onChange={(remarks) => setRating({ ...rating, remarks })} placeholder="Write exactly what needs to be fixed before resubmission..." /></>}<Field label="Revision Due Date" type="datetime-local" value={revisionDueAt} onChange={setRevisionDueAt} required={false} /><div className="grid grid-cols-1 gap-sm"><button className="rounded-lg bg-secondary px-4 py-2 text-white" onClick={() => review("approved")}>{profile.role === "manager" ? "Approve 100% & Forward to Admin" : "Accept / Approve Work"}</button><button className="rounded-lg bg-[#FFAB00] px-4 py-2 text-on-surface" onClick={() => review("revision required")}>Send for Revision</button><button className="rounded-lg bg-error px-4 py-2 text-white" onClick={() => review("rejected")}>Reject Work</button></div>{profile.role === "admin" && <div className="mt-lg space-y-md rounded-lg border border-outline-variant/50 bg-surface-container-low p-md"><h4 className="font-semibold">Release Payment</h4><SelectField label="Payment Company" value={payment.method} onChange={(method) => setPayment({ ...payment, method })} options={["JazzCash", "EasyPaisa", "Bank Transfer", "Cash", "Other"]} /><Field label="Transaction Number" value={payment.transaction_number} onChange={(transaction_number) => setPayment({ ...payment, transaction_number })} required={false} /><label className="flex flex-col gap-xs"><span className="text-label-bold font-label-bold">Payment Screenshot (max 100KB)</span><input className="rounded-lg border border-outline-variant bg-surface px-md py-2" type="file" accept="image/*" onChange={(e) => setPayment({ ...payment, file: e.target.files?.[0] })} /></label><button className="w-full rounded-lg bg-primary px-4 py-2 text-white" onClick={releasePayment} type="button">Release Payment</button></div>}</div>;
}

function SubmissionsPage() {
  const data = useData();
  const submittedTaskIds = new Set(data.submissions.map((submission) => submission.task_id));
  const forwardedTasks = data.tasks.filter((task) => task.final_forwarded_to_admin && !submittedTaskIds.has(task.id));
  const rows = [
    ...data.submissions.map((submission) => ({ type: "submission", id: submission.id, submission, task: data.tasks.find((task) => task.id === submission.task_id) })),
    ...forwardedTasks.map((task) => ({ type: "forwarded", id: task.id, submission: null, task }))
  ];
  return <Shell role="admin" title="Submissions Review"><div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-level-1"><div className="overflow-x-auto"><table className="sheet-table"><thead><tr><th>Task</th><th>Employee</th><th>Submitted</th><th>Link</th><th>Manager Remarks</th><th>Status</th><th className="text-right">Action</th></tr></thead><tbody>{rows.map((row) => { const task = row.task; const student = data.profiles.find((p) => p.id === task?.student_id); return <tr key={`${row.type}-${row.id}`}><td>{task?.task_title}</td><td>{student?.full_name}</td><td>{row.submission?.submitted_at ? new Date(row.submission.submitted_at).toLocaleString() : task?.manager_reviewed_at ? new Date(task.manager_reviewed_at).toLocaleString() : "-"}</td><td>{row.submission?.submission_url ? <a className="text-primary" href={row.submission.submission_url} target="_blank" rel="noreferrer">Open</a> : <span className="text-on-surface-variant">Manager forwarded</span>}</td><td className="max-w-xs truncate">{task?.manager_remarks || "-"}</td><td><StatusBadge status={task?.status || row.submission?.status} /></td><td className="text-right"><button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white" onClick={() => navigate(`/admin/tasks/${task?.id}`)}>Review</button></td></tr>; })}</tbody></table></div>{!rows.length && <div className="p-lg"><EmptyState title="No submissions yet" body="Submitted or manager-forwarded SEO work will be queued for review here." /></div>}</div></Shell>;
}

function PaymentsPage() {
  const data = useData();
  const payableTasks = data.tasks.filter((task) => ["done", "approved"].includes(String(task.status).toLowerCase()) || task.payment_status === "released");
  const pending = payableTasks.filter((task) => task.payment_status !== "released");
  const released = payableTasks.filter((task) => task.payment_status === "released");
  const totalPending = pending.reduce((sum, task) => sum + Number(task.payment_amount || 0), 0);
  const totalReleased = released.reduce((sum, task) => sum + Number(task.payment_amount || 0), 0);
  return (
    <Shell role="admin" title="Payments Queue">
      <div className="mx-auto max-w-7xl space-y-lg">
        <div className="grid grid-cols-1 gap-md md:grid-cols-4">
          <Card title="Payable Tasks" value={payableTasks.length} meta="Approved/completed" icon="task_alt" />
          <Card title="Pending Payments" value={pending.length} meta={`Rs. ${totalPending}`} icon="pending_actions" accent="text-[#FFAB00]" />
          <Card title="Released" value={released.length} meta={`Rs. ${totalReleased}`} icon="payments" accent="text-secondary" />
          <Card title="Total Amount" value={`Rs. ${totalPending + totalReleased}`} meta="Payable + released" icon="account_balance_wallet" />
        </div>
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-level-1">
          <div className="overflow-x-auto">
            <table className="sheet-table">
              <thead><tr><th>Task</th><th>Employee Contact</th><th>Website</th><th>Amount</th><th>Method</th><th>Transaction</th><th>Released At</th><th>Status</th><th className="text-right">Action</th></tr></thead>
              <tbody>{payableTasks.map((task) => {
                const employee = data.profiles.find((profile) => profile.id === task.student_id);
                const project = data.projects.find((item) => item.id === task.project_id);
                const payment = data.payments.find((item) => item.task_id === task.id);
                return <tr key={task.id}><td><button className="font-semibold text-primary" onClick={() => navigate(`/admin/tasks/${task.id}`)} type="button">{task.task_title}</button><div className="text-body-sm text-on-surface-variant">{task.task_type}</div></td><td><div>{employee?.full_name || "-"}</div><div className="text-body-sm text-on-surface-variant">{employee?.email || "-"}</div><div className="text-body-sm text-on-surface-variant">{employee?.phone || "-"}</div></td><td><ProjectTag project={project} /></td><td>Rs. {Number(payment?.amount || task.payment_amount || 0)}</td><td>{payment?.method || "-"}</td><td>{payment?.transaction_number || "-"}</td><td>{payment?.released_at ? new Date(payment.released_at).toLocaleString() : "-"}</td><td><StatusBadge status={task.payment_status === "released" ? "approved" : "pending"} /></td><td className="text-right"><button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white" onClick={() => navigate(`/admin/tasks/${task.id}`)} type="button">{task.payment_status === "released" ? "View" : "Release"}</button></td></tr>;
              })}</tbody>
            </table>
          </div>
          {!payableTasks.length && <div className="p-lg"><EmptyState title="No payments queued" body="Approved or completed tasks will appear here for payment release." /></div>}
        </div>
      </div>
    </Shell>
  );
}

function ManagerPerformancePage() {
  const data = useData();
  const managers = data.profiles.filter((profile) => profile.role === "manager");
  const rows = managers.map((manager) => {
    const managerTasks = data.tasks.filter((task) => task.manager_id === manager.id || task.assigned_by === manager.id);
    const forwarded = managerTasks.filter((task) => task.final_forwarded_to_admin).length;
    const rejectedByAdmin = managerTasks.filter((task) => String(task.status).toLowerCase() === "rejected" && task.admin_reviewed_at).length;
    const avgProgress = managerTasks.length ? Math.round(managerTasks.reduce((sum, task) => sum + getLatestTaskProgress(task, data.progressUpdates), 0) / managerTasks.length) : 0;
    const reviewedTasks = managerTasks.filter((task) => task.manager_reviewed_at);
    const reviewHours = reviewedTasks.map((task) => {
      const submission = data.submissions.find((item) => item.task_id === task.id);
      const start = submission?.submitted_at || task.created_at;
      return start ? (new Date(task.manager_reviewed_at) - new Date(start)) / 3600000 : 0;
    }).filter((hours) => Number.isFinite(hours) && hours >= 0);
    const avgReviewSpeed = reviewHours.length ? reviewHours.reduce((sum, hours) => sum + hours, 0) / reviewHours.length : 0;
    const activeEmployees = new Set(managerTasks.map((task) => task.student_id).filter(Boolean)).size;
    return { manager, managerTasks, assigned: managerTasks.length, forwarded, rejectedByAdmin, avgProgress, avgReviewSpeed, activeEmployees };
  });
  const totalAssigned = rows.reduce((sum, row) => sum + row.assigned, 0);
  const totalForwarded = rows.reduce((sum, row) => sum + row.forwarded, 0);
  const totalRejected = rows.reduce((sum, row) => sum + row.rejectedByAdmin, 0);
  const overallProgress = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.avgProgress, 0) / rows.length) : 0;
  return (
    <Shell role="admin" title="Manager Performance">
      <div className="mx-auto max-w-7xl space-y-lg">
        <div className="grid grid-cols-1 gap-md md:grid-cols-5">
          <Card title="Managers" value={managers.length} meta="Approved team leads" icon="supervisor_account" />
          <Card title="Assigned Tasks" value={totalAssigned} meta="Under managers" icon="assignment" />
          <Card title="Forwarded Tasks" value={totalForwarded} meta="Sent to admin" icon="forward_to_inbox" accent="text-primary" />
          <Card title="Rejected by Admin" value={totalRejected} meta="Quality misses" icon="cancel" accent="text-error" />
          <Card title="Avg Progress" value={`${overallProgress}%`} meta="Across managers" icon="trending_up" />
        </div>
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-level-1">
          <div className="overflow-x-auto">
            <table className="sheet-table">
              <thead><tr><th>Manager</th><th>Contact</th><th>Employees</th><th>Assigned Tasks</th><th>Forwarded</th><th>Rejected by Admin</th><th>Avg Progress</th><th>Review Speed</th><th>Status</th><th className="text-right">Action</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={row.manager.id}><td><div className="font-semibold">{row.manager.full_name || "Manager"}</div><div className="text-body-sm text-on-surface-variant">ID: {row.manager.id.slice(0, 8)}</div></td><td><div>{row.manager.email}</div><div className="text-body-sm text-on-surface-variant">{row.manager.phone || "-"}</div></td><td>{row.activeEmployees}</td><td>{row.assigned}</td><td>{row.forwarded}</td><td>{row.rejectedByAdmin}</td><td><div className="min-w-[120px]"><div className="mb-1 text-body-sm">{row.avgProgress}%</div><div className="h-1.5 rounded-full bg-surface-container-high"><div className="h-full rounded-full bg-primary" style={{ width: `${row.avgProgress}%` }} /></div></div></td><td>{row.avgReviewSpeed ? `${row.avgReviewSpeed.toFixed(1)}h avg` : "-"}</td><td><StatusBadge status={row.manager.status === "approved" ? "approved" : row.manager.status} /></td><td className="text-right"><button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white" onClick={() => navigate("/admin/tasks")} type="button">View Tasks</button></td></tr>)}</tbody>
            </table>
          </div>
          {!rows.length && <div className="p-lg"><EmptyState title="No managers yet" body="Promote an employee to manager to start tracking manager performance." /></div>}
        </div>
      </div>
    </Shell>
  );
}

function ManagerDashboard() {
  const { profile } = useAuth();
  const data = useData();
  const teamTasks = data.tasks.filter((task) => task.manager_id === profile.id || task.assigned_by === profile.id);
  const avgProgress = teamTasks.length ? Math.round(teamTasks.reduce((sum, task) => sum + getLatestTaskProgress(task, data.progressUpdates), 0) / teamTasks.length) : 0;
  return <Shell role="manager" title="Manager Dashboard"><div className="mx-auto max-w-7xl space-y-lg"><div className="grid grid-cols-1 gap-md md:grid-cols-4"><Card title="Team Tasks" value={teamTasks.length} meta="Assigned or created" icon="assignment" /><Card title="Submitted" value={teamTasks.filter((t) => t.status === "submitted").length} meta="Need review" /><Card title="Forwarded" value={teamTasks.filter((t) => t.final_forwarded_to_admin).length} meta="Sent to admin" /><Card title="Avg Progress" value={`${avgProgress}%`} meta="Team completion" /></div><TasksTable studentId={profile.id} /></div></Shell>;
}

function ManagerReviewInbox() {
  const { profile } = useAuth();
  const data = useData();
  const teamTasks = data.tasks.filter((task) => task.manager_id === profile.id || task.assigned_by === profile.id);
  const submitted = teamTasks.filter((task) => String(task.status).toLowerCase() === "submitted" && !task.final_forwarded_to_admin);
  const revisionReplies = teamTasks.filter((task) => {
    const submission = data.submissions.find((item) => item.task_id === task.id);
    return String(task.status).toLowerCase() === "revision required" || String(submission?.status).toLowerCase() === "revision required";
  });
  const overdue = teamTasks.filter((task) => task.deadline && new Date(task.deadline) < new Date() && !["done", "approved", "rejected"].includes(String(task.status).toLowerCase()));
  const readyToForward = teamTasks.filter((task) => getLatestTaskProgress(task, data.progressUpdates) >= 100 && !task.final_forwarded_to_admin && !["done", "approved", "rejected"].includes(String(task.status).toLowerCase()));
  const taskEmployee = (task) => data.profiles.find((person) => person.id === task.student_id);
  const taskProject = (task) => data.projects.find((project) => project.id === task.project_id);
  return (
    <Shell role="manager" title="Manager Review Inbox">
      <div className="mx-auto max-w-7xl space-y-lg">
        <div className="grid grid-cols-1 gap-md md:grid-cols-4">
          <Card title="Submitted" value={submitted.length} meta="Need manager review" icon="publish" onClick={() => navigate("/manager/inbox")} />
          <Card title="Revision Replies" value={revisionReplies.length} meta="Need re-check" icon="rate_review" accent="text-[#FFAB00]" onClick={() => navigate("/manager/inbox")} />
          <Card title="Overdue" value={overdue.length} meta="Deadline passed" icon="warning" accent="text-error" onClick={() => navigate("/manager/inbox")} />
          <Card title="Ready to Forward" value={readyToForward.length} meta="Progress 100%" icon="forward_to_inbox" accent="text-primary" onClick={() => navigate("/manager/inbox")} />
        </div>
        <ManagerInboxSection title="Employee Submitted Tasks" icon="publish" empty="No employee submitted tasks waiting for review.">
          {submitted.map((task) => <ManagerInboxRow key={task.id} task={task} employee={taskEmployee(task)} project={taskProject(task)} note={data.submissions.find((item) => item.task_id === task.id)?.notes || "Employee submitted work for review."} actionLabel="Review" />)}
        </ManagerInboxSection>
        <ManagerInboxSection title="Revision Replies" icon="rate_review" empty="No revision replies currently waiting.">
          {revisionReplies.map((task) => <ManagerInboxRow key={task.id} task={task} employee={taskEmployee(task)} project={taskProject(task)} note={task.revision_notes || "Revision needs manager re-check."} actionLabel="Re-check" />)}
        </ManagerInboxSection>
        <ManagerInboxSection title="Overdue Tasks" icon="warning" empty="No overdue tasks for your team.">
          {overdue.map((task) => <ManagerInboxRow key={task.id} task={task} employee={taskEmployee(task)} project={taskProject(task)} note={`Deadline: ${new Date(task.deadline).toLocaleString()}`} actionLabel="Open" />)}
        </ManagerInboxSection>
        <ManagerInboxSection title="Tasks Ready to Forward Admin" icon="forward_to_inbox" empty="No 100% tasks waiting to be forwarded.">
          {readyToForward.map((task) => <ManagerInboxRow key={task.id} task={task} employee={taskEmployee(task)} project={taskProject(task)} note="Progress is 100%. Add manager remarks and forward to admin." actionLabel="Forward" />)}
        </ManagerInboxSection>
      </div>
    </Shell>
  );
}

function ManagerInboxSection({ title, icon, empty, children }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-level-1"><div className="flex items-center gap-sm border-b border-outline-variant/50 bg-surface-container-low px-lg py-md"><Icon className="text-primary">{icon}</Icon><h2 className="text-h3 font-h3">{title}</h2><span className="ml-auto rounded-full bg-surface px-sm py-1 text-label-bold font-label-bold text-on-surface-variant">{items.length}</span></div>{items.length ? <div>{items}</div> : <div className="p-lg"><EmptyState title={empty} body="New team items will appear here automatically." /></div>}</section>;
}

function ManagerInboxRow({ task, employee, project, note, actionLabel }) {
  const progress = getLatestTaskProgress(task, useData().progressUpdates);
  return <div className="grid grid-cols-1 items-center gap-md border-t border-outline-variant/30 p-md md:grid-cols-[1.3fr_1fr_1fr_1fr_1.2fr_auto]"><div><button className="font-semibold text-primary" onClick={() => navigate(`/manager/tasks/${task.id}`)} type="button">{task.task_title}</button><p className="text-body-sm text-on-surface-variant">{task.task_type}</p></div><div><p>{employee?.full_name || "-"}</p><p className="text-body-sm text-on-surface-variant">{employee?.email || ""}</p></div><ProjectTag project={project} /><div><div className="mb-1 text-body-sm">{progress}%</div><div className="h-1.5 rounded-full bg-surface-container-high"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div></div><p className="line-clamp-2 text-body-sm text-on-surface-variant">{note}</p><div className="flex items-center justify-end gap-sm"><StatusBadge status={task.status} /><button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white" onClick={() => navigate(`/manager/tasks/${task.id}`)} type="button">{actionLabel}</button></div></div>;
}

function ManagerTeamPerformance() {
  const { profile } = useAuth();
  const data = useData();
  const teamTasks = data.tasks.filter((task) => task.manager_id === profile.id || task.assigned_by === profile.id);
  const employeeIds = [...new Set(teamTasks.map((task) => task.student_id).filter(Boolean))];
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const rows = employeeIds.map((employeeId) => {
    const employee = data.profiles.find((person) => person.id === employeeId);
    const tasks = teamTasks.filter((task) => task.student_id === employeeId);
    const avgProgress = tasks.length ? Math.round(tasks.reduce((sum, task) => sum + getLatestTaskProgress(task, data.progressUpdates), 0) / tasks.length) : 0;
    const submitted = tasks.filter((task) => String(task.status).toLowerCase() === "submitted").length;
    const revisions = tasks.filter((task) => String(task.status).toLowerCase() === "revision required").length;
    const late = tasks.filter((task) => task.deadline && new Date(task.deadline) < new Date() && !["done", "approved", "rejected"].includes(String(task.status).toLowerCase())).length;
    const completedThisWeek = tasks.filter((task) => ["done", "approved"].includes(String(task.status).toLowerCase()) && new Date(task.updated_at || task.created_at) >= startOfWeek).length;
    return { employee, tasks, avgProgress, submitted, revisions, late, completedThisWeek };
  });
  const teamAvgProgress = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.avgProgress, 0) / rows.length) : 0;
  return (
    <Shell role="manager" title="Team Performance">
      <div className="mx-auto max-w-7xl space-y-lg">
        <div className="grid grid-cols-1 gap-md md:grid-cols-5">
          <Card title="Employees" value={rows.length} meta="In your team" icon="group" />
          <Card title="Assigned Tasks" value={teamTasks.length} meta="Total workload" icon="assignment" />
          <Card title="Avg Progress" value={`${teamAvgProgress}%`} meta="Team average" icon="trending_up" />
          <Card title="Revision Count" value={rows.reduce((sum, row) => sum + row.revisions, 0)} meta="Needs fixes" icon="rate_review" accent="text-[#FFAB00]" />
          <Card title="Late Tasks" value={rows.reduce((sum, row) => sum + row.late, 0)} meta="Past deadline" icon="warning" accent="text-error" />
        </div>
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-level-1">
          <div className="overflow-x-auto">
            <table className="sheet-table">
              <thead><tr><th>Employee</th><th>Contact</th><th>Assigned Tasks</th><th>Average Progress</th><th>Submitted</th><th>Revision Count</th><th>Late Tasks</th><th>Completed This Week</th><th className="text-right">Action</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={row.employee?.id || row.tasks[0]?.student_id}><td><div className="font-semibold">{row.employee?.full_name || "Employee"}</div><div className="text-body-sm text-on-surface-variant">ID: {(row.employee?.id || "").slice(0, 8)}</div></td><td><div>{row.employee?.email || "-"}</div><div className="text-body-sm text-on-surface-variant">{row.employee?.phone || "-"}</div></td><td>{row.tasks.length}</td><td><div className="min-w-[120px]"><div className="mb-1 text-body-sm">{row.avgProgress}%</div><div className="h-1.5 rounded-full bg-surface-container-high"><div className="h-full rounded-full bg-primary" style={{ width: `${row.avgProgress}%` }} /></div></div></td><td>{row.submitted}</td><td>{row.revisions}</td><td>{row.late}</td><td>{row.completedThisWeek}</td><td className="text-right"><button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white" onClick={() => navigate("/manager/tasks")} type="button">View Tasks</button></td></tr>)}</tbody>
            </table>
          </div>
          {!rows.length && <div className="p-lg"><EmptyState title="No team performance yet" body="Assign tasks to employees to see performance metrics here." /></div>}
        </div>
      </div>
    </Shell>
  );
}

function ManagerTasksPage() {
  const { profile } = useAuth();
  const data = useData();
  const notify = useToast();
  return <Shell role="manager" title="Team Tasks"><div className="space-y-lg"><TaskForm managerMode onSave={async (task) => { await data.saveTask(task); notify("Employee task assigned."); }} /><TasksTable studentId={profile.id} /></div></Shell>;
}

function ManagerSubmissionsPage() {
  const { profile } = useAuth();
  const data = useData();
  const rows = data.submissions.filter((submission) => {
    const task = data.tasks.find((item) => item.id === submission.task_id);
    return task?.manager_id === profile.id;
  });
  return <Shell role="manager" title="Team Submissions"><div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-level-1"><div className="overflow-x-auto"><table className="sheet-table"><thead><tr><th>Task</th><th>Employee</th><th>Submitted</th><th>Link</th><th>Status</th><th className="text-right">Action</th></tr></thead><tbody>{rows.map((s) => { const task = data.tasks.find((t) => t.id === s.task_id); const employee = data.profiles.find((p) => p.id === s.student_id); return <tr key={s.id}><td>{task?.task_title}</td><td>{employee?.full_name}</td><td>{new Date(s.submitted_at).toLocaleString()}</td><td><a className="text-primary" href={s.submission_url} target="_blank" rel="noreferrer">Open</a></td><td><StatusBadge status={s.status} /></td><td className="text-right"><button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white" onClick={() => navigate(`/manager/tasks/${task?.id}`)}>Review</button></td></tr>; })}</tbody></table></div>{!rows.length && <div className="p-lg"><EmptyState title="No team submissions yet" body="Employee submissions assigned to you will appear here." /></div>}</div></Shell>;
}

function EmployeeDashboard() {
  const { profile } = useAuth();
  const data = useData();
  const mine = data.tasks.filter((t) => t.student_id === profile.id);
  return <Shell role="employee" title="Employee Dashboard"><div className="mx-auto max-w-7xl space-y-lg"><div className="grid grid-cols-1 gap-md md:grid-cols-4"><Card title="Total Tasks" value={mine.length} meta="Assigned to you" icon="assignment" /><Card title="Completed" value={mine.filter((t) => ["done", "approved"].includes(t.status)).length} meta="Reviewed work" accent="text-secondary" /><Card title="Pending" value={mine.filter((t) => t.status === "pending").length} meta="Waiting to start" /><Card title="Submitted" value={mine.filter((t) => t.status === "submitted").length} meta="Under review" /></div><TasksTable studentId={profile.id} /></div></Shell>;
}

function EmployeeTasksPage() {
  const { profile } = useAuth();
  return <Shell role="employee" title="My Tasks"><TasksTable studentId={profile.id} /></Shell>;
}

function AttendancePage({ role }) {
  const { profile } = useAuth();
  const data = useData();
  const notify = useToast();
  const today = toDateKey();
  const visibleEmployees = data.profiles.filter((person) => {
    if (person.role !== "employee") return false;
    if (role === "manager") return data.tasks.some((task) => (task.manager_id === profile.id || task.assigned_by === profile.id) && task.student_id === person.id);
    if (role === "employee") return person.id === profile.id;
    return true;
  });
  const emptyFilters = { employee: role === "employee" ? profile.id : "", status: "", from: "", to: "" };
  const [filters, setFilters] = useState(emptyFilters);
  const [manual, setManual] = useState({ employee_id: visibleEmployees[0]?.id || "", attendance_date: today, check_in_time: "09:00", check_out_time: "18:00", status: "present", notes: "" });
  useEffect(() => {
    if (role === "admin" && !visibleEmployees.some((employee) => employee.id === manual.employee_id)) {
      setManual((current) => ({ ...current, employee_id: visibleEmployees[0]?.id || "" }));
    }
  }, [role, visibleEmployees.map((employee) => employee.id).join(","), manual.employee_id]);
  const rows = getAttendanceRows(data, { role, profile, filters });
  const visibleEmployeeOptions = visibleEmployees.map((employee) => ({ value: employee.id, label: employee.full_name || employee.email || employee.id }));
  const todayRecord = data.attendanceRecords.find((record) => record.employee_id === profile.id && record.attendance_date === today);
  const present = rows.filter((row) => row.status === "present").length;
  const late = rows.filter((row) => row.status === "late").length;
  const absent = rows.filter((row) => row.status === "absent").length;
  const totalMinutes = rows.reduce((sum, row) => sum + row.workMinutes, 0);

  const saveEmployeeCheck = async (type) => {
    try {
      const now = new Date();
      const existing = data.attendanceRecords.find((record) => record.employee_id === profile.id && record.attendance_date === today);
      if (type === "in" && existing?.check_in_at) throw new Error("You already checked in today.");
      if (type === "out" && !existing?.check_in_at) throw new Error("Check in first.");
      const next = type === "in"
        ? { ...(existing || {}), employee_id: profile.id, attendance_date: today, check_in_at: now.toISOString(), status: attendanceStatusFor(now.toISOString()), notes: existing?.notes || "" }
        : { ...existing, check_out_at: now.toISOString(), work_minutes: minutesBetween(existing.check_in_at, now.toISOString()) };
      await data.saveAttendance(next);
      notify(type === "in" ? "Check-in recorded." : "Check-out recorded.");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const saveManualAttendance = async (event) => {
    event.preventDefault();
    try {
      if (!manual.employee_id) throw new Error("Select an employee.");
      const checkInAt = manual.status === "absent" ? "" : `${manual.attendance_date}T${manual.check_in_time}:00`;
      const checkOutAt = manual.status === "absent" || !manual.check_out_time ? "" : `${manual.attendance_date}T${manual.check_out_time}:00`;
      const existing = data.attendanceRecords.find((record) => record.employee_id === manual.employee_id && record.attendance_date === manual.attendance_date);
      await data.saveAttendance({
        ...(existing || {}),
        employee_id: manual.employee_id,
        attendance_date: manual.attendance_date,
        check_in_at: checkInAt,
        check_out_at: checkOutAt,
        work_minutes: minutesBetween(checkInAt, checkOutAt),
        status: manual.status === "present" && checkInAt ? attendanceStatusFor(checkInAt) : manual.status,
        notes: manual.notes
      });
      notify("Attendance saved.");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const exportAttendancePdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Attendance Report", 14, 14);
    autoTable(doc, {
      head: [["Employee", "Date", "Check In", "Check Out", "Work Hours", "Status", "Notes"]],
      body: rows.map((row) => [row.employee?.full_name || "-", row.attendance_date, row.check_in_at ? new Date(row.check_in_at).toLocaleTimeString() : "-", row.check_out_at ? new Date(row.check_out_at).toLocaleTimeString() : "-", formatWorkMinutes(row.workMinutes), row.status, row.notes || ""]),
      startY: 20,
      styles: { fontSize: 9 }
    });
    doc.save("attendance-report.pdf");
    notify("Attendance PDF generated.");
  };

  const exportAttendanceExcel = () => {
    const headers = ["Employee", "Date", "Check In", "Check Out", "Work Hours", "Status", "Notes"];
    const body = rows.map((row) => [row.employee?.full_name || "-", row.attendance_date, row.check_in_at ? new Date(row.check_in_at).toLocaleTimeString() : "-", row.check_out_at ? new Date(row.check_out_at).toLocaleTimeString() : "-", formatWorkMinutes(row.workMinutes), row.status, row.notes || ""]);
    const csv = [headers, ...body].map((line) => line.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendance-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("Attendance CSV generated.");
  };

  return (
    <Shell role={role} title="Attendance">
      <div className="mx-auto max-w-7xl space-y-lg">
        <div className="grid grid-cols-1 gap-md md:grid-cols-4">
          <Card title="Present" value={present} meta="On-time records" icon="check_circle" accent="text-secondary" />
          <Card title="Late Arrivals" value={late} meta="After 9:15 AM" icon="schedule" accent="text-[#FFAB00]" />
          <Card title="Absents" value={absent} meta="Marked absent" icon="cancel" accent="text-error" />
          <Card title="Work Hours" value={formatWorkMinutes(totalMinutes)} meta="Filtered total" icon="timer" />
        </div>
        {role === "employee" && (
          <div className="rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1">
            <div className="flex flex-col justify-between gap-md md:flex-row md:items-center">
              <div>
                <h2 className="text-h3 font-h3">Today</h2>
                <p className="mt-1 text-body-md text-on-surface-variant">Check in, check out, and see calculated work hours for {today}.</p>
              </div>
              <div className="flex flex-wrap gap-sm">
                <button className="rounded-lg bg-primary px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={Boolean(todayRecord?.check_in_at)} onClick={() => saveEmployeeCheck("in")} type="button">Check In</button>
                <button className="rounded-lg bg-secondary px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!todayRecord?.check_in_at || Boolean(todayRecord?.check_out_at)} onClick={() => saveEmployeeCheck("out")} type="button">Check Out</button>
              </div>
            </div>
            <div className="mt-md grid grid-cols-1 gap-md md:grid-cols-4">
              <div><p className="text-label-bold font-label-bold text-on-surface-variant">Check In</p><p className="mt-1 font-semibold">{todayRecord?.check_in_at ? new Date(todayRecord.check_in_at).toLocaleTimeString() : "-"}</p></div>
              <div><p className="text-label-bold font-label-bold text-on-surface-variant">Check Out</p><p className="mt-1 font-semibold">{todayRecord?.check_out_at ? new Date(todayRecord.check_out_at).toLocaleTimeString() : "-"}</p></div>
              <div><p className="text-label-bold font-label-bold text-on-surface-variant">Work Hours</p><p className="mt-1 font-semibold">{formatWorkMinutes(Number(todayRecord?.work_minutes ?? minutesBetween(todayRecord?.check_in_at, todayRecord?.check_out_at)))}</p></div>
              <div><p className="text-label-bold font-label-bold text-on-surface-variant">Status</p><div className="mt-1"><StatusBadge status={todayRecord?.status || "absent"} /></div></div>
            </div>
          </div>
        )}
        {role === "admin" && (
          <form className="rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1" onSubmit={saveManualAttendance}>
            <h2 className="mb-md text-h3 font-h3">Manual Attendance</h2>
            <div className="grid grid-cols-1 gap-md md:grid-cols-7">
              <SelectField label="Employee" value={manual.employee_id} onChange={(employee_id) => setManual({ ...manual, employee_id })} options={visibleEmployeeOptions} />
              <Field label="Date" type="date" value={manual.attendance_date} onChange={(attendance_date) => setManual({ ...manual, attendance_date })} />
              <Field label="Check In" type="time" value={manual.check_in_time} onChange={(check_in_time) => setManual({ ...manual, check_in_time })} required={false} />
              <Field label="Check Out" type="time" value={manual.check_out_time} onChange={(check_out_time) => setManual({ ...manual, check_out_time })} required={false} />
              <SelectField label="Status" value={manual.status} onChange={(status) => setManual({ ...manual, status })} options={["present", "late", "absent"]} />
              <Field label="Notes" value={manual.notes} onChange={(notes) => setManual({ ...manual, notes })} required={false} />
              <button className="self-end rounded-lg bg-primary px-lg py-3 text-label-bold font-label-bold text-white" type="submit">Save</button>
            </div>
          </form>
        )}
        <div className="rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1">
          <div className="grid grid-cols-1 gap-md md:grid-cols-5">
            {role !== "employee" && <SelectField label="Employee" value={filters.employee} onChange={(employee) => setFilters({ ...filters, employee })} options={visibleEmployeeOptions} />}
            <SelectField label="Status" value={filters.status} onChange={(status) => setFilters({ ...filters, status })} options={["present", "late", "absent"]} />
            <Field label="From" type="date" value={filters.from} onChange={(from) => setFilters({ ...filters, from })} required={false} />
            <Field label="To" type="date" value={filters.to} onChange={(to) => setFilters({ ...filters, to })} required={false} />
            <button className="self-end rounded-lg border border-outline-variant px-4 py-3 text-label-bold font-label-bold" onClick={() => setFilters(emptyFilters)} type="button">Clear</button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <div className="text-body-md text-on-surface-variant">{rows.length} attendance rows</div>
          <div className="flex flex-wrap gap-sm">
            <button className="rounded-lg bg-primary px-4 py-2 text-white" onClick={exportAttendancePdf} type="button">Export PDF</button>
            <button className="rounded-lg bg-secondary px-4 py-2 text-white" onClick={exportAttendanceExcel} type="button">Export CSV</button>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-level-1">
          <div className="overflow-x-auto">
            <table className="sheet-table">
              <thead><tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Work Hours</th><th>Status</th><th>Notes</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={row.id}><td><div className="font-semibold">{row.employee?.full_name || "Employee"}</div><div className="text-body-sm text-on-surface-variant">{row.employee?.email || "-"}</div></td><td>{row.attendance_date}</td><td>{row.check_in_at ? new Date(row.check_in_at).toLocaleTimeString() : "-"}</td><td>{row.check_out_at ? new Date(row.check_out_at).toLocaleTimeString() : "-"}</td><td>{formatWorkMinutes(row.workMinutes)}</td><td><StatusBadge status={row.status} /></td><td>{row.notes || "-"}</td></tr>)}</tbody>
            </table>
          </div>
          {!rows.length && <div className="p-lg"><EmptyState title="No attendance records" body="Attendance check-ins, absents, and late arrivals will appear here." /></div>}
        </div>
      </div>
    </Shell>
  );
}

function PerformancePage() {
  const { profile } = useAuth();
  const data = useData();
  const mine = data.tasks.filter((t) => t.student_id === profile.id);
  const ratings = data.ratings.filter((r) => r.student_id === profile.id);
  const avg = ratings.length ? (ratings.reduce((s, r) => s + Number(r.rating), 0) / ratings.length).toFixed(1) : "0.0";
  const late = mine.filter((t) => t.deadline && new Date(t.deadline) < new Date() && !["done", "approved"].includes(t.status)).length;
  return <Shell role="employee" title="Performance"><div className="grid grid-cols-1 gap-md md:grid-cols-5"><Card title="Total Tasks" value={mine.length} meta="Assigned" /><Card title="Completed" value={mine.filter((t) => ["done", "approved"].includes(t.status)).length} meta="Finished" accent="text-secondary" /><Card title="Pending" value={mine.filter((t) => t.status === "pending").length} meta="Not started" /><Card title="Late Tasks" value={late} meta="Past deadline" accent="text-error" /><Card title="Average Rating" value={avg} meta="Admin score" icon="star" /></div><div className="mt-lg rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1"><h3 className="mb-md text-h3 font-h3">Ratings & Remarks</h3>{ratings.length ? ratings.map((r) => { const task = data.tasks.find((t) => t.id === r.task_id); return <div key={r.id} className="border-t border-outline-variant/30 py-md"><div className="font-semibold">{task?.task_title}</div><div className="text-[#FFAB00]">Rating: {r.rating}/5</div><p className="text-body-md text-on-surface-variant">{r.remarks}</p></div>; }) : <EmptyState title="No ratings yet" body="Approved task ratings and admin remarks will appear here." />}</div></Shell>;
}

function ReportsPage() {
  const data = useData();
  const notify = useToast();
  const emptyFilters = { student: "", manager: "", project: "", status: "", task_type: "", payment: "", from: "", to: "" };
  const [filters, setFilters] = useState(emptyFilters);
  const [activePreset, setActivePreset] = useState("");
  const setPreset = (preset) => {
    const today = new Date();
    const yyyyMmDd = (date) => date.toISOString().slice(0, 10);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const next = { ...emptyFilters };
    if (preset === "This Week") Object.assign(next, { from: yyyyMmDd(startOfWeek), to: yyyyMmDd(today) });
    if (preset === "This Month") Object.assign(next, { from: yyyyMmDd(startOfMonth), to: yyyyMmDd(today) });
    if (preset === "By Manager") Object.assign(next, { manager: data.profiles.find((profile) => profile.role === "manager")?.id || "" });
    if (preset === "By Employee") Object.assign(next, { student: data.profiles.find((profile) => profile.role === "employee")?.id || "" });
    if (preset === "Payment Pending") Object.assign(next, { payment: "pending", status: "done" });
    if (preset === "Completed Work") Object.assign(next, { status: "done" });
    setFilters(next);
    setActivePreset(preset);
  };
  const rows = data.tasks.filter((task) => (!filters.student || task.student_id === filters.student) && (!filters.manager || task.manager_id === filters.manager) && (!filters.project || task.project_id === filters.project) && (!filters.status || task.status === filters.status) && (!filters.task_type || task.task_type === filters.task_type) && (!filters.payment || (filters.payment === "pending" ? task.payment_status !== "released" : task.payment_status === filters.payment)) && (!filters.from || new Date(task.created_at) >= new Date(filters.from)) && (!filters.to || new Date(task.created_at) <= new Date(`${filters.to}T23:59:59`))).map((task) => {
    const student = data.profiles.find((p) => p.id === task.student_id);
    const manager = data.profiles.find((p) => p.id === task.manager_id);
    const project = data.projects.find((p) => p.id === task.project_id);
    const submission = data.submissions.find((s) => s.task_id === task.id);
    const rating = data.ratings.find((r) => r.task_id === task.id);
    return { "Member Name": student?.full_name || "", Manager: manager?.full_name || "", Date: task.created_at ? new Date(task.created_at).toLocaleDateString() : "", Task: task.task_title, Website: project?.project_name || "", Link: submission?.submission_url || task.target_url || "", "Approx Time": task.approx_time || "", Status: task.status || "", Payment: `Rs. ${Number(task.payment_amount || 0)}`, "Payment Status": task.payment_status || "pending", Rating: rating?.rating || "", Remarks: rating?.remarks || task.admin_remarks || task.manager_remarks || "" };
  });
  const employeeOptions = data.profiles.filter((p) => p.role === "employee").map((p) => ({ value: p.id, label: p.full_name || p.email || p.id }));
  const managerOptions = data.profiles.filter((p) => p.role === "manager").map((p) => ({ value: p.id, label: p.full_name || p.email || p.id }));
  const projectOptions = data.projects.map((p) => ({ value: p.id, label: p.project_name || p.website_url || p.id }));
  const exportPdf = () => { const doc = new jsPDF({ orientation: "landscape" }); doc.text(`SEO TaskFlow Report${activePreset ? ` - ${activePreset}` : ""}`, 14, 14); autoTable(doc, { head: [Object.keys(rows[0] || { "Member Name": "", Manager: "", Date: "", Task: "", Website: "", Link: "", "Approx Time": "", Status: "", Payment: "", "Payment Status": "", Rating: "", Remarks: "" })], body: rows.map(Object.values), startY: 20, styles: { fontSize: 8 } }); doc.save("seo-task-report.pdf"); notify("PDF report generated."); };
  const exportExcel = () => {
    const headers = Object.keys(rows[0] || { "Member Name": "", Manager: "", Date: "", Task: "", Website: "", Link: "", "Approx Time": "", Status: "", Payment: "", "Payment Status": "", Rating: "", Remarks: "" });
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
  return <Shell role="admin" title="Reports"><div className="space-y-lg"><div className="rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1"><div className="mb-md flex flex-wrap items-center gap-sm"><span className="mr-sm text-label-bold font-label-bold text-on-surface-variant">Saved presets</span>{["This Week", "This Month", "By Manager", "By Employee", "Payment Pending", "Completed Work"].map((preset) => <button className={`rounded-full border px-4 py-2 text-label-bold font-label-bold ${activePreset === preset ? "border-primary bg-primary text-white" : "border-outline-variant bg-surface text-on-surface hover:bg-surface-container-low"}`} key={preset} onClick={() => setPreset(preset)} type="button">{preset}</button>)}<button className="rounded-full border border-outline-variant px-4 py-2 text-label-bold font-label-bold text-on-surface-variant" onClick={() => { setFilters(emptyFilters); setActivePreset(""); }} type="button">Clear</button></div><div className="grid grid-cols-1 gap-md md:grid-cols-3 xl:grid-cols-8"><SelectField label="Employee" value={filters.student} onChange={(student) => { setFilters({ ...filters, student }); setActivePreset(""); }} options={employeeOptions} /><SelectField label="Manager" value={filters.manager} onChange={(manager) => { setFilters({ ...filters, manager }); setActivePreset(""); }} options={managerOptions} /><SelectField label="Project" value={filters.project} onChange={(project) => { setFilters({ ...filters, project }); setActivePreset(""); }} options={projectOptions} /><SelectField label="Status" value={filters.status} onChange={(status) => { setFilters({ ...filters, status }); setActivePreset(""); }} options={statusLabels} /><SelectField label="Task Type" value={filters.task_type} onChange={(task_type) => { setFilters({ ...filters, task_type }); setActivePreset(""); }} options={taskTypes} /><SelectField label="Payment" value={filters.payment} onChange={(payment) => { setFilters({ ...filters, payment }); setActivePreset(""); }} options={["pending", "released"]} /><Field label="From" type="date" value={filters.from} onChange={(from) => { setFilters({ ...filters, from }); setActivePreset(""); }} required={false} /><Field label="To" type="date" value={filters.to} onChange={(to) => { setFilters({ ...filters, to }); setActivePreset(""); }} required={false} /></div></div><div className="flex flex-wrap items-center justify-between gap-sm"><div className="text-body-md text-on-surface-variant">{rows.length} report rows{activePreset ? ` using ${activePreset}` : ""}</div><div className="flex flex-wrap gap-sm"><button className="rounded-lg bg-primary px-4 py-2 text-white" onClick={exportPdf}>Export PDF</button><button className="rounded-lg bg-secondary px-4 py-2 text-white" onClick={exportExcel}>Export Excel</button><button className="rounded-lg border border-outline-variant px-4 py-2" onClick={shareWhatsapp}>Share WhatsApp</button></div></div><div className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-level-1"><div className="overflow-x-auto"><table className="sheet-table"><thead><tr>{Object.keys(rows[0] || { "Member Name": "", Manager: "", Date: "", Task: "", Website: "", Link: "", "Approx Time": "", Status: "", Payment: "", "Payment Status": "", Rating: "", Remarks: "" }).map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{Object.entries(row).map(([k, v]) => <td key={k}>{k === "Status" || k === "Payment Status" ? <StatusBadge status={v} /> : v}</td>)}</tr>)}</tbody></table></div>{!rows.length && <div className="p-lg"><EmptyState title="No report rows" body="Adjust filters or choose another saved preset." /></div>}</div></div></Shell>;
}

function SettingsPage({ role }) {
  const { profile } = useAuth();
  const data = useData();
  const notify = useToast();
  const [ownPassword, setOwnPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const people = data.profiles.filter((item) => ["employee", "manager"].includes(item.role));

  const changeOwnPassword = async (event) => {
    event.preventDefault();
    try {
      if (ownPassword.length < 6) throw new Error("Password must be at least 6 characters.");
      if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
      const { error } = await supabase.auth.updateUser({ password: ownPassword });
      if (error) throw error;
      setOwnPassword("");
      notify("Your password has been changed.");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const sendPasswordReset = async (event) => {
    event.preventDefault();
    try {
      if (!resetEmail) throw new Error("Select an employee or manager.");
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/employee/login`
      });
      if (error) throw error;
      setResetEmail("");
      notify("Password reset link sent to employee email.");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  return (
    <Shell role={role} title="Settings">
      <div className="space-y-lg">
        <div className="rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1">
          <h1 className="text-h2 font-h2">Account Settings</h1>
          <p className="mt-2 text-on-surface-variant">Signed in as {profile?.full_name || profile?.email}.</p>
          <div className="mt-lg rounded-lg bg-surface-container-low p-md text-body-sm text-on-surface-variant">Environment: {isSupabaseConfigured ? "Supabase connected" : "Demo mode. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env."}</div>
        </div>
        <form className="rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1" onSubmit={changeOwnPassword}>
          <h2 className="mb-md text-h3 font-h3">Change My Password</h2>
          <div className="grid grid-cols-1 gap-md md:grid-cols-[1fr_auto]">
            <Field label="New Password" type="password" value={ownPassword} onChange={setOwnPassword} placeholder="Enter new password" />
            <button className="self-end rounded-lg bg-primary px-lg py-3 text-label-bold font-label-bold text-white" type="submit">Update Password</button>
          </div>
        </form>
        {role === "admin" && (
          <form className="rounded-xl border border-outline-variant bg-surface p-lg shadow-level-1" onSubmit={sendPasswordReset}>
            <h2 className="mb-sm text-h3 font-h3">Send Employee / Manager Password Reset</h2>
            <p className="mb-md text-body-md text-on-surface-variant">This sends a secure reset link to the selected employee/manager email. No Edge Function or service role key is required.</p>
            <div className="grid grid-cols-1 gap-md md:grid-cols-[1fr_auto]">
              <label className="flex flex-col gap-xs">
                <span className="text-label-bold font-label-bold text-on-surface">Employee / Manager</span>
                <select className="w-full rounded-lg border border-outline-variant bg-surface px-md py-[10px] text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)}>
                  <option value="">Select person</option>
                  {people.map((person) => <option key={person.id} value={person.email}>{person.full_name || person.email} ({person.role}) - {person.email}</option>)}
                </select>
              </label>
              <button className="self-end rounded-lg bg-primary px-lg py-3 text-label-bold font-label-bold text-white" type="submit">Send Reset Link</button>
            </div>
          </form>
        )}
      </div>
    </Shell>
  );
}

function AppRouter() {
  const path = usePath();
  if (path === "/") return <PublicLanding />;
  if (path === "/admin/login") return <LoginPage role="admin" />;
  if (path === "/manager/login") return <LoginPage role="manager" />;
  if (path === "/employee/login" || path === "/student/login") return <LoginPage role="employee" />;
  if (path === "/employee/signup" || path === "/student/signup") return <SignupPage />;
  if (path === "/admin/dashboard") return <Guard role="admin"><AdminDashboard /></Guard>;
  if (path === "/admin/inbox") return <Guard role="admin"><AdminReviewInbox /></Guard>;
  if (path === "/admin/employees" || path === "/admin/students") return <Guard role="admin"><StudentsPage /></Guard>;
  if (path === "/admin/attendance") return <Guard role="admin"><AttendancePage role="admin" /></Guard>;
  if (path === "/admin/tasks") return <Guard role="admin"><TasksPage /></Guard>;
  if (path.startsWith("/admin/tasks/")) return <Guard role="admin"><TaskDetail id={path.split("/").pop()} /></Guard>;
  if (path === "/admin/submissions") return <Guard role="admin"><SubmissionsPage /></Guard>;
  if (path === "/admin/payments") return <Guard role="admin"><PaymentsPage /></Guard>;
  if (path === "/admin/managers") return <Guard role="admin"><ManagerPerformancePage /></Guard>;
  if (path === "/admin/projects") return <Guard role="admin"><ProjectsPage /></Guard>;
  if (path.startsWith("/admin/projects/")) return <Guard role="admin"><ProjectDetailPage id={path.split("/").pop()} /></Guard>;
  if (path === "/admin/reports") return <Guard role="admin"><ReportsPage /></Guard>;
  if (path === "/admin/settings") return <Guard role="admin"><SettingsPage role="admin" /></Guard>;
  if (path === "/manager/dashboard") return <Guard role="manager"><ManagerDashboard /></Guard>;
  if (path === "/manager/inbox") return <Guard role="manager"><ManagerReviewInbox /></Guard>;
  if (path === "/manager/tasks") return <Guard role="manager"><ManagerTasksPage /></Guard>;
  if (path === "/manager/attendance") return <Guard role="manager"><AttendancePage role="manager" /></Guard>;
  if (path === "/manager/performance") return <Guard role="manager"><ManagerTeamPerformance /></Guard>;
  if (path.startsWith("/manager/tasks/")) return <Guard role="manager"><TaskDetail id={path.split("/").pop()} /></Guard>;
  if (path === "/manager/submissions") return <Guard role="manager"><ManagerSubmissionsPage /></Guard>;
  if (path === "/manager/settings") return <Guard role="manager"><SettingsPage role="manager" /></Guard>;
  if (path === "/employee/dashboard" || path === "/student/dashboard") return <Guard role="employee"><EmployeeDashboard /></Guard>;
  if (path === "/employee/attendance" || path === "/student/attendance") return <Guard role="employee"><AttendancePage role="employee" /></Guard>;
  if (path === "/employee/tasks" || path === "/student/tasks") return <Guard role="employee"><EmployeeTasksPage /></Guard>;
  if (path.startsWith("/employee/tasks/") || path.startsWith("/student/tasks/")) return <Guard role="employee"><TaskDetail id={path.split("/").pop()} studentMode /></Guard>;
  if (path === "/employee/performance" || path === "/student/performance") return <Guard role="employee"><PerformancePage /></Guard>;
  if (path === "/employee/settings" || path === "/student/settings") return <Guard role="employee"><SettingsPage role="employee" /></Guard>;
  return <PublicLanding />;
}

function App() {
  return <ToastProvider><AuthProvider><DataProvider><AppRouter /></DataProvider></AuthProvider></ToastProvider>;
}

createRoot(document.getElementById("root")).render(<App />);
