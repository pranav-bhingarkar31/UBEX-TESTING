import React, { useState, useEffect } from "react";
import { Compass, Clock, MapPin, Sparkles, Check, ChevronRight, X, Phone, ShoppingCart, MessageSquare, Calendar } from "lucide-react";
import { Experience, ExperienceVariant } from "../types";
import { EXPERIENCES } from "../data";
import { t as translatorT } from "../utils/translator";
import { UbexDatePicker } from "./UbexDatePicker";
import { getWhatsAppNumber } from "../utils/contact";

interface ExperiencesPageProps {
  currency: string;
  convertAndFormatPrice: (val: number) => string;
  sheetsPrices?: Record<string, number>;
  cartExperiences: any[];
  setCartExperiences: React.Dispatch<React.SetStateAction<any[]>>;
  switchToTab: (tab: string) => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  lang?: string;
  externalSelectedCategory?: string;
  setExternalSelectedCategory?: (cat: string) => void;
}

const CATEGORIES = [
  { id: "all", title: "All Experiences", icon: "🌐" },
  { id: "Spiritual", title: "Culture & Heritage", icon: "🛕" },
  { id: "Wellness", title: "Wellness", icon: "🧘" },
  { id: "Food Trails", title: "Food & Dining", icon: "🍲" },
  { id: "Multi-Day", title: "Guided Tour", icon: "🧭" },
  { id: "Adventure", title: "Premium Experience", icon: "🚣" },
  { id: "Community", title: "Community", icon: "🌿" }
];

