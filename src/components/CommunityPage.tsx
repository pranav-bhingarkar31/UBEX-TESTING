import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Check, 
  X, 
  Info, 
  ChevronRight,
  Shield,
  MessageSquare,
  Users,
  Award,
  Video,
  Eye,
  Calendar
} from "lucide-react";
import { auth, googleAuthProvider } from "../lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { 
  makeGoogleCalendarUrl, 
  downloadIcsFile, 
  addEventToGoogleCalendarApi, 
  getNextOccurrenceOfDay 
} from "../utils/calendar";
import { getWhatsAppNumber } from "../utils/contact";

interface EventItem {
  id: number;
  day: string;
  emoji: string;
  bg: string;
  title: string;
  time: string;
  going: number;
  story: string;
  vibe: string;
  who: string;
}

interface MeetItem {
  type: string;
  emoji: string;
  bg: string;
  desc: string;
}

interface CustomStory {
  id: number;
  quote: string;
  name: string;
  country: string;
  insta: string | null;
  color: string;
  full: string;
  joined: string[];
  sa: string;
}

interface ComfortItem {
  icon: string;
  title: string;
  tag: string;
  full: string;
}

interface InstaItem {
  id: number;
  emoji: string;
  bg: string;
  name: string;
  flag: string;
  caption: string;
  big?: boolean;
}

// Static Local Datasets
const EVENTS: EventItem[] = [
  { id: 1, day: "FRI", emoji: "🎤", bg: "from-purple-900 to-indigo-950", title: "Karaoke Night", time: "7:00 PM Onwards", going: 12, story: "Terrible singing, the best memories. Every Friday, the community gathers for a night of laughter, bad notes and surprisingly good vibes. Zero talent required.", vibe: "Social · Fun · No Pressure", who: "All guests, especially solo travelers" },
  { id: 2, day: "SAT", emoji: "🔥", bg: "from-amber-900 to-red-955", title: "Bonfire + Community Dinner", time: "8:00 PM Onwards", going: 18, story: "Travellers, music, stories and chai under the stars. The Saturday bonfire is where strangers become friends. We eat together, we talk about everything.", vibe: "Warm · Social · Intimate", who: "Everyone — this one fills up fast" },
  { id: 3, day: "SUN", emoji: "🎬", bg: "from-blue-900 to-slate-950", title: "Movie Under Stars", time: "7:30 PM Onwards", going: 15, story: "Blankets, popcorn, the open sky as your ceiling. Community picks the film. Sometimes it's a classic, sometimes it's whatever someone downloaded on the train.", vibe: "Relaxed · Chill · Cozy", who: "All guests, great for introverts too" },
  { id: 4, day: "MON", emoji: "🧘", bg: "from-teal-900 to-emerald-950", title: "Yoga Morning Flow", time: "7:00 AM", going: 10, story: "Gentle sunrise yoga on the banks of the Ganges. Led by a certified local instructor. All levels welcome — including 'I haven't touched my toes in 10 years.'", vibe: "Wellness · Peaceful · Grounding", who: "Early risers, wellness lovers" },
  { id: 5, day: "TUE", emoji: "🏕", bg: "from-emerald-950 to-indigo-950", title: "Sunrise Trek & Tea", time: "6:30 AM", going: 8, story: "Into the Himalayan forest before the world wakes up. Small group, local guide, hidden viewpoints. Return just in time for chai and breakfast.", vibe: "Adventure · High Energy · Scenic", who: "Active guests, small group only" }
];

const PEOPLE: MeetItem[] = [
  { type: "Digital Nomads", emoji: "💻", bg: "from-sky-100 to-sky-200", desc: "Usually stays longer, works from cafés, loves slow mornings and community evenings. Great at recommending productivity hacks and local hidden spots." },
  { type: "Backbackpackers", emoji: "🎒", bg: "from-amber-100 to-amber-200", desc: "Always moving, always sharing. They know 3 routes to everywhere. The ones who remind you that plans are overrated and spontaneity is underrated." },
  { type: "Creators", emoji: "🎥", bg: "from-violet-100 to-violet-200", desc: "Documenting everything, finding angles you'd never notice. Great collab energy. Usually have the best eye for sunset spots." },
  { type: "Wellness Seekers", emoji: "🧘", bg: "from-emerald-100 to-emerald-200", desc: "Here for the yoga, sound healing and slow mornings. Usually the first ones up and the calmest presence at the bonfire." },
  { type: "Slow Travelers", emoji: "🌿", bg: "from-rose-100 to-rose-200", desc: "Staying weeks, not days. They know every café owner by name and somehow always have a table reserved." },
  { type: "International Travelers", emoji: "🌍", bg: "from-blue-105 to-blue-200", desc: "30+ countries represented at any given week. Every conversation becomes a cultural exchange. They're the reason the stories here are so good." }
];

