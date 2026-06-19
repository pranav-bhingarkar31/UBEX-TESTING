import React, { useState, useEffect } from "react";
import { 
  Trophy, Award, Compass, Sparkles, BookOpen, Gift, 
  Star, Users, MapPin, ChevronRight, CheckCircle2, Lock, 
  ArrowRight, Landmark, Phone, Camera, Video, Landmark as GovIcon, Shield,
  Layers, Flame, User, Play, Lightbulb, CheckCircle, RefreshCw, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UbexExplorerPassportSectionProps {
  currentUser?: any;
  lang?: string;
  setActiveView: (view: string) => void;
}

export default function UbexExplorerPassportSection({
  currentUser,
  lang = "EN",
  setActiveView
}: UbexExplorerPassportSectionProps) {
  // Live XP previewing state
  const [previewUserXp, setPreviewUserXp] = useState<number>(1250);
  const [previewLevel, setPreviewLevel] = useState<string>("🏔 Adventurer");
  const [previewBadges, setPreviewBadges] = useState<number>(8);
  const [previewDestinations, setPreviewDestinations] = useState<number>(4);
  const [userNameField, setUserNameField] = useState<string>(currentUser?.displayName || "Rahul");
  const [selectedRegionCollection, setSelectedRegionCollection] = useState<string>("Uttarakhand");
  const [activeTab, setActiveTab] = useState<"xp" | "levels" | "badges" | "collections" | "rewards" | "community">("xp");
  
  // XP counter addition toast simulator
  const [xpAdds, setXpAdds] = useState<{ id: number; text: string }[]>([]);
  const [xpTimer, setXpTimer] = useState<number>(0);

  // Auto-fill currentUser name if changed
  useEffect(() => {
    if (currentUser?.displayName) {
      setUserNameField(currentUser.displayName);
    }
  }, [currentUser]);

  // Social Proof Dynamic Counter simulator
  const [explorersCount, setExplorersCount] = useState(14850);
  const [experienceCompleted, setExperienceCompleted] = useState(4890);
  const [reviewsCount, setReviewsCount] = useState(2420);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setExplorersCount(prev => prev + (Math.random() > 0.7 ? 1 : 0));
      setExperienceCompleted(prev => prev + (Math.random() > 0.8 ? 1 : 0));
      setReviewsCount(prev => prev + (Math.random() > 0.95 ? 1 : 0));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const triggerXpAddition = (amount: number, description: string) => {
    setPreviewUserXp(prev => Math.min(10000, prev + amount));
    const newId = ++prevId;
    setXpAdds(prev => [...prev, { id: newId, text: `+${amount} XP (${description})` }]);
    setTimeout(() => {
      setXpAdds(prev => prev.filter(x => x.id !== newId));
    }, 2500);

    // Dynamic level adjustment
    const total = previewUserXp + amount;
    if (total < 100) {
      setPreviewLevel("🌱 New Explorer");
    } else if (total < 500) {
      setPreviewLevel("🧭 Wanderer");
    } else if (total < 2000) {
      setPreviewLevel("🏔 Adventurer");
    } else if (total < 5000) {
      setPreviewLevel("🌍 Explorer Elite");
    } else {
      setPreviewLevel("👑 UbEx Legend");
    }
  };

  const handleLevelSelect = (levelName: string, xpBase: number, badges: number, dests: number) => {
    setPreviewLevel(levelName);
    setPreviewUserXp(xpBase);
    setPreviewBadges(badges);
    setPreviewDestinations(dests);
  };

  const levelsList = [
    { name: "🌱 New Explorer", desc: "First Booking", xp: 50, badges: 1, dests: 1, req: "Join UbEx platform" },
    { name: "🧭 Wanderer", desc: "3 Experiences Locked", xp: 450, badges: 3, dests: 2, req: "Complete 3 outdoor items" },
    { name: "🏔 Adventurer", desc: "10 Experiences", xp: 1250, badges: 8, dests: 4, req: "Complete 10 high-thrills" },
    { name: "🌍 Explorer Elite", desc: "25 Experiences", xp: 3200, badges: 15, dests: 6, req: "Complete 25 stays/adventures" },
    { name: "👑 UbEx Legend", desc: "50+ Experiences", xp: 7500, badges: 32, dests: 12, req: "Complete 50+ local circles" }
  ];

  const badgesList = [
    { name: "🌊 Rafting Master", desc: "Completed the 24km Kaudiyala rapid-run", req: "Raft with level 4 certified guide", earned: true, icon: "🌊", bg: "from-sky-500/20 to-indigo-500/10" },
    { name: "🏕 Camp Explorer", desc: "Stayed in standard riverside camps", req: "Book any outdoor luxury tent", earned: true, icon: "🏕", bg: "from-emerald-500/20 to-teal-500/10" },
    { name: "🧗 Climbing Pro", desc: "Summited standard Tapovan high points", req: "Climb certified natural rock routes", earned: true, icon: "🧗", bg: "from-amber-500/20 to-orange-500/10" },
    { name: "🚣 Kayak King", desc: "Paddled single kayaks through Class II water", req: "Navigate rapids in a custom kayak", earned: true, icon: "🛶", bg: "from-cyan-500/20 to-blue-500/10" },
    { name: "🦅 Sky Rider", desc: "Completed the Bungee or Giant Swing", req: "Secure 83m classic canyon jump", earned: true, icon: "🦅", bg: "from-purple-500/20 to-indigo-500/10" },
    { name: "🏎 Terrain Conqueror", desc: "Completed the ATV gravel path runs", req: "Book 10km dirt-track motorcycle run", earned: true, icon: "🏎", bg: "from-rose-500/20 to-orange-500/10" },
    { name: "💻 Digital Nomad", desc: "Ergonomic co-working space regular", req: "7 nights booked on Workation program", earned: true, icon: "💻", bg: "from-blue-500/20 to-purple-500/10" },
    { name: "🎒 Complete Traveler", desc: "Mastered all aspects of local escapes", req: "Book Stay, Experience & Cleanup together", earned: true, icon: "🎒", bg: "from-fuchsia-500/20 to-pink-500/10" },
    { name: "🌌 Mountain Nomad", desc: "Camped beneath high-ridge constellations", req: "Complete Himalayan high-pass trek", earned: false, icon: "🌌", bg: "from-slate-500/20 to-indigo-500/10" },
    { name: "🏆 Uttarakhand Master", desc: "Completed every curated belt stay", req: "Stay in 5 unique Uttarakhand districts", earned: false, icon: "🏆", bg: "from-yellow-500/30 to-amber-500/20" }
  ];

  const destinationCollections = {
    "Uttarakhand": {
      title: "🏔 Uttarakhand Explorer",
      progress: "2/5",
      reward: "🏆 Uttarakhand Master Badge",
      items: [
        { name: "Rishikesh", completed: true },
        { name: "Mussoorie", completed: true },
        { name: "Auli", completed: false },
        { name: "Chopta", completed: false },
        { name: "Nainital", completed: false }
      ]
    },
    "Himachal": {
      title: "🌲 Himachal Ridge Runner",
      progress: "0/4",
      reward: "🧭 Pine Valley Legend Badge",
      items: [
        { name: "Manali Outpost", completed: false },
        { name: "Dharamshala", completed: false },
        { name: "Kasol Stream", completed: false },
        { name: "Spiti Dome", completed: false }
      ]
    },
    "Goa": {
      title: "🏖 Sun & Salt Explorer",
      progress: "0/3",
      reward: "🏄 Surf Master Elite Icon",
      items: [
        { name: "Arambol Surf Camp", completed: false },
        { name: "Palolem Backwater", completed: false },
        { name: "Anjuna Work-co", completed: false }
      ]
    },
    "Rajasthan": {
      title: "🐪 Desert Citadel Explorer",
      progress: "0/3",
      reward: "👑 Rajputana Legend Shield",
      items: [
        { name: "Jaisalmer Dunes Loft", completed: false },
        { name: "Udaipur Lake Villa", completed: false },
        { name: "Jaipur Heritage", completed: false }
      ]
    },
    "Kashmir": {
      title: "❄️ Frozen Ridge Conqueror",
      progress: "0/3",
      reward: "🏔 Great Lakes Pioneer Badge",
      items: [
        { name: "Gulmarg Snow cabin", completed: false },
        { name: "Pahalgam Pine Valley", completed: false },
        { name: "Srinagar Shikara House", completed: false }
      ]
    }
  };

  const rewardCards = [
    { badges: 10, title: "🎁 5% Stay Discount", desc: "Get an automatic cash reduction on any scenic room rental across active partner listings.", perks: ["No blackout days", "Transferable once"] },
    { badges: 20, title: "⚡ Priority Support", desc: "Direct route handling with senior hosts and dedicated SOS adventure desk connection.", perks: ["2-minute responses", "Free room upgrades if available"] },
    { badges: 30, title: "🌊 Exclusive Experiences", desc: "Access code for private high-altitude bonfire tracks, hidden waterfalls, and secret spiritual trails.", perks: ["Invite-only circles", "Free high-end rental goggles"] },
    { badges: 50, title: "👑 Explorer Elite Club", desc: "Zero booking processing fees, premium luxury lounge entries, and prototype gear trial access.", perks: ["Complimentary private drone footage", "Lifetime member-only rates"] }
  ];

  const communityRecognitions = [
    { title: "📸 Guest Stories", desc: "Share native photos, write local logs on Tapovan cafes, and list high-rapids guides. Every story published unlocks +50 XP and gets featured on the homepage carousel.", icon: "📸" },
    { title: "⭐ Verified Reviews", desc: "Leave structured feedback about security, meal hygiene, and host behavior. Helps maintain premium hospitality guidelines and rewards +20 XP instantly.", icon: "⭐" },
    { title: "🏆 Explorer Leaderboards", desc: "Compete with mountain climbers, developers, and writers globally. Top 3 explorers every month unlock free rafting vouchers.", icon: "🏆" },
    { title: "🎖 Achievement Showcases", desc: "Connect your social profiles and display your active digital passport on Instagram, LinkedIn, or personal portfolio. Flaunt your elite traveler status.", icon: "🎖" }
  ];

  const featuredStories = [
    { author: "Vikram R., Mumbai", stay: "Workation Tapovan", quote: "I came to Rishikesh for a week and stayed for two months! Earning XP and tracking my badges made the co-living feel like a real-life video game.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80" },
    { author: "Elena S., Munich", stay: "Ganga Luxury Outpost", quote: "Completing the Rishikesh Destination collection unlocked a 5% stay discount which I used instantly on my private yoga villa excursion. Stellar concept!", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80" }
  ];

  return (
    <section id="ubex-passport-section" className="py-20 rounded-[32px] md:rounded-[40px] my-12 mx-4 sm:mx-8 bg-slate-950 text-white border border-white/5 relative overflow-hidden select-none shadow-2xl">
      {/* Decorative luxury backgrounds */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-650/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Animated Floating XP floating block */}
      <div className="fixed top-8 right-8 z-[1000] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {xpAdds.map((add) => (
            <motion.div
              key={add.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100 }}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-indigo-950 font-black text-xs rounded-2xl shadow-xl flex items-center gap-1.5 border border-amber-300"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{add.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 mb-4 shadow-sm">
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> THE EXPLORER ENGAGEMENT ENGINE
          </span>
          <h2 className="text-4.5xl sm:text-6xl font-black font-display text-white tracking-tight leading-none">
            {lang === "HI" ? "यात्रा केवल बुकिंग से अधिक होनी चाहिए।" : "Travel Should Be "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-amber-400">
              {lang === "HI" ? "कुछ खास" : "More Than"}
            </span>
            {lang === "HI" ? "" : " Just Booking."}
          </h2>
          <p className="text-slate-300 text-base sm:text-lg font-light mt-6 leading-relaxed max-w-2xl mx-auto">
            Every stay, experience, review, story, and adventure helps you earn XP, unlock badging structures, level up, and access premium explorer rewards on the UbEx ecosystem.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <button
              onClick={() => {
                setActiveView("passport");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-6 py-3.5 bg-gradient-to-r from-indigo-650 to-indigo-850 hover:from-indigo-700 hover:to-indigo-900 text-white font-black text-sm rounded-xl hover:shadow-[0_0_25px_rgba(91,75,255,0.2)] transition-all flex items-center gap-2 border-0 cursor-pointer shadow-md"
            >
              <span>View Explorer Passport</span> <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setActiveView("passport");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl transition border border-slate-200/80 cursor-pointer shadow-sm"
            >
              Explore Rewards
            </button>
          </div>
        </div>

        {/* ================= BENTO GRID OVERVIEW & LIVE PASSPORT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-20">
          
          {/* LEFT: LIVE PASSPORT WIDGET SIMULATOR CARD */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 relative overflow-hidden shadow-lg shadow-slate-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
            <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-indigo-600/5 rounded-full blur-2xl" />
            
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-lg font-black shrink-0 shadow-sm border border-indigo-100">
                    🏆
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-indigo-950 uppercase block">Explorer Passport</h3>
                    <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Verified Traveler ID</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono shrink-0 px-2.5 py-1 bg-indigo-50 border border-indigo-100/50 text-indigo-700 rounded-full font-bold">
                  SYNCED LIVE
                </span>
              </div>

              {/* Physical Passport Look Card */}
              <div className="bg-gradient-to-b from-[#18203b] to-[#0f152b] border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                  <Compass className="w-48 h-48 text-white" />
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">TRAVELER PROFILE</span>
                    <input 
                      type="text" 
                      value={userNameField}
                      onChange={(e) => setUserNameField(e.target.value)}
                      placeholder="Your Name"
                      className="bg-transparent border-b border-dashed border-white/20 text-white font-extrabold text-sm mt-1 focus:outline-none focus:border-amber-400 w-32"
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-slate-400 uppercase block">ACTIVE PATH LEVEL</span>
                    <span className="text-xs font-black text-amber-300 block mt-1">{previewLevel}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-white/5 font-mono text-left">
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase">Experience XP</span>
                    <span className="text-xs font-black text-white block mt-0.5">{previewUserXp} XP</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase">Badges Earned</span>
                    <span className="text-xs font-black text-white block mt-0.5">{previewBadges} / 10</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase">Regions</span>
                    <span className="text-xs font-black text-white block mt-0.5">{previewDestinations} Collected</span>
                  </div>
                </div>

                {/* Progress bar info for NEXT MILESTONE */}
                <div className="mt-5 text-left">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Milestone Progress</span>
                    <span className="text-amber-300 font-bold">{Math.min(100, Math.round((previewUserXp / 5000) * 100))}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-1.5 border border-white/5">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.min(100, (previewUserXp / 5000) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-400 mt-2 font-mono">
                    <span>Recent Goal: ⛵ Rafting Master</span>
                    <span>Next Reward: <span className="text-amber-300 font-bold">5% Stay Discount</span></span>
                  </div>
                </div>
              </div>

              {/* Slider / Preview Controls inside card container */}
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 test-simulation text-left">
                <span className="text-[9px] text-indigo-700 font-black tracking-widest uppercase block flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-650" /> INTERACTIVE PROFILE WORKBENCH
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                  Simulate different traveler scenarios to understand the progression engine instantly before you register.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => handleLevelSelect("🌱 New Explorer", 85, 1, 1)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-400 text-[10px] rounded-lg transition text-slate-700 cursor-pointer text-left font-mono shadow-sm"
                  >
                    🌱 Newbie
                  </button>
                  <button 
                    onClick={() => handleLevelSelect("🏔 Adventurer", 1250, 8, 4)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-400 text-[10px] rounded-lg transition text-slate-700 cursor-pointer text-left font-mono shadow-sm"
                  >
                    🏔 Adventurer
                  </button>
                  <button 
                    onClick={() => handleLevelSelect("👑 UbEx Legend", 7500, 32, 12)}
                    className="px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 text-[10px] rounded-lg transition text-amber-800 cursor-pointer text-left font-mono"
                  >
                    👑 Legendary
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 text-left text-xs text-slate-500">
              <span className="font-bold block text-slate-800 mb-1 flex items-center gap-1">
                 🔒 SECURE REGISTRATION DELEGATE
              </span>
              Your explorer progression is automatically registered locally on your browser database without compromising your identity.
              <button 
                onClick={() => {
                  setActiveView("passport");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full mt-4 py-3 bg-indigo-950 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all duration-300 hover:scale-[1.01]"
              >
                <span>Navigate to Passport Terminal</span> <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* RIGHT: TABS AND EXPLORATION CONTENT */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-slate-200/90 rounded-[32px] p-6 sm:p-8 relative shadow-lg shadow-slate-100">
            
            {/* Horizontal Segment Switcher */}
            <div className="flex gap-1.5 overflow-x-auto pb-4 scrollbar-none border-b border-slate-100">
              {[
                { key: "xp", label: "🌟 How XP Works", icon: Star },
                { key: "levels", label: "📈 Progression Levels", icon: Layers },
                { key: "badges", label: "🎖 Badge Collections", icon: Award },
                { key: "collections", label: "🗺 Destination Cards", icon: Compass },
                { key: "rewards", label: "🎁 Luxury Perks", icon: Gift },
                { key: "community", label: "👥 Community Hub", icon: Users }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                      isActive 
                        ? "bg-indigo-650 text-white font-black shadow-md shadow-indigo-650/10" 
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100/80 border border-slate-200/60"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT ZONE */}
            <div className="flex-1 py-6">
              
              {/* TAB 1: HOW XP WORKS */}
              {activeTab === "xp" && (
                <div className="space-y-6 text-left animate-fade-in">
                  <div>
                    <h3 className="text-xl font-bold font-display text-indigo-950">Earn XP On Every Adventure</h3>
                    <p className="text-xs text-slate-500 font-normal mt-1">Your journey is rewarded at every step. Click any action card to simulate adding real XP to your passport preview!</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { title: "🏡 Stay Booking", xp: 50, color: "text-emerald-800 bg-emerald-50 border-emerald-100/80", desc: "Co-living & villas" },
                      { title: "🌊 Experience Booking", xp: 100, color: "text-indigo-800 bg-indigo-50 border-indigo-100/80", desc: "Rafting / Bungee slot" },
                      { title: "⭐ Verified Review", xp: 20, color: "text-amber-800 bg-amber-50 border-amber-100/80", desc: "Meal & host reviews" },
                      { title: "📸 Upload Photos", xp: 10, color: "text-sky-800 bg-sky-50 border-sky-100/80", desc: "Attach to trip card" },
                      { title: "🎥 Upload Video", xp: 25, color: "text-rose-800 bg-rose-50 border-rose-100/80", desc: "Drone or action cams" },
                      { title: "📖 Share Guest Story", xp: 50, color: "text-purple-800 bg-purple-50 border-purple-100/80", desc: "Detailed written blog" }
                    ].map((it, idx) => (
                      <div
                        key={idx}
                        onClick={() => triggerXpAddition(it.xp, it.title)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.03] flex flex-col justify-between h-28 relative overflow-hidden group ${it.color}`}
                      >
                        <div className="absolute right-0 bottom-0 opacity-5 font-bold text-4xl shrink-0 group-hover:scale-110 transition-transform">✨</div>
                        <div>
                          <h4 className="font-extrabold text-xs tracking-tight">{it.title}</h4>
                          <p className="text-[10px] text-slate-500 font-light mt-1">{it.desc}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/60">
                          <span className="text-[10px] font-mono tracking-wide underline group-hover:no-underline font-semibold block">Click to Add</span>
                          <span className="text-sm font-black font-mono font-bold text-slate-800">+{it.xp} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: EXPLORER LEVELS */}
              {activeTab === "levels" && (
                <div className="space-y-6 text-left animate-fade-in">
                  <div>
                    <h3 className="text-xl font-bold font-display text-indigo-950">Level Up Your Explorer Journey</h3>
                    <p className="text-xs text-slate-500 font-normal mt-1">Grow from a curious newcomer into a legendary mountaineer on the northern grid.</p>
                  </div>

                  <div className="space-y-3 relative">
                    {/* Progression bar line behind */}
                    <div className="absolute left-6 top-3 bottom-3 w-1 bg-slate-100 pointer-events-none" />

                    {levelsList.map((level, idx) => {
                      const isActive = previewLevel.includes(level.name.split(" ").slice(1).join(" "));
                      return (
                        <div
                          key={idx}
                          onClick={() => handleLevelSelect(level.name, level.xp, level.badges, level.dests)}
                          className={`flex gap-4 items-center p-3 sm:p-4 rounded-xl border transition-all cursor-pointer relative z-10 ${
                            isActive 
                              ? "bg-amber-50/50 border-amber-400/50 shadow-sm scale-[1.01]" 
                              : "bg-slate-50 border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shrink-0 ${isActive ? "bg-amber-400 text-slate-950" : "bg-slate-100 text-slate-700"}`}>
                            {level.name.split(" ")[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <h4 className="font-extrabold text-xs sm:text-sm text-indigo-950 truncate">{level.name}</h4>
                              <span className="text-[10px] font-bold text-amber-800 font-mono tracking-tight shrink-0 bg-amber-150 px-2 py-0.5 rounded">
                                {level.xp} XP Required
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                              <span>Perks: {level.desc}</span>
                              <span className="font-normal italic">Requirements: {level.req}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: ADVENTURE BADGES */}
              {activeTab === "badges" && (
                <div className="space-y-4 text-left animate-fade-in">
                  <div className="flex justify-between items-end gap-2">
                    <div>
                      <h3 className="text-xl font-bold font-display text-indigo-950">Unlock Adventure Badges</h3>
                      <p className="text-xs text-slate-500 font-normal mt-1">Every experience leaves a mark on your passport. Hover coordinates show instructions.</p>
                    </div>
                    <span className="text-xs font-mono text-amber-800 bg-amber-50 shrink-0 px-3 py-1 rounded-xl border border-amber-200 font-bold">
                      {previewBadges} / 10 Earned
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                    {badgesList.map((badge, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-between text-center relative group overflow-hidden hover:border-indigo-400/50 transition-all cursor-pointer h-32"
                        title={badge.req}
                      >
                        {/* 3D Glow on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        
                        <span className="text-3xl filter drop-shadow-md transform group-hover:scale-120 duration-300 block">
                          {badge.icon}
                        </span>
                        
                        <div className="mt-1 flex-1 flex flex-col justify-center">
                          <h4 className="font-extrabold text-[11px] text-indigo-950 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                            {badge.name}
                          </h4>
                          <p className="text-[8px] text-slate-500 font-normal mt-1.5 leading-snug line-clamp-2">
                            {badge.desc}
                          </p>
                        </div>

                        {idx < previewBadges ? (
                          <span className="text-[8px] bg-emerald-100 border border-emerald-250 text-emerald-800 font-black tracking-widest px-2 py-0.5 rounded uppercase mt-2 w-full">
                            ✓ UNLOCKED
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-200 border border-slate-300 text-slate-400 font-medium px-2 py-0.5 rounded w-full flex items-center justify-center gap-0.5 mt-2">
                            <Lock className="w-2.5 h-2.5" /> LOCKED
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: DESTINATION COLLECTIONS */}
              {activeTab === "collections" && (
                <div className="space-y-4 text-left animate-fade-in font-sans">
                  <div>
                    <h3 className="text-xl font-bold font-display text-indigo-950">Collect Destinations</h3>
                    <p className="text-xs text-slate-500 font-normal mt-1">Travel across regions and complete destination collections to unlock Master Medals.</p>
                  </div>

                  {/* Regional switches */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {Object.keys(destinationCollections).map((reg) => (
                      <button
                        key={reg}
                        onClick={() => setSelectedRegionCollection(reg)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedRegionCollection === reg 
                            ? "bg-indigo-650 text-white font-extrabold shadow-sm" 
                            : "bg-slate-50 text-slate-650 hover:text-indigo-950 border border-slate-200"
                        }`}
                      >
                        {reg}
                      </button>
                    ))}
                  </div>

                  {/* Active Selected Card info */}
                  {(() => {
                    const data = destinationCollections[selectedRegionCollection as keyof typeof destinationCollections];
                    return (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 relative overflow-hidden flex flex-col sm:flex-row justify-between items-stretch gap-6">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-b from-indigo-500/5 to-transparent blur-xl pointer-events-none" />
                        
                        <div className="flex-1 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-extrabold text-sm text-indigo-950 flex items-center gap-2">
                              <span>🏔</span> {data.title}
                            </h4>
                            <span className="text-xs text-indigo-700 font-mono font-bold bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100/50">
                              {data.progress} Completed
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {data.items.map((item, id) => (
                              <div 
                                key={id} 
                                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                                  item.completed 
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                                    : "bg-white border-slate-150 text-slate-400"
                                }`}
                              >
                                {item.completed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-650 shrink-0" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                                )}
                                <span className="truncate">{item.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="w-full sm:w-48 bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between shrink-0 font-mono text-[11px] leading-relaxed">
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase">COLLECTION PRIZE</span>
                            <span className="font-bold text-amber-800 block mt-1 leading-snug">{data.reward}</span>
                          </div>
                          <div className="mt-4 text-slate-405 text-[10px] leading-relaxed italic">
                            All locations checked on checkout sync real database values.
                          </div>
                        </div>

                      </div>
                    );
                  })()}

                </div>
              )}

              {/* TAB 5: REWARDS */}
              {activeTab === "rewards" && (
                <div className="space-y-4 text-left animate-fade-in font-sans">
                  <div>
                    <h3 className="text-xl font-bold font-display text-indigo-950">Unlock Explorer Rewards</h3>
                    <p className="text-xs text-slate-500 font-normal mt-1">The more you explore, the more high-end perks you unlock automatically in our partner properties.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                    {rewardCards.map((card, idx) => {
                      const isAcquired = previewBadges >= card.badges;
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border relative overflow-hidden flex flex-col justify-between h-36 ${
                            isAcquired 
                              ? "bg-gradient-to-r from-amber-50/45 to-amber-100/40 border-amber-300" 
                              : "bg-slate-50 border-slate-200 opacity-80"
                          }`}
                        >
                          <div className="absolute top-2 right-3 font-mono text-[9px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 uppercase tracking-widest font-bold">
                            {card.badges} Badges Required
                          </div>

                          <div>
                            <h4 className="font-extrabold text-xs sm:text-sm text-indigo-950 flex items-center gap-1.5 mt-2">
                              {card.title}
                            </h4>
                            <p className="text-[10px] text-slate-600 leading-snug tracking-tight mt-1">
                              {card.desc}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-100">
                            {card.perks.map((p, id) => (
                              <span key={id} className="text-[8px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                                • {p}
                              </span>
                            ))}
                          </div>

                          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[9px] tracking-wide font-black uppercase">
                            {isAcquired ? (
                              <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-250">✓ REDEEMABLE</span>
                            ) : (
                              <span className="text-slate-400 flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> LOCKED</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: COMMUNITY RECOGNITION */}
              {activeTab === "community" && (
                <div className="space-y-6 text-left animate-fade-in font-sans">
                  <div>
                    <h3 className="text-xl font-bold font-display text-indigo-950">Become Part Of The Community</h3>
                    <p className="text-xs text-slate-500 font-normal mt-1">Interact with outdoor travelers, write guides, clean pristine banks, and climb leadership boards.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Anchor Items */}
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {communityRecognitions.map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 flex gap-3 leading-tight">
                          <span className="text-2xl mt-0.5">{item.icon}</span>
                          <div>
                            <h4 className="font-extrabold text-xs text-indigo-950 uppercase tracking-wider">{item.title}</h4>
                            <p className="text-[10px] text-slate-600 leading-relaxed font-normal mt-1">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Featured stories cards */}
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between font-mono text-[10px] space-y-3 text-left shadow-md">
                      <div>
                        <span className="text-[9px] text-amber-400 font-black tracking-widest block uppercase mb-2">⭐ TOP EXPLORER RECOMMENDATIONS</span>
                        
                        <div className="space-y-3">
                          {featuredStories.map((story, id) => (
                            <div key={id} className="flex gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-850 items-start">
                              <img src={story.img} alt="" className="w-8 h-8 rounded-full border border-white/20 shrink-0" referrerPolicy="no-referrer" />
                              <div>
                                <span className="font-extrabold text-white text-[10px] block">{story.author} • {story.stay}</span>
                                <p className="text-slate-300 mt-1 leading-snug italic">"{story.quote}"</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-[9px] text-slate-400 leading-normal font-mono pt-1">
                        Host cleanup operations or story writing grants +50 XP on completion directly.
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* TAB PREV/NEXT FLOW HELPERS */}
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs text-slate-500">
              <span className="font-mono text-[10px]">Select any tab to find relevant progression metrics</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const keys: Array<typeof activeTab> = ["xp", "levels", "badges", "collections", "rewards", "community"];
                    const currentIdx = keys.indexOf(activeTab);
                    const prevIdx = (currentIdx - 1 + keys.length) % keys.length;
                    setActiveTab(keys[prevIdx]);
                  }}
                  className="p-1 px-3 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-slate-700 cursor-pointer text-[11px] font-bold"
                >
                  Prev Tab
                </button>
                <button
                  onClick={() => {
                    const keys: Array<typeof activeTab> = ["xp", "levels", "badges", "collections", "rewards", "community"];
                    const currentIdx = keys.indexOf(activeTab);
                    const nextIdx = (currentIdx + 1) % keys.length;
                    setActiveTab(keys[nextIdx]);
                  }}
                  className="p-1 px-3 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded border-0 cursor-pointer text-[11px]"
                >
                  Next Tab
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* ================= PLATFORM METRICS / SOCIAL PROOF ================= */}
        <div className="bg-white border border-slate-200 rounded-[40px] p-8 sm:p-12 mb-20 text-center relative overflow-hidden shadow-lg shadow-slate-100/50">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="text-center max-w-sm mx-auto mb-10">
            <span className="text-[10px] text-indigo-700 font-mono font-black uppercase tracking-widest block mb-2">LIVE GLOBAL EXPLORER HUB STATS</span>
            <h3 className="font-extrabold text-xl text-indigo-950">Platform Achievements</h3>
            <p className="text-[11px] text-slate-500 mt-1">Real-time stats synced directly from cloud database ledger boards.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 text-center font-mono">
            <div>
              <span className="text-2xl sm:text-4xl font-black text-amber-600 block tracking-tight">
                {explorersCount.toLocaleString()}+
              </span>
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mt-2">Active Explorers</span>
            </div>
            <div className="border-l border-slate-150 pl-2">
              <span className="text-2xl sm:text-4xl font-black text-indigo-950 block tracking-tight">
                {experienceCompleted.toLocaleString()}+
              </span>
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mt-2">Experiences Done</span>
            </div>
            <div className="border-l border-slate-150 pl-2">
              <span className="text-2xl sm:text-4xl font-black text-indigo-950 block tracking-tight">
                {reviewsCount.toLocaleString()}+
              </span>
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mt-2">Verified Reviews</span>
            </div>
            <div className="border-l border-slate-150 pl-2">
              <span className="text-2xl sm:text-4xl font-black text-amber-600 block tracking-tight">
                120+
              </span>
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mt-2">Achievements Unlocked</span>
            </div>
            <div className="border-l border-slate-150 pl-2">
              <span className="text-2xl sm:text-4xl font-black text-indigo-950 block tracking-tight">
                75+
              </span>
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mt-2">Partner Escapes</span>
            </div>
            <div className="border-l border-slate-150 pl-2">
              <span className="text-2xl sm:text-4xl font-black text-emerald-700 block tracking-tight">
                40+
              </span>
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mt-2">Adventure Slots</span>
            </div>
          </div>
        </div>

        {/* ================= FINAL CTA BLOCK ================= */}
        <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900/60 to-indigo-950/70 border border-white/10 rounded-[40px] p-8 sm:p-16 text-center relative overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-b from-amber-500/10 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
          
          <div className="max-w-2xl mx-auto space-y-6 text-center">
            <h3 className="text-3xl sm:text-5xl font-black font-display text-white tracking-tight leading-tight">
              Start Building Your Explorer Passport Today
            </h3>
            <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed max-w-lg mx-auto">
              Every stay, experience, review, and story brings you closer to new rewards, badges, destinations, and unforgettable adventures.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => {
                  setActiveView("passport");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm sm:text-base rounded-2xl hover:shadow-[0_0_30px_rgba(245,158,11,0.45)] transition-all cursor-pointer border-0 shadow-lg"
              >
                Explore Passport
              </button>
              <button
                onClick={() => {
                  const targetEl = document.getElementById("accommodation-section");
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    setActiveView("stays");
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="px-8 py-4 bg-white/10 hover:bg-white/15 text-white font-bold text-sm sm:text-base rounded-2xl backdrop-blur-md transition-all border border-white/15 cursor-pointer"
              >
                Book Your Next Adventure
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

// Global variable to keep toast ID increments safe
let prevId = 1000;