export default function ExperiencesPage({
  currency,
  convertAndFormatPrice,
  sheetsPrices,
  cartExperiences,
  setCartExperiences,
  switchToTab,
  searchQuery: propSearchQuery,
  setSearchQuery: propSetSearchQuery,
  lang,
  externalSelectedCategory,
  setExternalSelectedCategory
}: ExperiencesPageProps) {
  const t = (phrase: string): string => {
    return translatorT(lang || "EN", phrase);
  };

  const [localCategory, setLocalCategory] = useState<string>("all");
  const selectedCategoryRaw = externalSelectedCategory !== undefined ? externalSelectedCategory : localCategory;
  const setSelectedCategoryRaw = setExternalSelectedCategory !== undefined ? setExternalSelectedCategory : setLocalCategory;

  const normalizeCategory = (cat: string): string => {
    if (!cat) return "all";
    const c = cat.toLowerCase().trim();
    if (c === "all" || c === "all experiences") return "all";
    if (c === "spiritual" || c === "culture & heritage" || c === "culture and heritage") return "Spiritual";
    if (c === "wellness") return "Wellness";
    if (c === "food trails" || c === "food & dining" || c === "food and dining") return "Food Trails";
    if (c === "multi-day" || c === "guided tour") return "Multi-Day";
    if (c === "adventure" || c === "premium" || c === "premium experience") return "Adventure";
    if (c === "community") return "Community";
    return cat;
  };

  const selectedCategory = normalizeCategory(selectedCategoryRaw);
  const setSelectedCategory = (cat: string) => {
    setSelectedCategoryRaw(normalizeCategory(cat));
  };
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [localSearchQuery, setLocalSearchQuery] = useState<string>("");
  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
  const setSearchQuery = propSetSearchQuery !== undefined ? propSetSearchQuery : setLocalSearchQuery;
  const [activeExperience, setActiveExperience] = useState<Experience | null>(null);

  // Selector choices for active experience booking
  const [selectedVariant, setSelectedVariant] = useState<ExperienceVariant | null>(null);
  const [selectedTimingsSlot, setSelectedTimingsSlot] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("2026-06-19");
  const [showDatePickerPopup, setShowDatePickerPopup] = useState<boolean>(false);
  const formatDatePickerDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Select date";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };
  const [tourGuests, setTourGuests] = useState<number>(2);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeExperience) {
      if (activeExperience.variants && activeExperience.variants.length > 0) {
        setSelectedVariant(activeExperience.variants[0]);
      } else {
        setSelectedVariant(null);
      }
      if (activeExperience.timings && activeExperience.timings.length > 0) {
        setSelectedTimingsSlot(activeExperience.timings[0]);
      } else {
        setSelectedTimingsSlot("");
      }
    }
  }, [activeExperience]);

  // Utility to match Dynamic sheets pricing override
  const getOverridenPriceVal = (id: string, defaultValStr: string): number => {
    const rawVal = parseInt(defaultValStr.replace(/[^0-9]/g, "")) || 499;
    if (!sheetsPrices) return rawVal;
    
    const key = id.toLowerCase();
    if (sheetsPrices[key] !== undefined) return sheetsPrices[key];
    return rawVal;
  };

  const filteredExperiences = EXPERIENCES.filter(exp => {
    // Category check
    if (selectedCategory !== "all" && exp.category !== selectedCategory) return false;

    // Difficulty check
    if (selectedDifficulty !== "all" && exp.difficulty !== selectedDifficulty) return false;

    // Search query check
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        exp.title.toLowerCase().includes(q) ||
        exp.description.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const triggerAddToCart = () => {
    if (!activeExperience) return;

    const basePriceNum = getOverridenPriceVal(activeExperience.id, activeExperience.price);
    const finalVariantName = selectedVariant ? selectedVariant.name : "Standard Slot";
    const variantPriceNum = selectedVariant ? getOverridenPriceVal(`${activeExperience.id}-${selectedVariant.name}`, String(selectedVariant.priceValue)) : basePriceNum;

    const experiencesCheckoutItem = {
      id: `${activeExperience.id}-${Date.now()}`,
      experienceId: activeExperience.id,
      title: `${activeExperience.title} (${finalVariantName})`,
      price: `₹${variantPriceNum}`,
      priceValue: variantPriceNum,
      variantName: finalVariantName,
      bookingDate: selectedDate,
      bookingTime: selectedTimingsSlot,
      guestsCount: tourGuests
    };

    setCartExperiences(prev => [...prev, experiencesCheckoutItem]);

    setToastMessage(`✓ Added ${activeExperience.title} to your retreat adventure cart!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);

    setActiveExperience(null);
  };

  const handlePhoneInquiry = (exp: Experience) => {
    window.location.href = `tel:+${getWhatsAppNumber()}`;
    setToastMessage(`Dialling team counselor regarding: "${exp.title}" at +${getWhatsAppNumber()}!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const handleOnlineInquiry = async (exp: Experience) => {
    setToastMessage("Generating secure experience inquiry record and opening WhatsApp...");
    try {
      const payload = {
        inquiryType: "experience",
        listingId: exp.id,
        listingTitle: exp.title,
        category: exp.category,
        roomName: null,
        selectedDate: selectedDate || "TBD",
        selectedDates: selectedDate ? [selectedDate] : null,
        guestCount: tourGuests,
        sourcePage: "Experiences Detail Drawer"
      };
      
      const res = await fetch("/api/inquiries/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success && result.whatsAppUrl) {
        window.open(result.whatsAppUrl, "_blank");
        setToastMessage(`Inquiry generated: ${result.inquiryId}! Opening WhatsApp chat...`);
      } else {
        throw new Error(result.error || "Failed to initiate dynamic experience inquiry.");
      }
    } catch (err: any) {
      console.error(err);
      const waUrl = `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(`Hi UbEx, I am interested in experience: ${exp.title} on date: ${selectedDate || "TBD"} for ${tourGuests} participants.`)}`;
      window.open(waUrl, "_blank");
      setToastMessage(`WhatsApp chat opened (fallback): ${err.message}`);
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 5500);
  };

  return (
    <div className="font-sans antialiased text-[#0F1B3C] bg-slate-50 min-h-screen pb-20">
      
      {/* ─── DEDICATED EXPERIENCES HERO ─── */}
      <section className="ubex-hero-standard bg-slate-950 text-center">
        {/* Ambient Video Background Placeholder */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-indigo-950/75 to-slate-950/85 z-10" />
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover opacity-50"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-foggy-mountains-under-misty-sky-40243-large.mp4" type="video/mp4" />
          </video>
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-mono uppercase tracking-widest text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Video Background Placeholder</span>
          </div>
        </div>

        <div className="container max-w-4xl mx-auto px-4 z-10 text-center">
          <span className="px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-extrabold uppercase tracking-widest border border-indigo-500/30">
            Adventures, Holistics &amp; Gatherings
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-3 leading-tight font-display">
            Immersive Rishikesh Experiences
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 font-light max-w-xl mx-auto leading-relaxed">
            Expand your boundaries. Connect with global soul seekers through white water rafting, organic food trails, bonfire sessions, and Himalayan sunsets.
          </p>
        </div>
      </section>

      {/* ─── DEDICATED CATEGORY STRIP ─── */}
      <div className="sticky top-0 bg-white/95 border-b border-slate-200/60 shadow-xs z-30 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex-1 overflow-x-auto scrollbar-none flex gap-2.5 items-center py-1">
            {CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer text-xs font-bold transition-all whitespace-nowrap border ${
                    isActive 
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                    : "bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── FLOATING TOAST SYSTEM ─── */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-50 max-w-md border border-slate-750 flex items-center justify-between gap-4 animate-bounce">
          <p className="text-xs font-bold leading-relaxed">{toastMessage}</p>
          <button 
            onClick={() => switchToTab("checkout")}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-mono font-black uppercase hover:bg-slate-800 transition-all border-0"
          >
            Checkout Cart 🛒
          </button>
        </div>
      )}

      {/* ─── SEARCH & FILTER UTILITY CONTROLS ─── */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-8">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {t("Bespoke Daily Sessions")}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t("Showing")} <span className="font-bold text-indigo-600">{filteredExperiences.length}</span> {t("curated experiences")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative min-w-[220px]">
              <input 
                type="text"
                placeholder={t("Search rafting, trails, ashrams...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-250 py-2 pl-3 pr-8 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
              />
              <span className="absolute right-2.5 top-2.5 text-slate-350">🔍</span>
            </div>

            {/* Difficulty Toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-mono font-medium">Difficulty:</span>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-white border border-slate-250 py-2 px-3 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="all">⚡ All Levels</option>
                <option value="Easy">🧘 Easy / Gentle</option>
                <option value="Moderate">🧗 Moderate / Medium</option>
                <option value="Challenging">🔥 Challenging / Pro</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── DEDICATED EXPERIENCES EXPOSURE CARDS GRID ─── */}
        {filteredExperiences.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredExperiences.map(exp => {
              const currentPriceNum = getOverridenPriceVal(exp.id, exp.price);
              return (
                <div 
                  key={exp.id}
                  onClick={() => setActiveExperience(exp)}
                  className="bg-white rounded-[24px] border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer group"
                >
                  <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                    <img 
                      src={exp.mainImage} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95" 
                      alt={exp.title}
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Upper badges */}
                    <div className="absolute top-4 left-4 flex gap-1.5 z-10">
                      <span className="bg-indigo-600 text-white font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full shadow tracking-wider">
                        {exp.category}
                      </span>
                      <span className="bg-slate-900/80 text-white font-bold text-[10px] uppercase px-2.5 py-1 rounded-full shadow">
                        ⌛ {exp.duration}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-4 bg-black/60 text-white font-bold text-[10px] px-2.5 py-1 rounded-full backdrop-blur-xs select-none">
                      difficulty: <span className="text-amber-300 font-extrabold uppercase">{exp.difficulty}</span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-xl text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight line-clamp-1">
                        {exp.title}
                      </h3>
                      
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-medium mt-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="line-clamp-1">{exp.meetingPoint}</span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-3">
                        {exp.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {exp.inclusions.slice(0, 2).map((inc, i) => (
                          <span key={i} className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150 line-clamp-1">
                            ✓ {inc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-450 uppercase tracking-widest font-bold">Standard rate</span>
                      <div className="text-right">
                        <span className="text-lg font-black text-indigo-650 font-mono">
                          {convertAndFormatPrice(currentPriceNum)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block">/ passenger</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-205 p-8 max-w-md mx-auto">
            <Compass className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
            <h3 className="font-extrabold text-slate-800 text-lg mt-3">No Adventures Found</h3>
            <p className="text-xs text-slate-450 mt-1 max-w-xs mx-auto">
              No experiences matched your precise criteria combinations. Reset filters and try of new categories.
            </p>
            <button 
              onClick={() => {
                setSelectedCategory("all");
                setSelectedDifficulty("all");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all border-0 cursor-pointer"
            >
              Clear Search Filters
            </button>
          </div>
        )}
      </section>

      {/* ─── DEDICATED EXPERIENCES MULTI-TAB DETAILED DRAWER ─── */}
      {activeExperience && (
        <div className="experience-drawer active">
          <div onClick={() => setActiveExperience(null)} className="drawer-overlay" />

          <div className="drawer-container transition-transform duration-500 bg-white" style={{ width: "min(950px, 95vw)" }}>
            
            {/* Top drawer tool actions */}
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-40">
              <button 
                onClick={() => setActiveExperience(null)}
                className="flex items-center gap-1 px-4 py-2 hover:bg-slate-100 text-indigo-600 text-xs font-bold rounded-full transition-all border border-slate-150 cursor-pointer"
              >
                ← Back to List
              </button>
              <span className="text-xs font-mono font-black uppercase text-slate-400">Experience Inspector</span>
              <button 
                onClick={() => setActiveExperience(null)}
                className="w-10 h-10 rounded-full border border-slate-150 bg-slate-50 hover:bg-slate-100 hover:rotate-90 transition-all duration-300 flex items-center justify-center font-bold text-slate-400"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Container Body */}
            <div className="h-[calc(100vh-76px)] overflow-y-auto pb-24 p-6 sm:p-8 space-y-8 text-left">
              
              {/* Landscape Cover */}
              <div className="aspect-[21/10] rounded-[24px] overflow-hidden bg-slate-900 relative">
                <img 
                  src={activeExperience.mainImage} 
                  className="w-full h-full object-cover filter brightness-90" 
                  alt={activeExperience.title}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent flex flex-col justify-end p-6 text-white text-left">
                  <span className="bg-indigo-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider w-max mb-2 border border-indigo-400/20">
                    {activeExperience.category}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black tracking-tight">{activeExperience.title}</h2>
                  <p className="text-xs text-slate-305 mt-2 max-w-xl font-light">{activeExperience.description}</p>
                </div>
              </div>

              {/* Main Content Layout Segment */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left details pane */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Detailed Description */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">About The Activity</h3>
                    
                    {/* Adventure Passport Gamified Earning Banner */}
                    {(() => {
                      const idLower = String(activeExperience.id || "").toLowerCase();
                      let badge = null;
                      if (idLower.includes("raft")) badge = { name: "Rafting Master", icon: "🌊", xp: 100, color: "sky" };
                      else if (idLower.includes("bungee")) badge = { name: "Bungee Brave", icon: "🪂", xp: 150, color: "red" };
                      else if (idLower.includes("camp")) badge = { name: "Camp Explorer", icon: "🏕", xp: 80, color: "emerald" };
                      else if (idLower.includes("climb")) badge = { name: "Climbing Pro", icon: "🧗", xp: 120, color: "amber" };
                      else if (idLower.includes("kayak")) badge = { name: "Kayak King", icon: "🚣", xp: 110, color: "indigo" };
                      else if (idLower.includes("bike")) badge = { name: "Biking Beast", icon: "🚵", xp: 100, color: "orange" };
                      else if (idLower.includes("trek") || idLower.includes("hiking")) badge = { name: "Trek Titan", icon: "🥾", xp: 90, color: "lime" };
                      else if (idLower.includes("sky") || idLower.includes("fly")) badge = { name: "Sky Rider", icon: "🦅", xp: 140, color: "cyan" };
                      else if (idLower.includes("atv")) badge = { name: "Terrain Conqueror", icon: "🏎", xp: 100, color: "yellow" };
                      else if (idLower.includes("zipline")) badge = { name: "Zipline Daredevil", icon: "⚡", xp: 90, color: "purple" };

                      if (!badge) return null;

                      return (
                        <div className="p-4 bg-amber-500/10 border border-amber-300 rounded-2xl flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm shrink-0">
                            {badge.icon}
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-mono tracking-widest text-amber-700 font-extrabold block">UbEx Adventure Passport Eligible</span>
                            <span className="font-extrabold text-xs text-slate-900 block">Earn "{badge.name}" Badge &amp; +{badge.xp} XP Points</span>
                            <span className="text-[10px] text-slate-550 block font-light leading-none mt-1">Unlocked immediately on successful booking of this excursion!</span>
                          </div>
                        </div>
                      );
                    })()}

                    <p className="text-xs text-slate-600 leading-relaxed font-light whitespace-pre-line">
                      {activeExperience.longDescription}
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-450 uppercase text-[9px] block">Duration</span>
                      <span className="text-slate-800 font-bold block mt-0.5 mt-0.5">⌛ {activeExperience.duration}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-450 uppercase text-[9px] block">Meetingcamp Base</span>
                      <span className="text-slate-800 font-bold block mt-0.5">📍 {activeExperience.meetingPoint}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-450 uppercase text-[9px] block">Minimum Age Limit</span>
                      <span className="text-slate-800 font-bold block mt-0.5">👤 {activeExperience.minAge}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-450 uppercase text-[9px] block">Difficulty Gradient</span>
                      <span className="text-slate-800 font-bold block mt-0.5">⚡ {activeExperience.difficulty}</span>
                    </div>
                  </div>

                  {/* Inclusions / Exclusions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide border-b pb-1.5 mb-2.5">Everything Included:</h4>
                      <ul className="space-y-1.5 text-xs text-slate-650">
                        {activeExperience.inclusions.map((inc, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide border-b pb-1.5 mb-2.5">Exclusions & Rules:</h4>
                      <ul className="space-y-1.5 text-xs text-slate-550">
                        {activeExperience.exclusions.map((exc, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-red-500 font-bold">✕</span>
                            <span>{exc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Frequently Asked Questions */}
                  {activeExperience.faqs && activeExperience.faqs.length > 0 && (
                    <div className="space-y-3.5 pt-4">
                      <h3 className="text-base font-black text-slate-900 tracking-tight">Frequently Answered Queries</h3>
                      <div className="space-y-2.5">
                        {activeExperience.faqs.map((faq, i) => (
                          <div key={i} className="p-3 bg-slate-50 border rounded-xl">
                            <span className="font-bold text-slate-900 text-xs block">Q: {faq.question}</span>
                            <span className="text-slate-600 text-[11px] block mt-1 leading-relaxed font-light">{faq.answer}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Right booking checkout flow panel */}
                <div className="lg:col-span-5 bg-indigo-50/40 p-6 rounded-3xl border border-indigo-100/70 space-y-5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                    <span className="font-extrabold text-indigo-950 uppercase tracking-wider text-xs">Secure Your Slot</span>
                  </div>

                  {/* Active Variants Selection */}
                  {activeExperience.variants && activeExperience.variants.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase text-slate-400">Variant Selection</label>
                      <div className="space-y-2">
                        {activeExperience.variants.map((variant, index) => {
                          const isSelected = selectedVariant?.name === variant.name;
                          const dynamicVariantPrice = getOverridenPriceVal(`${activeExperience.id}-${variant.name}`, String(variant.priceValue));
                          return (
                            <div 
                              key={index}
                              onClick={() => setSelectedVariant(variant)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                isSelected 
                                ? "bg-white border-indigo-500 shadow-sm" 
                                : "bg-white border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <div>
                                <span className="font-bold text-xs text-slate-805 block">{variant.name}</span>
                                {variant.description && <span className="text-[10px] text-slate-400">{variant.description}</span>}
                              </div>
                              <span className="font-mono text-xs font-black text-indigo-650">
                                {convertAndFormatPrice(dynamicVariantPrice)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Time Slots */}
                  {activeExperience.timings && activeExperience.timings.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black uppercase text-slate-400">Available Daily Timings</label>
                      <div className="grid grid-cols-1 gap-2">
                        {activeExperience.timings.map(t => (
                          <button
                            key={t}
                            onClick={() => setSelectedTimingsSlot(t)}
                            className={`py-2 px-3 rounded-xl text-left text-xs font-bold border transition-all ${
                              selectedTimingsSlot === t
                              ? "bg-indigo-600 text-white border-transparent shadow-xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            🕒 {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Travel Date */}
                  <div className="space-y-1.5 relative text-left">
                    <label className="block text-xs font-black uppercase text-slate-400">Selected Adventure Date</label>
                    <div 
                      className="w-full px-3.5 py-2.5 border border-slate-205 rounded-xl text-slate-800 bg-white hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-all font-bold text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDatePickerPopup(!showDatePickerPopup);
                      }}
                    >
                      <span>{formatDatePickerDisplayDate(selectedDate)}</span>
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    </div>

                    {showDatePickerPopup && (
                      <>
                        <div 
                          className="fixed inset-0 z-40 bg-transparent" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDatePickerPopup(false);
                          }}
                        />
                        <div className="absolute top-[108%] right-0 z-50 w-[310px] max-w-[90vw] select-none">
                          <UbexDatePicker
                            checkIn={selectedDate ? new Date(selectedDate) : null}
                            checkOut={null}
                            singleDateOnly={true}
                            onChange={(inD) => {
                              if (inD) {
                                const yr = inD.getFullYear();
                                const mo = String(inD.getMonth() + 1).padStart(2, '0');
                                const da = String(inD.getDate()).padStart(2, '0');
                                setSelectedDate(`${yr}-${mo}-${da}`);
                              } else {
                                setSelectedDate("");
                              }
                              setShowDatePickerPopup(false);
                            }}
                            onClose={() => setShowDatePickerPopup(false)}
                            className="!max-w-full font-sans border border-slate-100"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Guest count */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-400 uppercase">Passengers Count</label>
                    <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-205">
                      <button 
                        disabled={tourGuests <= 1}
                        onClick={() => setTourGuests(tourGuests - 1)}
                        className="w-8 h-8 rounded-full border border-slate-220 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="font-black text-slate-800 text-xs font-mono">{tourGuests} Passengers</span>
                      <button 
                        onClick={() => setTourGuests(tourGuests + 1)}
                        className="w-8 h-8 rounded-full border border-slate-220 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Inquiry & Booking Button */}
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={triggerAddToCart}
                      className="w-full bg-indigo-600 hover:bg-slate-900 text-white py-3 rounded-2xl text-xs font-bold tracking-wider uppercase transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-0"
                    >
                      <ShoppingCart className="w-4 h-4" /> Add Experience to checkout Cart
                    </button>

                    <button 
                      onClick={() => handleOnlineInquiry(activeExperience)}
                      className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 mt-1 border-0 transition-colors"
                    >
                      💬 WhatsApp Retreat Specialist
                    </button>

                    <button 
                      onClick={() => handlePhoneInquiry(activeExperience)}
                      className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs py-2.5 rounded-2xl flex items-center justify-center gap-1.5 border-0 transition-colors"
                    >
                      📞 Call counselor hotline
                    </button>
                  </div>

                </div>

              </div>
              
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
