import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Clock, 
  Users, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Check, 
  ChevronRight, 
  Play, 
  X, 
  CheckCircle,
  ShieldCheck,
  Award,
  HeartHandshake,
  MessageSquare,
  Building,
  Briefcase,
  Layers,
  Smile,
  Zap,
  Volume2,
  Lock
} from "lucide-react";

interface CorporatePageProps {
  convertAndFormatPrice: (priceValue: number) => string;
  currency: string;
  lang?: string;
  externalSelectedRetreat?: string;
  setExternalSelectedRetreat?: (id: string) => void;
}

// Static dataset for Selector
const RETREAT_DATA = {
  "team-retreats": {
    id: "team-retreats",
    title: "Team Retreats",
    tagline: "Popular",
    description: "Bring your team together beyond meetings, screens and everyday work. Designed for teams who want to step out, slow down and come back stronger—together.",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=1200",
    meta: {
      who: "Managers, Leadership Teams, Departments, Remote Teams, Founders",
      size: "10 - 80 People",
      duration: "2 Nights / 3 Days or more"
    },
    included: [
      "Curated Stay Options",
      "Experiences & Activities",
      "Community Evenings",
      "Wellness Sessions",
      "Food & Beverages",
      "On-ground Coordination"
    ],
    outcomes: [
      "Better Communication",
      "Stronger Relationships",
      "Increased Engagement",
      "Aligned Goals",
      "Lasting Team Culture"
    ],
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
  },
  "wellness-retreats": {
    id: "wellness-retreats",
    title: "Wellness Retreats",
    tagline: "Recharge",
    description: "Reset minds. Reconnect within. Return renewed. Designed for individuals and groups seeking physical, mental, and emotional restoration in a supportive environment.",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200",
    meta: {
      who: "Corporate Teams, Executive Groups, Wellness Programs, Health-focused Organizations",
      size: "8 - 40 People",
      duration: "3 Nights / 4 Days or more"
    },
    included: [
      "Wellness-focused Accommodations",
      "Daily Yoga & Meditation",
      "Healthy Meal Planning",
      "Spa & Wellness Services",
      "Nature Activities",
      "Mindfulness Sessions"
    ],
    outcomes: [
      "Reduced Stress Levels",
      "Improved Mental Health",
      "Better Work-life Balance",
      "Renewed Energy & Focus",
      "Lasting Wellness Habits"
    ],
    videoUrl: "https://www.w3schools.com/html/movie.mp4"
  },
  "celebrations": {
    id: "celebrations",
    title: "Celebrations & Gatherings",
    tagline: "Memorable",
    description: "Milestones. Memories. Moments that bring people together. Designed for celebrations and special occasions that bring your community closer in deep, authentic settings.",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200",
    meta: {
      who: "Companies, Families, Organizations, Communities, Social Groups",
      size: "20 - 250 People",
      duration: "1 Night / 2 Days or more"
    },
    included: [
      "Premium Venue & Accommodations",
      "Curated Entertainment",
      "Gourmet Catering",
      "Event Coordination",
      "Audio/Visual Setup",
      "Professional Support Staff"
    ],
    outcomes: [
      "Unforgettable Memories",
      "Strengthened Bonds",
      "Celebration of Achievements",
      "Shared Joy & Connection",
      "Stories That Last Forever"
    ],
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
  },
  "workations": {
    id: "workations",
    title: "Workations & Offsites",
    tagline: "Focus & Flow",
    description: "Productive workdays. Inspiring environments. Meaningful connections. A perfect balance of focused work sessions, group alignment, and unique local experiences.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200",
    meta: {
      who: "Startups, Remote Teams, Founders, Creative Units",
      size: "6 - 40 People",
      duration: "3 Nights / 4 Days or more"
    },
    included: [
      "Dedicated Coworking Spaces",
      "Uncapped High-Speed Fiber Internet",
      "Comfortable Private Stays",
      "Ice-breakers & Team Challenges",
      "Local Culinary & Hiking Trails",
      "Evening Bonfires & Sharing Circles"
    ],
    outcomes: [
      "Better Team Alignment",
      "High Productive Output",
      "Inspired Creative Outlines",
      "Thriving Professional Culture",
      "Enhanced Retention & Morale"
    ],
    videoUrl: "https://www.w3schools.com/html/movie.mp4"
  }
};

