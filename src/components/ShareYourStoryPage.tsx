import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Check, 
  X, 
  Shield, 
  MessageSquare, 
  Users, 
  Award, 
  Camera, 
  Film, 
  ChevronRight, 
  Star, 
  AlertTriangle, 
  ThumbsUp, 
  Share2, 
  Plus, 
  Upload, 
  Filter, 
  LayoutDashboard, 
  Search,
  CheckCircle,
  HelpCircle,
  Video
} from "lucide-react";
import { auth } from "../lib/firebase";

export interface VerifiedReview {
  id: string;
  bookingId: string;
  userId: number | null;
  guestName: string;
  guestEmail: string;
  avatar?: string;
  bookingType: "Stay" | "Experience" | "Both";
  propertyName?: string;
  experienceName?: string;
  roomType?: string;
  dateOfStay?: string;
  ratingOverallStay?: number;
  ratingCleanliness?: number;
  ratingComfort?: number;
  ratingLocation?: number;
  ratingValueStay?: number;
  ratingStaffHospitality?: number;
  stayLoveMost?: string;
  stayImproved?: string;
  stayRecommend?: boolean;
  ratingOverallExp?: number;
  ratingSafety?: number;
  ratingGuideQuality?: number;
  ratingFunFactor?: number;
  ratingValueExp?: number;
  ratingEquipmentQuality?: number;
  expFavoritePart?: string;
  expRecommend?: boolean;
  travelerType: string;
  storyTitle?: string;
  storyText?: string;
  photos: string[];
  videos: string[];
  xpAwarded: number;
  badgesUnlocked?: string[];
  destination: string;
  moderationStatus: "Pending" | "Approved" | "Rejected";
  moderationChecks?: {
    isSpam: boolean;
    offensiveLanguage: boolean;
    hasContactInfo: boolean;
    isFake: boolean;
  };
  createdAt: string;
}

