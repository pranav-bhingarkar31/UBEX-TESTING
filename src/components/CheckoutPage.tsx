import React, { useState, useEffect } from "react";
import { 
  Check, 
  Trash2, 
  Plus, 
  Minus, 
  Info, 
  Lock, 
  CheckCircle,
  HelpCircle,
  Phone,
  MessageSquare,
  Gift,
  Tag,
  CreditCard,
  MapPin,
  Calendar as CalendarIcon,
  ShieldCheck,
  User,
  Activity,
  Smile,
  Users,
  ChevronRight,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Booking } from "../types";
import { getWhatsAppNumber } from "../utils/contact";

interface CartStayItem {
  id: string | number;
  title: string;
  roomName: string;
  roomPrice: number;
  img: string;
  loc: string;
  guestsCount: number;
  checkIn: string;
  checkOut: string;
  nights: number;
}

interface CartExperienceItem {
  id: string;
  title: string;
  variantName: string;
  priceValue: number;
  img: string;
  meetingPoint: string;
  bookingDate: string;
  bookingTime: string;
  guestsCount: number;
}

interface CheckoutPageProps {
  currency: string;
  convertAndFormatPrice: (val: number) => string;
  cartStays: CartStayItem[];
  cartExperiences: CartExperienceItem[];
  setCartStays: React.Dispatch<React.SetStateAction<CartStayItem[]>>;
  setCartExperiences: React.Dispatch<React.SetStateAction<CartExperienceItem[]>>;
  onCompleteBooking: (bookingDetails: any) => void;
  currencySymbol: string;
  switchToTab: (tab: "stays" | "experiences" | "community") => void;
  lang?: string;
  currentUser?: any;
}

const EXPERIENCE_ADDONS = [
  {
    name: "Scooter Rental",
    desc: "Explore Rishikesh freely at your own pace.",
    duration: "Full Day",
    price: 500,
    img: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400"
  },
  {
    name: "Pottery Workshop",
    desc: "Create your own pottery pieces with local artists.",
    duration: "2 Hours",
    price: 799,
    img: "https://images.unsplash.com/photo-1565192647048-f997ded87958?auto=format&fit=crop&q=80&w=400"
  },
  {
    name: "Yoga Session",
    desc: "Guided yoga session with experienced instructors.",
    duration: "90 Minutes",
    price: 499,
    img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400"
  },
  {
    name: "Airport Pickup",
    desc: "Comfortable transfer from airport to your stay.",
    duration: "One Way",
    price: 1200,
    img: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=400"
  }
];