const STORIES: CustomStory[] = [
  { id: 1, quote: "Came solo. Left with friends.", name: "Lena", country: "Germany 🇩🇪", insta: "@lenatravels", color: "#1d4ed8", sa: "bg-gradient-to-r from-blue-600 to-sky-500", full: "I booked for 4 nights and honestly planned to keep to myself. By night two I was invited to the bonfire. By night five I was extending my stay. The people here genuinely want to connect — not in a forced way, just naturally.", joined: ["Bonfire Night", "Yoga Morning", "Café Crawl", "Sound Healing"] },
  { id: 2, quote: "Booked for 3 days. Stayed for 2 weeks.", name: "Marco", country: "Italy 🇮🇹", insta: null, color: "#d4a847", sa: "bg-gradient-to-r from-yellow-500 to-amber-500", full: "I had a flight to catch on day 4. I missed it on purpose. Something about the community energy here — you wake up looking forward to the day. That doesn't happen in hotels.", joined: ["White Water Rafting", "Karaoke Night", "Movie Under Stars", "Sunrise Trek"] },
  { id: 3, quote: "First solo trip. Felt safe from day one.", name: "Priya", country: "India 🇮🇳", insta: "@priyaexplores", color: "#10b981", sa: "bg-gradient-to-r from-emerald-600 to-teal-500", full: "As a solo woman traveller on my first ever solo trip, I was terrified. Within hours I had people to eat with, a WhatsApp group, and a plan for the next day. The staff and the community made all the difference.", joined: ["Ganga Aarti", "Yoga Morning", "Sound Healing"] }
];

const COMFORTS: ComfortItem[] = [
  { icon: "🌱", title: "First Solo Trip?", tag: "You've got this", full: "We've had hundreds of first-time solo travelers. The UbEx community naturally includes people — no awkward standing alone, no forced socializing. Just easy, human connection." },
  { icon: "🪷", title: "Introvert Friendly", tag: "No pressure, ever", full: "You can be fully part of the community on your own terms. Join events if you want, retreat to your space if you don't. The vibe is always low-pressure and self-directed." },
  { icon: "🔒", title: "Women Friendly", tag: "Safe, verified, trusted", full: "UbEx has a strong track record with solo women travelers. Well-lit spaces, vetted staff, women-preferred accommodation options, and a community that looks out for each other." },
  { icon: "💼", title: "Workation Friendly", tag: "Work hard. Travel well.", full: "Reliable high-speed WiFi, co-working corners, café sessions, and a community that respects deep-work time. You can be fully productive and fully present here." }
];

const INSTA_WALL: InstaItem[] = [
  { id: 0, emoji: "🔥", bg: "from-blue-950 to-indigo-900", name: "Sophie", flag: "🇩🇪", caption: "Bonfire night stories — these became my people and my family.", big: true },
  { id: 1, emoji: "🧘", bg: "from-amber-950 to-orange-900", name: "Emma", flag: "🇺🇸", caption: "Sunrise yoga by the Ganges. I've been here 11 days and still cannot get enough of this serenity." },
  { id: 2, emoji: "💻", bg: "from-teal-950 to-emerald-900", name: "Alex", flag: "🇨🇦", caption: "Working from a cliffside café with 3 new friends I met during yesterday's sound healing session." },
  { id: 3, emoji: "🎤", bg: "from-purple-950 to-violet-900", name: "Liam", flag: "🇦🇺", caption: "Karaoke Friday. Deeply out of tune singing, completely zero regrets." },
  { id: 4, emoji: "☕", bg: "from-rose-950 to-pink-900", name: "Yuki", flag: "🇯🇵", caption: "Found my people over shared piping hot masala chai at 10pm near the riverbanks." },
  { id: 5, emoji: "🌅", bg: "from-slate-900 to-indigo-950", name: "Priya", flag: "🇮🇳", caption: "That exact majestic second when the roaring Ganges turns pure molten gold under sunset." },
  { id: 6, emoji: "🏕", bg: "from-cyan-950 to-sky-900", name: "Tom", flag: "🇬🇧", caption: "Sunrise mountain pine trek. The secret waterfalls wrap was worth every steep bend." },
  { id: 7, emoji: "🎬", bg: "from-stone-900 to-neutral-950", name: "Lena", flag: "🇩🇪", caption: "Movie under the stars with 14 lovely travelers I did not know a single week ago." },
  { id: 8, emoji: "🍵", bg: "from-emerald-950 to-indigo-950", name: "Marco", flag: "🇮🇹", caption: "It started as a short 'Where are you from?' query. Ended as a 4-hour heart exchange." },
  { id: 9, emoji: "🌊", bg: "from-sky-950 to-indigo-950", name: "Sara", flag: "🇧🇷", caption: "White-water rafting with brand new strangers. Absolutely the best day of our trip!" }
];

interface CommunityPageProps {
  currentUser?: any;
  googleCalendarToken?: string | null;
  setGoogleCalendarToken?: (token: string | null) => void;
  lang?: string;
}

