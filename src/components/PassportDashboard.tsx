import React, { useState, useEffect } from "react";
import { 
  Trophy, Award, Compass, Star, Camera, Video, Shield, User,
  ListFilter, Sparkles, BookOpen, Gift, RotateCcw, Plus, Edit2, Trash2, 
  ChevronRight, BarChart3, Users, Settings, Database, CheckCircle, Lock, Gem,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PassportDashboardProps {
  currentUser?: any;
  authHeader?: string;
  lang?: string;
  currencySymbol: string;
  convertAndFormatPrice: (price: number) => string;
}

export default function PassportDashboard({
  currentUser,
  authHeader,
  lang = "EN",
  currencySymbol,
  convertAndFormatPrice
}: PassportDashboardProps) {
  // Navigation tabs of Dashboard
  // "passport" | "destination" | "rewards" | "leaderboard" | "admin"
  const [activeTab, setActiveTab] = useState<string>("passport");
  
  // Passport State
  const [passport, setPassport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

  useEffect(() => {
    if (selectedBadge) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open");
    } else {
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
    };
  }, [selectedBadge]);

  // Admin Config Panel States
  const [adminData, setAdminData] = useState<any>(null);
  const [adminTab, setAdminTab] = useState<string>("badges"); // "badges" | "achievements" | "rewards" | "analytics" | "players"
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  
  // Form fields for create/edit
  const [formData, setFormData] = useState<any>({
    id: "",
    name: "",
    icon: "🗺️",
    color: "sky",
    description: "",
    xpAwarded: 100,
    activityType: "rafting",
    type: "destination",
    badgesRequired: 10,
    couponCode: ""
  });

  // Load Passport State
  const loadPassport = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authHeader) {
        headers["Authorization"] = authHeader;
      }
      const res = await fetch("/api/passport", { headers });
      if (!res.ok) throw new Error("Could not load Adventure Passport details.");
      const data = await res.json();
      if (data.success) {
        setPassport(data.passport);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load Admin configs
  const loadAdminData = async () => {
    try {
      const res = await fetch("/api/admin/passport-defs");
      if (res.ok) {
        const data = await res.json();
        setAdminData(data);
      }
    } catch (e) {
      console.error("Failed to load admin passport data", e);
    }
  };

  useEffect(() => {
    loadPassport();
    loadAdminData();
  }, [currentUser, authHeader]);

  // Escape key event listener to close overlay dialogs (Issue 3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedBadge(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Sandbox simulation tool flag (Issue 4)
  const showSandbox = window.location.hash === "#admin" || 
                      window.location.search.includes("admin=true") || 
                      window.location.search.includes("sandbox=true") ||
                      localStorage.getItem("isAdmin") === "true";

  // Simulate travel tasks
  const handleSimulateAction = async (action: string, payload: any) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const body = {
        action,
        payload,
        uid: currentUser?.uid || "guest-preview-id",
        email: currentUser?.email || "guest@ubex.com"
      };
      
      const res = await fetch("/api/passport/simulate", {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPassport(data.passport);
          loadAdminData();
          
          // Flash dynamic micro-animation / notification
          const simulatedToast = document.createElement("div");
          simulatedToast.className = "fixed bottom-5 right-5 bg-slate-900 border border-amber-400 text-white font-bold p-4 rounded-2xl shadow-2xl z-50 animate-bounce text-xs flex items-center gap-2";
          simulatedToast.innerHTML = `🌟 Simulated Action Succeeded! Saved and synchronized progress.`;
          document.body.appendChild(simulatedToast);
          setTimeout(() => simulatedToast.remove(), 4000);
        }
      }
    } catch (err) {
      console.error("Action simulation issue:", err);
    }
  };

  // Admin definitions handler
  const handleAdminAction = async (section: string, action: string, item: any) => {
    try {
      const endpoint = `/api/admin/${section}`;
      const payload: any = { action };
      payload[section.substring(0, section.length - 1)] = item; // badge, achievement, reward
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        loadAdminData();
        loadPassport();
        setEditingItem(null);
        setIsCreating(false);
      }
    } catch (err) {
      console.error("Admin save failure", err);
    }
  };

  // Helper colors mapping
  const badgeColorMapping: Record<string, string> = {
    sky: "bg-sky-50 border-sky-200 text-sky-700 shadow-sky-100/50",
    red: "bg-red-50 border-red-200 text-red-700 shadow-red-100/50",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-100/50",
    amber: "bg-amber-50 border-amber-200 text-amber-700 shadow-amber-100/50",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-indigo-100/50",
    orange: "bg-orange-50 border-orange-200 text-orange-700 shadow-orange-100/50",
    lime: "bg-lime-50 border-lime-200 text-lime-700 shadow-lime-100/50",
    cyan: "bg-cyan-50 border-cyan-200 text-cyan-700 shadow-cyan-100/50",
    yellow: "bg-yellow-50 border-yellow-250 text-yellow-750 shadow-yellow-100/50",
    purple: "bg-purple-50 border-purple-200 text-purple-700 shadow-purple-100/50"
  };

  const getBadgeColorClass = (color: string) => {
    return badgeColorMapping[color] || "bg-indigo-50 border-indigo-200 text-indigo-700";
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 font-sans antialiased text-[#0F1B3C]">
      
      {/* HEADER HERO AREA */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white p-8 md:p-12 mb-8 shadow-2xl border border-indigo-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.2),transparent_60%)] pointer-events-none" />
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
          <div className="space-y-3.5">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 font-mono text-[10px] uppercase font-bold tracking-widest rounded-full">
              👑 Gamified Loyalist Ecosystem
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none">
              UbEx <span className="text-amber-400 font-extrabold">Adventure Passport</span>
            </h1>
            <p className="text-slate-350 text-xs md:text-sm font-light max-w-xl">
              Track your unlocked accomplishments, raise your Explorer Levels, collect iconic destination trophies, and redeem valuable loyalty perks automatically as you book.
            </p>
          </div>

          {/* LEVEL BADGE / PROGRESS */}
          {passport && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl space-y-4 w-full lg:max-w-md shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-400 text-slate-950 text-2xl font-black rounded-xl flex items-center justify-center shadow-md animate-pulse">
                    {passport.level.icon}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Explorer Grade Rank</span>
                    <span className="text-md font-extrabold text-white block">Level {passport.level.current}: {passport.level.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">Current Balance</span>
                  <span className="font-mono text-emerald-400 font-black text-sm">{passport.xp} XP Points</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>{passport.xp} / {passport.level.maxXp} XP</span>
                  <span>{passport.level.progress}% Progress</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${passport.level.progress}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-amber-400 to-indigo-400 rounded-full"
                  />
                </div>
                <span className="text-[9px] text-slate-450 block italic text-right">
                  Next Rank Milestone: <strong className="text-indigo-300 font-bold">{passport.level.nextMilestone}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CORE NAVIGATION */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl mb-8 max-w-fit border border-slate-200">
        <button 
          onClick={() => setActiveTab("passport")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-0 ${
            activeTab === "passport" 
            ? "bg-white text-slate-900 shadow-sm" 
            : "text-slate-500 hover:text-slate-800 bg-transparent"
          }`}
        >
          <Award className="w-4 h-4 text-indigo-500" />
          Passport Badges
        </button>

        <button 
          onClick={() => setActiveTab("destination")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-0 ${
            activeTab === "destination" 
            ? "bg-white text-slate-900 shadow-sm" 
            : "text-slate-500 hover:text-slate-800 bg-transparent"
          }`}
        >
          <Compass className="w-4 h-4 text-indigo-500" />
          Destinations
        </button>

        <button 
          onClick={() => setActiveTab("rewards")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-0 ${
            activeTab === "rewards" 
            ? "bg-white text-slate-900 shadow-sm" 
            : "text-slate-500 hover:text-slate-800 bg-transparent"
          }`}
        >
          <Gift className="w-4 h-4 text-indigo-500" />
          Loyalty Rewards
        </button>

        <button 
          onClick={() => setActiveTab("leaderboard")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-0 ${
            activeTab === "leaderboard" 
            ? "bg-white text-slate-900 shadow-sm" 
            : "text-slate-500 hover:text-slate-800 bg-transparent"
          }`}
        >
          <Users className="w-4 h-4 text-indigo-500" />
          Leaderboard
        </button>

        <button 
          onClick={() => setActiveTab("admin")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-0 ${
            activeTab === "admin" 
            ? "bg-emerald-500 text-slate-950 shadow-sm" 
            : "text-emerald-700 hover:text-emerald-900 bg-emerald-50"
          }`}
        >
          <Settings className="w-4 h-4 text-slate-950" />
          Passport CMS Admin
        </button>
      </div>

      {loading && !passport ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-mono">Synchronizing passport history state...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          
          {/* TAB 1: PASSPORT BADGES */}
          {activeTab === "passport" && passport && (
            <motion.div 
              key="passport-tab" 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
               {/* SANDBOX TESTING BOX */}
               {showSandbox && (
                 <div className="p-4 bg-amber-500/10 border border-amber-400/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                   <div>
                     <div className="font-extrabold text-[#0F1B3C] text-xs uppercase tracking-wider flex items-center gap-1.5">
                       <Database className="w-4 h-4 text-amber-500" />
                       Interactive Simulation Sandbox (Demo Sandbox Option)
                     </div>
                     <p className="text-[11px] text-slate-600 mt-1 font-light">
                       Test how badges and achievements unlock in real-time. Since auth is set to Guest by default, simulate any activity or stay booking to trigger instant celebrations.
                     </p>
                   </div>
                   <div className="flex flex-wrap gap-1 md:self-center shrink-0">
                     <button 
                       onClick={() => handleSimulateAction("manual_badge", { badgeId: "rafting_master" })}
                       className="px-2.5 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 font-extrabold text-[10px] rounded-lg tracking-wider border-0 cursor-pointer"
                     >
                       🚣 Raft
                     </button>
                     <button 
                       onClick={() => handleSimulateAction("manual_badge", { badgeId: "bungee_brave" })}
                       className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 font-extrabold text-[10px] rounded-lg tracking-wider border-0 cursor-pointer"
                     >
                       🪂 Bungee
                     </button>
                     <button 
                       onClick={() => handleSimulateAction("manual_badge", { badgeId: "camp_explorer" })}
                       className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold text-[10px] rounded-lg tracking-wider border-0 cursor-pointer"
                     >
                       🏕 Camp
                     </button>
                     <button 
                       onClick={() => handleSimulateAction("manual_badge", { badgeId: "climbing_pro" })}
                       className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-850 font-extrabold text-[10px] rounded-lg tracking-wider border-0 cursor-pointer"
                     >
                       🧗 Climb
                     </button>
                     <button 
                       onClick={() => handleSimulateAction("manual_badge", { badgeId: "kayak_king" })}
                       className="px-2.5 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-extrabold text-[10px] rounded-lg tracking-wider border-0 cursor-pointer"
                     >
                       🚣 Kayak
                     </button>
                     <button 
                       onClick={() => handleSimulateAction("social_action", { type: "photo" })}
                       className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-extrabold text-[10px] rounded-lg tracking-wider border-0 cursor-pointer"
                     >
                       📸 Photos
                     </button>
                     <button 
                       onClick={() => handleSimulateAction("social_action", { type: "reel" })}
                       className="px-2.5 py-1.5 bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-800 font-extrabold text-[10px] rounded-lg tracking-wider border-0 cursor-pointer"
                     >
                       🎥 Reels
                     </button>
                     <button 
                       onClick={() => handleSimulateAction("reset_passport", {})}
                       className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[10px] rounded-lg tracking-wider border-0 cursor-pointer flex items-center gap-1"
                     >
                       <RotateCcw className="w-3 h-3" /> Reset
                     </button>
                   </div>
                 </div>
               )}

              {/* CORE METRICS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg shadow-sm">
                    🏅
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total Badges</span>
                    <span className="font-mono text-2xl font-black text-slate-800">
                      {passport.badges.filter((b: any) => b.earned).length} / {passport.badges.length}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold text-lg shadow-sm">
                    🏆
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Special Achievements</span>
                    <span className="font-mono text-2xl font-black text-slate-800">
                      {passport.achievements.filter((a: any) => a.earned).length} Unlocked
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg shadow-sm">
                    🗺️
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Explored Sites</span>
                    <span className="font-mono text-2xl font-black text-slate-800">
                      {passport.destinations.filter((d: any) => d.earned).length} Cities
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg shadow-sm">
                    🎁
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Claimed rewards</span>
                    <span className="font-mono text-2xl font-black text-slate-800">
                      {passport.rewards.filter((r: any) => r.earned).length} / {passport.rewards.length} unlocked
                    </span>
                  </div>
                </div>

              </div>

              {/* RECENT UNLOCKS BAR */}
              {passport.badges.some((b: any) => b.earned) && (
                <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/70">
                  <h4 className="font-extrabold text-xs text-indigo-950 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Recent Unlocks
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {passport.badges.filter((b: any) => b.earned).map((badge: any) => (
                      <div 
                        key={badge.id}
                        onClick={() => setSelectedBadge(badge)}
                        className="p-2 px-3.5 bg-white/80 border border-indigo-100 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer shadow-xs hover:border-indigo-300 transition-all"
                      >
                        <span className="text-sm">{badge.icon}</span>
                        <span>{badge.name}</span>
                        <span className="text-[9px] text-emerald-600 font-mono">earned ✓</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CORE ACTIVITY BADGES SECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Part 1: Experience Activity Badges</h3>
                    <p className="text-xs text-slate-450">Unlock high-quality activity badges by booking and completing specific outdoor operations.</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 shrink-0 select-none">
                    Count: {passport.badges.filter((b: any) => b.earned).length} / {passport.badges.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {passport.badges.map((badge: any) => {
                    const earned = badge.earned;
                    return (
                      <motion.div
                        key={badge.id}
                        whileHover={{ y: -4 }}
                        onClick={() => setSelectedBadge(badge)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center relative ${
                          earned 
                          ? `${getBadgeColorClass(badge.color)} shadow-md border-slate-300` 
                          : "bg-white border-slate-200 opacity-60 hover:opacity-90"
                        }`}
                      >
                        {/* Earned status ribbon */}
                        {earned ? (
                          <span className="absolute top-2.5 right-2.5 text-[9px] font-mono text-emerald-600 uppercase font-black tracking-widest bg-emerald-100 px-1.5 py-0.5 rounded-md">
                            ✓ Active
                          </span>
                        ) : (
                          <span className="absolute top-2.5 right-2.5 text-[9px] font-mono text-slate-450 uppercase font-bold tracking-widest bg-slate-100 px-1.5 py-0.5 rounded-md">
                            🔒 Locked
                          </span>
                        )}

                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl font-extrabold mb-4 border border-slate-150">
                          {badge.icon}
                        </div>

                        <span className="font-extrabold text-xs text-slate-900 block tracking-tight truncate max-w-full">{badge.name}</span>
                        <span className="text-[10px] text-slate-500 font-light mt-1.5 line-clamp-2 leading-tight">{badge.description}</span>
                        
                        <div className="mt-4 pt-3 border-t border-slate-100/50 w-full flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-mono">Awarded XP</span>
                          <span className="font-mono text-indigo-650 font-extrabold">+{badge.xpAwarded} XP</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* COMBOS & STAY ACHIEVEMENTS SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                
                {/* COMBO RETENTION SEC */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-black text-slate-950 tracking-tight">Part 4: Combo Achievements</h3>
                    <p className="text-xs text-slate-450">Unlock massively multiplied rewards when completing mixed combinations of outposts.</p>
                  </div>
                  <div className="space-y-3">
                    {passport.achievements.filter((a: any) => a.type === "combo").map((ach: any) => {
                      const earned = ach.earned;
                      return (
                        <div 
                          key={ach.id}
                          className={`p-4 bg-white border rounded-xl flex items-center justify-between gap-4 transition-all ${
                            earned ? "border-amber-400 bg-amber-500/5" : "border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{ach.icon}</span>
                            <div>
                              <span className="font-extrabold text-xs text-slate-900 block">{ach.name}</span>
                              <span className="text-[10px] text-slate-550 block font-light leading-snug">{ach.description}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {earned ? (
                              <span className="text-[10px] text-amber-600 font-black uppercase tracking-wider block">Unlocked ✓</span>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">No Combo</span>
                            )}
                            <span className="text-[10px] font-mono font-bold text-indigo-650 block">+{ach.xpAwarded} XP</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* STAY ATTACHMENTS SEC */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-black text-slate-950 tracking-tight">Part 5 & 6: Lodging & Social Achievements</h3>
                    <p className="text-xs text-slate-450">Participate in community groups, submit written photo reviews, or lodge across multiple cities.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {passport.achievements.filter((a: any) => a.type === "stay" || a.type === "social").map((ach: any) => {
                      const earned = ach.earned;
                      return (
                        <div 
                          key={ach.id}
                          className={`p-4 bg-white border rounded-xl flex flex-col justify-between gap-3 transition-all ${
                            earned ? "border-emerald-300 bg-emerald-500/5" : "border-slate-200"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="text-xl shrink-0 mt-0.5">{ach.icon}</span>
                            <div>
                              <span className="font-extrabold text-xs text-slate-900 block leading-tight">{ach.name}</span>
                              <span className="text-[9.5px] text-slate-500 font-light leading-tight mt-1 block">{ach.description}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-t pt-2 border-slate-100">
                            <span className="text-[9px] font-mono text-indigo-600 font-bold">+{ach.xpAwarded} XP</span>
                            {earned ? (
                              <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 font-bold">
                                <CheckCircle className="w-3 h-3" /> Unlocked
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Locked</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 2: DESTINATIONS COLLECTION */}
          {activeTab === "destination" && passport && (
            <motion.div 
              key="destination-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xl font-black text-slate-950">Part 3: Destination Collection System</h3>
                <p className="text-xs text-slate-500">Collect destination achievements. Expand your footprint across beautiful territories in Northern India.</p>
              </div>

              {/* Uttarakhand Master Spotlight */}
              {passport.destinations.some((d: any) => d.earned) && (
                <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300 rounded-3xl flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-16 h-16 bg-amber-400 text-slate-950 text-3xl rounded-2xl flex items-center justify-center font-black shadow-md shrink-0">
                    🏆
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-amber-600 font-black block">Elite State Achievement</span>
                    <h4 className="text-md font-bold text-slate-900">Uttarakhand Master Trophy Milestone</h4>
                    <p className="text-[11px] text-slate-600 font-light max-w-xl">
                      Complete all five major destinations in Uttarakhand (Rishikesh + Mussoorie + Auli + Nainital + Chopta) to earn the ultimate master trophy + 300 XP Bonus!
                    </p>
                  </div>
                  <div className="sm:ml-auto shrink-0">
                    {passport.achievements.find((a: any) => a.id === "uttarakhand_master")?.earned ? (
                      <span className="px-3.5 py-1.5 bg-emerald-600 text-white font-extrabold text-[10px] rounded-xl uppercase tracking-wider flex items-center gap-1">
                        ✓ Unlocked Master Status
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 bg-amber-100 text-amber-900 font-extrabold text-[10px] rounded-xl uppercase tracking-wider block text-center">
                        In Progress ({passport.destinations.filter((d: any) => ["Rishikesh Explorer", "Mussoorie Explorer", "Auli Explorer", "Nainital Explorer", "Chopta Explorer"].includes(d.name) && d.earned).length}/5 Complete)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* DESTINATIONS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {passport.destinations.map((dest: any) => (
                  <div 
                    key={dest.id}
                    className={`p-5 rounded-2xl border transition-all bg-white ${
                      dest.earned ? "border-slate-350 shadow-xs" : "border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border flex items-center justify-center text-2xl font-black">
                          {dest.icon}
                        </div>
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 block">{dest.name}</span>
                          <span className="text-[9px] text-slate-400 block font-mono">Location ID: {dest.id.replace("_explorer", "")}</span>
                        </div>
                      </div>
                      
                      {dest.earned ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-mono uppercase font-black tracking-wider rounded-md">
                          Explored
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-mono uppercase font-bold tracking-wider rounded-md">
                          Locked
                        </span>
                      )}
                    </div>

                    <p className="text-[10.5px] text-slate-500 font-light leading-relaxed mb-4">
                      Complete any lodging, trek runs, activities or local cafe trails hosted in {dest.name.replace(" Explorer", "")} to count.
                    </p>

                    <div className="flex items-center justify-between border-t pt-3 border-slate-100 text-[10px]">
                      <span className="text-slate-400">XP Reward</span>
                      <span className="font-mono text-indigo-650 font-bold block">+100 XP</span>
                    </div>
                  </div>
                ))}
              </div>

            </motion.div>
          )}

          {/* TAB 3: LOYALTY REWARDS */}
          {activeTab === "rewards" && passport && (
            <motion.div 
              key="rewards-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xl font-black text-slate-950">Part 8: Loyalty Benefits & Reward Milestones</h3>
                <p className="text-xs text-slate-500">Unravel premium travel advantages and discounts as your unlocked badge count grows.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {passport.rewards.map((rew: any) => {
                  const earned = rew.earned;
                  const earnedBadgesCount = passport.badges.filter((b: any) => b.earned).length;
                  const progressRatio = Math.min(100, Math.floor((earnedBadgesCount / rew.badgesRequired) * 100));
                  
                  return (
                    <div 
                      key={rew.id} 
                      className={`p-6 rounded-2xl border transition-all bg-white relative flex flex-col justify-between gap-4 ${
                        earned ? "border-indigo-400 shadow-md" : "border-slate-205"
                      }`}
                    >
                      {earned && (
                        <span className="absolute top-4 right-4 bg-indigo-600 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">
                          Active Benefit
                        </span>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Gem className={`w-5 h-5 ${earned ? "text-indigo-600" : "text-slate-400"}`} />
                          <span className="font-extrabold text-xs text-slate-900 block">{rew.name}</span>
                        </div>
                        <p className="text-[10.5px] text-slate-600 font-light leading-relaxed">{rew.description}</p>
                      </div>

                      {/* Coupon visual or locked details */}
                      {earned ? (
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
                          {rew.couponCode ? (
                            <>
                              <div>
                                <span className="text-[9px] text-indigo-400 font-mono block">COUPON CODE</span>
                                <span className="font-mono font-bold text-indigo-900 tracking-wider block">{rew.couponCode}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(rew.couponCode);
                                  alert("Copied discount coupon code!");
                                }}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-slate-900 text-white font-bold rounded-lg text-[9px] tracking-wider border-0 cursor-pointer uppercase shrink-0"
                              >
                                Copy
                              </button>
                            </>
                          ) : (
                            <span className="font-bold text-indigo-850 flex items-center gap-1">
                              ✓ Direct Priority Concierge Enabled
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                            <span>Requires {rew.badgesRequired} Badges</span>
                            <span>{earnedBadgesCount} / {rew.badgesRequired} Badges</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-400" style={{ width: `${progressRatio}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </motion.div>
          )}

          {/* TAB 4: LEADERBOARD */}
          {activeTab === "leaderboard" && (
            <motion.div 
              key="leaderboard-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xl font-black text-slate-950">Top Global Explorers</h3>
                <p className="text-xs text-slate-500">View performance indices of real travel members competing for rare high-tier status ranks.</p>
              </div>

              {adminData?.leaderboard ? (
                <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
                  <div className="grid grid-cols-12 gap-4 bg-slate-50 p-4 border-b text-[10px] font-extrabold uppercase tracking-wider text-slate-450">
                    <div className="col-span-1 text-center">Rank</div>
                    <div className="col-span-4">Explorer Identity</div>
                    <div className="col-span-3 text-center">Level Rank</div>
                    <div className="col-span-2 text-center">Badges count</div>
                    <div className="col-span-2 text-right">Lifetime XP</div>
                  </div>
                  <div className="divide-y text-xs">
                    {adminData.leaderboard.map((player: any, idx: number) => {
                      const isMe = player.id === (passport?.userId || -1);
                      return (
                        <div 
                          key={player.id} 
                          className={`grid grid-cols-12 gap-4 p-4 items-center ${
                            isMe ? "bg-indigo-50/50 font-bold" : ""
                          }`}
                        >
                          <div className="col-span-1 text-center font-mono">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                          </div>
                          <div className="col-span-4 flex items-center gap-1.5 font-bold">
                            <span>{player.email}</span>
                            {isMe && <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded text-[8px] uppercase tracking-wide">Me</span>}
                          </div>
                          <div className="col-span-3 text-center text-slate-600 font-bold">
                            Level {player.level} ({player.levelName})
                          </div>
                          <div className="col-span-2 text-center text-slate-500 font-mono">
                            {player.badgesCount} badges
                          </div>
                          <div className="col-span-2 text-right font-mono font-black text-indigo-750">
                            {player.xp} XP
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-450 text-center py-12">Leaderboard records synchronize shortly.</p>
              )}

            </motion.div>
          )}

          {/* TAB 5: CMS WORKSPACE ADMIN */}
          {activeTab === "admin" && (
            <motion.div 
              key="admin-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-950">Badge & Achievement Customization Panel</h3>
                  <p className="text-xs text-slate-500">Administrator and Host Workspace. Modify, delete, or define badge and reward rules.</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingItem(null);
                    setFormData({
                      id: `badge_custom_${Date.now()}`,
                      name: "",
                      icon: "🔥",
                      color: "sky",
                      description: "",
                      xpAwarded: 100,
                      activityType: "rafting",
                      type: "combo",
                      badgesRequired: 10,
                      couponCode: ""
                    });
                    setIsCreating(true);
                  }}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 border-0 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create Definition Rules
                </button>
              </div>

              {/* Sub tabs of admin dashboard */}
              <div className="flex gap-2 border-b pb-2 text-xs">
                <button className={`pb-2 px-1 font-bold ${adminTab === "badges" ? "border-b-2 border-emerald-500 text-emerald-700" : "text-slate-400"}`} onClick={() => setAdminTab("badges")}>Experience Badges</button>
                <button className={`pb-2 px-1 font-bold ${adminTab === "achievements" ? "border-b-2 border-emerald-500 text-emerald-700" : "text-slate-400"}`} onClick={() => setAdminTab("achievements")}>Achievements</button>
                <button className={`pb-2 px-1 font-bold ${adminTab === "rewards" ? "border-b-2 border-emerald-500 text-emerald-700" : "text-slate-400"}`} onClick={() => setAdminTab("rewards")}>Benefit Rewards</button>
              </div>

              {/* FORM POPUP / COMPONENT */}
              {(isCreating || editingItem) && (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 max-w-xl">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest">
                    {editingItem ? "Edit Ruleset" : "Create New Definition Ruleset"}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                    <div className="space-y-1">
                      <label className="block text-slate-400 uppercase text-[9px]">ID Key (Unique)</label>
                      <input 
                        type="text" 
                        value={formData.id} 
                        disabled={!!editingItem}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        className="w-full p-2 bg-white border rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-400 uppercase text-[9px]">Display Name</label>
                      <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2 bg-white border rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-400 uppercase text-[9px]">Emoji Icon</label>
                      <input 
                        type="text" 
                        value={formData.icon} 
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full p-2 bg-white border rounded-xl"
                      />
                    </div>
                    
                    {adminTab === "badges" && (
                      <>
                        <div className="space-y-1">
                          <label className="block text-slate-400 uppercase text-[9px]">Aesthetic Theme Color</label>
                          <select 
                            value={formData.color} 
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            className="w-full p-2 bg-white border rounded-xl"
                          >
                            <option value="sky">Sky Blue</option>
                            <option value="red">Red Thrill</option>
                            <option value="emerald">Emerald Forest</option>
                            <option value="amber">Amber Sunrise</option>
                            <option value="indigo">Indigo Stream</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-slate-400 uppercase text-[9px]">Associated Experience Term</label>
                          <input 
                            type="text" 
                            value={formData.activityType} 
                            onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                            className="w-full p-2 bg-white border rounded-xl"
                          />
                        </div>
                      </>
                    )}

                    {adminTab === "achievements" && (
                      <div className="space-y-1">
                        <label className="block text-slate-400 uppercase text-[9px]">Achievement Category</label>
                        <select 
                          value={formData.type} 
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full p-2 bg-white border rounded-xl"
                        >
                          <option value="destination">Destination Collection</option>
                          <option value="combo">Activity Combo</option>
                          <option value="stay">Stay Milestone</option>
                          <option value="social">Social Action</option>
                        </select>
                      </div>
                    )}

                    {adminTab === "rewards" && (
                      <>
                        <div className="space-y-1">
                          <label className="block text-slate-400 uppercase text-[9px]">Badges Requirement Count</label>
                          <input 
                            type="number" 
                            value={formData.badgesRequired} 
                            onChange={(e) => setFormData({ ...formData, badgesRequired: Number(e.target.value) })}
                            className="w-full p-2 bg-white border rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-slate-400 uppercase text-[9px]">Coupon Code</label>
                          <input 
                            type="text" 
                            value={formData.couponCode} 
                            onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                            className="w-full p-2 bg-white border rounded-xl font-mono uppercase text-xs font-bold"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-1 col-span-2">
                      <label className="block text-slate-400 uppercase text-[9px]">Definition description</label>
                      <textarea 
                        value={formData.description} 
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-2 bg-white border rounded-xl text-xs"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-400 uppercase text-[9px]">Awarded XP Gain</label>
                      <input 
                        type="number" 
                        value={formData.xpAwarded} 
                        onChange={(e) => setFormData({ ...formData, xpAwarded: Number(e.target.value) })}
                        className="w-full p-2 bg-white border rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 text-xs font-bold">
                    <button 
                      onClick={() => {
                        const section = adminTab;
                        const action = editingItem ? "update" : "create";
                        handleAdminAction(section, action, formData);
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl border-0 cursor-pointer"
                    >
                      ✓ Save Definition
                    </button>
                    <button 
                      onClick={() => { setEditingItem(null); setIsCreating(false); }}
                      className="px-4 py-2 bg-slate-200 text-slate-650 rounded-xl border-0 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* READ & DATA SECTIONS */}
              {adminData && (
                <div className="divide-y border rounded-xl bg-white overflow-hidden text-xs">
                  
                  {adminTab === "badges" && adminData.badges.map((badge: any) => (
                    <div key={badge.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{badge.icon}</span>
                        <div>
                          <span className="font-bold text-slate-900 block">{badge.name}</span>
                          <span className="text-[10px] text-slate-500 font-light block">{badge.description}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-slate-400">XP: <strong className="text-green-600">+{badge.xpAwarded}</strong></span>
                        <span className="text-slate-400">Activity: <strong>{badge.activityType}</strong></span>
                        <div className="flex gap-2">
                          <button 
                            className="p-1 text-slate-400 hover:text-indigo-600 bg-transparent border-0 cursor-pointer"
                            onClick={() => {
                              setEditingItem(badge);
                              setFormData(badge);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-1 text-slate-400 hover:text-red-500 bg-transparent border-0 cursor-pointer"
                            onClick={() => handleAdminAction("badges", "delete", badge)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {adminTab === "achievements" && adminData.achievements.map((ach: any) => (
                    <div key={ach.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{ach.icon}</span>
                        <div>
                          <span className="font-bold text-slate-900 block">{ach.name}</span>
                          <span className="text-[10px] text-slate-500 font-light block">{ach.description}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-slate-400">XP: <strong className="text-green-600">+{ach.xpAwarded}</strong></span>
                        <span className="text-slate-400 font-bold uppercase text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-md">{ach.type}</span>
                        <div className="flex gap-2">
                          <button 
                            className="p-1 text-slate-400 hover:text-indigo-600 bg-transparent border-0 cursor-pointer"
                            onClick={() => {
                              setEditingItem(ach);
                              setFormData({ ...ach, type: ach.type || "combo" });
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-1 text-slate-400 hover:text-red-500 bg-transparent border-0 cursor-pointer"
                            onClick={() => handleAdminAction("achievements", "delete", ach)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {adminTab === "rewards" && adminData.rewards.map((reward: any) => (
                    <div key={reward.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🎁</span>
                        <div>
                          <span className="font-bold text-slate-900 block">{reward.name}</span>
                          <span className="text-[10px] text-slate-500 font-light block">{reward.description}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-slate-400">Required: <strong>{reward.badgesRequired} badges</strong></span>
                        {reward.couponCode && <span className="bg-indigo-50 border px-1.5 py-0.5 rounded text-indigo-700 tracking-wider font-extrabold">{reward.couponCode}</span>}
                        <div className="flex gap-2">
                          <button 
                            className="p-1 text-slate-400 hover:text-indigo-600 bg-transparent border-0 cursor-pointer"
                            onClick={() => {
                              setEditingItem(reward);
                              setFormData(reward);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-1 text-slate-400 hover:text-red-500 bg-transparent border-0 cursor-pointer"
                            onClick={() => handleAdminAction("rewards", "delete", reward)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                </div>
              )}

            </motion.div>
          )}

        </AnimatePresence>
      )}

      {/* DETAIL DRAWER / POPUP FOR BADGES */}
      {selectedBadge && (
        <div 
          onClick={() => setSelectedBadge(null)}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[2200] animate-fade-in"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-3xl p-6 border text-center space-y-6 relative ${getBadgeColorClass(selectedBadge.color)} bg-white`}
          >
            <button 
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 border-none p-1.5 rounded-full text-slate-600 cursor-pointer flex items-center justify-center"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-24 h-24 rounded-3xl bg-white shadow-xl border flex items-center justify-center text-6xl mx-auto animate-bounce">
              {selectedBadge.icon}
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#0F1B3C]/50 block">UbEx Adventure Badge</span>
              <h3 className="text-lg font-black text-[#0F1B3C] tracking-tight">{selectedBadge.name}</h3>
              <p className="text-xs text-slate-655 font-light leading-relaxed whitespace-pre-line">{selectedBadge.description}</p>
            </div>

            <div className="p-4 bg-white/50 border border-black/5 rounded-2xl flex items-center justify-between text-xs">
              <span className="font-bold">Ecosystem Reward</span>
              <span className="font-mono font-extrabold text-indigo-750">+{selectedBadge.xpAwarded} XP Points</span>
            </div>

            {selectedBadge.earned ? (
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-extrabold bg-emerald-100 p-2.5 rounded-xl w-full">
                <CheckCircle className="w-4 h-4" /> Congratulations, Unlocked on {selectedBadge.earnedAt ? new Date(selectedBadge.earnedAt).toLocaleDateString() : "Active date"}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-505 font-bold bg-slate-200/50 p-2.5 rounded-xl w-full">
                <Lock className="w-4 h-4 text-slate-400" /> Book an excursion in Rishikesh and complete it to unlock!
              </div>
            )}
          </motion.div>
        </div>
      )}

    </div>
  );
}