// Tabs expectations dataset
const TAB_DETAILS = {
  "what-to-expect": [
    { title: "Culture Building", desc: "Create a shared experience that strengthens team bonds and shared values.", icon: Layers },
    { title: "Leadership Alignment", desc: "Align on vision, strategy, and goals in an environment away from day-to-day pressures.", icon: Clock },
    { title: "Team Bonding", desc: "Forge genuine connections through shared experiences and meaningful interactions.", icon: Users },
    { title: "Innovation & Growth", desc: "Break from routine to brainstorm, collaborate, and discover new possibilities together.", icon: Sparkles }
  ],
  "sample-agenda": [
    { title: "Day 1: Arrival & Orientation", desc: "Check-in, welcome drinks, opening circle and introduction to the majestic retreat atmosphere.", icon: Calendar },
    { title: "Day 2: Core Programming", desc: "Immersive workshops, bespoke team challenges, and active wellness explorations designed for your goals.", icon: Briefcase },
    { title: "Day 2: Evening Vibe", desc: "Curated community dinners, bonfire circles, live traditional elements, and starry networking.", icon: MessageSquare },
    { title: "Day 3: Reflection & Safe Travels", desc: "Group alignment reviews, goal commitment declarations, and customized departures.", icon: CheckCircle }
  ],
  "experiences": [
    { title: "Adventure Activities", desc: "White water river rafting, pristine mountain trekking and outdoor wilderness courses.", icon: Zap },
    { title: "Wellness Workshops", desc: "Sunrise yoga, evening guided transcendental breathing, and sound healing meditation.", icon: Smile },
    { title: "Team Building Guides", desc: "Facilitated bonding activities, deep relationship communication games, and masterclasses.", icon: Award },
    { title: "Community Circles", desc: "Himalayan soundscapes, acoustic song circles and traditional local culinary experiences.", icon: HeartHandshake }
  ],
  "moments": [
    { title: "Genuine Connection", desc: "Real moments of laughter, vulnerability, and authentic human interaction without screens.", icon: Sparkles },
    { title: "Shared Memories", desc: "Unique stories and legendary bonds that people speak about fondly for years to come.", icon: Award },
    { title: "Visible Growth", desc: "Transformation in how teams communicate and support each other's vision.", icon: CheckCircle },
    { title: "Lasting Impact", desc: "Proactive mindset shifts that continue to improve organizational culture long term.", icon: ShieldCheck }
  ]
};

// Static dataset for Spaces
const SPACES_DATA = {
  wellness: {
    title: "Wellness Hall",
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=600",
    area: "824 sq ft",
    capacity: "45 People",
    useCases: "Yoga, Workshops, Wellness Sessions",
    description: "A light-filled hall meticulously modeled with fine local woodwork, custom acoustics, and floor-to-ceiling windows. It provides an exceptional environment for sunrise meditation, deep breathing circles, collective strategy workshops, and group alignment.",
    details: ["824 Square Feet", "Up to 45 Guests Capable", "State of the art sound proofing", "Beautiful views of green valleys"],
    perfectFor: ["Yoga Retreats", "Guided Meditations", "Breathwork Circles", "Mindful Goal Setting"],
    features: ["Polished Hardwood Floors", "Professional Grade Yoga Mats & Blocks", "Ambient Dimmable LED Control", "DMC Certified AV Infrastructure"],
    curated: ["Facilitated Healing Circles", "Guided Acoustic Concerts", "Holistic Clean Cleanses"]
  },
  activity: {
    title: "Activity Hall",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=600",
    area: "425 sq ft",
    capacity: "25 People",
    useCases: "Team Activities, Indoor Games",
    description: "Our high-energy arena designed for active, collaborative play, ice breakers, group-solving challenges, and dynamic, fun indoor team interactions.",
    details: ["425 Square Feet", "Up to 25 Guests Capable", "Resilient high-impact flooring", "Clutter-free modular layout"],
    perfectFor: ["Interactive Team Contests", "Creative Brainstorms", "Ice Breaker Drills", "Dynamic Group Challenges"],
    features: ["Retractable Walls", "Whiteboards & Multi-projection Setup", "Gaming Consoles & Sports Equipment", "High-Fidelity Audio Controls"],
    curated: ["Custom Corporate Olympics", "Interactive Logic Tournaments", "Vibrant Drama & Expression Workshops"]
  },
  multipurpose: {
    title: "Multipurpose Hall",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600",
    area: "308 sq ft",
    capacity: "20 People",
    useCases: "Meetings, Workshops, Trainings",
    description: "Corporate spaces constructed to offer modular versatility. Features ergonomic leather seats, premium write boards, high-grade connectivity, and direct executive services.",
    details: ["308 Square Feet", "Comfortably sits 20 Executives", "Premium air conditioning", "Complete privacy layout"],
    perfectFor: ["Board Meetings", "Intensive Training Sprints", "Productive Strategy Roadmaps", "Exclusive Masterclasses"],
    features: ["Smart 4K Touch Displays", "Ergonomic Chairs", "Premium Stationaries", "Dual Fiber Internet Fallbacks"],
    curated: ["Specialist Guest Lectures", "Strategic Alignment Audits", "Startup Pitch Workshops"]
  },
  coworking: {
    title: "Coworking Space",
    image: "https://images.unsplash.com/photo-15222071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600",
    area: "260 sq ft",
    capacity: "15 People",
    useCases: "Workations, Focus Sessions, Meetings",
    description: "A customized workspace bathed in natural sunlight, serving fast-paced remote teams desiring absolute focus, seamless hybrid calls, and modern facilities.",
    details: ["260 Square Feet", "Up to 15 Nomads", "Power-backed desk clusters", "Panoramic Himalayan outlook"],
    perfectFor: ["SaaS Sprint Offsites", "Daily Remote Catchups", "Silent Study & Coding Sprints", "One-on-One Alignment"],
    features: ["Dedicated Dual WAN Routers", "Ergonomic Standing Desk Clusters", "Espresso & Tea Bar", "Phone Booths for Quiet Calls"],
    curated: ["Expert Goal Planning Hacks", "Productivity Assessments", "Community Networking Hours"]
  }
};