export default function CommunityPage({ 
  currentUser, 
  googleCalendarToken, 
  setGoogleCalendarToken,
  lang
}: CommunityPageProps = {}) {
  // Calendar tracking states
  const [syncedEventIds, setSyncedEventIds] = useState<number[]>([]);
  const [syncingEventId, setSyncingEventId] = useState<number | null>(null);
  const [syncMessage, setSyncMessage] = useState<Record<number, string>>({});

  const handleAddToGoogleCalendarSync = (e: React.MouseEvent, evt: any) => {
    e.stopPropagation();
    const { start, end } = getNextOccurrenceOfDay(evt.day, evt.time);
    const eventData = {
      title: `UbEx Rishikesh: ${evt.emoji} ${evt.title}`,
      description: `${evt.story}\nVibe: ${evt.vibe}\nFor: ${evt.who}\nJoin us at the Tapovan camp outpost!`,
      start,
      end,
      location: "UbEx Outpost, Rishikesh, Uttarakhand, India"
    };

    const url = makeGoogleCalendarUrl(eventData);
    window.open(url, "_blank");
  };

  const handleAppleCalendarDownload = (e: React.MouseEvent, evt: any) => {
    e.stopPropagation();
    const { start, end } = getNextOccurrenceOfDay(evt.day, evt.time);
    const eventData = {
      title: `UbEx Rishikesh: ${evt.emoji} ${evt.title}`,
      description: `${evt.story}\nVibe: ${evt.vibe}\nFor: ${evt.who}\nJoin us at the Tapovan camp outpost!`,
      start,
      end,
      location: "UbEx Outpost, Rishikesh, Uttarakhand, India"
    };
    downloadIcsFile(eventData);
  };

  // Navigation & Inline toggles states
  const [openEventId, setOpenEventId] = useState<number | null>(null);
  const [openPersonIdx, setOpenPersonIdx] = useState<number | null>(null);
  const [openStoryId, setOpenStoryId] = useState<number | null>(null);
  const [openComfortIdx, setOpenComfortIdx] = useState<number | null>(null);
  
  // Instagram Viewer state
  const [mediaItem, setMediaItem] = useState<InstaItem | null>(null);

  // Vibe onboarding survey wizard popup
  const [showVibePopup, setShowVibePopup] = useState(false);
  const [surveyStep, setSurveyStep] = useState(0);
  const [vibeDates, setVibeDates] = useState({ arr: "", dep: "" });
  const [vibeGroup, setVibeGroup] = useState("");
  const [vibeInterests, setVibeInterests] = useState<string[]>([]);
  const [vibeTone, setVibeTone] = useState("");
  const [vibePhone, setVibePhone] = useState("");
  const [surveySubmittingStep, setSurveySubmittingStep] = useState(false);
  const [generatedInquiryId, setGeneratedInquiryId] = useState("");
  const [generatedWhatsAppUrl, setGeneratedWhatsAppUrl] = useState("");

  // Floating bubble effect engine
  const [bubbles, setBubbles] = useState<Array<{ id: number; size: number; left: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    // Generate organic starting bubbles
    const initBubbles = Array.from({ length: 15 }).map((_, idx) => ({
      id: idx,
      size: 20 + Math.random() * 50,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 10 + Math.random() * 12
    }));
    setBubbles(initBubbles);

    // Spawn regular upward bubbles
    const interval = setInterval(() => {
      setBubbles(prev => {
        const nextId = prev.length > 0 ? Math.max(...prev.map(b => b.id)) + 1 : 1;
        const fresh = {
          id: nextId,
          size: 15 + Math.random() * 45,
          left: Math.random() * 100,
          delay: 0,
          duration: 8 + Math.random() * 12
        };
        // Cap list size
        return [...prev.slice(-20), fresh];
      });
    }, 1600);

    return () => clearInterval(interval);
  }, []);

  const selectGroup = (group: string) => {
    setVibeGroup(group);
  };

  const selectVibeTone = (tone: string) => {
    setVibeTone(tone);
  };

  const toggleInterest = (interest: string) => {
    if (vibeInterests.includes(interest)) {
      setVibeInterests(prev => prev.filter(x => x !== interest));
    } else {
      setVibeInterests(prev => [...prev, interest]);
    }
  };

  const submitSurveyVibe = async () => {
    setSurveySubmittingStep(true);
    try {
      const payload = {
        inquiryType: "community",
        listingId: "community-vibe-match",
        listingTitle: `UbEx Rishikesh Community Vibe Check - ${vibeTone || "TBD"}`,
        category: vibeTone || "Community Onboarding",
        roomName: vibeGroup || "Solo",
        selectedDate: vibeDates.arr || "TBD",
        selectedDates: vibeDates.arr && vibeDates.dep ? [vibeDates.arr, vibeDates.dep] : null,
        guestCount: vibeGroup ? 2 : 1, // estimate base on traveler type
        selectedAddons: vibeInterests,
        visitorCount: null,
        sourcePage: "Community Matching Survey"
      };

      const res = await fetch("/api/inquiries/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setGeneratedInquiryId(result.inquiryId);
        setGeneratedWhatsAppUrl(result.whatsAppUrl);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      console.error("Community Vibe inquiry logging failure:", err);
      const fallbackMsg = `Hi UbEx, I just completed my Rishikesh Community Vibe Check!\n\nStyle: ${vibeTone || "TBD"}\nInterests: ${vibeInterests.join(", ")}\nDates: ${vibeDates.arr || "TBD"}`;
      setGeneratedWhatsAppUrl(`https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(fallbackMsg)}`);
    } finally {
      setSurveyStep(5);
      setSurveySubmittingStep(false);
    }
  };

  return (
    <div className="bg-white font-sans antialiased text-[#0a0f1e]">
      
      {/* ─── IMMERSIVE COSMIC DARK HERO ─── */}
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

        {/* Bubbles Simulation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {bubbles.map(b => (
            <div 
              key={b.id}
              className="absolute rounded-full bg-white/5 border border-white/10 animate-float-bubble"
              style={{
                width: `${b.size}px`,
                height: `${b.size}px`,
                left: `${b.left}%`,
                bottom: "-100px",
                animationDelay: `${b.delay}s`,
                animationDuration: `${b.duration}s`
              }}
            />
          ))}
        </div>

        <div className="container max-w-4xl mx-auto px-4 z-10 text-center select-none">
          <span className="px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-extrabold uppercase tracking-widest border border-indigo-500/30">
            ✨ More than a standard lodging stay
          </span>
          
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-3 leading-tight font-display">
            It's a Community that <span className="italic text-indigo-400">stays with you.</span>
          </h1>
          
          <p className="mt-3 text-sm sm:text-base text-slate-300 font-light max-w-xl mx-auto leading-relaxed">
            Arrive as a solo traveler, depart with a global family. We host campfire gatherings, acoustic nights, and slow-mornings where life-conversations launch naturally.
          </p>

          <div className="flex flex-wrap justify-center gap-3.5 mt-6">
            <button 
              onClick={() => { setSurveyStep(0); setShowVibePopup(true); }}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-950/40 transition-transform hover:-translate-y-1 cursor-pointer"
            >
              Join the Community ✨
            </button>
            <a 
              href="#week-at-ubex" 
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-sm rounded-xl transition-all"
            >
              Find Your Vibe ↓
            </a>
          </div>
        </div>
      </section>

      {/* ─── TRUST STATS STRIP ─── */}
      <section className="bg-white border-b border-slate-100 py-6">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 text-center divide-x divide-slate-100">
            {[
              { icon: "🌍", num: "30+", sub: "Nomad Nations" },
              { icon: "✨", num: "Weekly", sub: "Curated Events" },
              { icon: "💻", num: "Workation", sub: "Friendly Decks" },
              { icon: "🧘", num: "Wellness", sub: "Ganga Havens" },
              { icon: "👋", num: "Solo Travel", sub: "Absolute Safety" },
              { icon: "🔑", num: "Verified", sub: "Secure Outposts" }
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center p-2">
                <span className="text-xl mb-1.5">{stat.icon}</span>
                <div className="font-extrabold text-slate-900 text-sm">{stat.num}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMMUNITY FEELS LIKE SECTION ─── */}
      <section className="py-20 max-w-7xl mx-auto px-6 sm:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-650">Our Core Ethos</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight font-display">
              Real People. <br />
              Connections. <br />
              <span className="italic text-indigo-600">Real Moments.</span>
            </h2>
            <div className="w-12 h-1 bg-amber-400 rounded-full my-4" />
            <p className="text-slate-500 font-light text-sm sm:text-base leading-relaxed">
              At UbEx, co-living sits above mere room rentals. We curate relaxed social architectures that bridge age brackets, professions, and cultures - all centered on slow growth, safety, and mutual inspirations.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {[
              { icon: "👥", t: "Double trust Friendships", bg: "from-sky-50 to-sky-100" },
              { icon: "📅", t: "Acoustic Fire Circles", bg: "from-amber-50 to-amber-100" },
              { icon: "💻", t: "Balanced Deep Work", bg: "from-emerald-50 to-emerald-100" },
              { icon: "🌸", t: "Low Pressure Social", bg: "from-purple-50 to-purple-100" },
              { icon: "🤝", t: "Unity in Adventure", bg: "from-rose-50 to-rose-100" }
            ].map((feel, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-150 p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feel.bg} flex items-center justify-center text-xl mb-4`}>
                  {feel.icon}
                </div>
                <div className="font-extrabold text-[#0B1530] text-xs leading-snug">{feel.t}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── THIS WEEK AT UBEX SCROLL ROAD ─── */}
      <section id="week-at-ubex" className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          
          <div className="flex flex-col sm:flex-row items-baseline justify-between mb-12">
            <div>
              <span className="text-xs font-black uppercase text-indigo-650 tracking-widest block">This Week Schedule</span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1 leading-tight">
                Something exciting, every single day.
              </h2>
            </div>
            <button 
              onClick={() => { setSurveyStep(0); setShowVibePopup(true); }}
              className="text-xs text-indigo-650 font-bold hover:underline transition mt-2 flex items-center gap-1"
            >
              Calendar Details View →
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto scrollbar-none py-2">
            {EVENTS.map(evt => {
              const isOpen = openEventId === evt.id;
              return (
                <div 
                  key={evt.id}
                  onClick={() => setOpenEventId(isOpen ? null : evt.id)}
                  className="w-72 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow hover:-translate-y-1.5 transition-all duration-300 flex-shrink-0 cursor-pointer"
                >
                  <div className={`aspect-[16/10] bg-gradient-to-tr ${evt.bg} relative flex items-center justify-center text-3xl`}>
                    <span className="select-none">{evt.emoji}</span>
                    <span className="absolute top-4 left-4 bg-indigo-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {evt.day}
                    </span>
                    <span className="absolute bottom-3 right-4 bg-black/50 backdrop-blur-md text-[10px] text-white px-2 py-0.5 rounded-full font-bold">
                      +{evt.going} attending
                    </span>
                  </div>

                  <div className="p-5">
                    <h4 className="font-extrabold text-slate-900 text-base">{evt.title}</h4>
                    <p className="text-xs text-slate-400 font-semibold mt-1">🕒 {evt.time}</p>
                    
                    {isOpen ? (
                      <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-3 leading-relaxed animate-fade-in">
                        <p>{evt.story}</p>
                        <div className="text-[10px] text-indigo-650 font-black uppercase">vibe: {evt.vibe}</div>

                        {/* Interactive Calendar Integrations */}
                        <div className="mt-3.5 p-3 bg-slate-50 rounded-2xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-800 mb-2">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Add to Calendar &amp; Set Reminder</span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 mt-1">
                            <button
                              onClick={(e) => handleAddToGoogleCalendarSync(e, evt)}
                              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-extrabold rounded-xl transition"
                            >
                              📅 Google Cal
                            </button>

                            <button
                              onClick={(e) => handleAppleCalendarDownload(e, evt)}
                              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-extrabold rounded-xl transition"
                            >
                              🍏 Apple Cal (.ics)
                            </button>
                          </div>
                        </div>

                        <button 
                          onClick={(e) => { e.stopPropagation(); submitSurveyVibe(); setShowVibePopup(true); }}
                          className="w-full py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-slate-900 hover:text-white transition"
                        >
                          Request Free Ticket
                        </button>
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-indigo-600 mt-4 flex items-center gap-1">
                        Read Story Breakdown <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─── A DAY TIMELINE ─── */}
      <section className="py-20 max-w-7xl mx-auto px-6 sm:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-4 space-y-4">
            <span className="text-xs font-black uppercase text-indigo-650 tracking-widest block">Daily Rythm</span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-1 leading-tight font-display">
              Planned moments. <br />
              <span className="italic text-amber-500">Spontaneous magic.</span>
            </h2>
            <div className="w-12 h-1 bg-amber-400 rounded-full mt-4" />
            <p className="text-slate-500 font-light text-sm sm:text-base leading-relaxed">
              Our outposts rhythm blends structure with absolute freedom. Join our specialized morning Soundbowl meditations, plug into afternoon focus sessions, and slip into beach volley meets.
            </p>
          </div>

          <div className="lg:col-span-8 relative">
            
            {/* Horizontal line */}
            <div className="absolute top-[22px] left-8 right-8 h-0.5 border-t-2 border-dashed border-slate-200 z-0 hidden sm:block" />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 z-10 relative">
              {[
                { t: "Morning Zen", time: "7 AM", icon: "🧘", bg: "from-sky-50 to-sky-100", d: "Optional beach pranayama flows, slow locally roasted coffee, and card chats." },
                { t: "Afternoon Focus", time: "11 AM", icon: "💻", bg: "from-indigo-50 to-indigo-100", d: "Tackle operations inside acoustic rooms or seek collabs on the co-working tables." },
                { t: "Sunset Spark", time: "5 PM", icon: "🌅", bg: "from-amber-50 to-amber-100", d: "Spontaneous walk to Ganga river beaches. Meet artists and release diyya clay lamps." },
                { t: "Night Fire", time: "9 PM", icon: "🔥", bg: "from-rose-50 to-rose-100", d: "Bonfire acoustic circles, sharing travel itineraries, or movies under clear stars." }
              ].map((time, i) => (
                <div key={i} className="text-left space-y-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${time.bg} border-2 border-white shadow flex items-center justify-center text-xl font-bold`}>
                    {time.icon}
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-650 uppercase font-black tracking-widest">{time.time}</span>
                    <h4 className="font-extrabold text-slate-900 text-base leading-tight mt-0.5">{time.t}</h4>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{time.d}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* ─── WHO YOU'LL MEET CO-COLAB TRACK ─── */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          
          <div className="max-w-3xl mb-12">
            <span className="text-xs uppercase font-extrabold text-indigo-650 tracking-widest">Co-Nomads</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1 leading-tight font-display">
              Your kind of people are already here.
            </h2>
            <p className="text-slate-400 mt-2 text-xs font-semibold">Tuning strings, executing spreadsheets, or finding enlightenment. Click card to read profile profiles.</p>
          </div>

          <div className="flex gap-4 overflow-x-auto scrollbar-none py-1">
            {PEOPLE.map((p, idx) => {
              const isOpen = openPersonIdx === idx;
              return (
                <div 
                  key={idx}
                  onClick={() => setOpenPersonIdx(isOpen ? null : idx)}
                  className="w-56 bg-white border border-slate-205 rounded-3xl p-5 cursor-pointer shadow-sm hover:shadow transition-shadow flex-shrink-0 flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${p.bg} flex items-center justify-center text-2xl mb-4`}>
                      {p.emoji}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm tracking-tight">{p.type}</h4>
                    {isOpen ? (
                      <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed font-light animate-fade-in">{p.desc}</p>
                    ) : (
                      <p className="text-[10px] text-indigo-500 font-bold mt-3">Click to unwrap profile</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─── COMMUNITY TESTIMONY STORIES ─── */}
      <section className="py-20 max-w-7xl mx-auto px-6 sm:px-12">
        <div className="max-w-3xl mb-12">
          <span className="text-xs uppercase font-extrabold text-indigo-650 tracking-widest text-indigo-600">Community Stories</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1 leading-tight font-display">
            The best reviews are the ones we didn't ask for.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STORIES.map(st => {
            const isOpen = openStoryId === st.id;
            return (
              <div 
                key={st.id}
                onClick={() => setOpenStoryId(isOpen ? null : st.id)}
                className="bg-white border border-slate-205 rounded-[24px] shadow-sm hover:shadow transition-shadow overflow-hidden cursor-pointer"
              >
                <div className={`h-1.5 ${st.sa}`} />
                <div className="p-6">
                  <div className="text-2xl font-display italic font-light text-slate-900 leading-snug">
                    "{st.quote}"
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold select-none text-sm" style={{ background: st.color }}>
                      {st.name[0]}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">{st.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">{st.country}</div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-5 pt-5 border-t border-slate-100 text-xs text-slate-500 space-y-4 animate-fade-in leading-relaxed font-light">
                      <p>{st.full}</p>
                      
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {st.joined.map((tag, i) => (
                          <span key={i} className="text-[10px] font-bold text-indigo-700 bg-indigo-50/60 px-2.5 py-0.5 rounded-full border border-indigo-100">
                            ✔ {tag}
                          </span>
                        ))}
                      </div>

                      <button 
                        onClick={(e) => { e.stopPropagation(); setSurveyStep(0); setShowVibePopup(true); }}
                        className="w-full py-2.5 bg-indigo-650 hover:bg-slate-900 text-white font-bold rounded-xl mt-3"
                      >
                        Plan My Stays
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── INSTAGRAM SEEN VIA TRAVELER EYES ─── */}
      <section className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          
          <div className="flex flex-col sm:flex-row items-baseline justify-between mb-12">
            <div>
              <span className="text-xs font-black uppercase text-indigo-650 tracking-widest block">Social Proof</span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1 leading-tight font-display">
                Real captures. Real people.
              </h2>
            </div>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); }} 
              className="text-xs text-indigo-650 font-bold hover:underline transition mt-2"
            >
              Verify on Instagram →
            </a>
          </div>

          {/* Insta Mosaic Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {INSTA_WALL.map((item, idx) => {
              const isBig = item.big;
              return (
                <div 
                  key={idx}
                  onClick={() => setMediaItem(item)}
                  className={`bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-lg hover:scale-103 cursor-pointer overflow-hidden transition-all duration-300 relative group aspect-square ${
                    isBig ? "col-span-2 row-span-2 aspect-auto min-h-[220px]" : ""
                  }`}
                >
                  <div className={`w-full h-full bg-gradient-to-tr ${item.bg} flex items-center justify-center text-3xl sm:text-4xl select-none filter group-hover:brightness-105 transition-all`}>
                    {item.emoji}
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-slate-950/70 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-350 flex flex-col justify-end text-white select-none">
                    <span className="text-sm">{item.flag}</span>
                    <span className="text-xs font-bold mt-1 tracking-tight">@{item.name}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─── SOLO TRAVEL COMFORT METRICS ─── */}
      <section className="py-20 max-w-7xl mx-auto px-6 sm:px-12">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs uppercase font-extrabold text-indigo-650 tracking-widest text-indigo-600 block">Traveller Safeguards</span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-1 leading-tight font-display">
            Designed for Solo Travelers, <br />
            Loved by Couples &amp; Nomads.
          </h2>
          <div className="w-12 h-1 bg-amber-400 rounded-full mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {COMFORTS.map((com, idx) => {
            const isOpen = openComfortIdx === idx;
            return (
              <div 
                key={idx}
                onClick={() => setOpenComfortIdx(isOpen ? null : idx)}
                className="bg-white border border-slate-205 rounded-3xl p-6 cursor-pointer shadow-sm hover:shadow transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl mb-3">{com.icon}</div>
                  <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">{com.title}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{com.tag}</p>
                  
                  {isOpen && (
                    <p className="text-[11px] text-slate-500 mt-4 leading-relaxed font-light border-t border-slate-100 pt-3 animate-fade-in">{com.full}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── VIBE ADVENTURE REGISTER WIZARD POPUP ─── */}
      {showVibePopup && (
        <div className="popup-overlay open">
          <div className="popup-box font-sans text-[#0f1b3c]">
            
            {/* Header */}
            <div className="popup-header">
              <h3 className="popup-title font-black text-slate-900 text-lg sm:text-xl">Let's find your vibe</h3>
              <button 
                onClick={() => setShowVibePopup(false)}
                className="popup-close text-[#6B7FA3]"
              >
                ✕
              </button>
            </div>

            {/* Step Indicators */}
            <div className="popup-steps">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div 
                  key={idx}
                  className={`popup-step ${idx < surveyStep ? "done" : idx === surveyStep ? "current" : ""}`}
                />
              ))}
            </div>

            {/* Custom Steps Forms */}
            <div className="popup-body">
              
              {/* Step 0: Date selector */}
              {surveyStep === 0 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="popup-q capitalize">When are you travelling to Rishikesh?</div>
                  <div className="popup-hint leading-relaxed">No fixed dates? Choose any approximate range -- you can skip dates anytime.</div>
                  
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Arrival Date</label>
                      <input 
                        type="date" 
                        value={vibeDates.arr}
                        onChange={(e) => setVibeDates({ ...vibeDates, arr: e.target.value })}
                        className="popup-input" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Departure Date</label>
                      <input 
                        type="date" 
                        value={vibeDates.dep}
                        onChange={(e) => setVibeDates({ ...vibeDates, dep: e.target.value })}
                        className="popup-input" 
                      />
                    </div>
                  </div>

                  <div className="popup-skip select-none text-[10px] font-bold mr-auto cursor-pointer" onClick={() => setSurveyStep(1)}>
                    I haven't decided dates yet • Skip dates →
                  </div>

                  <div className="popup-nav pt-4">
                    <span />
                    <button 
                      onClick={() => setSurveyStep(1)}
                      className="px-6 py-2.5 bg-indigo-650 hover:bg-slate-900 text-white rounded-xl text-xs font-bold tracking-tight shadow flex items-center gap-1.5"
                    >
                      Continue <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1: Who is travelling */}
              {surveyStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="popup-q capitalize">Who's travelling?</div>
                  <div className="popup-hint leading-relaxed">Solo or group, our specialist coordinates community clusters beautifully.</div>

                  <div className="choice-grid">
                    {[
                      { emoji: "🧳", label: "Solo Traveler" },
                      { emoji: "💑", label: "Couple Stay" },
                      { emoji: "👯", label: "Friends Group" },
                      { emoji: "👨‍👩‍👧‍👦", label: "Family Team" }
                    ].map(type => (
                      <div 
                        key={type.label}
                        onClick={() => selectGroup(type.label)}
                        className={`choice-card ${vibeGroup === type.label ? "selected" : ""}`}
                      >
                        <div className="cc-emoji">{type.emoji}</div>
                        <div className="cc-txt">{type.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="popup-nav pt-4">
                    <button onClick={() => setSurveyStep(0)} className="popup-back">← Back</button>
                    <button 
                      onClick={() => setSurveyStep(2)}
                      disabled={!vibeGroup}
                      className="px-6 py-2.5 bg-indigo-650 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-55 shadow"
                    >
                      Continue <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Selecting Interests */}
              {surveyStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="popup-q capitalize">What are you into?</div>
                  <div className="popup-hint leading-relaxed">Choose as many as you like to customise calendar alerts!</div>

                  <div className="interest-chips">
                    {[
                      "☕ Cafés", "🧘 Yoga & Sound Bowl", "🌊 Water Rafting", 
                      "🎶 Bonfire Open-mic", "💻 Workation Focus", "🌱 Eco Cleanups", 
                      "🏍 Mountain Riding", "🏔 Sunrise Treks"
                    ].map(int => {
                      const isSel = vibeInterests.includes(int);
                      return (
                        <div 
                          key={int}
                          onClick={() => toggleInterest(int)}
                          className={`int-chip ${isSel ? "selected animate-bounce-once" : ""}`}
                        >
                          {int}
                        </div>
                      );
                    })}
                  </div>

                  <div className="popup-nav pt-4">
                    <button onClick={() => setSurveyStep(1)} className="popup-back">← Back</button>
                    <button 
                      onClick={() => setSurveyStep(3)}
                      disabled={vibeInterests.length === 0}
                      className="px-6 py-2.5 bg-indigo-650 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-55 shadow"
                    >
                      Continue <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Pick vibe tone */}
              {surveyStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="popup-q capitalize">Choose your travel style vibe</div>
                  <div className="popup-hint leading-relaxed">We clusters groups depending on active vs quiet expectations.</div>

                  <div className="choice-grid">
                    {[
                      { emoji: "🧘", label: "Quiet & Relaxed" },
                      { emoji: "🔥", label: "Highly Social" },
                      { emoji: "⚖️", label: "Perfectly Balanced" },
                      { emoji: "💼", label: "Remote Work Focused" }
                    ].map(style => (
                      <div 
                        key={style.label}
                        onClick={() => selectVibeTone(style.label)}
                        className={`choice-card ${vibeTone === style.label ? "selected" : ""}`}
                      >
                        <div className="cc-emoji">{style.emoji}</div>
                        <div className="cc-txt">{style.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="popup-nav pt-4">
                    <button onClick={() => setSurveyStep(2)} className="popup-back">← Back</button>
                    <button 
                      onClick={() => setSurveyStep(4)}
                      disabled={!vibeTone}
                      className="px-6 py-2.5 bg-indigo-650 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-55 shadow"
                    >
                      Continue <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: WhatsApp input */}
              {surveyStep === 4 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="popup-q capitalize font-bold text-slate-800">Your WhatsApp coordinates</div>
                  <div className="popup-hint leading-relaxed">We will coordinate direct guides and room suggestions. No automated newsletters, ever.</div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block uppercase mb-1">WhatsApp number with country code</label>
                    <input 
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={vibePhone}
                      onChange={(e) => setVibePhone(e.target.value)}
                      className="popup-input"
                    />
                  </div>

                  <div className="popup-nav pt-4">
                    <button onClick={() => setSurveyStep(3)} className="popup-back">← Back</button>
                    <button 
                      onClick={submitSurveyVibe}
                      disabled={!vibePhone || surveySubmittingStep}
                      className="px-6 py-2.5 bg-indigo-650 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
                    >
                      {surveySubmittingStep ? "Processing Vibe..." : "Help Me Find My Community! →"}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Final simulation success celebration page */}
              {surveyStep === 5 && (
                <div className="text-center py-6 space-y-4 animate-fade-in text-slate-800 font-sans">
                  <div className="text-5xl">🎉</div>
                  <h3 className="font-extrabold text-[#0B1530] text-xl">You are officially in the family.</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-light">
                    Our Rishikesh specialist has received your preferred settings! We have logged your match criteria in the database and generated your official Inquiry ID.
                  </p>

                  {generatedInquiryId && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-2.5 max-w-[240px] mx-auto text-center shadow-xs">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Inquiry System ID</span>
                      <code className="text-xs font-mono font-black text-indigo-700 block mt-0.5">{generatedInquiryId}</code>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <button 
                      onClick={() => {
                        setShowVibePopup(false);
                        window.open(generatedWhatsAppUrl || `https://wa.me/${getWhatsAppNumber()}`, "_blank");
                      }}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow tracking-wide transition-all uppercase cursor-pointer"
                    >
                      Launch WhatsApp Dispatch →
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ─── INSTAGRAM VIEW MEDIA MODAL OVERLAY ─── */}
      {mediaItem && (
        <div className="media-viewer open" onClick={() => setMediaItem(null)}>
          <div className="mv-wrap font-sans text-slate-850" onClick={(e) => e.stopPropagation()}>
            <div className="mv-inner max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl relative">
              <div className={`aspect-video bg-gradient-to-tr ${mediaItem.bg} flex items-center justify-center text-[70px] select-none text-white filter`}>
                {mediaItem.emoji}
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-700 italic text-sm leading-relaxed">
                  "{mediaItem.caption}"
                </p>
                <div className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-15">
                  <span>{mediaItem.flag} Curated by @{mediaItem.name}</span>
                </div>
                
                <div className="border-t border-slate-100 pt-4 text-center">
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); setMediaItem(null); }}
                    className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-1200 text-indigo-650 rounded-xl text-xs font-bold inline-block"
                  >
                    View Original Profile Link →
                  </a>
                </div>
              </div>

              {/* Close pin */}
              <button 
                onClick={() => setMediaItem(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white leading-none shadow hover:bg-slate-100 font-bold transition-all text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