export default function CheckoutPage({
  currency,
  convertAndFormatPrice,
  cartStays,
  cartExperiences,
  setCartStays,
  setCartExperiences,
  onCompleteBooking,
  currencySymbol,
  switchToTab,
  lang,
  currentUser
}: CheckoutPageProps) {
  // Guest Details state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  
  // Auto-fill profile details from active user session
  useEffect(() => {
    if (currentUser) {
      setFullName((prev) => prev || currentUser.displayName || "");
      setEmail((prev) => prev || currentUser.email || "");
      setPhone((prev) => prev || currentUser.phoneNumber || "");
    }
  }, [currentUser]);
  const [country, setCountry] = useState("India");
  const [arrivalTime, setArrivalTime] = useState("");
  const [travelPurpose, setTravelPurpose] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  // Experience addons State (Prepopulated from the HTML template: Scooter and Pottery)
  const [selectedAddons, setSelectedAddons] = useState<string[]>(["Scooter Rental", "Pottery Workshop"]);

  // Discount Codes state
  const [referralCode, setReferralCode] = useState("");
  const [referralMessage, setReferralMessage] = useState("");
  const [referralDiscount, setReferralDiscount] = useState(0);

  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Active payment type
  const [paymentType, setPaymentType] = useState<"full-payment" | "advance-payment">("full-payment");

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculations
  const getStaysSubtotal = () => {
    return cartStays.reduce((sum, stay) => sum + (stay.roomPrice * stay.nights), 0);
  };

  const getExperiencesSubtotal = () => {
    return cartExperiences.reduce((sum, exp) => sum + (exp.priceValue * exp.guestsCount), 0);
  };

  const getAddonsSubtotal = () => {
    return selectedAddons.reduce((sum, name) => {
      const addon = EXPERIENCE_ADDONS.find(a => a.name === name);
      return sum + (addon ? addon.price : 0);
    }, 0);
  };

  const getSubtotal = () => {
    return getStaysSubtotal() + getExperiencesSubtotal() + getAddonsSubtotal();
  };

  const getDiscountAmount = () => {
    return referralDiscount + couponDiscount;
  };

  const getTaxesAndFees = () => {
    // 1% standard tax matching original styling or ₹100 flat
    return 100;
  };

  const getAmountPayable = () => {
    const total = getSubtotal() - getDiscountAmount() + getTaxesAndFees();
    return Math.max(total, 0);
  };

  const handleApplyReferral = () => {
    const formatted = referralCode.trim().toUpperCase();
    if (formatted === "PRANAVRISH") {
      setReferralDiscount(250);
      setReferralMessage("Referral code applied successfully! ₹250 discount added.");
    } else {
      setReferralMessage("Invalid referral code.");
      setReferralDiscount(0);
    }
  };

  const handleApplyCoupon = () => {
    const formatted = couponCode.trim().toUpperCase();
    const coupons: Record<string, number> = {
      "UBEX100": 100,
      "UBEX250": 250,
      "RISHI500": 500,
      "WELCOME10": Math.round(getSubtotal() * 0.10) // 10% Welcome Promo
    };

    if (coupons[formatted] !== undefined) {
      setCouponDiscount(coupons[formatted]);
      setCouponMessage(`Promo code applied! ₹${coupons[formatted]} discount added.`);
    } else {
      setCouponMessage("Invalid promo code.");
      setCouponDiscount(0);
    }
  };

  const handleToggleAddon = (name: string) => {
    if (selectedAddons.includes(name)) {
      setSelectedAddons(prev => prev.filter(x => x !== name));
    } else {
      setSelectedAddons(prev => [...prev, name]);
    }
  };

  const handleDeleteStay = (id: string | number, roomName: string) => {
    setCartStays(prev => prev.filter(stay => !(stay.id === id && stay.roomName === roomName)));
  };

  const handleDeleteExperience = (id: string, variantName: string) => {
    setCartExperiences(prev => prev.filter(exp => !(exp.id === id && exp.variantName === variantName)));
  };

  const handleUpdateStayGuests = (id: string | number, roomName: string, change: number) => {
    setCartStays(prev => prev.map(stay => {
      if (stay.id === id && stay.roomName === roomName) {
        return { ...stay, guestsCount: Math.max(stay.guestsCount + change, 1) };
      }
      return stay;
    }));
  };

  const handleUpdateExperienceGuests = (id: string, variantName: string, change: number) => {
    setCartExperiences(prev => prev.map(exp => {
      if (exp.id === id && exp.variantName === variantName) {
        return { ...exp, guestsCount: Math.max(exp.guestsCount + change, 1) };
      }
      return exp;
    }));
  };

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!fullName.trim() || !/^[A-Za-z\s]{2,50}$/.test(fullName.trim())) {
      newErrors.fullName = "Please enter a valid full name.";
    }

    if (!phone.trim() || !/^[0-9]{10,15}$/.test(phone.trim())) {
      newErrors.phone = "Please enter a valid phone number (10-15 digits).";
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!termsAccepted) {
      newErrors.terms = "Please accept the booking terms and conditions.";
    }

    if (!policyAccepted) {
      newErrors.policy = "Please agree to the booking policies to continue.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // scroll to errors
      const errorEl = document.getElementById("guest-details-section");
      if (errorEl) {
        errorEl.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    setErrors({});

    // Build the final checkout model
    const totalPayable = getAmountPayable();
    const reservationPaid = paymentType === "advance-payment" ? Math.round(totalPayable * 0.70) : totalPayable;
    const remainingBalance = totalPayable - reservationPaid;

    const bookingObject = {
      bookingId: `UBX-RISH-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`,
      guestName: fullName.trim(),
      guestPhone: phone.trim(),
      guestEmail: email.trim(),
      country,
      arrivalTime,
      travelPurpose,
      specialNotes: specialRequests,
      marketingConsent,
      paymentType,
      selectedAddons: [...selectedAddons],
      cartStays: [...cartStays],
      cartExperiences: [...cartExperiences],
      amountPayable: totalPayable,
      amountPaid: reservationPaid,
      amountRemaining: remainingBalance,
      currency,
      date: new Date().toLocaleDateString()
    };

    onCompleteBooking(bookingObject);
  };

  return (
    <div className="pt-28 pb-20 px-4 max-w-7xl mx-auto font-sans text-slate-900 bg-slate-50 min-h-screen">
      
      {/* ==========================================
           CHECKOUT HERO / TITLE
      =========================================== */}
      <div className="mb-10 text-center md:text-left">
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-3">
          Home / Checkout
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-none mb-4 font-display">
          Complete Your Booking
        </h1>
        <p className="text-slate-500 max-w-2xl text-sm md:text-base">
          Review your customized stays, local experiences, and additional services, and complete your registration easily.
        </p>
      </div>

      {/* ==========================================
           MAIN CHECKOUT GRID LAYOUT
      =========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT MAIN DETAILS COLUMN (8 spans) */}
        <div className="lg:col-span-8 space-y-8">

          {/* ==========================================
               BOOKING SUMMARY SECTION
          =========================================== */}
          <section id="booking-summary-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"></div>
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-indigo-600" /> Booking Summary
                </h2>
                <p className="text-xs text-slate-400 mt-1">Review your selected accommodations and experiences.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => switchToTab("stays")}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  + Add Stay
                </button>
                <button 
                  onClick={() => switchToTab("experiences")}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl transition-all"
                >
                  + Add Experience
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {cartStays.length === 0 && cartExperiences.length === 0 && (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium text-sm mb-4">Your booking basket is currently empty.</p>
                  <div className="flex justify-center gap-3">
                    <button 
                      onClick={() => switchToTab("stays")}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      Browse Stays
                    </button>
                    <button 
                      onClick={() => switchToTab("experiences")}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      Browse Experiences
                    </button>
                  </div>
                </div>
              )}

              {/* LIST OF STAYS */}
              {cartStays.map((stay, idx) => (
                <article key={`stay-${idx}`} className="flex flex-col md:flex-row gap-5 border border-slate-150 rounded-2xl p-4 bg-white hover:border-slate-350 transition-all shadow-xs">
                  <div className="w-full md:w-44 h-28 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img 
                      src={stay.img || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=400"} 
                      alt={stay.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md uppercase tracking-wider mb-1 inline-block">
                            Stay Lodging
                          </span>
                          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                            {stay.title}
                          </h3>
                          <p className="text-[11px] text-slate-400 font-light flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-red-400" /> {stay.loc}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleDeleteStay(stay.id, stay.roomName)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5">
                        <div className="bg-slate-50 p-2 rounded-xl text-center">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Room Category</span>
                          <strong className="text-slate-800 text-[11px] font-black">{stay.roomName}</strong>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl text-center">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Date Duration</span>
                          <strong className="text-slate-800 text-[11px] font-black">{stay.nights} nights</strong>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl text-center">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Base Cost</span>
                          <strong className="text-slate-800 text-[11px] font-black">{convertAndFormatPrice(stay.roomPrice)}/nt</strong>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl text-center flex flex-col justify-center items-center">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Total Stay</span>
                          <strong className="text-indigo-650 text-[11px] font-black">{convertAndFormatPrice(stay.roomPrice * stay.nights)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">Travel Guests:</span>
                        <div className="flex items-center gap-1.5 ml-1">
                          <button 
                            onClick={() => handleUpdateStayGuests(stay.id, stay.roomName, -1)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 w-5 h-5 rounded flex items-center justify-center font-bold"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="font-bold text-slate-800 text-xs">{stay.guestsCount}</span>
                          <button 
                            onClick={() => handleUpdateStayGuests(stay.id, stay.roomName, 1)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 w-5 h-5 rounded flex items-center justify-center font-bold"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-[10px] text-indigo-500 font-bold">
                        🗓 {stay.checkIn} to {stay.checkOut}
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {/* LIST OF EXPERIENCES */}
              {cartExperiences.map((exp, idx) => (
                <article key={`experience-${idx}`} className="flex flex-col md:flex-row gap-5 border border-slate-150 rounded-2xl p-4 bg-white hover:border-slate-350 transition-all shadow-xs">
                  <div className="w-full md:w-44 h-28 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img 
                      src={exp.img || "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=400"} 
                      alt={exp.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider mb-1 inline-block">
                            Local Experience
                          </span>
                          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                            {exp.title}
                          </h3>
                          <p className="text-[11px] text-slate-400 font-light flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-400" /> {exp.meetingPoint}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleDeleteExperience(exp.id, exp.variantName)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5">
                        <div className="bg-slate-50 p-2 rounded-xl text-center">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Variant Choice</span>
                          <strong className="text-slate-800 text-[11px] font-black truncate block">{exp.variantName}</strong>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl text-center">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Selected Slot</span>
                          <strong className="text-slate-800 text-[11px] font-black truncate block">{exp.bookingTime}</strong>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl text-center">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Price Each</span>
                          <strong className="text-slate-800 text-[11px] font-black">{convertAndFormatPrice(exp.priceValue)}</strong>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl text-center flex flex-col justify-center items-center">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Total cost</span>
                          <strong className="text-emerald-600 text-[11px] font-black">{convertAndFormatPrice(exp.priceValue * exp.guestsCount)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">Total spots:</span>
                        <div className="flex items-center gap-1.5 ml-1">
                          <button 
                            onClick={() => handleUpdateExperienceGuests(exp.id, exp.variantName, -1)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 w-5 h-5 rounded flex items-center justify-center font-bold"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="font-bold text-slate-800 text-xs">{exp.guestsCount}</span>
                          <button 
                            onClick={() => handleUpdateExperienceGuests(exp.id, exp.variantName, 1)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 w-5 h-5 rounded flex items-center justify-center font-bold"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-[10px] text-emerald-500 font-bold">
                        🗓 Booking Date: {exp.bookingDate}
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {/* ADD-ONS SUMMARY LINE ITEM */}
              {selectedAddons.length > 0 && (
                <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50">
                  <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2.5">
                    🛍 Handpicked Experiences & Accessories Addons
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedAddons.map(name => {
                      const ad = EXPERIENCE_ADDONS.find(a => a.name === name);
                      return ad && (
                        <div key={name} className="bg-white px-3.5 py-2 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                          <span className="text-slate-700 font-medium">✨ {name}</span>
                          <span className="text-indigo-650 font-bold">{convertAndFormatPrice(ad.price)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ==========================================
               EXPERIENCE ADD-ONS (Enhance Your Stay)
          =========================================== */}
          <section id="experience-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Gift className="w-6 h-6 text-indigo-600" /> Enhance Your Stay
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Add highly recommended local activities, scooter rentals, and essential services to complete your travel program.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EXPERIENCE_ADDONS.map(addon => {
                const isSelected = selectedAddons.includes(addon.name);
                return (
                  <article 
                    key={addon.name} 
                    className={`border rounded-2xl overflow-hidden bg-white transition-all flex flex-col justify-between ${
                      isSelected ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="h-40 bg-slate-100 overflow-hidden relative">
                        <img 
                          src={addon.img} 
                          alt={addon.name} 
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-2.5 right-2.5 text-[9px] font-bold text-white bg-slate-900/80 px-2 py-1 rounded-md uppercase tracking-wider backdrop-blur-xs">
                          {addon.duration}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-extrabold text-slate-900 text-sm">{addon.name}</h3>
                        <p className="text-xs text-slate-500 font-light mt-1.5 leading-relaxed">{addon.desc}</p>
                      </div>
                    </div>
                    <div className="p-4 pt-0 flex justify-between items-center mt-2">
                      <span className="font-black text-indigo-650 text-sm">{convertAndFormatPrice(addon.price)}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAddon(addon.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected 
                            ? "bg-red-500 hover:bg-red-600 text-white shadow-xs" 
                            : "bg-indigo-600 hover:bg-slate-900 text-white shadow-xs"
                        }`}
                      >
                        {isSelected ? "Remove" : "Add Experience"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* ==========================================
               GUEST DETAILS FORM SEC
          =========================================== */}
          <section id="guest-details-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <User className="w-6 h-6 text-indigo-600" /> Guest Contact Details
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tell us a little about yourself so we can register and prepare correct slots for your arrival.
              </p>
            </div>

            <form onSubmit={validateAndSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* NAME */}
                <div className="space-y-1.5">
                  <label htmlFor="guest-name" className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="guest-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full px-4 py-3 border rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 ${
                      errors.fullName ? "border-red-500 ring-1 ring-red-500 bg-red-50/10" : "border-slate-200"
                    }`}
                  />
                  {errors.fullName && <p className="text-[10px] text-red-500 font-medium">{errors.fullName}</p>}
                </div>

                {/* PHONE */}
                <div className="space-y-1.5">
                  <label htmlFor="guest-phone" className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="guest-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className={`w-full px-4 py-3 border rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 ${
                      errors.phone ? "border-red-500 ring-1 ring-red-500 bg-red-50/10" : "border-slate-200"
                    }`}
                  />
                  {errors.phone && <p className="text-[10px] text-red-500 font-medium">{errors.phone}</p>}
                </div>

                {/* EMAIL */}
                <div className="space-y-1.5">
                  <label htmlFor="guest-email" className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="guest-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full px-4 py-3 border rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 ${
                      errors.email ? "border-red-500 ring-1 ring-red-500 bg-red-50/10" : "border-slate-200"
                    }`}
                  />
                  {errors.email && <p className="text-[10px] text-red-500 font-medium">{errors.email}</p>}
                </div>

                {/* COUNTRY */}
                <div className="space-y-1.5">
                  <label htmlFor="guest-country" className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    Country *
                  </label>
                  <select
                    id="guest-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Germany">Germany</option>
                    <option value="Australia">Australia</option>
                    <option value="Russian Federation">Russia</option>
                    <option value="China">China</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* EXPECTED ARRIVAL */}
                <div className="space-y-1.5">
                  <label htmlFor="arrival-time" className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    Expected Arrival Time
                  </label>
                  <select
                    id="arrival-time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    <option value="">Select Arrival Time</option>
                    <option value="before-12">Before 12 PM</option>
                    <option value="12-4">12 PM - 4 PM</option>
                    <option value="4-8">4 PM - 8 PM</option>
                    <option value="after-8">After 8 PM</option>
                  </select>
                </div>

                {/* TRAVEL PURPOSE */}
                <div className="space-y-1.5">
                  <label htmlFor="travel-purpose" className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    Travel Purpose
                  </label>
                  <select
                    id="travel-purpose"
                    value={travelPurpose}
                    onChange={(e) => setTravelPurpose(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    <option value="">Select Purpose</option>
                    <option value="leisure">Leisure</option>
                    <option value="workation">Workation / Nomad</option>
                    <option value="family">Family Gathering</option>
                    <option value="wellness">Yoga & Wellness</option>
                    <option value="corporate">Corporate Outpost</option>
                  </select>
                </div>
              </div>

              {/* SPECIAL NOTES */}
              <div className="space-y-1.5">
                <label htmlFor="special-notes" className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  Special Requests / Dietary Needs
                </label>
                <textarea
                  id="special-notes"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={3}
                  placeholder="Tell us if you have any dietary preferences, special accessibility requirements, or custom transport guidelines..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 resize-y"
                ></textarea>
              </div>

              {/* CHECKBOXES */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-slate-500 leading-normal">
                    Send me updates about upcoming local experience programs, retreat spots, and community bonfire events.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-slate-500 leading-normal">
                    I agree to the property’s standard booking policies, cancellation guidelines, and terms & conditions. *
                  </span>
                </label>
                {errors.terms && <p className="text-[10px] text-red-500 font-medium pl-6">{errors.terms}</p>}
              </div>

              {/* OTP ready code note */}
              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 text-xs text-blue-800">
                <Activity className="w-4 h-4 text-blue-500 flex-shrink-0 animate-pulse" />
                <span>
                  Our team verification outpost may send a secure OTP code to your phone number before final site access is granted.
                </span>
              </div>
            </form>
          </section>

          {/* ==========================================
               DISCOUNT CODES & REDEMPTIONS
          =========================================== */}
          <section id="referral-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Tag className="w-6 h-6 text-indigo-600" /> Discounts & Offers
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Apply active promotional coupons or family referral codes to avail discounts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* REFERRAL */}
              <div className="border border-slate-150 rounded-2xl p-4 bg-white space-y-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Referral Code</h3>
                  <p className="text-[11px] text-slate-400 font-light mt-0.5">Got recommended by a friend?</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Enter referral code"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyReferral}
                    className="px-3 bg-indigo-600 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Apply
                  </button>
                </div>
                {referralMessage && (
                  <p className={`text-[11px] font-medium ${referralDiscount > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {referralMessage}
                  </p>
                )}
              </div>

              {/* COUPON */}
              <div className="border border-slate-150 rounded-2xl p-4 bg-white space-y-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Promo Code</h3>
                  <p className="text-[11px] text-slate-400 font-light mt-0.5">Apply valid promotional vouchers.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-3 bg-indigo-600 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <p className={`text-[11px] font-medium ${couponDiscount > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {couponMessage}
                  </p>
                )}
              </div>
            </div>

            {/* PRESET OFFERS */}
            <div className="mt-6 pt-5 border-t border-slate-150">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-3">Available Offers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { code: "RISHI500", desc: "Flat ₹500 off on wellness items." },
                  { code: "WELCOME10", desc: "10% absolute discount for first bookings." },
                  { code: "PRANAVRISH", desc: "Referral code from Pranav (₹250 off)." }
                ].map((off) => (
                  <button
                    key={off.code}
                    onClick={() => {
                      if (off.code === "PRANAVRISH") {
                        setReferralCode(off.code);
                      } else {
                        setCouponCode(off.code);
                      }
                    }}
                    className="text-left p-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/20 hover:bg-indigo-55/30 transition-all font-sans"
                  >
                    <span className="font-mono text-[10px] font-black text-indigo-600 block bg-indigo-50 px-1.5 py-0.5 rounded w-max">
                      🎉 {off.code}
                    </span>
                    <small className="text-[10px] text-slate-500 block leading-tight mt-1.5">{off.desc}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* REWARDS STATUS */}
            <div className="mt-5 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1">
                  <Gift className="w-4 h-4 text-indigo-600" /> Reward Points Balance
                </h4>
                <p className="text-[10px] text-slate-400 font-light leading-snug mt-0.5">Earn points on every booking and redeem dynamically.</p>
              </div>
              <div className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-100 font-display">
                <span className="text-[10px] text-indigo-600 font-bold uppercase">Points Available:</span>
                <strong className="text-slate-800 text-xs font-black">0 Points</strong>
              </div>
            </div>
          </section>

          {/* ==========================================
               PAYMENT PROCESS OPTIONS
          =========================================== */}
          <section id="payment-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600"></div>
            
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-indigo-600" /> Payment & Reservation Options
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose your preferred funding plan to secure this reservation.
              </p>
            </div>

            {/* CHOOSE PAYMENT OPTION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* PAY IN FULL */}
              <label 
                className={`border rounded-2xl p-5 cursor-pointer transition-all flex items-start gap-3 ${
                  paymentType === "full-payment" 
                    ? "border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/10" 
                    : "border-slate-200 hover:border-slate-350"
                }`}
              >
                <input
                  type="radio"
                  name="payment-choice"
                  checked={paymentType === "full-payment"}
                  onChange={() => setPaymentType("full-payment")}
                  className="mt-1 text-indigo-650"
                />
                <div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900 font-display">Pay Full Amount</span>
                    <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Recom.</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-light mt-1.5 leading-normal">
                    Settle the complete reservation amount now and receive instant verified booking passes.
                  </p>
                  <p className="font-mono text-base font-black text-slate-900 mt-3">{convertAndFormatPrice(getAmountPayable())}</p>
                </div>
              </label>

              {/* ADVANCE RESERVE 70% */}
              <label 
                className={`border rounded-2xl p-5 cursor-pointer transition-all flex items-start gap-3 ${
                  paymentType === "advance-payment" 
                    ? "border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/10" 
                    : "border-slate-200 hover:border-slate-350"
                }`}
              >
                <input
                  type="radio"
                  name="payment-choice"
                  checked={paymentType === "advance-payment"}
                  onChange={() => setPaymentType("advance-payment")}
                  className="mt-1 text-indigo-650"
                />
                <div>
                  <span className="font-extrabold text-xs text-slate-905 font-display block">Reserve with 70% Advance</span>
                  <p className="text-[11px] text-slate-400 font-light mt-1.5 leading-normal">
                    Secure your rooms & experience slots with an immediate 70% deposit. Pay the balance prior to arrival at Rishikesh.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] bg-slate-50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-slate-400 block font-bold">PAY NOW:</span>
                      <strong className="text-slate-800 font-mono font-black text-[11px]">{convertAndFormatPrice(Math.round(getAmountPayable() * 0.70))}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold">PAY LATER:</span>
                      <strong className="text-slate-500 font-mono font-black text-[11px]">{convertAndFormatPrice(getAmountPayable() - Math.round(getAmountPayable() * 0.70))}</strong>
                    </div>
                  </div>
                </div>
              </label>
            </div>

            {/* SUPPORTED GATEWAY BRANDING */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <h3 className="font-bold text-xs text-slate-600">Secure Direct Gateways Available:</h3>
              <div className="flex flex-wrap gap-2.5 mt-2 text-xs">
                {["⚡ Google Pay UPI", "💳 Visa / Mastercard", "🏦 Net Banking", "🛵 On-site Cash Outpost", "🌎 Wise Pay / International"].map((pm) => (
                  <span key={pm} className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-slate-600">
                    {pm}
                  </span>
                ))}
              </div>
            </div>

            {/* PAYMENT SECURITY BLOCK */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center justify-between text-[11px] text-slate-400 mt-5 pt-4 border-t border-slate-100">
              <span className="flex items-center gap-1 font-bold">
                🔒 256-Bit SSL Secured Encryption
              </span>
              <span className="flex items-center gap-1 font-bold">
                🛡 Verified Secure Outpost Shield
              </span>
              <span className="flex items-center gap-1 font-bold">
                ⚡ Instant Slot Protection Guarantee
              </span>
            </div>
          </section>

          {/* ==========================================
               BOOKING POLICIES / INFORMATION
          =========================================== */}
          <section id="policy-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-indigo-600" /> Booking Policies & Guidelines
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Please double-check active guidelines regarding lodging rules and cancellations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Check-In & Out Timeline</span>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] block font-bold">Check-In</span>
                    <strong className="text-slate-800 font-black">02:00 PM</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] block font-bold">Check-Out</span>
                    <strong className="text-slate-800 font-black">11:00 AM</strong>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-500 block">General Outpost Rules</span>
                  <ul className="text-xs space-y-1.5 mt-2.5 pl-4 list-disc text-slate-500 font-light leading-normal">
                    <li>No loud music after 10 PM.</li>
                    <li>Alcohol consumed inside private rooms only.</li>
                    <li>Power fluctuations can occur during severe storms.</li>
                    <li>Pack appropriate walking boots.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CANCELLATION DETAILS */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3.5">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Refund & Cancellations Matrix</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                  <strong className="text-indigo-600 block uppercase text-[10px] tracking-wider font-extrabold">Individual Bookings</strong>
                  <p className="text-slate-500 font-light mt-1 text-[11px] leading-relaxed">
                    100% back before 7 days / 50% back before 4 days / No refund within 3 days.
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                  <strong className="text-purple-600 block uppercase text-[10px] tracking-wider font-extrabold">Group Retreat Blocks</strong>
                  <p className="text-slate-500 font-light mt-1 text-[11px] leading-relaxed">
                    100% back before 90 days / 50% back before 30 days / No refund under 29 days.
                  </p>
                </div>
              </div>
            </div>

            {/* AGREE DRAFT AT BOTTOM */}
            <div className="mt-6 pt-5 border-t border-slate-150">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policyAccepted}
                  onChange={(e) => setPolicyAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-500 leading-normal font-bold">
                  I explicitly acknowledge having read and approved all active cancellation refund rules, community regulations, noise guidelines, and travel advisories. *
                </span>
              </label>
              {errors.policy && <p className="text-[10px] text-red-500 font-medium pl-6 block mt-1">{errors.policy}</p>}
            </div>
          </section>

          {/* ==========================================
               TRUST TESTIMONIAL STORIES
          =========================================== */}
          <section className="bg-slate-100 rounded-3xl p-6 sm:p-8 border border-slate-200">
            <h2 className="text-lg font-extrabold text-slate-900 font-display mb-1">Book With Peace of Mind</h2>
            <p className="text-xs text-slate-400 mb-6">See why 10,000+ wanderers trust the UbEx platform.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <article className="bg-white rounded-2xl p-4.5 border border-slate-150 text-xs relative flex flex-col justify-between">
                <div>
                  <span className="text-amber-400 font-bold block mb-2">⭐⭐⭐⭐⭐</span>
                  <p className="text-slate-500 font-light leading-relaxed">"The complete package of lodging plus local workshop and rafting made organizing our Rishikesh retreat incredibly smooth."</p>
                </div>
                <strong className="text-slate-700 font-extrabold block mt-3.5">— Amanda T., Germany</strong>
              </article>

              <article className="bg-white rounded-2xl p-4.5 border border-slate-150 text-xs relative flex flex-col justify-between">
                <div>
                  <span className="text-amber-400 font-bold block mb-2">⭐⭐⭐⭐⭐</span>
                  <p className="text-slate-500 font-light leading-relaxed">"Absolutely incredible service. Seamless payment confirmation process, and direct offline assist base camps in Tapovan."</p>
                </div>
                <strong className="text-slate-700 font-extrabold block mt-3.5">— Rahul P., Mumbai</strong>
              </article>

              <article className="bg-white rounded-2xl p-4.5 border border-slate-150 text-xs relative flex flex-col justify-between">
                <div>
                  <span className="text-amber-400 font-bold block mb-2">⭐⭐⭐⭐⭐</span>
                  <p className="text-slate-500 font-light leading-relaxed">"Their 70% reservation deposit allows real planning flexibility as digital nomads traveling cross-country."</p>
                </div>
                <strong className="text-slate-700 font-extrabold block mt-3.5">— Tyler S., Australia</strong>
              </article>
            </div>
          </section>

          {/* WHATSAPP OUTPOST SUPPORT DIRECT LINK */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center justify-center md:justify-start gap-1">
                💬 Need customized booking assistance?
              </h3>
              <p className="text-xs text-slate-500 mt-1">Our coordinators can customize room classes, shuttle routes and timings instantly.</p>
            </div>
            <a 
              href={`https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent("Hello UbEx Support, I need assistance with my checkout booking.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-all"
            >
              <MessageSquare className="w-4 h-4 fill-white" /> Connect WhatsApp Assist
            </a>
          </div>

        </div>

        {/* RIGHT STICKY BILLING COLUMN (4 spans) */}
        <aside className="lg:col-span-4 sticky top-28 space-y-6">
          
          {/* STICKY SUMMARY TARIFF */}
          <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-indigo-600 uppercase tracking-widest block font-display">
                Invoice Breakdown
              </h3>
              <p className="text-[10px] text-slate-400 font-light">Calculations for your active selections.</p>
            </div>

            {/* BREAKDOWN SECTIONS */}
            <div className="space-y-4 text-xs font-sans">
              
              {/* STAYS ITEMS */}
              {cartStays.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Lodging Accommodations</span>
                  {cartStays.map((s, i) => (
                    <div key={`stay-bill-${i}`} className="flex justify-between items-center text-slate-600">
                      <span className="font-medium max-w-[70%] truncate text-[11px]">
                        🏠 {s.title} ({s.roomName}) x {s.nights}nt
                      </span>
                      <strong className="font-mono text-slate-800 font-bold">{convertAndFormatPrice(s.roomPrice * s.nights)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* EXPERIENCES ITEMS */}
              {cartExperiences.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Experiences Slots</span>
                  {cartExperiences.map((e, idx) => (
                    <div key={`exp-bill-${idx}`} className="flex justify-between items-center text-slate-600">
                      <span className="font-medium max-w-[70%] truncate text-[11px]">
                        🚣 {e.title} ({e.variantName}) x {e.guestsCount}
                      </span>
                      <strong className="font-mono text-slate-800 font-bold">{convertAndFormatPrice(e.priceValue * e.guestsCount)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* EXPERIENCES SELECTED ADDONS */}
              {selectedAddons.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Added Accessories</span>
                  {selectedAddons.map(name => {
                    const ad = EXPERIENCE_ADDONS.find(a => a.name === name);
                    return ad && (
                      <div key={`addon-bill-${name}`} className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>✨ {name}</span>
                        <strong className="font-mono text-slate-800">{convertAndFormatPrice(ad.price)}</strong>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SUB TOTALS */}
              <div className="pt-4.5 border-t border-slate-150 space-y-2 text-[11px] text-slate-500">
                <div className="flex justify-between items-center">
                  <span>Gross Basket Sum</span>
                  <strong className="font-mono text-slate-800 font-semibold">{convertAndFormatPrice(getSubtotal())}</strong>
                </div>

                {getDiscountAmount() > 0 && (
                  <div className="flex justify-between items-center text-red-500 font-medium">
                    <span>Voucher Applied Discount</span>
                    <strong className="font-mono">- {convertAndFormatPrice(getDiscountAmount())}</strong>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Base Booking Levy</span>
                  <strong className="font-mono text-slate-800 font-semibold">{convertAndFormatPrice(getTaxesAndFees())}</strong>
                </div>
              </div>

              {/* CUMULATIVE TOTAL CHARGE */}
              <div className="pt-3.5 border-t border-slate-150 flex justify-between items-baseline">
                <span className="font-bold text-slate-700 text-xs uppercase tracking-wider font-display">Amount Payable</span>
                <strong className="text-xl sm:text-2xl font-black text-indigo-600 tracking-tight font-sans">
                  {convertAndFormatPrice(getAmountPayable())}
                </strong>
              </div>

              {/* TIMELINES FOR 70% ADVANCE RETENTION */}
              <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-800 text-[11px] font-bold rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span>SECURE WITH 70% DEPOSIT:</span>
                  <strong className="font-mono text-slate-900">{convertAndFormatPrice(Math.round(getAmountPayable() * 0.70))}</strong>
                </div>
                {paymentType === "advance-payment" && (
                  <p className="text-[10px] text-indigo-650 font-normal leading-normal">
                    * Active. Pay {convertAndFormatPrice(Math.round(getAmountPayable() * 0.70))} today to instantly lock slots. Remaining {convertAndFormatPrice(getAmountPayable() - Math.round(getAmountPayable() * 0.70))} payable at Tapovan base.
                  </p>
                )}
              </div>

            </div>
          </section>

          {/* MAJOR CTA ACTIONS */}
          <div className="space-y-3">
            <button
              onClick={validateAndSubmit}
              type="button"
              className="w-full py-4.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-center text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all font-display hover:-translate-y-0.5"
            >
              🔒 Complete Booking & Secure Slots
            </button>
            <p className="text-center text-[10px] text-slate-400 max-w-[90%] mx-auto leading-relaxed">
              By proceeding, you agree to secure data processing rules. Payments are fully encrypted by trusted processors.
            </p>
          </div>

        </aside>

      </div>

    </div>
  );
}