// Testimonials
const TESTIMONIALS = [
  {
    author: "Arjun S.",
    role: "Co-founder, Vertex Technologies",
    type: "Startup Team • 22 People",
    location: "Bengaluru",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    challenge: "Our remote team struggled with authentic cross-department alignment and felt heavily isolated over Slack.",
    experience: "A bespoke 3-day retreats custom-integrated with team adventure challenges, white water rafting, and outdoor bonfire strategy circles.",
    outcome: "The team returned with incredibly tight ties. Quarterly retreats here have officially become a staple of our core company culture."
  },
  {
    author: "Neha Kapoor",
    role: "Founder, Prana Wellness Network",
    type: "Wellness Group • 18 People",
    location: "Mumbai",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    challenge: "I aimed to launch a premium wellness retreat that offered both absolute safety and high-end local luxury.",
    experience: "UbEx handled our premium stays, nutritious catering, yogic soundscapes, and local trekking end-to-end.",
    outcome: "Every single attendee was absolutely blown away. We've immediately booked our next three groups with UbEx."
  },
  {
    author: "Vikram Malhotra",
    role: "Director of Operations",
    type: "Family & Execs Celebration • 35 People",
    location: "Delhi NCR",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    challenge: "Needed a highly personalized, secure, stunning location for our parent agency's 50th foundation ceremony.",
    experience: "Seamless private stays, custom lighting layouts, curated local musicians, and hand-delivered dining elements.",
    outcome: "We didn't have to lift a finger during the event. An absolute masterpiece of logistics that exceeded all metrics."
  }
];

