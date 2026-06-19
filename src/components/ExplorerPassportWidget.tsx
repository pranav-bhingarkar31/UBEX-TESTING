import React, { useState, useEffect } from "react";
import { 
  Trophy, Award, Compass, Sparkles, BookOpen, Gift, 
  Star, Users, MapPin, ChevronRight, CheckCircle2, Lock, 
  ArrowRight, Landmark, Flame, X, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ExplorerPassportProps {
  currentUser?: any;
  authHeader?: string;
  lang?: string;
  setActiveTabInApp?: (tab: string) => void;
}

export default function ExplorerPassportWidget({
  currentUser,
  authHeader,
  lang = "EN",
  setActiveTabInApp
}: ExplorerPassportProps) {
  // Local passport state
  const [passport, setPassport] = useState<any>(null);
  const [displayXp, setDisplayXp] = useState<number>(0);
  const [showHowWorks, setShowHowWorks] = useState<boolean>(false);

  // Set up base passport preview data out-of-the-box
  useEffect(() => {
    setPassport({
      xp: 1250,
      level: {
        current: 3,
        name: "Adventurer Elite",
        icon: "🏔",
        minXp: 1000,
        maxXp: 2500,
        progress: 16.6,
        nextMilestone: "Explorer Legend",
        xpRemaining: 1250
      },
      badges: [
        { icon: "🌊", name: "Rafting Master" },
        { icon: "🏕", name: "Camp Explorer" },
        { icon: "🧗", name: "Climbing Pro" },
        { icon: "💻", name: "Digital Nomad" }
      ],
      nextReward: {
        name: "5% Stay Discount",
        badgeRequiredText: "Unlock after 2 more badges"
      }
    });
  }, [currentUser]);

  // Handle XP animation count up
  useEffect(() => {
    if (passport) {
      let start = 0;
      const end = passport.xp;
      if (end === 0) {
        setDisplayXp(0);
        return;
      }
      const duration = 800; // ms
      const increment = Math.ceil(end / (duration / 20));
      const counter = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayXp(end);
          clearInterval(counter);
        } else {
          setDisplayXp(start);
        }
      }, 20);
      return () => clearInterval(counter);
    }
  }, [passport?.xp]);

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-5 flex flex-col justify-between relative overflow-hidden group select-none h-full min-h-[460px] max-h-[520px] transition-all duration-300 hover:shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
      
      {/* Premium ambient decorative paths */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* 1. COMPACT REFINED CARD HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 relative z-10">
        <div className="flex items-center gap-2 text-left">
          <span className="text-xl filter drop-shadow-sm">🏆</span>
          <div>
            <h3 className="text-sm.5 font-black tracking-tight text-[#1A3C8F] flex items-center gap-1 font-display">
              Explorer Passport
              <span className="text-amber-500 text-xs animate-pulse">✦</span>
            </h3>
            <p className="text-[9.5px] text-slate-400 font-bold tracking-wide uppercase">
              Earn XP • Unlock Badges • Get Rewards
            </p>
          </div>
        </div>

        <span className="text-[8.5px] font-mono font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-md">
          {currentUser ? "Verified" : "Active"}
        </span>
      </div>

      {/* 2. PRIMARY DASHBOARD AREA (LEVEL & XP EMPHASIS) */}
      <div className="my-3 relative z-10">
        <div className="bg-[#1A3C8F]/5 border border-[#1a3c8f]/10 rounded-2xl p-3.5 flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute right-0 top-0 text-7xl opacity-5 select-none font-black text-[#1A3C8F] translate-x-4 translate-y-2 pointer-events-none">
            🏔️
          </div>

          <div className="flex justify-between items-end relative z-10">
            <div className="text-left">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">CURRENT LEVEL</span>
              <div className="flex items-center gap-1">
                <span className="text-base text-indigo-600">🏔️</span>
                <span className="text-sm.5 font-black text-[#1A3C8F] font-display">Adventurer Elite</span>
              </div>
            </div>

            {/* HIGH-CONTRAST XP CONTAINER */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl px-2.5 py-1 text-right shadow-sm border border-amber-400/25 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
              <span className="text-[7.5px] font-bold uppercase tracking-wider block opacity-90">⭐ EXPLORER XP</span>
              <span className="text-sm.5 font-mono font-black tracking-tight block">
                {displayXp} <span className="text-[9px] font-medium opacity-80">XP</span>
              </span>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="space-y-1 relative z-10 text-left">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/25">
              <div 
                className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-[#1A3C8F] h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: "50%" }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-400 font-bold font-mono">
              <span>{passport?.level.minXp || 1000} XP</span>
              <span>1,250 / 2,500 XP</span>
              <span className="text-indigo-600">Next: Explorer Legend</span>
            </div>
          </div>

          <p className="text-[9px] text-slate-500 text-left leading-none font-medium">
            🌟 <strong className="text-indigo-600 font-bold">1250 XP remaining</strong> to unlock elite <strong className="text-amber-600 font-bold">Explorer Legend</strong> status!
          </p>
        </div>
      </div>

      {/* 3. REWARD & BADGE MINI SNAPSHOTS */}
      <div className="space-y-2 relative z-10 text-left">
        
        {/* COMPACT REWARD PREVIEW */}
        <div className="bg-emerald-50/55 border border-emerald-100/60 p-2.5 rounded-2xl flex items-center justify-between text-[11px] text-slate-800 hover:bg-emerald-50 transition-colors duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🎁</span>
            <div className="truncate">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block leading-none">NEXT REWARD</span>
              <strong className="text-[10px] text-slate-800 font-bold block truncate">5% Stay Discount</strong>
            </div>
          </div>
          <span className="text-[8px] font-semibold text-emerald-800 bg-emerald-100/50 border border-emerald-200/50 px-2 py-0.5 rounded-md shrink-0">
            Unlock in 2 Badges
          </span>
        </div>

        {/* COMPACT BADGE PREVIEW */}
        <div className="bg-slate-50/80 border border-slate-100 p-2 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-colors duration-200">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-base">🏅</span>
            <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest leading-none">BADGES</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-[13px] hover:scale-125 transition-transform" title="Rafting Master">🌊</span>
            <span className="text-[13px] hover:scale-125 transition-transform" title="Camp Explorer">🏕</span>
            <span className="text-[13px] hover:scale-125 transition-transform" title="Climbing Pro">🧗</span>
            <span className="text-[13px] hover:scale-125 transition-transform" title="Digital Nomad">💻</span>
            <span className="text-[8.5px] text-slate-400 font-bold ml-1 shrink-0">
              +120 available
            </span>
          </div>
        </div>

      </div>

      {/* 4. GUEST FEATURED STORY CARD */}
      <div className="my-2.5 text-left relative z-10 shrink-0">
        <div className="bg-slate-50 border border-slate-100 p-2 rounded-2xl flex items-center justify-between text-[10px] text-slate-800 gap-2.5 hover:bg-slate-100/40 transition-colors">
          <div className="flex gap-2 items-center text-left min-w-0">
            <img 
              src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=64&auto=format&fit=crop" 
              alt="Arjun M." 
              className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" 
              referrerPolicy="no-referrer" 
            />
            <div className="min-w-0">
              <span className="text-[7px] font-black text-[#1A3C8F] uppercase block tracking-widest leading-none mb-0.5">READ COMMUNITY STORY</span>
              <strong className="text-[9.5px] text-slate-800 truncate block max-w-full">"Three Unforgettable Days in Rishikesh"</strong>
              <p className="text-[8px] text-slate-400 font-medium">By Arjun M. • Solo Backpacker</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setActiveTabInApp?.("share-your-story")}
            className="text-[8px] font-black text-[#5B4BFF] border border-[#5b4bff]/20 rounded-md px-1.5 py-0.5 bg-white hover:bg-slate-50 transition-colors shrink-0 shadow-sm cursor-pointer whitespace-nowrap"
          >
            Read
          </button>
        </div>
      </div>

      {/* 5. COMPACT COMMUNITY STATISTICS */}
      <div className="bg-gradient-to-r from-slate-50/50 to-slate-50 rounded-1.5xl border border-slate-100 py-1.5 px-2 relative z-10 shrink-0">
        <div className="flex items-center justify-around text-center text-[8px] text-slate-400 font-bold uppercase tracking-wider">
          <div>
            <strong className="text-[10px] font-black text-[#1A3C8F] block leading-none font-mono">15,000+</strong>
            <span className="scale-[0.9] mt-0.5 block">Travelers</span>
          </div>
          <div className="h-4 border-l border-slate-200" />
          <div>
            <strong className="text-[10px] font-black text-[#1A3C8F] block leading-none font-mono">5,000+</strong>
            <span className="scale-[0.9] mt-0.5 block">Trips Done</span>
          </div>
          <div className="h-4 border-l border-slate-200" />
          <div>
            <strong className="text-[10px] font-black text-[#1A3C8F] block leading-none font-mono">120+</strong>
            <span className="scale-[0.9] mt-0.5 block">Adventure Badges</span>
          </div>
        </div>
      </div>

      {/* 6. CONVERSION CTA & EDUCATIONAL MODAL LINK */}
      <div className="pt-3 border-t border-slate-100 relative z-10 shrink-0 space-y-2">
        <button 
          type="button"
          onClick={() => {
            setActiveTabInApp?.("passport");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="w-full h-8.5 bg-[#1A3C8F] hover:bg-indigo-900 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-[0_4px_12px_rgba(26,60,143,0.12)] flex items-center justify-center gap-1 border-0 cursor-pointer hover:scale-[1.01]"
        >
          Explore Passport
        </button>

        {/* Lightweight Educational inline link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowHowWorks(true)}
            className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 bg-transparent border-0 outline-none cursor-pointer transition-colors inline-flex items-center gap-1"
          >
            How XP & Rewards Work <span className="text-[10px] font-normal">→</span>
          </button>
        </div>
      </div>

      {/* ==========================================
         REFINED HOW IT WORKS OVERLAY MODAL
      ========================================== */}
      <AnimatePresence>
        {showHowWorks && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHowWorks(false)}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden text-left"
            >
              {/* Header */}
              <div className="bg-slate-950 text-white p-5 flex items-center justify-between relative">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <div>
                    <h4 className="text-sm.5 font-black font-display tracking-tight">How Explorer Passport Works</h4>
                    <p className="text-[9.5px] text-slate-300 font-medium">Earn loyalty level benefits as you travel</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowHowWorks(false)}
                  className="p-1 px-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border-0 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                
                {/* Ways to Earn XP */}
                <div>
                  <h5 className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5">
                    ⚡ Ways to Earn Explorer XP
                  </h5>
                  <div className="space-y-2">
                    {[
                      { act: "🏡 Stay Booking", xp: "+50 XP", desc: "Gain automations with retreat outposts" },
                      { act: "🌊 Experience Booking", xp: "+100 XP", desc: "Embark on high-alpine rafting tours" },
                      { act: "⭐ Verified Review", xp: "+20 XP", desc: "Provide high quality honest feedback" },
                      { act: "📸 Upload Photos", xp: "+10 XP", desc: "Take and share live sunset photos" },
                      { act: "🎥 Upload Video", xp: "+25 XP", desc: "Add real experience videography clips" },
                      { act: "📖 Guest Story", xp: "+50 XP", desc: "Publish complete hiking story diaries" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10.5px] bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <strong className="text-slate-800 text-[10.5px] font-bold block">{item.act}</strong>
                          <span className="text-[8.5px] text-slate-400 block leading-none mt-0.5">{item.desc}</span>
                        </div>
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 font-black font-mono px-2 py-0.5 rounded-md text-[10px]">
                          {item.xp}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progression steps footer */}
                <div className="border-t border-slate-100 pt-3.5 flex justify-between items-center text-center text-[10px] text-slate-500 font-bold bg-indigo-50/30 rounded-2xl p-2.5">
                  <div className="flex-1">
                    <span className="text-base block mb-0.5">🎖️</span>
                    <span>Unlock Badges</span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-50 shrink-0" />
                  <div className="flex-1">
                    <span className="text-base block mb-0.5">🏔️</span>
                    <span>Level Up</span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-50 shrink-0" />
                  <div className="flex-1">
                    <span className="text-base block mb-0.5">🎁</span>
                    <span>Earn Rewards</span>
                  </div>
                </div>

              </div>

              {/* Close Button Bottom */}
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setShowHowWorks(false)}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[10.5px] font-extrabold uppercase tracking-wide border-0 cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  Got It, Let's Explorer!
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
