import React, { useState, useEffect } from "react";
import { 
  BarChart3, Users, ShieldAlert, FileText, Activity, Bell, Database, Key, 
  RefreshCw, AlertTriangle, CheckCircle, XCircle, Search, Power, Terminal, 
  PlusCircle, Check, Eye, ChevronRight, X, Shield, Sliders, Play, HardDrive, Wifi,
  Home, Compass, CalendarDays, ShieldCheck, FileSpreadsheet, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAdminAuth } from "./admin/auth/AdminAuthProvider";
import { FEATURES } from "../config/features";

interface AdminOSDashboardProps {
  onClose: () => void;
  lang?: string;
  isSyncEnabled: boolean;
  setIsSyncEnabled: (val: boolean) => void;
  spreadsheetUrl: string;
  setSpreadsheetUrl: (val: string) => void;
  syncLoading: boolean;
  syncError: string | null;
  syncSuccess: boolean;
  handleTriggerSync: () => void;
}

export default function AdminOSDashboard({
  onClose,
  lang = "EN",
  isSyncEnabled,
  setIsSyncEnabled,
  spreadsheetUrl,
  setSpreadsheetUrl,
  syncLoading,
  syncError,
  syncSuccess,
  handleTriggerSync
}: AdminOSDashboardProps) {
  if (!FEATURES.ADMIN_OS_ENABLED) {
    return null;
  }
  
  // Dynamic Authentication and RBAC Privileges
  const { isAuthenticated, permissions, logout } = useAdminAuth();

  // Navigation tabs
  // "dashboard" | "users" | "roles" | "audit" | "security" | "notifications" | "health" | "sheets_cms"
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // States for stats & loaded data
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [rolesMeta, setRolesMeta] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters-related states
  const [userSearchText, setUserSearchText] = useState("");
  const [auditFilterType, setAuditFilterType] = useState("");
  const [securityFilterSeverity, setSecurityFilterSeverity] = useState("");
  const [customNotificationType, setCustomNotificationType] = useState("booking");
  const [customNotificationTitle, setCustomNotificationTitle] = useState("");
  const [customNotificationContent, setCustomNotificationContent] = useState("");
  const [notifSuccessMsg, setNotifSuccessMsg] = useState<string | null>(null);

  // Actions states (modals, selected targets)
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPasswordPlain, setNewPasswordPlain] = useState("");
  const [assignRoleName, setAssignRoleName] = useState("OPERATIONS_ADMIN");

  // Extended operational states
  const [staysList, setStaysList] = useState<any[]>([]);
  const [experiencesList, setExperiencesList] = useState<any[]>([]);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [bookingSearchText, setBookingSearchText] = useState("");
  const [inquiriesList, setInquiriesList] = useState<any[]>([]);
  
  // Modals / Selection targets
  const [selectedStay, setSelectedStay] = useState<any>(null);
  const [selectedExperience, setSelectedExperience] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [expAnalytics, setExpAnalytics] = useState<any>(null);
  
  // Creations / Edits Forms
  const [showStayCreate, setShowStayCreate] = useState(false);
  const [showExpCreate, setShowExpCreate] = useState(false);
  
  const [stayForm, setStayForm] = useState({
    title: "", category: "Luxury", price: "₹12,000", priceValue: 12000, capacity: 4, features: "", description: "", image: ""
  });
  
  const [expForm, setExpForm] = useState({
    title: "", category: "Wilderness Adventure", price: "₹1,500", priceValue: 1500, duration: "3 Hours", capacity: 15, difficulty: "Easy", meetingPoint: "Rishikesh Outpost Base CAMP", description: "", mainImage: ""
  });

  // OTP Step-Up state
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaMaskPhone, setMfaMaskPhone] = useState<string>("");
  const [mfaOtpInput, setMfaOtpInput] = useState<string>("");
  const [refundingBookingId, setRefundingBookingId] = useState<string>("");

  // Load metrics and database elements
  const loadStatsAndWidgets = async () => {
    if (!permissions || !permissions.includes("analytics:view")) {
      return; // Stop any hidden requests to protect against analytics data exposure
    }
    try {
      setLoading(true);
      const res = await fetch("/api/v1/admin/os/dashboard/stats");
      if (res.ok) {
        const body = await res.json();
        if (body.success) setStats(body.data);
      }
    } catch (e) {
      console.error("Dashboard metrics could not be fetched", e);
    } finally {
      setLoading(false);
    }
  };

  const loadUsersList = async () => {
    try {
      const res = await fetch(`/api/v1/admin/os/users?q=${userSearchText}`);
      if (res.ok) {
        const body = await res.json();
        if (body.success) setUsersList(body.data);
      }
    } catch (e) {
      console.error("Users list loading failed", e);
    }
  };

  const loadRolesMeta = async () => {
    try {
      const res = await fetch("/api/v1/admin/os/roles");
      if (res.ok) {
        const body = await res.json();
        if (body.success && body.data && body.data[0]) {
          setRolesMeta(body.data[0]);
        }
      }
    } catch (e) {
      console.error("Roles and bindings loading failed", e);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const queryParams = auditFilterType ? `?eventType=${auditFilterType}` : "";
      const res = await fetch(`/api/v1/admin/os/audit/logs${queryParams}`);
      if (res.ok) {
        const body = await res.json();
        if (body.success) setAuditLogs(body.data);
      }
    } catch (e) {
      console.error("Audit logs query failed", e);
    }
  };

  const loadSecurityEvents = async () => {
    try {
      const res = await fetch("/api/v1/admin/os/security/events");
      if (res.ok) {
        const body = await res.json();
        if (body.success) setSecurityEvents(body.data);
      }
    } catch (e) {
      console.error("Security alerts query failed", e);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/v1/admin/os/notifications");
      if (res.ok) {
        const body = await res.json();
        if (body.success) setNotifications(body.data);
      }
    } catch (e) {
      console.error("Notifications fetch failure", e);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const res = await fetch("/api/v1/admin/os/health");
      if (res.ok) {
        const body = await res.json();
        if (body.success) setHealthMetrics(body.data);
      }
    } catch (e) {
      console.error("Health indicators latency sync failed", e);
    }
  };

  const loadStaysList = async () => {
    try {
      const res = await fetch("/api/v1/admin/os/stays?includeArchived=true");
      if (res.ok) {
        const body = await res.json();
        if (body.success) setStaysList(body.data);
      }
    } catch (e) {
      console.error("Stays collection query failed", e);
    }
  };

  const loadExperiencesList = async () => {
    try {
      const res = await fetch("/api/v1/admin/os/experiences?includeArchived=true");
      if (res.ok) {
        const body = await res.json();
        if (body.success) setExperiencesList(body.data);
      }
    } catch (e) {
      console.error("Experiences collection query failed", e);
    }
  };

  const loadBookingsList = async () => {
    try {
      const res = await fetch(`/api/v1/admin/os/bookings?q=${bookingSearchText}`);
      if (res.ok) {
        const body = await res.json();
        if (body.success) setBookingsList(body.data);
      }
    } catch (e) {
      console.error("Bookings search list failed", e);
    }
  };

  const loadSystemSettings = async () => {
    try {
      const res = await fetch("/api/v1/admin/os/system-settings");
      if (res.ok) {
        const body = await res.json();
        if (body.success) setSystemSettings(body.data);
      }
    } catch (e) {
      console.error("System settings loading failed", e);
    }
  };

  const loadInquiriesList = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inquiries");
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setInquiriesList(body.data || []);
        }
      }
    } catch (e) {
      console.error("Inquiries list loading failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId: string, status: string) => {
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        loadInquiriesList();
      }
    } catch (e) {
      console.error("Failed to update inquiry status", e);
    }
  };

  // Perform administrative actions on standard target elements
  const handleToggleSuspension = async (userId: string, type: "Traveller" | "Operator", currentState: boolean) => {
    try {
      const res = await fetch(`/api/v1/admin/os/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, state: !currentState })
      });
      if (res.ok) {
        loadUsersList();
        loadStatsAndWidgets();
      }
    } catch (e) {
      console.error("Suspension switch toggle failed", e);
    }
  };

  const handleToggleBan = async (userId: string, type: "Traveller" | "Operator", currentState: boolean) => {
    try {
      const res = await fetch(`/api/v1/admin/os/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, state: !currentState })
      });
      if (res.ok) {
        loadUsersList();
        loadStatsAndWidgets();
      }
    } catch (e) {
      console.error("Ban switch override failed", e);
    }
  };

  const handleToggleVerification = async (userId: string, type: "Traveller" | "Operator", currentState: boolean) => {
    try {
      const res = await fetch(`/api/v1/admin/os/users/${userId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, state: !currentState })
      });
      if (res.ok) {
        loadUsersList();
      }
    } catch (e) {
      console.error("Identity verification toggling failed", e);
    }
  };

  const handleOverridePassword = async (userId: string, type: "Traveller" | "Operator") => {
    if (!newPasswordPlain || newPasswordPlain.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }
    try {
      const res = await fetch(`/api/v1/admin/os/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, plainPassword: newPasswordPlain })
      });
      if (res.ok) {
        alert("Account password was administratively overridden successfully.");
        setNewPasswordPlain("");
        setSelectedUser(null);
      }
    } catch (e) {
      console.error("Administrative credential reset override state failed", e);
    }
  };

  const handleRoleBinding = async (userId: string, roleName: string, action: "assign" | "remove") => {
    try {
      const res = await fetch(`/api/v1/admin/os/roles/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, roleName })
      });
      if (res.ok) {
        loadRolesMeta();
      }
    } catch (e) {
      console.error("Role assignment transaction failed", e);
    }
  };

  const handleMarkNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/os/notifications/${id}/read`, {
        method: "POST"
      });
      if (res.ok) {
        loadNotifications();
        loadStatsAndWidgets();
      }
    } catch (e) {
      console.error("Notification status alteration failed", e);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!customNotificationTitle || !customNotificationContent) return;
    try {
      const res = await fetch("/api/v1/admin/os/notifications/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: customNotificationType,
          title: customNotificationTitle,
          content: customNotificationContent
        })
      });
      if (res.ok) {
        setCustomNotificationTitle("");
        setCustomNotificationContent("");
        setNotifSuccessMsg("Alert announcement successfully added and broadcasted to staff.");
        loadNotifications();
        loadStatsAndWidgets();
        setTimeout(() => setNotifSuccessMsg(null), 5000);
      }
    } catch (e) {
      console.error("Announcement propagation failed", e);
    }
  };

  // Redirect away from dashboard if missing view permission
  useEffect(() => {
    if (permissions && permissions.length > 0 && !permissions.includes("analytics:view") && activeTab === "dashboard") {
      setActiveTab("users");
    }
  }, [permissions, activeTab]);

  // Perform dynamic state synchronization depending on the selected tab
  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === "dashboard") {
      loadStatsAndWidgets();
    }

    if (activeTab === "users") loadUsersList();
    if (activeTab === "roles") loadRolesMeta();
    if (activeTab === "stays") loadStaysList();
    if (activeTab === "experiences") loadExperiencesList();
    if (activeTab === "bookings") loadBookingsList();
    if (activeTab === "audit") loadAuditLogs();
    if (activeTab === "security") loadSecurityEvents();
    if (activeTab === "notifications") loadNotifications();
    if (activeTab === "health") loadSystemHealth();
    if (activeTab === "system_settings") loadSystemSettings();
    if (activeTab === "inquiries") loadInquiriesList();
  }, [activeTab, userSearchText, auditFilterType, bookingSearchText, isAuthenticated, permissions]);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto" style={{ contentVisibility: "auto" }}>
      <div className="bg-slate-50 rounded-3xl max-w-6xl w-full border border-slate-200 shadow-2xl relative my-8 animate-scale-up text-left overflow-hidden h-[85vh] flex flex-col md:flex-row">
        
        {/* SIDE BAR NAVIGATION CONTROL PANEL */}
        <div className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col justify-between p-6 shrink-0">
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-emerald-500 rounded-2xl text-slate-950 animate-pulse">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-wider uppercase text-emerald-400">UbEx Admin OS</h3>
                <p className="text-[10px] text-slate-400 font-mono">Build Enterprise v1.4</p>
              </div>
            </div>

            {/* Nav tabs links */}
            <div className="space-y-1">
              {[
                { id: "dashboard", label: "Dashboard", icon: BarChart3, reqPermission: "analytics:view" },
                { id: "users", label: "User Directory", icon: Users },
                { id: "roles", label: "Access & RBAC", icon: Key },
                { id: "stays", label: "Stays Properties", icon: Home },
                { id: "experiences", label: "Experiences Hub", icon: Compass },
                { id: "bookings", label: "Bookings & Refunds", icon: CalendarDays },
                { id: "inquiries", label: "Inquiries Engine", icon: MessageSquare },
                { id: "audit", label: "Compliance Audits", icon: FileText },
                { id: "security", label: "Security Center", icon: ShieldAlert },
                { id: "notifications", label: "Operator Inbox", icon: Bell },
                { id: "health", label: "System Health", icon: Activity },
                { id: "sheets_cms", label: "CMS Pricing Sync", icon: Database },
                { id: "system_settings", label: "Super Controls", icon: Sliders }
              ].filter(tab => !tab.reqPermission || (permissions && permissions.includes(tab.reqPermission))).map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-3 text-xs font-black transition-all border-0 cursor-pointer ${
                      isSelected 
                        ? "bg-emerald-500 text-slate-950 shadow-md transform scale-[1.03]" 
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer controls */}
          <div className="border-t border-slate-850 pt-4 mt-6 space-y-2">
            <button
              onClick={onClose}
              className="w-full py-2 border border-slate-700/60 bg-transparent hover:bg-slate-800 text-slate-300 text-xs font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm font-mono"
            >
              <X className="w-3.5 h-3.5" strokeWidth={3} />
              Exit Panel
            </button>
            <button
              onClick={logout}
              className="w-full py-2 border-0 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm font-mono"
            >
              <Power className="w-3.5 h-3.5" />
              Secure Logout
            </button>
          </div>
        </div>

        {/* WORKSPACE AREA */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto flex flex-col justify-between bg-slate-50 text-slate-800">
          
          <div className="space-y-6">
            
            {/* Tab header title */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-widest bg-slate-200 px-2 py-1 rounded-md">
                  Active Console / {activeTab.replace("_", " ")}
                </span>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
                  {activeTab === "dashboard" && "Executive Dashboard Analytics"}
                  {activeTab === "users" && "User Directory & Account Controls"}
                  {activeTab === "roles" && "RBAC Role Privileges Configurator"}
                  {activeTab === "stays" && "Curated Rentals & Inventory Blocks"}
                  {activeTab === "experiences" && "Active Spots, Schedulers & Slot Price Overrides"}
                  {activeTab === "bookings" && "Bookings & SMS Step-Up Refund Center"}
                  {activeTab === "inquiries" && "Marketplace Inquiry Dynamic Engine Tracker"}
                  {activeTab === "audit" && "Security Audits & Activity Trails"}
                  {activeTab === "security" && "Global Security Threat Center"}
                  {activeTab === "notifications" && "Interactive Staff Notifications"}
                  {activeTab === "health" && "Real-Time Infrastructure Health"}
                  {activeTab === "sheets_cms" && "Live Google Sheets Pricing CMS"}
                  {activeTab === "system_settings" && "Super Admin Feature Gates & Operations Configuration"}
                </h2>
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB INTERFACE CONTENTS */}
            
            {/* 1. EXECUTIVE DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              permissions && permissions.includes("analytics:view") ? (
                <div className="space-y-6">
                  {/* Stats Indicators Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Total Users", val: stats?.totalUsers ?? "...", sub: "Travellers + Operators", color: "text-indigo-600", bg: "bg-indigo-50" },
                      { label: "Active Bookings", val: stats?.activeBookings ?? "...", sub: "Live reservations", color: "text-emerald-600", bg: "bg-emerald-50" },
                      { label: "Revenue Today", val: stats ? `₹${stats.revenueToday.toLocaleString()}` : "...", sub: "Prepay checkout loops", color: "text-cyan-600", bg: "bg-cyan-50" },
                      { label: "Revenue Month", val: stats ? `₹${stats.revenueThisMonth.toLocaleString()}` : "...", sub: "Current calendar month", color: "text-purple-600", bg: "bg-purple-50" },
                      { label: "Total Properties", val: stats?.totalProperties ?? "...", sub: "Active outposts", color: "text-slate-700", bg: "bg-slate-100" },
                      { label: "Verified Vendors", val: stats?.totalVendors ?? "...", sub: "High-altitude pros", color: "text-amber-600", bg: "bg-amber-50" },
                      { label: "Pending Approvals", val: stats?.pendingApprovals ?? "...", sub: "Review moderation", color: "text-amber-500", bg: "bg-amber-50" },
                      { label: "Security Alerts", val: stats?.securityAlertsCount ?? "...", sub: "High severity logs", color: "text-rose-600", bg: "bg-rose-50" }
                    ].map((w, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{w.label}</span>
                          <p className={`text-xl font-black ${w.color} mt-1`}>{w.val}</p>
                        </div>
                        <span className="text-[9px] text-slate-500 mt-2 block font-mono">{w.sub}</span>
                      </div>
                    ))}
                  </div>

                  {/* Info block */}
                  <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 space-y-2">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" /> Automated Ledger Report
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-400">
                      Calculations are gathered securely from local file fallbacks and live PostgreSQL variables. Revenue metrics filter for prepaid checkout outposts recorded during 2026 UTC date runs.
                    </p>
                  </div>
                </div>
              ) : null
            )}

            {/* 2. USER DIRECTORY TAB */}
            {activeTab === "users" && (
              <div className="space-y-4">
                
                {/* Search Bar */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={userSearchText}
                      onChange={(e) => setUserSearchText(e.target.value)}
                      placeholder="Search accounts directory by email or type ('Traveller' / 'Operator')..."
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                  <button 
                    onClick={loadUsersList}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-black border-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-Query
                  </button>
                </div>

                {/* Table list */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 uppercase tracking-wider font-mono text-[9px] border-b">
                          <th className="p-3 font-bold">Email Interface</th>
                          <th className="p-3 font-bold">Category</th>
                          <th className="p-3 font-bold">Status</th>
                          <th className="p-3 font-bold">Identity Trust</th>
                          <th className="p-3 font-bold text-right">Actions Panel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {usersList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-400 font-bold">No accounts matched current filter query terms.</td>
                          </tr>
                        ) : (
                          usersList.map((usr) => (
                            <tr key={usr.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-bold">{usr.email}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full font-black text-[9px] ${usr.type === "Operator" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                                  {usr.type}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full font-black text-[9px] ${usr.status === "Active" ? "bg-emerald-100 text-emerald-800" : usr.status === "Suspended" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                                  {usr.status}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full font-black text-[9px] ${usr.isVerified ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                                  {usr.isVerified ? "★ Authenticated" : "Standard"}
                                </span>
                              </td>
                              <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                <button
                                  onClick={() => handleToggleVerification(usr.id, usr.type, usr.isVerified)}
                                  className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md border-0 hover:bg-indigo-200 cursor-pointer font-black text-[10px]"
                                  title="Toggle Verification Badge"
                                >
                                  Trust
                                </button>
                                <button
                                  onClick={() => handleToggleSuspension(usr.id, usr.type, usr.status === "Suspended")}
                                  className="px-2 py-1 bg-amber-50 text-amber-600 rounded-md border-0 hover:bg-amber-200 cursor-pointer font-black text-[10px]"
                                >
                                  {usr.status === "Suspended" ? "Activate" : "Suspend"}
                                </button>
                                <button
                                  onClick={() => handleToggleBan(usr.id, usr.type, usr.status === "Banned")}
                                  className="px-2 py-1 bg-rose-50 text-rose-600 rounded-md border-0 hover:bg-rose-200 cursor-pointer font-black text-[10px]"
                                >
                                  {usr.status === "Banned" ? "Unban" : "Ban"}
                                </button>
                                <button
                                  onClick={() => { setSelectedUser(usr); setNewPasswordPlain(""); }}
                                  className="px-2 py-1 bg-slate-900 text-white rounded-md border-0 hover:bg-slate-800 cursor-pointer font-black text-[10px]"
                                >
                                  Key Override
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Password reset widget section */}
                {selectedUser && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-extrabold text-indigo-950 uppercase">Override Credentials for: {selectedUser.email}</h4>
                      <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs font-black border-0 bg-transparent">Cancel</button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Enter new plain password overrides (min 8 chars)..."
                        value={newPasswordPlain}
                        onChange={(e) => setNewPasswordPlain(e.target.value)}
                        className="flex-1 p-2 border border-slate-200 rounded-xl text-xs font-mono outline-none font-bold"
                      />
                      <button
                        onClick={() => handleOverridePassword(selectedUser.id, selectedUser.type)}
                        className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-black border-0 cursor-pointer"
                      >
                        Commit Overrides
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. ACCESS & RBAC TAB */}
            {activeTab === "roles" && (
              <div className="space-y-6">
                
                {/* Available matrix roles summary info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rolesMeta?.roles.map((rl: any) => (
                    <div key={rl.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                      <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-mono uppercase">{rl.name}</span>
                      <p className="text-xs text-slate-600 leading-normal font-medium pt-1">{rl.description}</p>
                    </div>
                  ))}
                </div>

                {/* Assignments directory */}
                <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-sm text-xs">
                  <h3 className="font-extrabold text-slate-800 uppercase tracking-widest text-[11px] border-b pb-2">Active Roles Assignments Directory</h3>
                  
                  <div className="divide-y space-y-4">
                    {rolesMeta?.bindings.map((usr: any) => (
                      <div key={usr.adminUserId} className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
                        <div>
                          <p className="font-black text-slate-900">{usr.email}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Operator ID: {usr.adminUserId}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {usr.roles.length === 0 ? (
                            <span className="text-[9px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-bold">No Roles Defined</span>
                          ) : (
                            usr.roles.map((r: any) => (
                              <span key={r.id} className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                                {r.name}
                                <button
                                  onClick={() => handleRoleBinding(usr.adminUserId, r.name, "remove")}
                                  className="text-rose-400 hover:text-rose-600 border-0 bg-transparent cursor-pointer font-black text-[9px] p-0"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          )}
                        </div>

                        {/* Assign Role action */}
                        <div className="flex gap-2">
                          <select
                            value={assignRoleName}
                            onChange={(e) => setAssignRoleName(e.target.value)}
                            className="p-1 border border-slate-200 rounded-lg text-[10px] uppercase font-bold outline-none font-mono"
                          >
                            <option value="OPERATIONS_ADMIN">OPERATIONS_ADMIN</option>
                            <option value="FINANCE_ADMIN">FINANCE_ADMIN</option>
                            <option value="SUPPORT_ADMIN">SUPPORT_ADMIN</option>
                            <option value="BOOKING_ADMIN">BOOKING_ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>
                          <button
                            onClick={() => handleRoleBinding(usr.adminUserId, assignRoleName, "assign")}
                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg border-0 font-black cursor-pointer text-[10px]"
                          >
                            + Bind
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

              </div>
            )}

            {/* 4. COMPLIANCE AUDITS TAB */}
            {activeTab === "audit" && (
              <div className="space-y-4 text-xs font-mono">
                
                {/* Event Type filters */}
                <div className="flex gap-2">
                  <select
                    value={auditFilterType}
                    onChange={(e) => setAuditFilterType(e.target.value)}
                    className="p-2 border border-slate-200 rounded-xl text-xs font-bold outline-none font-mono"
                  >
                    <option value="">-- All Audited Event Types --</option>
                    <option value="USER_SUSPENSION_TOGGLE">USER_SUSPENSION_TOGGLE</option>
                    <option value="USER_BAN_TOGGLE">USER_BAN_TOGGLE</option>
                    <option value="USER_VERIFICATION_STATUS">USER_VERIFICATION_STATUS</option>
                    <option value="USER_PASSWORD_RESET_FORCE">USER_PASSWORD_RESET_FORCE</option>
                    <option value="ROLE_ASSIGNMENT">ROLE_ASSIGNMENT</option>
                    <option value="ROLE_REVOCATION">ROLE_REVOCATION</option>
                    <option value="ADMIN_LOGIN_SUCCESS">ADMIN_LOGIN_SUCCESS</option>
                    <option value="ADMIN_PASSWORD_ROTATED">ADMIN_PASSWORD_ROTATED</option>
                  </select>
                  <button 
                    onClick={loadAuditLogs}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black border-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Filter Logs
                  </button>
                </div>

                {/* Audit Logs Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-[11px]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 uppercase tracking-wider text-[9px] border-b">
                          <th className="p-3 font-bold">Created Date</th>
                          <th className="p-3 font-bold">Event Log Type</th>
                          <th className="p-3 font-bold">Trace Correlation</th>
                          <th className="p-3 font-bold">Action Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400 font-bold font-sans">No security audited actions recorded in log tables.</td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50">
                              <td className="p-3 text-slate-400 font-mono whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                              <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">{log.eventType}</span></td>
                              <td className="p-3 text-emerald-600 font-mono text-[9px]" title="Correlation Log ID">{log.correlationId || "SYS-GLOBAL-MOCK"}</td>
                              <td className="p-3 font-sans text-slate-600 font-medium leading-relaxed">{log.description}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* 5. SECURITY CENTER TAB */}
            {activeTab === "security" && (
              <div className="space-y-6 font-mono text-xs">
                
                {/* Security metrics dashboard summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 space-y-2 text-rose-950 font-sans">
                    <h4 className="text-xs font-black text-rose-700 uppercase tracking-widest flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-rose-700" /> Locked Accounts Metric
                    </h4>
                    <p className="text-xs leading-relaxed font-semibold">
                      Security services enforce lockouts upon 5 consecutive failed log attempts. Lockout window: 15 minutes. Global lockout count: 0 active.
                    </p>
                  </div>
                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 space-y-2 text-amber-950 font-sans">
                    <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-700" /> Suspicious Session Logs
                    </h4>
                    <p className="text-xs leading-relaxed font-semibold">
                      Cookie signatures audit client browser signatures dynamically. Geo-location mismatch anomalies trigger MFA rotations automatically.
                    </p>
                  </div>
                </div>

                {/* Live Events Timeline */}
                <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4 shadow-sm text-sans">
                  <h3 className="font-extrabold text-slate-800 uppercase tracking-widest text-[11px] border-b pb-2 font-sans">Global Threats & Sec-Ops Timeline</h3>
                  
                  <div className="space-y-4">
                    {securityEvents.length === 0 ? (
                      <p className="text-slate-400 font-bold text-center py-4 font-sans text-xs">No active compliance blockages or high-risk threats detected.</p>
                    ) : (
                      securityEvents.map((evt) => (
                        <div key={evt.id} className="flex gap-4 items-start border-b pb-3 hover:bg-slate-5/20 transition-all">
                          <span className={`px-2 py-0.5 rounded font-black text-[9px] whitespace-nowrap mt-0.5 ${
                            evt.severity === "CRITICAL" ? "bg-red-200 text-red-800" :
                            evt.severity === "HIGH" ? "bg-rose-100 text-rose-800" :
                            "bg-amber-100 text-amber-800"
                          }`}>
                            {evt.severity}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-900 text-xs font-mono">{evt.eventType}</p>
                            <p className="text-slate-500 font-medium leading-relaxed font-sans mt-0.5">{evt.description}</p>
                            <div className="flex gap-3 text-[9px] text-slate-400 mt-2 font-mono">
                              <span>Date: {new Date(evt.createdAt).toLocaleString()}</span>
                              <span>•</span>
                              <span>Source: {evt.ipAddress || "127.0.0.1"}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* 6. OPERATOR INBOX TAB */}
            {activeTab === "notifications" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-800">
                
                {/* Inbox notifications lists */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="font-extrabold text-slate-800 uppercase tracking-widest text-[11px] border-b pb-2">Active Notifications Inbox</h3>
                  
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-4 rounded-2xl border shadow-sm transition-all text-xs flex gap-3 ${
                          notif.isRead ? "bg-white border-slate-200" : "bg-emerald-50/50 border-emerald-200"
                        }`}
                      >
                        <Bell className={`w-4 h-4 mt-0.5 shrink-0 ${notif.isRead ? "text-slate-400" : "text-emerald-500"}`} />
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-extrabold text-slate-950 uppercase tracking-wide text-[10px]">{notif.title}</h4>
                            {!notif.isRead && (
                              <button
                                onClick={() => handleMarkNotification(notif.id)}
                                className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 hover:bg-emerald-600 rounded text-[9px] font-black border-0 cursor-pointer"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                          <p className="text-slate-600 pt-1 leading-relaxed font-medium">{notif.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Announcement Broadcaster */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
                  <h3 className="font-extrabold text-indigo-950 uppercase tracking-widest text-[11px] border-b pb-2">Broadcaster announcement</h3>
                  
                  {notifSuccessMsg && (
                    <div className="p-3 bg-semibold bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-black rounded-xl">
                      {notifSuccessMsg}
                    </div>
                  )}

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Notification Type</label>
                      <select
                        value={customNotificationType}
                        onChange={(e) => setCustomNotificationType(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none font-bold font-mono"
                      >
                        <option value="booking">Category: Booking</option>
                        <option value="vendor">Category: Vendor</option>
                        <option value="security">Category: Security Warning</option>
                        <option value="refund">Category: Refund Request</option>
                        <option value="error">Category: Infrastructure Error</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Notification Title</label>
                      <input
                        type="text"
                        placeholder="E.g. System Wide Backup Cycle Completed"
                        value={customNotificationTitle}
                        onChange={(e) => setCustomNotificationTitle(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Notification Content</label>
                      <textarea
                        rows={3}
                        placeholder="E.g. Background operators completed maintenance and restored synchronization speeds."
                        value={customNotificationContent}
                        onChange={(e) => setCustomNotificationContent(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-xl outline-none font-medium leading-relaxed"
                      />
                    </div>

                    <button
                      onClick={handleCreateAnnouncement}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl font-black border-0 cursor-pointer flex items-center justify-center gap-1 text-[11px]"
                    >
                      <PlusCircle className="w-4 h-4" /> Broadcast announce
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* 7. SYSTEM HEALTH TAB */}
            {activeTab === "health" && (
              <div className="space-y-6">
                
                {/* Indicator Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sans">
                  
                  {[
                    { title: "REST APIs Hub", status: healthMetrics?.api.status || "healthy", details: `Uptime: ${healthMetrics ? Math.round(healthMetrics.api.uptimeSeconds / 60) : "--"} mins`, icon: Wifi, color: "text-emerald-500", bg: "bg-emerald-50/50" },
                    { title: "PostgreSQL Connection", status: healthMetrics?.database.status || "healthy", details: `Lag: ${healthMetrics?.database.latencyMs || 0} ms`, icon: Database, color: "text-emerald-500", bg: "bg-emerald-50/50" },
                    { title: "Action Job Queues", status: healthMetrics?.queue.status || "healthy", details: "Pending: 0 jobs", icon: Terminal, color: "text-emerald-500", bg: "bg-emerald-50/50" },
                    { title: "Local Storage Volumes", status: healthMetrics?.storage.status || "healthy", details: `Disk Free: 67%`, icon: HardDrive, color: "text-emerald-500", bg: "bg-emerald-50/50" },
                    { title: "Stripe Payment Gateway", status: healthMetrics?.payment.status || "operational", details: `Latency: 142 ms`, icon: Key, color: "text-emerald-500", bg: "bg-emerald-50/50" }
                  ].map((gauge, index) => {
                    const Icon = gauge.icon;
                    return (
                      <div key={index} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between text-xs font-sans space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest leading-tight">{gauge.title}</h4>
                          <Icon className={`w-4 h-4 ${gauge.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-extrabold text-slate-900 uppercase font-mono text-[10px]">{gauge.status}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block font-mono mt-1">{gauge.details}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-slate-900 text-slate-300 p-6 rounded-3xl border border-slate-850 space-y-3 font-mono text-xs">
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" /> Live Operator Diagnostics Logs
                  </h4>
                  <div className="space-y-1 block text-slate-400">
                    <p className="text-emerald-400">INFO: [2026-06-16T15:52:00Z] Successfully validated master database clusters connections parameters.</p>
                    <p>DEBUG: [2026-06-16T15:52:10Z] Synchronized Stripe Payment status indicators. Network latency evaluated. Response standard.</p>
                    <p>WARN: [2026-06-16T15:52:15Z] Host CRM prices configurations changed. Automated synchronizer queue schedules running.</p>
                  </div>
                </div>

              </div>
            )}

            {/* 8. CMS GOOGLE SHEETS TAB */}
            {activeTab === "sheets_cms" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-800 font-sans">
                
                {/* Left Settings & Actions Section */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                        isSyncEnabled 
                          ? "bg-emerald-100 text-emerald-800" 
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${isSyncEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                        {isSyncEnabled ? "Live Sync Enabled" : "Using Default Prices"}
                      </span>
                    </div>

                    {/* Sync Form */}
                    <div className="space-y-4 text-xs font-sans">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Google Sheets Link or ID
                        </label>
                        <input 
                          type="text"
                          value={spreadsheetUrl}
                          onChange={(e) => setSpreadsheetUrl(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          className="w-full p-3 border border-slate-200 bg-slate-50 rounded-2xl outline-none font-mono focus:ring-2 focus:ring-emerald-400 text-slate-800"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-100/50 rounded-2xl border border-slate-150">
                        <div>
                          <p className="font-bold text-indigo-950 text-xs">Enable Dynamic Override</p>
                          <p className="text-[10px] text-slate-500">Inject prices from Sheets to our checkout</p>
                        </div>
                        <input 
                          type="checkbox"
                          checked={isSyncEnabled}
                          onChange={(e) => setIsSyncEnabled(e.target.checked)}
                          className="w-4 h-4 accent-emerald-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={handleTriggerSync}
                      disabled={syncLoading || !spreadsheetUrl}
                      className="w-full py-4.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-black rounded-2xl transition duration-150 flex items-center justify-center gap-2 border-none shadow-md cursor-pointer text-xs uppercase tracking-wider"
                    >
                      {syncLoading ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" /> Synchronizing spreadsheet...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 fill-current" /> Begin Sync Override
                        </>
                      )}
                    </button>

                    {syncError && (
                      <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Overlapping error validation detected!</p>
                          <p className="mt-1 leading-relaxed text-[10px] text-rose-700">{syncError}</p>
                        </div>
                      </div>
                    )}

                    {syncSuccess && (
                      <div className="mt-4 p-4 bg-emerald-100 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Sync successful!</p>
                          <p className="mt-1 text-[11px] text-emerald-700 font-medium">Pricing variables, category codes, and outposts definitions were successfully pulled in real-time!</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Specs & Guidance */}
                <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between text-slate-400 space-y-4">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                      <Terminal className="w-4.5 h-4.5" /> Spreadsheet CMS Specifications
                    </h4>
                    
                    <div className="space-y-3 text-[11px] leading-relaxed">
                      <p>
                        We map stay and experience rates in real-time using Google Sheets columns mapping directly. This lets local coordinators update inventory, pricing tiers, and packages from mobile.
                      </p>
                      
                      <div className="border border-white/5 bg-slate-950/40 rounded-2xl p-4 font-mono space-y-1 text-[10px] text-slate-300">
                        <p className="text-emerald-400 font-bold"># Expected Spreadsheet Columns structure:</p>
                        <p>A: ITEM_ID | B: OUTPOST_CATEGORY | C: PRICE_INR</p>
                        <p className="pt-2 text-slate-400">// Sample matches keys in our code:</p>
                        <p>• stay_camp_outdoor | Luxury Camping | 1999</p>
                        <p>• stay_luxury_villa | Premium Villa  | 8999</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-normal font-mono">
                    Pricing synchronization uses secure read-only proxies. Changes fallback gracefully to pre-built native rates when decoupled or internet latency thresholds exceed.
                  </p>
                </div>

              </div>
            )}

            {/* 9. STAYS PROPERTIES TAB */}
            {activeTab === "stays" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Curated Outpost Accommodations</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">CRUD controls, blocked dates inventory, and dynamic pricing multipliers</p>
                  </div>
                  <button 
                    onClick={() => setShowStayCreate(!showStayCreate)} 
                    className="px-3.5 py-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl border-none cursor-pointer hover:bg-emerald-600 flex items-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" /> {showStayCreate ? "Close Form" : "Create Stay Property"}
                  </button>
                </div>

                {showStayCreate && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await fetch("/api/v1/admin/os/stays", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...stayForm,
                          features: stayForm.features.split(",").map(f => f.trim()).filter(Boolean)
                        })
                      });
                      if (res.ok) {
                        setShowStayCreate(false);
                        setStayForm({ title: "", category: "Luxury", price: "₹12,000", priceValue: 12000, capacity: 4, features: "", description: "", image: "" });
                        loadStaysList();
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }} className="bg-slate-900 text-slate-300 p-6 rounded-3xl border border-slate-800 space-y-4 text-xs font-sans">
                    <h4 className="font-bold text-emerald-400 uppercase tracking-widest text-[11px] flex items-center gap-1.5 border-b border-slate-850 pb-2">
                      <Terminal className="w-4.5 h-4.5" /> Provision New Stay Outpost Facility
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Property Name</label>
                        <input type="text" required value={stayForm.title} onChange={e => setStayForm({...stayForm, title: e.target.value})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none" placeholder="e.g. UbEx Riverside Deluxe Glamping" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Category Code</label>
                        <select value={stayForm.category} onChange={e => setStayForm({...stayForm, category: e.target.value as any})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none font-bold uppercase">
                          <option value="Luxury">Luxury</option>
                          <option value="Family">Family</option>
                          <option value="Workation">Workation</option>
                          <option value="Dorm">Dorm</option>
                          <option value="Long-Stay">Long-Stay</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Display Price (INR)</label>
                        <input type="text" required value={stayForm.price} onChange={e => setStayForm({...stayForm, price: e.target.value})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none" placeholder="₹12,000" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Base Price Numeric (INR Value)</label>
                        <input type="number" required value={stayForm.priceValue} onChange={e => setStayForm({...stayForm, priceValue: Number(e.target.value)})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Capacity (Max Guests)</label>
                        <input type="number" required value={stayForm.capacity} onChange={e => setStayForm({...stayForm, capacity: Number(e.target.value)})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Amenities (Comma separated)</label>
                        <input type="text" value={stayForm.features} onChange={e => setStayForm({...stayForm, features: e.target.value})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none" placeholder="Wifi, AC, Hot Tub, Ganga View" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Image URL</label>
                        <input type="text" value={stayForm.image} onChange={e => setStayForm({...stayForm, image: e.target.value})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none" placeholder="https://images.unsplash.com/photo-..." />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Stay Description Preview</label>
                        <textarea value={stayForm.description} onChange={e => setStayForm({...stayForm, description: e.target.value})} rows={2} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none" placeholder="Describe layout details, location advantages etc." />
                      </div>
                    </div>
                    <button type="submit" className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 border-none text-slate-950 font-black tracking-wider uppercase rounded-xl cursor-pointer shadow-md">
                      Commit & Seize In-Memory Registry
                    </button>
                  </form>
                )}

                {/* Stays Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
                  {staysList.map((stay: any) => (
                    <div key={stay.id} className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between ${stay.isArchived ? "opacity-75 bg-slate-50/50" : ""}`}>
                      <div>
                        {stay.image && (
                          <div className="h-44 overflow-hidden relative">
                            <img src={stay.image} alt={stay.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            {stay.isArchived && (
                              <span className="absolute top-3 right-3 bg-red-500 text-white font-bold text-[9px] uppercase px-2 py-0.5 rounded-full">Archived</span>
                            )}
                          </div>
                        )}
                        <div className="p-5 space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[9px] uppercase">{stay.category}</span>
                            <span className="font-extrabold text-teal-600 text-xs">{stay.price} / night</span>
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{stay.title}</h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-2">{stay.description}</p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {stay.features?.map((f: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black tracking-wider rounded">{f}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Config actions */}
                      <div className="border-t border-slate-150 p-4 bg-slate-50/50 flex flex-wrap gap-2 justify-between items-center">
                        <button 
                          onClick={() => setSelectedStay(stay)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg border-0 font-bold cursor-pointer text-[10px]"
                        >
                          Inventory & Pricing
                        </button>
                        <div className="space-x-1">
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/v1/admin/os/stays/${stay.id}/archive`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ isArchived: !stay.isArchived })
                                });
                                if (res.ok) loadStaysList();
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border-0 font-bold cursor-pointer text-[10px]"
                          >
                            {stay.isArchived ? "Restore" : "Archive"}
                          </button>
                          <button 
                            onClick={async () => {
                              if (!confirm(`Are you absolutely sure you want to permanently delete stay: ${stay.title}?`)) return;
                              try {
                                const res = await fetch(`/api/v1/admin/os/stays/${stay.id}`, { method: "DELETE" });
                                if (res.ok) loadStaysList();
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border-0 font-bold cursor-pointer text-[10px]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stays Inventory block modal */}
                {selectedStay && (
                  <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h4 className="font-extrabold text-slate-850 text-xs uppercase">Inventory for: {selectedStay.title}</h4>
                        <button onClick={() => setSelectedStay(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent font-black">✕</button>
                      </div>
                      
                      <div className="space-y-4 text-xs font-sans">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Blocked Calendar Dates (Comma separated)</label>
                          <input 
                            type="text" 
                            id="block-dates-input"
                            defaultValue={selectedStay.blockedDates?.join(", ") || ""} 
                            placeholder="YYYY-MM-DD, e.g. 2026-06-21, 2026-07-04" 
                            className="w-full p-2.5 border border-slate-200 rounded-xl outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Maintenance Blocked Dates (Comma separated)</label>
                          <input 
                            type="text" 
                            id="maint-dates-input"
                            defaultValue={selectedStay.maintenanceDates?.join(", ") || ""} 
                            placeholder="e.g. 2026-06-25, 2026-06-26" 
                            className="w-full p-2.5 border border-slate-200 rounded-xl outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Dynamic Price Override Value (INR Numerical)</label>
                          <input 
                            type="number" 
                            id="dyn-price-input"
                            defaultValue={selectedStay.priceValue || ""} 
                            placeholder="e.g. 15000" 
                            className="w-full p-2.5 border border-slate-200 rounded-xl outline-none" 
                          />
                        </div>
                        <button 
                          onClick={async () => {
                            const bInput = (document.getElementById("block-dates-input") as HTMLInputElement)?.value;
                            const mInput = (document.getElementById("maint-dates-input") as HTMLInputElement)?.value;
                            const pInput = (document.getElementById("dyn-price-input") as HTMLInputElement)?.value;
                            
                            try {
                              const res = await fetch(`/api/v1/admin/os/stays/${selectedStay.id}/inventory`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  blockedDates: bInput.split(",").map(d => d.trim()).filter(Boolean),
                                  maintenanceDates: mInput.split(",").map(d => d.trim()).filter(Boolean),
                                  priceValue: pInput ? Number(pInput) : selectedStay.priceValue
                                })
                              });
                              if (res.ok) {
                                setSelectedStay(null);
                                loadStaysList();
                              }
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase rounded-xl border-0 cursor-pointer text-xs tracking-wider"
                        >
                          Submit Outpost Override
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 10. EXPERIENCES HUB TAB */}
            {activeTab === "experiences" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">High Altitude Curated Experiences</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Edit adventure parameters, slot timetables, and audit business indexes</p>
                  </div>
                  <button 
                    onClick={() => setShowExpCreate(!showExpCreate)} 
                    className="px-3.5 py-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl border-none cursor-pointer hover:bg-emerald-600 flex items-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" /> {showExpCreate ? "Close Form" : "Create Adventure Spot"}
                  </button>
                </div>

                {showExpCreate && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await fetch("/api/v1/admin/os/experiences", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(expForm)
                      });
                      if (res.ok) {
                        setShowExpCreate(false);
                        setExpForm({ title: "", category: "Wilderness Adventure", price: "₹1,500", priceValue: 1500, duration: "3 Hours", capacity: 15, difficulty: "Easy", meetingPoint: "Rishikesh Outpost Base CAMP", description: "", mainImage: "" });
                        loadExperiencesList();
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }} className="bg-slate-900 text-slate-300 p-6 rounded-3xl border border-slate-800 space-y-4 text-xs font-sans">
                    <h4 className="font-bold text-emerald-400 uppercase tracking-widest text-[11px] flex items-center gap-1.5 border-b border-slate-850 pb-2">
                      <Terminal className="w-4.5 h-4.5" /> Provision Adventure Experience Outpost
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Adventure Title</label>
                        <input type="text" required value={expForm.title} onChange={e => setExpForm({...expForm, title: e.target.value})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none" placeholder="e.g. Ganga Rapid White Water Rafting" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Category Theme</label>
                        <input type="text" value={expForm.category} onChange={e => setExpForm({...expForm, category: e.target.value})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none" placeholder="Wilderness Adventure" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Price Label (INR)</label>
                        <input type="text" required value={expForm.price} onChange={e => setExpForm({...expForm, price: e.target.value})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none" placeholder="₹1,500" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Base Price Numeric (INR Value)</label>
                        <input type="number" required value={expForm.priceValue} onChange={e => setExpForm({...expForm, priceValue: Number(e.target.value)})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Timings Duration</label>
                        <input type="text" required value={expForm.duration} onChange={e => setExpForm({...expForm, duration: e.target.value})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none" placeholder="3 Hours" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Difficulty Metric</label>
                        <select value={expForm.difficulty} onChange={e => setExpForm({...expForm, difficulty: e.target.value as any})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none uppercase font-bold text-xs text-white">
                          <option value="Easy">Easy</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Challenging">Challenging</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Meeting Destination Point</label>
                        <input type="text" value={expForm.meetingPoint} onChange={e => setExpForm({...expForm, meetingPoint: e.target.value})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Cover Image Link URL</label>
                        <input type="text" value={expForm.mainImage} onChange={e => setExpForm({...expForm, mainImage: e.target.value})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none" placeholder="https://unsplash.com/promo" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Adventure Synopsis</label>
                        <textarea value={expForm.description} onChange={e => setExpForm({...expForm, description: e.target.value})} rows={2} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 outline-none" />
                      </div>
                    </div>
                    <button type="submit" className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 border-none text-slate-950 font-black tracking-wider uppercase rounded-xl cursor-pointer shadow-md">
                      Commit & Deploy Adventure Spots registry
                    </button>
                  </form>
                )}

                {/* Experiences list cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
                  {experiencesList.map((exp: any) => (
                    <div key={exp.id} className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between ${exp.isArchived ? "opacity-75 bg-slate-50/50" : ""}`}>
                      <div>
                        {exp.mainImage && (
                          <div className="h-44 overflow-hidden relative">
                            <img src={exp.mainImage} alt={exp.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        <div className="p-5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[9px] uppercase">{exp.difficulty}</span>
                            <span className="font-extrabold text-teal-600 text-xs">{exp.price} / person</span>
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{exp.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 leading-normal font-medium">{exp.description}</p>
                          <div className="pt-2 flex items-center justify-between text-[10px] text-indigo-900 font-bold font-mono">
                            <span>🕒 {exp.duration}</span>
                            <span>📍 Base Point: {exp.meetingPoint || "Outpost Base"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Config panel controls footer */}
                      <div className="border-t border-slate-150 p-4 bg-slate-50/50 flex flex-wrap gap-2 justify-between items-center">
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => setSelectedExperience(exp)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg border-0 font-bold cursor-pointer text-[10px]"
                          >
                            Set Schedule
                          </button>
                          {permissions?.includes("analytics:view") && (
                            <button 
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/v1/admin/os/experiences/${exp.id}/analytics`);
                                  if (res.ok) {
                                    const body = await res.json();
                                    if (body.success) setExpAnalytics(body.data);
                                  }
                                } catch (e) {
                                  alert("Failed permissions checks. Only executive admin operators possess 'analytics:view' access.");
                                }
                              }}
                              className="px-2.5 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg border-0 font-bold cursor-pointer text-[10px]"
                            >
                              Analytics
                            </button>
                          )}
                        </div>
                        <div className="space-x-1">
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/v1/admin/os/experiences/${exp.id}/archive`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ isArchived: !exp.isArchived })
                                });
                                if (res.ok) loadExperiencesList();
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border-0 font-bold cursor-pointer text-[10px]"
                          >
                            {exp.isArchived ? "Restore" : "Archive"}
                          </button>
                          <button 
                            onClick={async () => {
                              if (!confirm(`Are you absolutely convinced of removing ${exp.title}?`)) return;
                              try {
                                const res = await fetch(`/api/v1/admin/os/experiences/${exp.id}`, { method: "DELETE" });
                                if (res.ok) loadExperiencesList();
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border-0 font-bold cursor-pointer text-[10px]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Experiences Analytics detail module info overlay modal */}
                {expAnalytics && (
                  <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-sm w-full p-6 border border-slate-800 shadow-2xl relative space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="text-[10px] bg-teal-500/20 text-teal-400 font-bold uppercase py-0.5 px-2 rounded tracking-widest">Secure Ledger Index</span>
                        <button onClick={() => setExpAnalytics(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer border-0 bg-transparent font-black">✕</button>
                      </div>
                      
                      <div className="space-y-3 font-sans">
                        <h4 className="font-extrabold text-sm uppercase text-slate-200">Revenue & Slot booking metrics</h4>
                        <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850">
                            <span className="text-[9px] text-slate-400 uppercase font-black">Total Bookings</span>
                            <p className="text-lg font-black text-emerald-400 mt-1">{expAnalytics.totalBookings}</p>
                          </div>
                          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850">
                            <span className="text-[9px] text-slate-400 uppercase font-black">Total Guest count</span>
                            <p className="text-lg font-black text-indigo-400 mt-1">{expAnalytics.totalBookedGuests}</p>
                          </div>
                          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 col-span-2">
                            <span className="text-[9px] text-slate-400 uppercase font-black">Total Revenue yielded</span>
                            <p className="text-xl font-black text-emerald-400 mt-1">₹{expAnalytics.totalRevenue?.toLocaleString()}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal font-mono pt-2 border-t border-slate-800">
                          Data represents aggregated ledger metrics retrieved from database audits. Access to metrics is protected by RBAC logs.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Experiences scheduling config modal */}
                {selectedExperience && (
                  <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h4 className="font-extrabold text-slate-850 text-xs uppercase">Schedule timetable for: {selectedExperience.title}</h4>
                        <button onClick={() => setSelectedExperience(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent font-black">✕</button>
                      </div>
                      
                      <div className="space-y-4 text-xs font-sans">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Scheduled Available Dates (Comma separated)</label>
                          <input 
                            type="text" 
                            id="exp-sched-dates"
                            defaultValue={selectedExperience.scheduledDates?.join(", ") || ""} 
                            placeholder="YYYY-MM-DD, e.g. 2026-06-25, 2026-06-28" 
                            className="w-full p-2.5 border border-slate-200 rounded-xl outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Max capacity threshold per run (Slots)</label>
                          <input 
                            type="number" 
                            id="exp-sched-capacity"
                            defaultValue={selectedExperience.capacity || "15"} 
                            className="w-full p-2.5 border border-slate-200 rounded-xl outline-none" 
                          />
                        </div>
                        
                        <button 
                          onClick={async () => {
                            const dInput = (document.getElementById("exp-sched-dates") as HTMLInputElement)?.value;
                            const cInput = (document.getElementById("exp-sched-capacity") as HTMLInputElement)?.value;
                            
                            try {
                              const res = await fetch(`/api/v1/admin/os/experiences/${selectedExperience.id}/schedule`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  scheduledDates: dInput.split(",").map(d => d.trim()).filter(Boolean),
                                  capacity: Number(cInput) || selectedExperience.capacity
                                })
                              });
                              if (res.ok) {
                                setSelectedExperience(null);
                                loadExperiencesList();
                              }
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase rounded-xl border-0 cursor-pointer text-xs tracking-wider"
                        >
                          Submit Schedule override
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 11. BOOKINGS & REFUNDS TAB */}
            {activeTab === "bookings" && (
              <div className="space-y-4 font-sans max-w-full">
                
                {/* Search Bar matching Booking ID, email */}
                <div className="flex gap-2 text-xs">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={bookingSearchText}
                      onChange={(e) => setBookingSearchText(e.target.value)}
                      placeholder="Search active guest ledger bookings by Booking ID, Email, Name, or Phone..."
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono outline-none"
                    />
                  </div>
                  <button 
                    onClick={loadBookingsList}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-black border-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-Query Bookings
                  </button>
                </div>

                {/* Table lists */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 uppercase tracking-wider font-mono text-[9px] border-b">
                          <th className="p-3 font-bold">Booking Reference ID</th>
                          <th className="p-3 font-bold">Customer Contact Info</th>
                          <th className="p-3 font-bold">Reservations Value</th>
                          <th className="p-3 font-bold">Checkout Status</th>
                          <th className="p-3 font-bold text-right">Actions Dashboard</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {bookingsList.map((b: any) => {
                          const hasStay = b.cartStays?.length > 0;
                          const hasExp = b.cartExperiences?.length > 0;
                          return (
                            <tr key={b.id} className="hover:bg-slate-50/50">
                              <td className="p-3">
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-indigo-950 font-mono tracking-wider">{b.bookingId}</span>
                                  <p className="text-[9px] text-slate-400 font-mono font-medium">Recorded: {new Date(b.createdAt).toLocaleString()}</p>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-slate-800 text-[11px]">{b.guestName}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">{b.guestEmail} | {b.guestPhone}</p>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-emerald-700 text-[11px]">₹{Number(b.amountPaid || 0).toLocaleString()}</p>
                                  <p className="text-[9px] font-medium text-slate-400 font-mono">{b.paymentType}</p>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider ${
                                  b.status === "Cancelled" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                                }`}>
                                  {b.status || "Confirmed"}
                                </span>
                              </td>
                              <td className="p-3 text-right whitespace-nowrap space-x-1">
                                <button
                                  onClick={() => setSelectedBooking(b)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border-0 font-bold cursor-pointer text-[10px]"
                                >
                                  Modify Details
                                </button>
                                {b.status !== "Cancelled" && (
                                  <button
                                    onClick={async () => {
                                      // Step-Up refund flow
                                      if (!permissions?.includes("refund:execute")) {
                                        alert("Permission Denied: Operator requires high stakes permission 'refund:execute' to cancel bookings.");
                                        return;
                                      }
                                      
                                      try {
                                        // Trigger phone challenge
                                        const res = await fetch("/api/v1/admin/auth/request-phone-otp", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ device_fingerprint: "admin_console_fallback_device" })
                                        });
                                        if (res.ok) {
                                          const body = await res.json();
                                          if (body.success) {
                                            setMfaChallengeId(body.data.challenge_id);
                                            setMfaMaskPhone(body.data.target_mask);
                                            setRefundingBookingId(b.bookingId);
                                            
                                            // Pre-fill fallback log code in dev env to ease preview validation
                                            if (body.data._dev_otp) {
                                              setMfaOtpInput(body.data._dev_otp);
                                              console.info(`PRE-LOADED STEPPING CODE IN PREVIEW WINDOW FOR CONSOLE AUTH: ${body.data._dev_otp}`);
                                            }
                                          }
                                        }
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md border-0 font-bold cursor-pointer text-[10px]"
                                  >
                                    Refund
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Booking modification details modal */}
                {selectedBooking && (
                  <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h4 className="font-extrabold text-slate-850 text-xs uppercase">Modify Booking: {selectedBooking.bookingId}</h4>
                        <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent font-black">✕</button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Customer Guest Name</label>
                          <input type="text" id="mod-guest-name" defaultValue={selectedBooking.guestName || ""} className="w-full p-2.5 border rounded-xl outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Phone Number</label>
                          <input type="text" id="mod-guest-phone" defaultValue={selectedBooking.guestPhone || ""} className="w-full p-2.5 border rounded-xl outline-none" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Email Address</label>
                          <input type="email" id="mod-guest-email" defaultValue={selectedBooking.guestEmail || ""} className="w-full p-2.5 border rounded-xl outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Arrival Timetable slot</label>
                          <input type="text" id="mod-arrival" defaultValue={selectedBooking.arrivalTime || ""} className="w-full p-2.5 border rounded-xl outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Reassign Outpost Room / Slot Resource</label>
                          <input type="text" id="mod-reassign" placeholder="e.g. Ganga View Luxury Villa - Room 302" defaultValue="" className="w-full p-2.5 border rounded-xl outline-none font-bold" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Special Operator Instructions</label>
                          <textarea id="mod-instructions" defaultValue={selectedBooking.specialNotes || ""} rows={2} className="w-full p-2.5 border rounded-xl outline-none" />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={async () => {
                            const name = (document.getElementById("mod-guest-name") as HTMLInputElement)?.value;
                            const phone = (document.getElementById("mod-guest-phone") as HTMLInputElement)?.value;
                            const email = (document.getElementById("mod-guest-email") as HTMLInputElement)?.value;
                            const arrival = (document.getElementById("mod-arrival") as HTMLInputElement)?.value;
                            const notes = (document.getElementById("mod-instructions") as HTMLTextAreaElement)?.value;
                            const reassign = (document.getElementById("mod-reassign") as HTMLInputElement)?.value;

                            try {
                              // Perform standard update
                              const res = await fetch(`/api/v1/admin/os/bookings/${selectedBooking.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  guestName: name,
                                  guestPhone: phone,
                                  guestEmail: email,
                                  arrivalTime: arrival,
                                  specialNotes: notes
                                })
                              });
                              
                              if (res.ok && reassign) {
                                // Trigger reassignment and allocation log if set
                                await fetch(`/api/v1/admin/os/bookings/${selectedBooking.id}/reassign`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ targetResource: reassign })
                                });
                              }

                              setSelectedBooking(null);
                              loadBookingsList();
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase rounded-xl border-0 cursor-pointer text-xs"
                        >
                          Persist Changes & Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* SMS Step-Up MFA Challenge input modal window */}
                {mfaChallengeId && (
                  <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 text-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4">
                      
                      <div className="pb-2 border-b border-slate-800 text-center">
                        <span className="text-[9px] uppercase font-black bg-rose-500/20 text-rose-400 py-1 px-2 rounded-full tracking-widest font-mono">
                          ★ High-Security Auth Step-Up Required
                        </span>
                        <h4 className="font-extrabold text-slate-100 text-sm mt-3 uppercase tracking-wider font-sans">Verify Identity to Cancel Refund</h4>
                      </div>

                      <div className="space-y-4 text-xs font-sans text-center">
                        <p className="text-slate-300 leading-relaxed text-[11px]">
                          Enter the secure SMS verification code dispatched to your registered operational mobile number:
                          <strong className="block text-emerald-400 mt-1 font-mono">{mfaMaskPhone}</strong>
                        </p>

                        <div className="space-y-1">
                          <input 
                            type="text" 
                            id="mfa-stepup-otp-code"
                            value={mfaOtpInput} 
                            onChange={e => setMfaOtpInput(e.target.value)}
                            placeholder="e.g. 123456" 
                            className="w-full text-center p-3 border border-slate-700 bg-slate-950 text-emerald-400 rounded-2xl outline-none font-mono text-lg font-black tracking-widest" 
                          />
                          <p className="text-[9px] text-slate-500 italic leading-tight font-mono">
                            Testing OTP code generated by developer console in logs in sandbox environment is preloaded for ease.
                          </p>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={() => {
                              setMfaChallengeId(null);
                              setMfaOtpInput("");
                            }}
                            className="w-1/3 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-xl border-0 font-bold cursor-pointer font-mono"
                          >
                            Abort
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/v1/admin/os/bookings/refund", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    bookingId: refundingBookingId,
                                    challengeId: mfaChallengeId,
                                    otp: mfaOtpInput
                                  })
                                });
                                
                                const body = await res.json();
                                if (res.ok && body.success) {
                                  alert("High-stakes booking refund transaction successfully recorded!");
                                  setMfaChallengeId(null);
                                  setMfaOtpInput("");
                                  loadBookingsList();
                                  loadStatsAndWidgets();
                                } else {
                                  alert(body.message || "OTP matches failed or expired. Please attempt code rotation again.");
                                }
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl border-0 font-black cursor-pointer uppercase text-[10px]"
                          >
                            Authenticate & Refund
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 12. SUPER ADMIN MODULE SETTINGS */}
            {activeTab === "system_settings" && (
              <div className="space-y-6 text-xs font-sans text-slate-800">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-slate-300 space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-extrabold text-emerald-400 uppercase tracking-widest text-[11px]">UbEx Global Operations control tower</h3>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Configuration settings inside this module override global system parameters of the UbEx checkout client, booking validations, and operator login flow in real-time. Alteration requires role `SUPER_ADMIN`.
                  </p>
                </div>

                {systemSettings ? (
                  <div className="space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Global Live Maintenance Blockade Mode</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Locks public checking client and displays global server upgrade overlay dialogs.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={systemSettings.maintenance_mode || false}
                          onChange={async (e) => {
                            const updated = { ...systemSettings, maintenance_mode: e.target.checked };
                            try {
                              const res = await fetch("/api/v1/admin/os/system-settings", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(updated)
                              });
                              if (res.ok) loadSystemSettings();
                            } catch (err) {
                              alert("MFA Failure context or incomplete permissions. Roles 'SUPER_ADMIN' required.");
                            }
                          }}
                          className="w-4 h-4 accent-emerald-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Mock SMS / Email Delivery Verification Bypass</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Enforces automatic pre-verification for rapid testing purposes on production previews.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={systemSettings.mfa_bypass_enforced || false}
                          onChange={async (e) => {
                            const updated = { ...systemSettings, mfa_bypass_enforced: e.target.checked };
                            try {
                              const res = await fetch("/api/v1/admin/os/system-settings", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(updated)
                              });
                              if (res.ok) loadSystemSettings();
                            } catch (err) {
                              alert("MFA Failure context or incomplete permissions. Roles 'SUPER_ADMIN' required.");
                            }
                          }}
                          className="w-4 h-4 accent-emerald-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Strict Device Location IP Validation check</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Blocks administrator dashboards if login occurs from unrecognized geological addresses pools.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={systemSettings.strict_ip_blocking || false}
                          onChange={async (e) => {
                            const updated = { ...systemSettings, strict_ip_blocking: e.target.checked };
                            try {
                              const res = await fetch("/api/v1/admin/os/system-settings", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(updated)
                              });
                              if (res.ok) loadSystemSettings();
                            } catch (err) {
                              alert("MFA Failure context or incomplete permissions. Roles 'SUPER_ADMIN' required.");
                            }
                          }}
                          className="w-4 h-4 accent-emerald-500 cursor-pointer"
                        />
                      </div>

                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 font-bold text-center py-4">Checking supervisor settings access rights...</p>
                )}
              </div>
            )}

            {/* 13. DYNAMIC INQUIRY ENGINE TRACKER PANEL */}
            {activeTab === "inquiries" && (
              <div className="space-y-6 text-xs font-sans text-slate-800">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-slate-300 space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-extrabold text-emerald-400 uppercase tracking-widest text-[11px]">UbEx Dynamic Inquiry Control Console</h3>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Real-time logs of customer-initiated stay, experience, and community board inquiries. Under Closed Beta rules, all submissions trigger back-end safety logging before opening a direct WhatsApp counselor channel.
                  </p>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Requests</p>
                    <p className="text-2xl font-black text-slate-950 mt-1">{inquiriesList.length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-yellow-500">Pending Leads</p>
                    <p className="text-2xl font-black text-yellow-600 mt-1">
                      {inquiriesList.filter(inq => (inq.inquiryStatus || inq.inquiry_status) === "pending").length}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-blue-500">Contacted</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">
                      {inquiriesList.filter(inq => (inq.inquiryStatus || inq.inquiry_status) === "contacted").length}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-emerald-500">Qualified/Conv</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">
                      {inquiriesList.filter(inq => ["qualified", "converted"].includes(inq.inquiryStatus || inq.inquiry_status)).length}
                    </p>
                  </div>
                </div>

                {/* Inquiries list */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-extrabold text-slate-700">Dynamic Inquiries Ledger</span>
                    <button 
                      onClick={loadInquiriesList}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 text-slate-500" /> Reload Inquiries
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    {inquiriesList.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold">No dynamic inquiries recorded yet.</p>
                        <p className="text-[10px] mt-0.5">Customer interactions on stays, tours, or surveys will compile sequentially here.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                            <th className="py-3 px-4">ID</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Title / Context</th>
                            <th className="py-3 px-4">Dates / Unit</th>
                            <th className="py-3 px-4">Device</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inquiriesList.map((inq: any) => {
                            const curStatus = inq.inquiryStatus || inq.inquiry_status || "pending";
                            const inqId = inq.inquiryId || inq.inquiry_id;
                            const createdDate = inq.createdAt || inq.created_at;

                            return (
                              <tr key={inqId} className="hover:bg-slate-50/55 transition-colors">
                                <td className="py-3 px-4 font-mono font-black text-indigo-650 shrink-0">
                                  {inqId}
                                  {createdDate && (
                                    <span className="block text-[9px] font-normal text-slate-400 font-sans mt-0.5">
                                      {new Date(createdDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${
                                    (inq.inquiryType || "").toLowerCase() === "stay" 
                                      ? "bg-amber-100 text-amber-800" 
                                      : (inq.inquiryType || "").toLowerCase() === "experience"
                                      ? "bg-cyan-100 text-cyan-800"
                                      : "bg-purple-100 text-purple-800"
                                  }`}>
                                    {inq.inquiryType || "Listing"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 max-w-[180px] truncate">
                                  <p className="font-extrabold text-slate-950 truncate">{inq.listingTitle || inq.listing_title}</p>
                                  {inq.roomName && <p className="text-[10px] text-slate-400 truncate mt-0.5">{inq.roomName}</p>}
                                </td>
                                <td className="py-3 px-4">
                                  <p className="font-mono text-slate-705">{inq.selectedDate || inq.selected_date || "TBD"}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{inq.guestCount || 1} Guests</p>
                                </td>
                                <td className="py-3 px-4">
                                  <p className="text-slate-600">{inq.deviceType || inq.device_type || "Desktop"}</p>
                                  <p className="text-[9px] text-slate-400 font-mono truncate max-w-[120px] mt-0.5">{inq.sourcePage || "App"}</p>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded-md font-extrabold text-[9px] uppercase ${
                                    curStatus === "pending" 
                                      ? "bg-yellow-101 text-yellow-800 border border-yellow-200" 
                                      : curStatus === "contacted"
                                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                                      : curStatus === "qualified"
                                      ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  }`}>
                                    {curStatus}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex gap-1.5 justify-end">
                                    {curStatus === "pending" && (
                                      <button
                                        onClick={() => handleUpdateInquiryStatus(inqId, "contacted")}
                                        className="px-2 py-1 bg-blue-50 border border-blue-100 text-blue-705 hover:bg-blue-100 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                                      >
                                        Contacted
                                      </button>
                                    )}
                                    {["pending", "contacted"].includes(curStatus) && (
                                      <button
                                        onClick={() => handleUpdateInquiryStatus(inqId, "qualified")}
                                        className="px-2 py-1 bg-indigo-50 border border-indigo-100 text-indigo-705 hover:bg-indigo-100 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                                      >
                                        Qualify
                                      </button>
                                    )}
                                    {curStatus !== "converted" && (
                                      <button
                                        onClick={() => handleUpdateInquiryStatus(inqId, "converted")}
                                        className="px-2 py-1 bg-emerald-50 border border-emerald-100 text-emerald-707 hover:bg-emerald-100 rounded-lg text-[9px] font-bold transition-all cursor-pointer animate-pulse"
                                      >
                                        Convert 🎉
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