export default function CorporatePage({ 
  convertAndFormatPrice, 
  currency, 
  lang,
  externalSelectedRetreat,
  setExternalSelectedRetreat
}: CorporatePageProps) {
  // Selector State
  const [localRetreat, setLocalRetreat] = useState<keyof typeof RETREAT_DATA>("team-retreats");
  const selectedRetreat = (externalSelectedRetreat !== undefined ? externalSelectedRetreat : localRetreat) as keyof typeof RETREAT_DATA;
  const setSelectedRetreat = (val: keyof typeof RETREAT_DATA) => {
    if (setExternalSelectedRetreat) {
      setExternalSelectedRetreat(val);
    } else {
      setLocalRetreat(val);
    }
  };

  const [activeTab, setActiveTab] = useState<keyof typeof TAB_DETAILS>("what-to-expect");
  
  // Video Modal State
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState("");

  // Space Drawer State
  const [spaceDrawerOpen, setSpaceDrawerOpen] = useState(false);
  const [selectedSpaceKey, setSelectedSpaceKey] = useState<keyof typeof SPACES_DATA>("wellness");

  // Multi-step form Wizard State
  const [selections, setSelections] = useState({
    goal: "",
    groupSize: "",
    duration: "",
    experiences: [] as string[],
    budget: "",
    dates: ""
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Helper inside form
  const handleOptionToggleSingle = (field: keyof typeof selections, value: string) => {
    setSelections(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExperiencesToggle = (value: string) => {
    setSelections(prev => {
      const exists = prev.experiences.includes(value);
      if (exists) {
        return {
          ...prev,
          experiences: prev.experiences.filter(item => item !== value)
        };
      } else {
        return {
          ...prev,
          experiences: [...prev.experiences, value]
        };
      }
    });
  };

  const handleFormSubmit = () => {
    if (!selections.goal || !selections.groupSize || !selections.duration || selections.experiences.length === 0 || !selections.budget || !selections.dates) {
      alert("Please make selections on all steps before compiling your tailored plan.");
      return;
    }
    setShowSuccessModal(true);
  };

  const handleOpenVideo = (videoUrl: string) => {
    setActiveVideoUrl(videoUrl);
    setVideoModalOpen(true);
  };

  const currentRetreat = RETREAT_DATA[selectedRetreat];

  return (
    <div className="bg-[#f8fafc] text-[#14213d] min-h-screen font-sans">
      {/* ========================================== HERO SECTION ========================================== */}
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
            Retreats &amp; Gatherings
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-3 leading-tight font-display">
            Retreats Your Team Actually Remembers
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 font-light max-w-xl mx-auto leading-relaxed">
            More than a venue. We help create meaningful retreats, celebrations, workshops and gatherings beside the sacred river Ganga.
          </p>
        </div>
      </section>

      <div className="px-4 md:px-8 py-12">

      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6"
        >
          <span className="text-indigo-600 font-extrabold tracking-widest text-xs uppercase inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full w-fit">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> DESIGNED FOR TEAMS
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#14213d] leading-tight font-display">
            Coordinate Deep Work &amp; True Synergy.
          </h2>
          <p className="text-base text-slate-600 leading-relaxed max-w-xl">
            We provide remote teams with premium high-utility workspace capsules, 
            peaceful yoga pavilions, and curated group dinners to encourage genuine 
            bonding. From arrival shuttles to river rafting, we manage everything.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <a 
              href="#gathering-builder-section" 
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 border-0 cursor-pointer"
            >
              Build My Gathering <ArrowRight className="w-4.5 h-4.5" />
            </a>
            <a 
              href="#retreats-choices" 
              className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm sm:text-base rounded-2xl shadow-sm transition-all hover:scale-[1.02] border border-slate-200/80 flex items-center justify-center cursor-pointer"
            >
              Explore Retreats
            </a>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative max-w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 group"
        >
          <img 
            src="https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=1200" 
            alt="Team gathering at a premium retreat venue"
            className="w-full h-[400px] sm:h-[500px] object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
        </motion.div>
      </section>

      {/* ========================================== TRUST STRIP SECTION ========================================== */}
      <section className="max-w-7xl mx-auto py-12 mt-20 border-y border-slate-200 bg-white rounded-3xl p-8 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-8">
        {[
          { text: "Fully Customizable", desc: "Tailored itineraries", icon: ShieldCheck },
          { text: "Stay + Experiences", desc: "All elements included", icon: Layers },
          { text: "Corporate & Private", desc: "Event spaces available", icon: Building },
          { text: "Community Access", desc: "Meaningful social vibes", icon: Users },
          { text: "End-to-End Planning", desc: "UbEx takes care of all", icon: Award }
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col items-center text-center gap-2">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <item.icon className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-sm text-[#14213d] mt-1">{item.text}</span>
            <span className="text-xs text-slate-500">{item.desc}</span>
          </div>
        ))}
      </section>

      {/* ========================================== RETREAT SELECTOR SECTION ========================================== */}
      <section id="retreats-choices" className="max-w-7xl mx-auto py-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <span className="text-indigo-600 font-extrabold text-xs uppercase tracking-wider block mb-2">FIND YOUR PERFECT GATHERING</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#14213d] font-display">What Brings You Together?</h2>
          </div>
          <a href="#gathering-builder-section" className="text-sm font-bold text-indigo-600 flex items-center gap-1 hover:underline">
            Need Help Choosing? <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* RETREAT FILTER TABS */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-3.5 scrollbar-none border-b border-slate-100">
          {[
            { id: "all", label: "All Corporate Retreats", filterId: "team-retreats" },
            { id: "wellness", label: "🧘 Wellness Retreats Focus", filterId: "wellness-retreats" },
            { id: "community", label: "🌿 Community & Celebrations Focus", filterId: "celebrations" },
            { id: "workation", label: "💻 Workations & Offsites Focus", filterId: "workations" }
          ].map((itm) => {
            const isTabSelected = selectedRetreat === itm.filterId;
            return (
              <button
                key={itm.id}
                onClick={() => {
                  setSelectedRetreat(itm.filterId as any);
                }}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                  isTabSelected
                  ? "bg-indigo-600 text-white shadow-md transform -translate-y-0.5" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {itm.label}
              </button>
            );
          })}
        </div>

        {/* Categories Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {Object.values(RETREAT_DATA).map(item => {
            const isSelected = selectedRetreat === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedRetreat(item.id as any)}
                className={`text-left rounded-3xl overflow-hidden border transition-all h-[200px] flex flex-col justify-end p-6 relative focus:outline-none cursor-pointer ${isSelected ? "border-indigo-600 ring-4 ring-indigo-50" : "border-slate-200 hover:border-indigo-300 bg-white"}`}
              >
                <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <span className="px-2.5 py-0.5 text-[10px] bg-indigo-600 text-white font-extrabold rounded-full mb-2 inline-block uppercase tracking-widest">{item.tagline}</span>
                  <h3 className="text-lg font-extrabold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-200 line-clamp-2">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Category Details Board */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 lg:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Info Col */}
            <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#14213d]">{currentRetreat.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{currentRetreat.description}</p>
              
              <div className="flex flex-col gap-4 py-4 border-y border-slate-200">
                <div className="flex gap-3 items-start">
                  <Users className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-400 block">Who it's for</span>
                    <span className="text-xs text-slate-700 mt-1 block">{currentRetreat.meta.who}</span>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <Users className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-400 block">Ideal group size</span>
                    <span className="text-xs text-slate-700 mt-1 block">{currentRetreat.meta.size}</span>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <Clock className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-400 block">Retreat duration</span>
                    <span className="text-xs text-slate-700 mt-1 block">{currentRetreat.meta.duration}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                <a href="#gathering-builder-section" className="px-6 py-3.5 bg-indigo-600 text-white hover:bg-indigo-700 font-extrabold text-xs text-center rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md">
                  Customize This Retreat <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a href="mailto:gathering@ubex.com?subject=Business Gathering Inquiry" className="px-6 py-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[#14213d] font-extrabold text-xs text-center rounded-xl flex items-center justify-center gap-1 transition-all">
                  Talk To UbEx
                </a>
              </div>
            </div>

            {/* Image & Video Play Col */}
            <div className="col-span-1 lg:col-span-4 relative rounded-2xl overflow-hidden h-[300px] sm:h-[400px] border border-slate-200">
              <img src={currentRetreat.image} alt={currentRetreat.title} className="w-full h-full object-cover object-center" />
              <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                <button 
                  onClick={() => handleOpenVideo(currentRetreat.videoUrl)}
                  className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer border-none"
                  title="Play Experience Video Preview"
                >
                  <Play className="w-6 h-6 fill-current translate-x-0.5" />
                </button>
              </div>
            </div>

            {/* Bullet Lists Column */}
            <div className="col-span-1 lg:col-span-4 flex flex-col gap-8">
              <div>
                <h4 className="text-xs font-extrabold text-indigo-600 tracking-wider uppercase mb-3">What's Included</h4>
                <ul className="flex flex-col gap-2.5">
                  {currentRetreat.included.map((item, idx) => (
                    <li key={idx} className="flex gap-2 items-center text-xs text-slate-600 font-medium">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-indigo-600 tracking-wider uppercase mb-3">Outcomes</h4>
                <ul className="flex flex-col gap-2.5">
                  {currentRetreat.outcomes.map((item, idx) => (
                    <li key={idx} className="flex gap-2 items-center text-xs text-slate-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          {/* Tab Navigation Segment */}
          <div className="mt-16 pt-12 border-t border-slate-200">
            <div className="flex gap-6 overflow-x-auto border-b border-slate-250 pb-2 scrollbar-none mb-8">
              {[
                { id: "what-to-expect", label: "What to Expect" },
                { id: "sample-agenda", label: "Sample Agenda" },
                { id: "experiences", label: "Experiences Included" },
                { id: "moments", label: "Real Moments" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`text-sm font-bold pb-2 transition-all cursor-pointer relative focus:outline-none whitespace-nowrap ${activeTab === tab.id ? "text-indigo-600" : "text-slate-500 hover:text-indigo-600"}`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div layoutId="navSelection" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Animated Tab Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {TAB_DETAILS[activeTab].map((card, idx) => {
                const IconComp = card.icon;
                return (
                  <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 w-fit">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-sm text-[#14213d]">{card.title}</h5>
                    <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ========================================== VALUE PILLARS SECTION ========================================== */}
      <section className="max-w-7xl mx-auto py-24 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <span className="text-indigo-600 font-extrabold text-xs uppercase tracking-wider">MORE THAN A VENUE</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#14213d] leading-tight font-display">We Bring Everything<br />Together.</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            From organic stays and thrilling experiences to guided community evenings and on-ground execution — we manage 
            the intricate logistics so you can focus entirely on connecting people.
          </p>
          <a href="#gathering-builder-section" className="text-indigo-600 font-extrabold text-xs flex items-center gap-1 hover:underline">
            Get personalized DMC advice <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { tag: "Stay", text: "Comfortable organic stays for every group size.", icon: Building },
            { tag: "Experiences", text: "Adventure, deep breathing, and wellness programs.", icon: Sparkles },
            { tag: "Community", text: "Guided sunset circles and traditional dining.", icon: MessageSquare },
            { tag: "Wellness", text: "Certified yogic soundscapes & healing.", icon: Smile },
            { tag: "Planning", text: "Custom timelines crafted around specific metrics.", icon: Calendar },
            { tag: "Coordination", text: "Incredibly smooth end-to-end local managers.", icon: ShieldCheck }
          ].map((pillar, idx) => (
            <div key={idx} className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all flex flex-col gap-3 shadow-sm">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl w-fit border border-indigo-100">
                <pillar.icon className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-sm text-[#14213d]">{pillar.tag}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{pillar.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================== SPACES & VENUES SECTION ========================================== */}
      <section className="max-w-7xl mx-auto py-24 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <span className="text-indigo-600 font-extrabold text-xs uppercase tracking-wider block mb-2">SPACES & VENUES</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#14213d] font-display">Flexible Spaces for Every Gathering.</h2>
          </div>
          <a href="#gathering-builder-section" className="text-sm font-bold text-indigo-600 flex items-center gap-1 hover:underline">
            View all curated spaces <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* Space Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(SPACES_DATA).map(([key, space]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedSpaceKey(key as any);
                setSpaceDrawerOpen(true);
              }}
              className="text-left bg-white hover:shadow-xl rounded-2xl overflow-hidden border border-slate-200 hover:border-indigo-300 transition-all flex flex-col group cursor-pointer focus:outline-none"
            >
              <div className="w-full h-44 overflow-hidden relative">
                <img src={space.image} alt={space.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-indigo-505 uppercase tracking-widest">{space.area}</div>
              </div>
              <div className="p-5 flex flex-col gap-3 flex-grow">
                <h3 className="font-extrabold text-sm text-[#14213d]">{space.title}</h3>
                <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Up to {space.capacity}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>{space.useCases}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ========================================== REAL MOMENTS SECTION ========================================== */}
      <section className="max-w-7xl mx-auto py-24 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <span className="text-indigo-600 font-extrabold text-xs uppercase tracking-wider block mb-2">REAL MOMENTS</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#14213d] font-display">Genuine Memories Beyond the Screens.</h2>
          </div>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 flex items-center gap-1 hover:underline">
            View more on Instagram <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {[
            "https://images.unsplash.com/photo-1529156069898-49953e39b3ac", // moments 1
            "https://images.unsplash.com/photo-1517457373958-b7bdd4587205", // moments 2
            "https://images.unsplash.com/photo-1511578314322-379afb476865", // moments 3
            "https://images.unsplash.com/photo-1542744094-3a31f103e35f", // moments 4
            "https://images.unsplash.com/photo-1522071820081-009f0129c71c", // moments 5
            "https://images.unsplash.com/photo-1506126613408-eca07ce68773", // moments 6
            "https://images.unsplash.com/photo-1545205597-3d9d02c29597"  // moments 7
          ].map((url, idx) => (
            <div key={idx} className="rounded-2xl overflow-hidden aspect-[4/5] bg-white border border-slate-200/85 group hover:scale-[1.02] transition-all shadow-sm">
              <img src={`${url}?auto=format&fit=crop&q=80&w=300`} alt={`Activity Moment ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* ========================================== GATHERING INTERACTIVE QUESTIONNAIRE (WIZARD) ========================================== */}
      <section id="gathering-builder-section" className="max-w-4xl mx-auto py-24 border-t border-slate-200">
        <div className="text-center mb-16">
          <span className="text-indigo-600 font-extrabold text-xs uppercase tracking-widest block mb-3">BUILD YOUR EXPERIENCE</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#14213d] mb-4 font-display">Build My Gathering</h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Answer a few simple questions and we'll immediately formulate a personalized gathering blueprint custom-tailored around your strategic goals.
          </p>
        </div>

        {/* Wizard Panel layout */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-2xl flex flex-col gap-8">
          
          {/* STEP 1: GOAL */}
          <div className={`p-6 rounded-2xl border transition-all ${selections.goal ? "border-emerald-500/30 bg-emerald-50/20" : "border-slate-200 bg-slate-50/50"}`}>
            <div className="flex gap-4 items-center mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${selections.goal ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                1
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Goal</h4>
                <p className="text-xs text-slate-500">What is the main strategic purpose of your event?</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { value: "team-building", label: "Team Building" },
                { value: "leadership", label: "Leadership Retreat" },
                { value: "celebration", label: "Celebration" },
                { value: "wellness", label: "Wellness Retreat" },
                { value: "community", label: "Community Circle" },
                { value: "workation", label: "Remote Workation" }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleOptionToggleSingle("goal", opt.value)}
                  className={`px-4 py-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer focus:outline-none ${selections.goal === opt.value ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-slate-50"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: GROUP SIZE */}
          <div className={`p-6 rounded-2xl border transition-all ${selections.groupSize ? "border-emerald-500/30 bg-emerald-50/20" : "border-slate-200 bg-slate-50/50"}`}>
            <div className="flex gap-4 items-center mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${selections.groupSize ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                2
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Group Size</h4>
                <p className="text-xs text-slate-500">How many attendees are joining this majestic gatherings?</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: "10-20", label: "10 - 20 guests" },
                { value: "20-50", label: "20 - 50 guests" },
                { value: "50-100", label: "50 - 100 guests" },
                { value: "100+", label: "100+ guests" }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleOptionToggleSingle("groupSize", opt.value)}
                  className={`px-4 py-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer focus:outline-none ${selections.groupSize === opt.value ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-slate-50"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: DURATION */}
          <div className={`p-6 rounded-2xl border transition-all ${selections.duration ? "border-emerald-500/30 bg-emerald-50/20" : "border-slate-200 bg-slate-50/50"}`}>
            <div className="flex gap-4 items-center mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${selections.duration ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                3
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Duration</h4>
                <p className="text-xs text-slate-500">What is the planned timeline for the offsite?</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: "day", label: "Single Day Event" },
                { value: "weekend", label: "Weekend Break" },
                { value: "2-3", label: "2 - 3 Full Days" },
                { value: "4+", label: "4+ Luxury Days" }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleOptionToggleSingle("duration", opt.value)}
                  className={`px-4 py-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer focus:outline-none ${selections.duration === opt.value ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-slate-50"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 4: EXPERIENCES */}
          <div className={`p-6 rounded-2xl border transition-all ${selections.experiences.length > 0 ? "border-emerald-500/30 bg-emerald-50/20" : "border-slate-200 bg-slate-50/50"}`}>
            <div className="flex gap-4 items-center mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${selections.experiences.length > 0 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                4
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Experiences (Multi-select)</h4>
                <p className="text-xs text-slate-500">Select any amount of options to weave into your private agenda:</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {[
                { value: "wellness", label: "🧘 Wellness sessions" },
                { value: "adventure", label: "🚣 Extreme Adventures" },
                { value: "team-building", label: "🏆 Facilitated Challenges" },
                { value: "culture", label: "✨ Spiritual Explorations" },
                { value: "community", label: "🌿 Evening Bonfires" },
                { value: "music", label: "🎵 Local Folk Soundscapes" },
                { value: "yoga", label: "🤸 Guided Hikes & Yoga" },
                { value: "trekking", label: "⛰️ Wilderness Trails" }
              ].map(opt => {
                const isSelected = selections.experiences.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleExperiencesToggle(opt.value)}
                    className={`px-4.5 py-2.5 text-xs font-bold rounded-full border transition-all cursor-pointer focus:outline-none flex items-center gap-1.5 ${isSelected ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-slate-50"}`}
                  >
                    {opt.label}
                    {isSelected && <Check className="w-3.5 h-3.5 font-black" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 5: BUDGET */}
          <div className={`p-6 rounded-2xl border transition-all ${selections.budget ? "border-emerald-500/30 bg-emerald-50/20" : "border-slate-200 bg-slate-50/50"}`}>
            <div className="flex gap-4 items-center mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${selections.budget ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                5
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Budget Range</h4>
                <p className="text-xs text-slate-500">Select your ideal budget parameter per company guest:</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: "flexible", label: "Flexible Plan" },
                { value: "25-50k", label: "₹25k - ₹50k per guest" },
                { value: "50-100k", label: "₹50k - ₹1L per guest" },
                { value: "100k+", label: "₹1L+ Luxury Elite" }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleOptionToggleSingle("budget", opt.value)}
                  className={`px-4 py-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer focus:outline-none ${selections.budget === opt.value ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-slate-50"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 6: DATES */}
          <div className={`p-6 rounded-2xl border transition-all ${selections.dates ? "border-emerald-500/30 bg-emerald-50/20" : "border-slate-200 bg-slate-50/50"}`}>
            <div className="flex gap-4 items-center mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${selections.dates ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                6
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Target Dates</h4>
                <p className="text-xs text-slate-500">When is the team planning to check in with UbEx?</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: "next-month", label: "Immediate Next Month" },
                { value: "2-3-months", label: "Within 2 - 3 Months" },
                { value: "flexible", label: "Absolutely Flexible Dates" }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleOptionToggleSingle("dates", opt.value)}
                  className={`px-4 py-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer focus:outline-none ${selections.dates === opt.value ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-slate-50"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleFormSubmit}
            className="w-full mt-4 py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl flex items-center justify-center gap-1.5 transition-all border-0 cursor-pointer"
          >
            Get My Plan <ArrowRight className="w-4.5 h-4.5" />
          </button>

        </div>
      </section>

      {/* ========================================== CALL TO ACTION PRE-FOOTER LIGHT BLUE GRADIENT PANEL ========================================== */}
      <section className="max-w-7xl mx-auto py-16 relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 to-indigo-950 border border-indigo-750 p-8 sm:p-16 flex flex-col items-center text-center shadow-2xl">
        <div className="relative z-10 flex flex-col gap-6 max-w-3xl">
          <span className="text-indigo-200 font-extrabold text-xs tracking-wider uppercase">READY TO PLAN YOUR GATHERING?</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight font-display">Let's Create Something Meaningful Together.</h2>
          <p className="text-sm sm:text-base text-indigo-100 max-w-2xl mx-auto leading-relaxed font-light">
            Whether you're organizing an executive team offsite, startup workation, milestone celebration, or customized healing retreat, we'll curate the ideal rooms, bespoke experiences, dynamic workshop spaces, and dedicated local managers needed to bring it to life flawlessly.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <a href="#gathering-builder-section" className="px-8 py-4 bg-white text-indigo-950 font-extrabold text-sm sm:text-base rounded-2xl shadow-xl transition-all hover:scale-[1.02] hover:bg-indigo-50">
              Build My Gathering
            </a>
            <a href="mailto:gathering@ubex.com?subject=Strategic Retreat Consulting" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base rounded-2xl shadow-md transition-all hover:scale-[1.02] border border-white/10 flex items-center gap-2">
              <span>💬</span> Talk To UbEx
            </a>
          </div>
        </div>
      </section>

      {/* ========================================== TRUST ITEMS SUBSECTION ========================================== */}
      <section className="max-w-7xl mx-auto py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Quick Response", desc: "Our retreat directors typically reply in under 3 hours." },
          { title: "Bespoke Plans", desc: "Every group is highly unique. No pre-cooked itineraries." },
          { title: "On-Ground Trust", desc: "Certified local guides support your journey throughout." },
          { title: "Elite Standard Locations", desc: "Pristine properties featuring executive coworking systems." }
        ].map((item, idx) => (
          <div key={idx} className="p-6 bg-white rounded-2xl border border-slate-200 text-center flex flex-col gap-2 shadow-sm">
            <h4 className="font-extrabold text-sm text-[#14213d]">{item.title}</h4>
            <p className="text-xs text-slate-500">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* ========================================== TESTIMONIALS SECTION ========================================== */}
      <section className="max-w-7xl mx-auto py-24 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
          <div>
            <span className="text-indigo-600 font-extrabold text-xs uppercase tracking-wider block mb-2">STORIES THAT INSPIRE</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#14213d] font-display">What Our Guests Say.</h2>
          </div>
          <a href="#gathering-builder-section" className="text-sm font-bold text-indigo-600 flex items-center gap-1 hover:underline">
            Create Your Story Today <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-6 hover:border-indigo-300 transition-all flex flex-col gap-6 shadow-sm">
              
              {/* Header profile */}
              <div className="flex gap-4 items-center">
                <img src={t.avatar} alt={t.author} className="w-14 h-14 rounded-full object-cover border border-slate-200 shadow-sm" />
                <div>
                  <h4 className="font-extrabold text-sm text-[#14213d]">{t.author}</h4>
                  <p className="text-[11px] text-indigo-600 font-bold">{t.role}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{t.type} • {t.location}</p>
                </div>
              </div>

              {/* Challenge - Experience - Outcome structure */}
              <div className="flex flex-col gap-4 flex-grow py-4 border-t border-slate-250">
                <div>
                  <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest block mb-1">Challenge</span>
                  <p className="text-xs text-slate-600 leading-relaxed italic">"{t.challenge}"</p>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest block mb-1">Experience</span>
                  <p className="text-xs text-slate-600 leading-relaxed italic">"{t.experience}"</p>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest block mb-1">Outcome</span>
                  <p className="text-xs text-slate-800 leading-relaxed font-semibold italic">"{t.outcome}"</p>
                </div>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* ========================================== VIDEO PREVIEW MODAL ========================================== */}
      <AnimatePresence>
        {videoModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVideoModalOpen(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-200 z-10"
            >
              <button 
                onClick={() => setVideoModalOpen(false)}
                className="absolute top-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full border-0 transition-all z-20 focus:outline-none cursor-pointer shadow-md"
              >
                <X className="w-5 h-5" />
              </button>
              <video src={activeVideoUrl} controls autoPlay className="w-full h-full object-contain" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== SPACES DETAILS DRAWER ========================================== */}
      <AnimatePresence>
        {spaceDrawerOpen && (
          <div className="fixed inset-0 z-[99999] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSpaceDrawerOpen(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="relative w-full max-w-lg h-full bg-white border-l border-slate-200 shadow-2xl p-6 sm:p-10 overflow-y-auto z-10 flex flex-col gap-8 text-slate-800"
            >
              <button 
                onClick={() => setSpaceDrawerOpen(false)}
                className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-500 hover:text-slate-800 rounded-full border border-slate-200 focus:outline-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col gap-6">
                <img src={SPACES_DATA[selectedSpaceKey].image} alt={SPACES_DATA[selectedSpaceKey].title} className="w-full h-56 object-cover rounded-2xl border border-slate-200 shadow-sm" />
                
                <div>
                  <span className="text-indigo-600 font-extrabold text-[10px] tracking-widest uppercase bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">{SPACES_DATA[selectedSpaceKey].area}</span>
                  <h3 className="text-2xl font-extrabold text-[#14213d] mt-3">{SPACES_DATA[selectedSpaceKey].title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{SPACES_DATA[selectedSpaceKey].useCases}</p>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed">{SPACES_DATA[selectedSpaceKey].description}</p>
              </div>

              {/* Space detailed metrics list */}
              <div className="flex flex-col gap-6 border-t border-slate-200 pt-6">
                <div>
                  <h4 className="text-xs font-bold text-[#14213d] uppercase tracking-wide mb-3">Space Details</h4>
                  <ul className="grid grid-cols-2 gap-2.5">
                    {SPACES_DATA[selectedSpaceKey].details.map((dItem, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                        <span className="w-1 h-1 bg-indigo-600 rounded-full" /> {dItem}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#14213d] uppercase tracking-wide mb-3">Perfect For</h4>
                  <ul className="flex flex-wrap gap-2">
                    {SPACES_DATA[selectedSpaceKey].perfectFor.map((pItem, idx) => (
                      <li key={idx} className="bg-indigo-50 px-2.5 py-1 text-[10px] text-indigo-700 rounded-lg border border-indigo-100/60 font-semibold">
                        {pItem}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#14213d] uppercase tracking-wide mb-3">Premium Features</h4>
                  <ul className="flex flex-col gap-2">
                    {SPACES_DATA[selectedSpaceKey].features.map((fItem, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{fItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-3">UbEx Custom Curated Experience</h4>
                  <ul className="flex flex-col gap-2">
                    {SPACES_DATA[selectedSpaceKey].curated.map((cItem, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{cItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== SUCCESS CONFIRMATION WIZARD MODAL ========================================== */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center text-center gap-6 z-10 text-slate-800"
            >
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full border border-slate-200 focus:outline-none cursor-pointer bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 font-black" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#14213d]">Great. Let's Build Something Memorable!</h3>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  Your customized questionnaire response has been verified. Our corporate gathering director is compiling curated stays, custom spaces, private dmc travel options, and premium activities matching your preferences.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 w-full mt-4">
                <a href="mailto:gathering@ubex.com?subject=Strategic Business Gathering Pitch" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md text-center">
                  Consult With Our Director
                </a>
                <button 
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition-all focus:outline-none cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
}