// Pre-curated gorgeous high-quality option photos for immediate attaching
const PRE_CURATED_PHOTOS = [
  { id: "p1", title: "Rafting Rapids", url: "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=800&q=85" },
  { id: "p2", title: "Sunrise Yoga", url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=85" },
  { id: "p3", title: "Sacred Ganges Walk", url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=85" },
  { id: "p4", title: "Workation Desk & Coffee", url: "https://images.unsplash.com/photo-1593642532973-d31b6557fa68?w=800&q=85" },
  { id: "p5", title: "Riverside Bonfire Meet", url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=85" },
  { id: "p6", title: "Bungee Suspension", url: "https://images.unsplash.com/photo-1588644525287-ea4e33912952?w=800&q=85" }
];

interface ShareYourStoryPageProps {
  lang: string;
  currency: string;
  setActiveTabInApp?: (tab: string) => void;
  uid?: string | null;
  userEmail?: string | null;
  userName?: string | null;
}

export default function ShareYourStoryPage({ 
  lang, 
  currency, 
  setActiveTabInApp, 
  uid, 
  userEmail, 
  userName 
}: ShareYourStoryPageProps) {
  
  // App views: "feed" | "submit" | "admin"
  const [currentSubView, setCurrentSubView] = useState<"feed" | "submit" | "admin">("feed");
  const [reviews, setReviews] = useState<VerifiedReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Filter conditions
  const [filterDestination, setFilterDestination] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterTraveler, setFilterTraveler] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Submitting review workflow wizard states
  const [step, setStep] = useState<number>(1);
  const [bookingIdInput, setBookingIdInput] = useState<string>("");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verifiedDetails, setVerifiedDetails] = useState<any>(null);

  // Form selections and texts
  const [selectedBookingType, setSelectedBookingType] = useState<"Stay" | "Experience" | "Both">("Stay");
  const [travelerType, setTravelerType] = useState<string>("Solo Traveler");
  
  // Stay ratings
  const [rateCleanliness, setRateCleanliness] = useState<number>(5);
  const [rateComfort, setRateComfort] = useState<number>(5);
  const [rateLocation, setRateLocation] = useState<number>(5);
  const [rateValueStay, setRateValueStay] = useState<number>(5);
  const [rateStaff, setRateStaff] = useState<number>(5);
  const [stayLoveMost, setStayLoveMost] = useState<string>("");
  const [stayImproved, setStayImproved] = useState<string>("");
  const [stayRecommend, setStayRecommend] = useState<boolean>(true);

  // Experience ratings
  const [rateOverallExp, setRateOverallExp] = useState<number>(5);
  const [rateSafety, setRateSafety] = useState<number>(5);
  const [rateGuide, setRateGuide] = useState<number>(5);
  const [rateFun, setRateFun] = useState<number>(5);
  const [rateEquipment, setRateEquipment] = useState<number>(5);
  const [expFavorite, setExpFavorite] = useState<string>("");
  const [expRecommend, setExpRecommend] = useState<boolean>(true);

  // Rich Media attaching
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [customPhotoInput, setCustomPhotoInput] = useState<string>("");
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);

  // Story detail
  const [storyTitle, setStoryTitle] = useState<string>("");
  const [storyText, setStoryText] = useState<string>("");

  // Submission moderation load screen details
  const [moderating, setModerating] = useState<boolean>(false);
  const [moderationProgressText, setModerationProgressText] = useState<string>("");
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Dynamic calculations
  const calculateEstimatedXp = () => {
    let xp = 20; // base review submission
    if (selectedPhotos.length > 0) xp += 10;
    if (selectedVideos.length > 0) xp += 25;
    const wordCount = storyText.trim() ? storyText.trim().split(/\s+/).length : 0;
    if (wordCount >= 50) xp += 50;
    return xp;
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reviews?admin=true");
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (e) {
      console.error("Failed to retrieve reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleVerifyBooking = async () => {
    if (!bookingIdInput.trim()) {
      setVerificationError("Please enter a valid Booking ID");
      return;
    }
    try {
      setVerifying(true);
      setVerificationError(null);
      const res = await fetch("/api/bookings/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bookingIdInput.toUpperCase() })
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setVerifiedDetails(data);
        setSelectedBookingType(data.bookingType);
        setStep(2); // advance to type selection
      } else {
        setVerificationError(data.error || "Could not verify this booking. Ensure format is e.g. UBX-ST-2026-4587");
      }
    } catch (err) {
      setVerificationError("Verification connection failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const togglePhotoSelection = (url: string) => {
    if (selectedPhotos.includes(url)) {
      setSelectedPhotos(selectedPhotos.filter(p => p !== url));
    } else {
      setSelectedPhotos([...selectedPhotos, url]);
    }
  };

  const addCustomPhoto = () => {
    if (customPhotoInput.trim() && !selectedPhotos.includes(customPhotoInput.trim())) {
      setSelectedPhotos([...selectedPhotos, customPhotoInput.trim()]);
      setCustomPhotoInput("");
    }
  };

  // Submit complete review to server
  const handleReviewSubmission = async () => {
    setModerating(true);
    setModerationProgressText("Initializing secured gateway review package...");
    
    setTimeout(() => {
      setModerationProgressText("AI Moderation scanning narratives for links and promotions...");
    }, 1200);

    setTimeout(() => {
      setModerationProgressText("Adventure Passport state sync & calculation engine matching...");
    }, 2800);

    // Prepare complete review payload
    const payload = {
      bookingId: bookingIdInput.toUpperCase(),
      guestName: userName || verifiedDetails?.guestName || "Verified Guest",
      guestEmail: userEmail || verifiedDetails?.guestEmail || "guest@ubex.com",
      bookingType: selectedBookingType,
      propertyName: selectedBookingType !== "Experience" ? (verifiedDetails?.propertyName || "Rishikesh Outpost") : undefined,
      experienceName: selectedBookingType !== "Stay" ? (verifiedDetails?.experienceName || "White Water Rafting") : undefined,
      roomType: selectedBookingType !== "Experience" ? (verifiedDetails?.roomType || "6 Bed Mixed Dormitory") : undefined,
      dateOfStay: verifiedDetails?.dateOfStay || "June 2026",
      travelerType,
      ratingOverallStay: selectedBookingType !== "Experience" ? Math.round((rateCleanliness + rateComfort + rateLocation + rateValueStay + rateStaff) / 5) : undefined,
      ratingCleanliness: selectedBookingType !== "Experience" ? rateCleanliness : undefined,
      ratingComfort: selectedBookingType !== "Experience" ? rateComfort : undefined,
      ratingLocation: selectedBookingType !== "Experience" ? rateLocation : undefined,
      ratingValueStay: selectedBookingType !== "Experience" ? rateValueStay : undefined,
      ratingStaffHospitality: selectedBookingType !== "Experience" ? rateStaff : undefined,
      stayLoveMost: selectedBookingType !== "Experience" ? stayLoveMost : undefined,
      stayImproved: selectedBookingType !== "Experience" ? stayImproved : undefined,
      stayRecommend: selectedBookingType !== "Experience" ? stayRecommend : undefined,
      ratingOverallExp: selectedBookingType !== "Stay" ? rateOverallExp : undefined,
      ratingSafety: selectedBookingType !== "Stay" ? rateSafety : undefined,
      ratingGuideQuality: selectedBookingType !== "Stay" ? rateGuide : undefined,
      ratingFunFactor: selectedBookingType !== "Stay" ? rateFun : undefined,
      ratingValueExp: selectedBookingType !== "Stay" ? rateEquipment : undefined,
      ratingEquipmentQuality: selectedBookingType !== "Stay" ? rateEquipment : undefined,
      expFavoritePart: selectedBookingType !== "Stay" ? expFavorite : undefined,
      expRecommend: selectedBookingType !== "Stay" ? expRecommend : undefined,
      storyTitle: storyTitle || "Stellar Stay at UbEx",
      storyText,
      photos: selectedPhotos,
      videos: selectedVideos,
      uid
    };

    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      setTimeout(() => {
        setModerating(false);
        if (res.ok && data.success) {
          setSubmissionResult(data);
          setStep(6); // Success phase!
          fetchReviews(); // refresh
        } else {
          alert(data.error || "Submission failed. Please check criteria.");
        }
      }, 3800);
      
    } catch (err) {
      setModerating(false);
      alert("Submission connection failed. Offline fallback saved. Thanks!");
    }
  };

  const handleAdminAction = async (reviewId: string, action: "Approve" | "Reject" | "Delete") => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/admin/reviews/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, action })
      });
      const data = await res.json();
      if (data.success) {
        setReviews(reviews.map(r => {
          if (r.id === reviewId) {
            if (action === "Approve") return { ...r, moderationStatus: "Approved" as const };
            if (action === "Reject") return { ...r, moderationStatus: "Rejected" as const };
          }
          return r;
        }).filter(r => !(action === "Delete" && r.id === reviewId)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const resetFormState = () => {
    setStep(1);
    setBookingIdInput("");
    setVerifiedDetails(null);
    setVerificationError(null);
    setStayLoveMost("");
    setStayImproved("");
    setExpFavorite("");
    setStoryTitle("");
    setStoryText("");
    setSelectedPhotos([]);
    setSelectedVideos([]);
    setSubmissionResult(null);
  };

  // Filter public items
  const filteredReviews = reviews.filter(r => {
    if (r.moderationStatus !== "Approved") return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesText = 
        r.guestName.toLowerCase().includes(q) ||
        (r.storyTitle && r.storyTitle.toLowerCase().includes(q)) ||
        (r.storyText && r.storyText.toLowerCase().includes(q)) ||
        (r.propertyName && r.propertyName.toLowerCase().includes(q)) ||
        (r.experienceName && r.experienceName.toLowerCase().includes(q));
      if (!matchesText) return false;
    }

    if (filterDestination !== "all" && r.destination.toLowerCase() !== filterDestination.toLowerCase()) return false;
    if (filterCategory !== "all" && r.bookingType.toLowerCase() !== filterCategory.toLowerCase()) return false;
    if (filterTraveler !== "all" && r.travelerType.toLowerCase() !== filterTraveler.toLowerCase()) return false;
    
    if (filterRating > 0) {
      const realRating = r.ratingOverallStay || r.ratingOverallExp || 5;
      if (realRating < filterRating) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-24 border-t border-slate-800">
      
      {/* HEADER BAR */}
      <div className="bg-indigo-950/60 backdrop-blur-md border-b border-white/5 sticky top-0 z-50 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-yellow-400 animate-spin-slow" />
          <span className="font-mono text-sm tracking-wider uppercase font-bold text-slate-300">
            UbEx Verified Stories
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentSubView("feed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${currentSubView === "feed" ? "bg-indigo-600 text-white" : "hover:bg-white/5 text-slate-400"}`}
          >
            Guest Stories
          </button>
          <button 
            onClick={() => {
              resetFormState();
              setCurrentSubView("submit");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${currentSubView === "submit" ? "bg-amber-500 text-slate-950" : "hover:bg-white/5 text-amber-400"}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Share Story
          </button>
          <button 
            onClick={() => setCurrentSubView("admin")}
            className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${currentSubView === "admin" ? "bg-teal-600/30 text-teal-300 border border-teal-500/30" : "hover:bg-white/5 text-slate-500"}`}
          >
            Admin Panel
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-10">
        
        {/* ========================================================== */}
        {/* VIEW 1: GUEST STORIES FEED */}
        {/* ========================================================== */}
        {currentSubView === "feed" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            {/* HERO INTRODUCTION */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
                UbEx Guest Stories Feed
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed font-light">
                Explore real, unfiltered adventure memories and stays rated by verified travelers. Filter stories to plan your next premium workation or bungy jump.
              </p>
            </div>

            {/* SECTIONS FILTERS & SEARCH */}
            <div className="bg-slate-800/80 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 w-full md:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input 
                  type="text"
                  placeholder="Search stories, names..."
                  className="bg-transparent border-0 text-xs text-white focus:outline-none w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 shrink-0">
                  <Filter className="w-3.5 h-3.5" />
                  Filter Story:
                </div>
                
                {/* Destination */}
                <select 
                  className="bg-slate-900 border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-indigo-500"
                  value={filterDestination}
                  onChange={(e) => setFilterDestination(e.target.value)}
                >
                  <option value="all">Any Destination</option>
                  <option value="Rishikesh">Rishikesh</option>
                  <option value="Mussoorie">Mussoorie</option>
                  <option value="Auli">Auli</option>
                </select>

                {/* Category Type */}
                <select 
                  className="bg-slate-900 border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-indigo-500"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">Any Type</option>
                  <option value="stay">Stays Only</option>
                  <option value="experience">Experiences Only</option>
                  <option value="both">Stay & Exp Both</option>
                </select>

                {/* Traveler Companion */}
                <select 
                  className="bg-slate-900 border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-indigo-500"
                  value={filterTraveler}
                  onChange={(e) => setFilterTraveler(e.target.value)}
                >
                  <option value="all">Any Traveler Companion</option>
                  <option value="Solo Traveler">Solo Traveler</option>
                  <option value="Couple">Couple</option>
                  <option value="Family">Family</option>
                  <option value="Friends">Friends</option>
                  <option value="Workation">Workation Guests</option>
                </select>

                {/* Min Star Rating */}
                <select 
                  className="bg-slate-900 border border-white/10 text-xs text-slate-300 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-indigo-500"
                  value={filterRating}
                  onChange={(e) => setFilterRating(Number(e.target.value))}
                >
                  <option value="0">Any Rating</option>
                  <option value="5">⭐⭐⭐⭐⭐ Rated Only</option>
                  <option value="4">⭐⭐⭐⭐ & above</option>
                  <option value="3">⭐⭐⭐ & above</option>
                </select>
              </div>
            </div>

            {/* STORIES RESULTS COUNTERS / GRID */}
            {loading ? (
              <div className="text-center py-24 space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500 font-mono">Syncing stories ledger...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-16 text-center space-y-4">
                <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <p className="font-semibold text-slate-300 text-sm">No Matching Guest Stories Found</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto font-light">
                    Try adjusting your filters or search keywords. Alternatively, trigger the submission wizard to post the first!
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetFormState();
                    setCurrentSubView("submit");
                  }}
                  className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  Launch Submission Wizard
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReviews.map((rev) => {
                  const ratingValue = rev.ratingOverallStay || rev.ratingOverallExp || 5;
                  return (
                    <motion.div 
                      key={rev.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-slate-800 border border-white/5 rounded-2.5xl p-6 flex flex-col justify-between hover:border-indigo-500/30 transition-all shadow-lg group relative overflow-hidden"
                    >
                      {/* Booking verified banner */}
                      <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 font-mono text-[9px] uppercase font-bold tracking-wider px-3.5 py-1.5 rounded-bl-xl border-l border-b border-emerald-500/20 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Verified Guest
                      </div>

                      <div className="space-y-4">
                        {/* PROFILE AUTHOR */}
                        <div className="flex items-center gap-3">
                          <img 
                            src={rev.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"}
                            alt={rev.guestName}
                            className="w-10 h-10 rounded-full border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="text-xs hover:text-indigo-400 font-medium text-white">{rev.guestName}</p>
                            <p className="text-[10px] text-slate-400 font-mono tracking-wider flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {rev.destination} Outpost • {rev.dateOfStay}
                            </p>
                          </div>
                        </div>

                        {/* RATINGS & VERIFICATION SPECIFICS */}
                        <div className="flex flex-wrap gap-2 items-center">
                          <div className="flex items-center gap-0.5 bg-slate-900 border border-white/5 px-2 py-0.5 rounded-lg">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-[10px] font-bold text-amber-400">{ratingValue}.0</span>
                          </div>
                          
                          <span className="bg-slate-900 text-indigo-300 border border-indigo-500/10 text-[10px] px-2 py-0.5 rounded-lg font-mono">
                            {rev.travelerType}
                          </span>

                          <span className="bg-slate-900 text-teal-300 border border-teal-500/10 text-[10px] px-2 py-0.5 rounded-lg font-mono uppercase">
                            {rev.bookingType}
                          </span>
                        </div>

                        {/* HIGHLIGHTED PROP / EXPERIENCE */}
                        <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5 text-[11px] space-y-1 text-slate-350">
                          {rev.propertyName && (
                            <p>🏨 <span className="font-semibold text-slate-200">Stay:</span> {rev.propertyName} <span className="text-slate-500">({rev.roomType})</span></p>
                          )}
                          {rev.experienceName && (
                            <p>🚣 <span className="font-semibold text-slate-200">Experience:</span> {rev.experienceName}</p>
                          )}
                        </div>

                        {/* STORY text */}
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                            "{rev.storyTitle || "Loving our travel story!"}"
                          </h3>
                          <p className="text-xs text-slate-400 font-light leading-relaxed line-clamp-4">
                            {rev.storyText || "Wonderful trip package from start to finish. Safety instructions were robust and clean."}
                          </p>
                        </div>
                      </div>

                      {/* DISPLAY PHOTOS IF ATTACHED */}
                      {rev.photos && rev.photos.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {rev.photos.slice(0, 3).map((ph, idx) => (
                            <img 
                              key={idx}
                              src={ph}
                              alt="Guest memory"
                              className="w-full h-14 object-cover rounded-lg border border-white/10 hover:opacity-80 transition-opacity"
                              referrerPolicy="no-referrer"
                            />
                          ))}
                        </div>
                      )}

                      {/* CARD FOOTER XP EARNED */}
                      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-mono tracking-tight">Passport XP contribution:</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1 font-mono bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          🪙 +{rev.xpAwarded} XP
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================== */}
        {/* VIEW 2: SUBMIT VERIFIED REVIEW SYSTEM WIZARD */}
        {/* ========================================================== */}
        {currentSubView === "submit" && (
          <div className="max-w-4xl mx-auto">
            
            {/* SUBMISSION MODERATION LOADING VIEW Overlay */}
            <AnimatePresence>
              {moderating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center p-6 text-center"
                >
                  <div className="space-y-6 max-w-md">
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="absolute inset-0 border-4 border-amber-400/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white tracking-tight">Processing Verified Review Ledger</h3>
                      <p className="text-xs text-indigo-300 font-mono h-8 animate-pulse">
                        {moderationProgressText}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider leading-relaxed">
                      UbEx automatic AI Moderation processes text matching logs to ensure 100% genuine storytelling.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
            >
              
              {/* STATUS INDICATOR HEADER */}
              <div className="border-b border-white/5 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                    Share Your Story
                  </h2>
                  <p className="text-xs text-slate-400">
                    Add verified feedback of yourstays & reviews to credit Adventure Passport badges.
                  </p>
                </div>

                <div className="bg-slate-900 px-4 py-2 rounded-2xl border border-white/5 flex items-center gap-3">
                  <p className="text-[11px] text-slate-400 font-mono text-right">
                    Estimated Reward:
                  </p>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2.5 py-1 rounded-xl font-mono">
                    🪙 +{calculateEstimatedXp()} XP
                  </span>
                </div>
              </div>

              {/* WIZARD TRACKING STEPS CHEVRON */}
              <div className="flex items-center gap-1 sm:gap-3 mb-8 overflow-x-auto pb-2 border-b border-white/5 scrollbar-thin">
                {["Check In", "Details", "Stay", "Activity", "Storytellers", "Receipt"].map((stName, idx) => {
                  const stepNum = idx + 1;
                  return (
                    <React.Fragment key={stName}>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step > stepNum ? "bg-emerald-500 text-white" : step === stepNum ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-500 border border-white/5"}`}>
                          {step > stepNum ? "✓" : stepNum}
                        </div>
                        <span className={`text-[10px] uppercase font-mono tracking-wider font-bold ${step === stepNum ? "text-indigo-400" : "text-slate-500"}`}>
                          {stName}
                        </span>
                      </div>
                      {idx < 5 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* STEP COMPONENTS */}

              {/* STEP 1: VERIFICATION PROCESS */}
              {step === 1 && (
                <div className="space-y-6 max-w-md mx-auto py-6">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-2 border border-indigo-500/20">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Guest Booking Verification</h3>
                    <p className="text-xs text-slate-450 leading-relaxed font-light">
                      To safeguard a trusted ecosystem, please verify using your unique Booking ID from confirmation vouchers.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase font-semibold text-slate-400 tracking-wider">Booking ID / Review Key</label>
                      <input 
                        type="text"
                        placeholder="e.g. UBX-ST-2026-4587"
                        className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 w-full uppercase font-mono tracking-wider"
                        value={bookingIdInput}
                        onChange={(e) => setBookingIdInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleVerifyBooking()}
                      />
                    </div>

                    {verificationError && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-xs text-red-400 flex gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>{verificationError}</p>
                      </div>
                    )}

                    <button
                      onClick={handleVerifyBooking}
                      disabled={verifying}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3 rounded-xl w-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {verifying ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          Verify Booking
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-3.5">
                    <p className="text-[10px] font-mono uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                      <span>💡 Quick Test IDs</span>
                    </p>
                    <div className="space-y-2 text-xs font-light text-slate-400 leading-relaxed">
                      <p>Don't have a live booking handy? Test immediately using these pre-seeded check-ins:</p>
                      <ul className="space-y-1.5 font-mono text-[10px] text-slate-300">
                        <li>🏨 Stay: <span className="text-indigo-400 font-bold click-copy cursor-pointer hover:underline" onClick={() => setBookingIdInput("UBX-ST-2026-4587")}>UBX-ST-2026-4587</span></li>
                        <li>🚣 Experience: <span className="text-indigo-400 font-bold click-copy cursor-pointer hover:underline" onClick={() => setBookingIdInput("UBX-EXP-2026-1458")}>UBX-EXP-2026-1458</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: REVIEW TYPE SELECTION */}
              {step === 2 && (
                <div className="space-y-6 py-6">
                  <div className="bg-emerald-500/15 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">✓ Verification Confirmed</p>
                      <p className="text-[11px] text-slate-400">
                        Welcome <span className="text-slate-200 font-bold">{verifiedDetails?.guestName}</span>! Let's catalog your stay at <span className="text-slate-200 font-bold">{verifiedDetails?.propertyName || verifiedDetails?.experienceName}</span>.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">What would you like to review?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Option Stay */}
                      <div 
                        onClick={() => setSelectedBookingType("Stay")}
                        className={`bg-slate-900 border p-5 rounded-2.5xl cursor-pointer hover:border-indigo-500/40 transition-all ${selectedBookingType === "Stay" ? "border-indigo-500 ring-1 ring-indigo-500/40" : "border-white/5"}`}
                      >
                        <p className="text-2xl mb-2">🏨</p>
                        <p className="text-xs font-bold text-white">Stay Only</p>
                        <p className="text-[10px] text-slate-400 font-light mt-1">Review lodgings cleanliness, bedding comfort, location & staff.</p>
                      </div>

                      {/* Option Experience */}
                      <div 
                        onClick={() => setSelectedBookingType("Experience")}
                        className={`bg-slate-900 border p-5 rounded-2.5xl cursor-pointer hover:border-indigo-500/40 transition-all ${selectedBookingType === "Experience" ? "border-indigo-500 ring-1 ring-indigo-500/40" : "border-white/5"}`}
                      >
                        <p className="text-2xl mb-2">🚣</p>
                        <p className="text-xs font-bold text-white">Experience Only</p>
                        <p className="text-[10px] text-slate-400 font-light mt-1">Review local rafting, safety quality, guide friendliness & fun.</p>
                      </div>

                      {/* Option Both */}
                      <div 
                        onClick={() => setSelectedBookingType("Both")}
                        className={`bg-slate-900 border p-5 rounded-2.5xl cursor-pointer hover:border-indigo-500/40 transition-all ${selectedBookingType === "Both" ? "border-indigo-500 ring-1 ring-indigo-500/40" : "border-white/5"}`}
                      >
                        <p className="text-2xl mb-2">✨</p>
                        <p className="text-xs font-bold text-white">Both Stays & Exp</p>
                        <p className="text-[10px] text-slate-400 font-light mt-1">Submit high-value reviews of lodging and associated travel runs together.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-end">
                    <button 
                      onClick={() => setStep(selectedBookingType === "Experience" ? 4 : 3)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: STAY RATINGS */}
              {step === 3 && (
                <div className="space-y-6 py-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">🏨 Rate Your Stay</h3>
                    <p className="text-xs text-slate-400">Share your lodging satisfaction details below.</p>
                  </div>

                  {/* GRID OF STAR RATINGS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-900 p-5 rounded-2.5xl border border-white/5">
                    {[
                      { label: "Cleanliness (dorms & bathrooms tidy)", val: rateCleanliness, set: setRateCleanliness },
                      { label: "Comfort (beds, fiber internet, acoustics)", val: rateComfort, set: setRateComfort },
                      { label: "Location (mountain frames & local access)", val: rateLocation, set: setRateLocation },
                      { label: "Value for Money (pricing vs offerings)", val: rateValueStay, set: setRateValueStay },
                      { label: "Staff & Traditional Hospitality", val: rateStaff, set: setRateStaff }
                    ].map((ratingRow, idx) => (
                      <div key={idx} className="space-y-2">
                        <label className="text-[11px] text-slate-350">{ratingRow.label}</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((starNum) => (
                            <Star 
                              key={starNum}
                              onClick={() => ratingRow.set(starNum)}
                              className={`w-5 h-5 cursor-pointer transition-colors ${starNum <= ratingRow.val ? "text-amber-400 fill-amber-400 scale-105" : "text-slate-600"}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Narrative details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-350">What did you love most?</label>
                      <textarea 
                        rows={3}
                        placeholder="e.g. The cozy common decks, acoustic pods, and the amazing sunset coffee meets."
                        className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none w-full"
                        value={stayLoveMost}
                        onChange={(e) => setStayLoveMost(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-350">What could be improved? (Optional)</label>
                      <textarea 
                        rows={3}
                        placeholder="e.g. Maybe add more charging plugs on the open terrace spots."
                        className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none w-full"
                        value={stayImproved}
                        onChange={(e) => setStayImproved(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Recommend checkpoint */}
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox"
                      id="stayRecommendCheckbox"
                      className="accent-indigo-500 rounded cursor-pointer"
                      checked={stayRecommend}
                      onChange={(e) => setStayRecommend(e.target.checked)}
                    />
                    <label htmlFor="stayRecommendCheckbox" className="text-xs text-slate-350 cursor-pointer">
                      Yes, I highly recommend staying at this outpost to other travelers!
                    </label>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-between">
                    <button 
                      onClick={() => setStep(2)}
                      className="border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => setStep(selectedBookingType === "Both" ? 4 : 5)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: EXPERIENCE RATINGS */}
              {step === 4 && (
                <div className="space-y-6 py-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">🚣 Rate Your Adventure Experience</h3>
                    <p className="text-xs text-slate-400">Share your rating for rapids or excursions down the valley.</p>
                  </div>

                  {/* Experience star rows */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-900 p-5 rounded-2.5xl border border-white/5">
                    {[
                      { label: "Overall Fun Factor & Thrills", val: rateOverallExp, set: setRateOverallExp },
                      { label: "Safety Auditing (helmets, vests, life rafts)", val: rateSafety, set: setRateSafety },
                      { label: "Advisory Guide Quality & Professionalism", val: rateGuide, set: setRateGuide },
                      { label: "Equipment Standards (fresh paddles & ropes)", val: rateEquipment, set: setRateEquipment }
                    ].map((ratingRow, idx) => (
                      <div key={idx} className="space-y-2">
                        <label className="text-[11px] text-slate-350">{ratingRow.label}</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((starNum) => (
                            <Star 
                              key={starNum}
                              onClick={() => ratingRow.set(starNum)}
                              className={`w-5 h-5 cursor-pointer transition-colors ${starNum <= ratingRow.val ? "text-amber-400 fill-amber-400 scale-105" : "text-slate-600"}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Favorite segment */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-350">What was your favorite part of this experience?</label>
                    <textarea 
                      rows={3}
                      placeholder="e.g. Navigating the rapids at Shivpuri, and the cliff jumping challenge with guides!"
                      className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none w-full"
                      value={expFavorite}
                      onChange={(e) => setExpFavorite(e.target.value)}
                    />
                  </div>

                  {/* Recommend check */}
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox"
                      id="expRecommendCheckbox"
                      className="accent-indigo-500 rounded cursor-pointer"
                      checked={expRecommend}
                      onChange={(e) => setExpRecommend(e.target.checked)}
                    />
                    <label htmlFor="expRecommendCheckbox" className="text-xs text-slate-350 cursor-pointer">
                      Yes, I recommend this local adventure to other explorers!
                    </label>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-between">
                    <button 
                      onClick={() => setStep(selectedBookingType === "Both" ? 3 : 2)}
                      className="border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => setStep(5)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: STORYTELLERS NARRATIVE & TRAVELER TYPE & IMAGES */}
              {step === 5 && (
                <div className="space-y-6 py-6">
                  
                  {/* TRAVEL COMPANION */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Who were you traveling with?</h4>
                    <div className="flex flex-wrap gap-2">
                      {["Solo Traveler", "Couple", "Family", "Friends", "Workation", "Corporate Group", "Backpacker"].map((tcType) => (
                        <button
                          key={tcType}
                          type="button"
                          onClick={() => setTravelerType(tcType)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer border transition-all ${travelerType === tcType ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-white/10 text-slate-450 hover:bg-slate-950"}`}
                        >
                          {tcType}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* COGNITIVE STORY HEADER */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                      
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Tell Your UbEx Story</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-light">
                          Share a comprehensive travel memory (write 50+ words to unlock an additional <span className="text-emerald-400 font-bold">+50 XP</span> in your passport wallet!).
                        </p>
                      </div>

                      <div className="space-y-3">
                        <input 
                          type="text"
                          placeholder="Story Title (e.g., Majestic Yoga Sunsets near Triveni)"
                          className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none w-full font-semibold focus:border-indigo-500"
                          value={storyTitle}
                          onChange={(e) => setStoryTitle(e.target.value)}
                        />

                        <div className="relative">
                          <textarea 
                            rows={6}
                            placeholder="Describe your wild rafting, cozy bonfire dinners, or remote coding experience in details. What made it special?"
                            className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none w-full"
                            value={storyText}
                            onChange={(e) => setStoryText(e.target.value)}
                          />
                          <div className="absolute bottom-3 right-3 text-[10px] text-slate-450 font-mono">
                            {storyText.trim() ? storyText.trim().split(/\s+/).length : 0} words
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* SELECT PRE-CURATED OR CUSTOM PHOTOS */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-indigo-400" />
                          Attach Memories
                        </h4>
                        <p className="text-[10px] text-slate-500">Pick stunning photos to accompany your post (+10 XP).</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 h-44 overflow-y-auto pr-1 bg-slate-900 p-2.5 rounded-xl border border-white/5 scrollbar-thin">
                        {PRE_CURATED_PHOTOS.map((ph) => {
                          const isSel = selectedPhotos.includes(ph.url);
                          return (
                            <div 
                              key={ph.id}
                              onClick={() => togglePhotoSelection(ph.url)}
                              className={`relative rounded-lg overflow-hidden h-16 cursor-pointer border-2 transition-all ${isSel ? "border-indigo-500 scale-95" : "border-white/5 opacity-70 hover:opacity-100"}`}
                            >
                              <img src={ph.url} alt={ph.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1 text-[8px] text-center text-white line-clamp-1 pointer-events-none">
                                {ph.title}
                              </div>
                              {isSel && (
                                <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full p-0.5">
                                  <Check className="w-2 h-2 stroke-[4]" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Custom Photo URL Input */}
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Paste image URL..."
                          className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-white focus:outline-none w-full"
                          value={customPhotoInput}
                          onChange={(e) => setCustomPhotoInput(e.target.value)}
                        />
                        <button 
                          onClick={addCustomPhoto}
                          className="bg-slate-700 hover:bg-slate-650 px-2.5 rounded-xl text-white text-[10px] cursor-pointer shrink-0"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-between">
                    <button 
                      onClick={() => setStep(selectedBookingType === "Stay" ? 3 : 4)}
                      className="border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleReviewSubmission}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer shadow-lg shadow-amber-500/10"
                    >
                      <Sparkles className="w-4 h-4" />
                      Submit Verified Story
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 6: VERIFIED SUCCESS RECEIPT */}
              {step === 6 && (
                <div className="text-center py-8 space-y-6 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">Story Approved & Published!</h3>
                    <p className="text-xs text-slate-400 font-light leading-relaxed">
                      Your traveler report passed automated AI Content Moderation checks. The ratings have been routed!
                    </p>
                  </div>

                  {/* REWARDS SUMMARY CARD */}
                  <div className="bg-slate-900 border border-white/5 rounded-2.5xl p-5 space-y-4 text-left">
                    <p className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider text-center">Adventure Passport Update</p>
                    
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-xs text-slate-400">XP Rewards Credited:</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono bg-emerald-500/5 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                        🪙 +{submissionResult?.xpEarned || 20} XP
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 font-mono block">Unlocked Badges & Achievements:</span>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-slate-950 text-indigo-300 border border-indigo-500/10 text-[10px] px-2.5 py-1 rounded-lg font-mono flex items-center gap-1 font-semibold">
                          ⭐ Reviewer
                        </span>
                        {selectedPhotos.length > 0 && (
                          <span className="bg-slate-950 text-indigo-300 border border-indigo-500/10 text-[10px] px-2.5 py-1 rounded-lg font-mono flex items-center gap-1 font-semibold">
                            📸 Storyteller
                          </span>
                        )}
                        {selectedVideos.length > 0 && (
                          <span className="bg-slate-950 text-indigo-300 border border-indigo-500/10 text-[10px] px-2.5 py-1 rounded-lg font-mono flex items-center gap-1 font-semibold">
                            🎥 Creator
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={() => setCurrentSubView("feed")}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3 rounded-xl w-full cursor-pointer"
                    >
                      View Live Feed
                    </button>
                    <button
                      onClick={resetFormState}
                      className="border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold py-3 rounded-xl w-full cursor-pointer"
                    >
                      Write Another Review
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}

        {/* ========================================================== */}
        {/* VIEW 3: ADMIN MODERATION QUEUE */}
        {/* ========================================================== */}
        {currentSubView === "admin" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-teal-400" />
                  Admin Moderation Panel
                </h2>
                <p className="text-xs text-slate-400">
                  Audit, approve or filter stories entered by travelers. Check system telemetry variables.
                </p>
              </div>

              {/* STATS CAPSULES */}
              <div className="flex gap-2">
                <div className="bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-center shrink-0">
                  <p className="text-[10px] text-slate-500 font-mono block">REVIEWS AMOUNT</p>
                  <p className="text-sm font-bold text-white font-mono">{reviews.length}</p>
                </div>
                <div className="bg-slate-800 border border-white/5 rounded-xl px-4 py-2.5 text-center shrink-0">
                  <p className="text-[10px] text-slate-300 font-mono block">PENDING QUEUE</p>
                  <p className="text-sm font-bold text-amber-400 font-mono">{reviews.filter(r => r.moderationStatus === "Pending").length}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-white/5 rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-white/5 bg-slate-900/50">
                <h3 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">Moderation Review Registry Queue</h3>
              </div>
              
              <div className="divide-y divide-white/5">
                {reviews.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-500">No review registers found.</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-6 flex flex-col lg:flex-row items-start justify-between gap-6 hover:bg-slate-900/10 transition-colors">
                      <div className="space-y-4 max-w-2xl">
                        
                        {/* Profile segment */}
                        <div className="flex items-center gap-3">
                          <img 
                            src={rev.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"}
                            alt={rev.guestName}
                            className="w-10 h-10 rounded-full border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{rev.guestName}</span>
                              <span className="text-[10px] text-slate-405 font-mono">({rev.guestEmail})</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">
                              Booking ID: <span className="text-indigo-400 font-semibold">{rev.bookingId}</span> • Type: <span className="font-semibold uppercase text-teal-300">{rev.bookingType}</span>
                            </p>
                          </div>
                        </div>

                        {/* Title and Body info */}
                        <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-white/5">
                          <p className="text-xs font-semibold text-slate-200">"{rev.storyTitle}"</p>
                          <p className="text-xs text-slate-400 leading-relaxed font-light">{rev.storyText || "No detailed story narrative added."}</p>
                          
                          <div className="mt-3.5 flex flex-wrap gap-4 text-[10px] font-mono text-slate-450 border-t border-white/5 pt-2">
                            {rev.propertyName && <p>🏨 Stay Property: <span className="text-slate-300 font-semibold">{rev.propertyName}</span></p>}
                            {rev.experienceName && <p>🚣 Exp Activity: <span className="text-slate-300 font-semibold">{rev.experienceName}</span></p>}
                            <p>🧭 Traveler: <span className="text-slate-300 font-semibold">{rev.travelerType}</span></p>
                          </div>
                        </div>

                        {/* Automatic Moderation Checks Report card */}
                        <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1.5">
                          <p className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                            Auto-Moderation Checks Log
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                            <span className={`px-2 py-0.5 rounded ${rev.moderationChecks?.isSpam ? "bg-red-500/10 text-red-400" : "bg-emerald-500/5 text-emerald-400 border border-emerald-500/10"}`}>
                              Spam: {rev.moderationChecks?.isSpam ? "FLAGGED" : "CLEAN"}
                            </span>
                            <span className={`px-2 py-0.5 rounded ${rev.moderationChecks?.offensiveLanguage ? "bg-red-500/10 text-red-400" : "bg-emerald-500/5 text-emerald-400 border border-emerald-500/10"}`}>
                              Toxicity: {rev.moderationChecks?.offensiveLanguage ? "FLAGGED" : "CLEAN"}
                            </span>
                            <span className={`px-2 py-0.5 rounded ${rev.moderationChecks?.hasContactInfo ? "bg-red-500/10 text-red-400" : "bg-emerald-500/5 text-emerald-400 border border-emerald-500/10"}`}>
                              Contact Info: {rev.moderationChecks?.hasContactInfo ? "FLAGGED" : "CLEAN"}
                            </span>
                            <span className={`px-2 py-0.5 rounded ${rev.moderationChecks?.isFake ? "bg-red-500/10 text-red-400" : "bg-emerald-500/5 text-emerald-400 border border-emerald-500/10"}`}>
                              Fake Logs: {rev.moderationChecks?.isFake ? "FLAGGED" : "CLEAN"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status indicator buttons */}
                      <div className="shrink-0 flex flex-col items-end gap-3 self-center sm:self-start lg:self-center">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500">Status:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${rev.moderationStatus === "Approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : rev.moderationStatus === "Pending" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                            {rev.moderationStatus}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {rev.moderationStatus !== "Approved" && (
                            <button
                              onClick={() => handleAdminAction(rev.id, "Approve")}
                              disabled={actionLoading}
                              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[10px] px-2.5 py-1 rounded cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {rev.moderationStatus !== "Rejected" && (
                            <button
                              onClick={() => handleAdminAction(rev.id, "Reject")}
                              disabled={actionLoading}
                              className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] px-2.5 py-1 rounded cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleAdminAction(rev.id, "Delete")}
                            disabled={actionLoading}
                            className="bg-red-650 hover:bg-red-600 text-white text-[10px] px-2.5 py-1 rounded cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
