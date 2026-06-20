import React, { useState, useEffect } from "react";
import { 
  MapPin, 
  Clock, 
  Heart, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  X, 
  Phone, 
  MessageSquare, 
  Sparkles,
  Shield,
  Coffee,
  Wifi,
  Compass,
  Calendar
} from "lucide-react";
import { UbexDatePicker } from "./UbexDatePicker";
import { t as translatorT } from "../utils/translator";
import { getWhatsAppNumber } from "../utils/contact";

interface StayItem {
  id: number;
  slug: string;
  title: string;
  loc: string;
  price: string;
  priceValue: number;
  story: string;
  img: string;
  features: string[];
  highlights: string[];
  trust: string;
  categories: string[];
  isPopular?: boolean;
  featured?: boolean;
  active: boolean;
  
  // Experience tags (Phases 1, 4, 7)
  communityScore: number;
  vibeTags: string[];
  travelerType: string[];
  experienceTags: string[];
  
  // Room and Capacity (Phases 1, 6)
  capacity: number;
  latitude: number;
  longitude: number;
  locationGroup: string;
  
  // Features (Phase 8)
  wifi: boolean;
  coworking: boolean;
  cafe: boolean;
  riversideAccess: boolean;
  parking: boolean;
  petFriendly: boolean;
  ac: boolean;
  hotWater: boolean;
  mountainView: boolean;

  // Dynamic room inventory and metadata architecture
  badges?: string[];
  propertyType?: string;
  rank?: number;
  featuredScore?: number;
  rating?: number;
  reviewCount?: number;
  propertySource?: string;
  availabilityEnabled?: boolean;
  inventorySummary?: {
    totalRooms: number;
    totalDormBeds: number;
    totalCapacity: number;
  };
  roomCategories?: {
    dorms: string[];
    private_rooms: string[];
    premium: string[];
  };
  roomInventory?: {
    name: string;
    inventory: number;
    availableUnits: number;
    occupancy: string;
    priceValue: number;
    amenities: string[];
    img: string;
    photos?: string[];
    status: string;
    description: string;
  }[];
}

const ALL_STAYS: StayItem[] = [
  {
    id: 1,
    slug: "ubex-home-rishikesh",
    title: "UbEx Home Rishikesh",
    loc: "Near Laxman Jhula • Tapovan • Rishikesh",
    price: "₹699",
    priceValue: 699,
    story: "The flagship UbEx community haven — a perfect balance of high-speed workation decks, yoga wellness zones, and riverside backpacker social spaces.",
    img: "/src/assets/images/supreme_studio_bed_1781787296976.jpg",
    features: ["Community Living", "Workation Ready", "UbEx Verified"],
    highlights: ["Community Stay", "Workation Ready", "Family Friendly", "Backpacker Friendly", "High Speed WiFi"],
    trust: "Top 1 Property • UbEx Verified",
    badges: ["Top 1 Property", "UbEx Verified"],
    categories: ["dorms", "private", "private_rooms", "premium", "workation", "family", "wellness", "corporate"],
    isPopular: true,
    featured: true,
    active: true,
    communityScore: 4.9,
    
    // Core parameters from Objective 10 and 11
    capacity: 36,
    propertyType: "Community Hostel",
    rank: 1,
    featuredScore: 100,
    rating: 4.9,
    reviewCount: 0,
    propertySource: "UBEX_OWNED",
    availabilityEnabled: true,
    
    // Merge standard filter vibes with beautiful discovery tags to pass all category & filter nodes smoothly
    vibeTags: [
      "Social", "Quiet", "Luxury", "Wellness", "Adventure", "Remote Work", "Family", "Retreat",
      "Community Living", "Workation Ready", "Wellness Friendly", "Corporate Friendly"
    ],
    travelerType: ["Digital Nomad Friendly", "Solo Traveler Friendly", "Backpacker Friendly", "Family Friendly", "Long Stay Friendly", "Couples Friendly"],
    experienceTags: ["Riverside", "Mountain View", "Yoga", "Coworking", "Bonfire", "Café Access", "Nature", "Adventure Access"],
    
    latitude: 30.1300,
    longitude: 78.3180,
    locationGroup: "Tapovan",
    wifi: true,
    coworking: true,
    cafe: true,
    riversideAccess: true,
    parking: true,
    petFriendly: true,
    ac: true,
    hotWater: true,
    mountainView: true,
    
    inventorySummary: {
      totalRooms: 10,
      totalDormBeds: 16,
      totalCapacity: 36
    },
    
    roomCategories: {
      dorms: ["AC Dormitory", "Non AC Dormitory"],
      private_rooms: [
        "Supreme Studio",
        "Premium Room",
        "Deluxe Room",
        "Deluxe Room 02"
      ],
      premium: [
        "Supreme Studio",
        "Premium Room"
      ]
    },
    
    roomInventory: [
      {
        name: "Supreme Studio",
        inventory: 1,
        availableUnits: 1,
        occupancy: "2 Adults",
        priceValue: 2999,
        amenities: ["Private Balcony", "King Size Bed", "Gigabit WiFi", "River View", "Kitchenette"],
        img: "/src/assets/images/supreme_studio_bed_1781787296976.jpg",
        photos: [
          "/src/assets/images/supreme_studio_bed_1781787296976.jpg",
          "/src/assets/images/supreme_studio_bath_1781787319505.jpg",
          "/src/assets/images/supreme_studio_view_1781787340895.jpg"
        ],
        status: "Only 1 Left",
        description: "The ultimate luxury space. Panoramic river views, private workspaces, premium lounge area, and personal balcony."
      },
      {
        name: "Premium Room",
        inventory: 3,
        availableUnits: 3,
        occupancy: "2 Adults",
        priceValue: 1999,
        amenities: ["Mountain View", "Queen Size Bed", "High Speed WiFi", "Attached Bath", "Work Desk"],
        img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&q=70",
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80",
          "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&q=80",
          "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&q=80",
          "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=900&q=80"
        ],
        status: "Available",
        description: "Elegant private suite overlooking pine-covered hilltops. Includes ergonomic working chairs and premium sleep beds."
      },
      {
        name: "Deluxe Room",
        inventory: 4,
        availableUnits: 4,
        occupancy: "2 Adults",
        priceValue: 1499,
        amenities: ["Comfort Bedding", "Attached Bath", "WiFi Connection", "AC Control", "Electric Kettle"],
        img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&q=70",
        photos: [
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80",
          "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=900&q=80",
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80"
        ],
        status: "Available",
        description: "Cosy comfort tailored for workation nomads or couples. Features bright natural light and full amenities."
      },
      {
        name: "Deluxe Room 02",
        inventory: 2,
        availableUnits: 2,
        occupancy: "2 Adults",
        priceValue: 1299,
        amenities: ["Comfort Bed", "Attached Bath", "WiFi Connection", "Ceiling Fan", "Hot Water"],
        img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=500&q=70",
        photos: [
          "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=900&q=80",
          "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=900&q=80",
          "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=900&q=80"
        ],
        status: "Available",
        description: "An elegant budget-friendly private layout with high speed internet, standard comfort, and a dedicated workspace."
      },
      {
        name: "AC Dormitory",
        inventory: 12,
        availableUnits: 12,
        occupancy: "1 Guest (1 Bed)",
        priceValue: 899,
        amenities: ["Privacy Curtain", "Reading Lamp", "Universal Plug", "Locker Room", "AC"],
        img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&q=70",
        photos: [
          "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=900&q=80",
          "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=900&q=80",
          "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=900&q=80"
        ],
        status: "Filling Fast",
        description: "Spacious premium bunk bed setup. Features full climate control, charging ports, and vibrant social community vibe."
      },
      {
        name: "Non AC Dormitory",
        inventory: 4,
        availableUnits: 4,
        occupancy: "1 Guest (1 Bed)",
        priceValue: 699,
        amenities: ["Locker Room", "High-power Fan", "Reading Light", "Fast WiFi", "Hot Water"],
        img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&q=70",
        photos: [
          "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=900&q=80",
          "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80",
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80"
        ],
        status: "Available",
        description: "Eco-friendly, budget-friendly shared layout designed for direct backpacker vibes and morning group treks."
      }
    ]
  }
];

const CATEGORIES = [
  { id: "all", title: "All Stays", img: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=400&q=80", icon: "🌐" },
  { id: "dorms", title: "Dorms", img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80", icon: "🏠" },
  { id: "private", title: "Private Rooms", img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80", icon: "🛏️" },
  { id: "premium", title: "Premium", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", icon: "✨" },
  { id: "villas", title: "Villas", img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80", icon: "🏘️" },
  { id: "workation", title: "Workation", img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80", icon: "💻" },
  { id: "family", title: "Family", img: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=400&q=80", icon: "👨‍👩‍👧" },
  { id: "wellness", title: "Wellness", img: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&q=80", icon: "🧘" },
  { id: "corporate", title: "Corporate", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80", icon: "🏢" }
];

const ADDONS = [
  { id: "addon-scooter", name: "🛵 Scooter Rental", price: "₹400 / day", priceValue: 400, img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=70" },
  { id: "addon-trek", name: "🏔 Group Trek", price: "₹650 / person", priceValue: 650, img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=70" },
  { id: "addon-breakfast", name: "🥐 Breakfast", price: "₹199 / day", priceValue: 199, img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=70", isMostAdded: true },
  { id: "addon-yoga", name: "🧘 Yoga Session", price: "₹350 / session", priceValue: 350, img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&q=70" },
  { id: "addon-cab", name: "🚖 Cab Pickup", price: "₹500 / trip", priceValue: 500, img: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&q=70" }
];

interface StaysPageProps {
  currency: string;
  convertAndFormatPrice: (val: number) => string;
  onBookStay: (
    stay: any,
    roomName: string,
    roomPrice: number,
    selectedAddons: string[],
    checkIn: string,
    checkOut: string,
    nights: number,
    guestsCount: number
  ) => void;
  sheetsPrices?: Record<string, number>;
  initialCategory?: string;
  
  // Shared states for "connect the booking widget with the stay page properly"
  externalCheckInDate?: Date | string | null;
  setExternalCheckInDate?: (d: Date) => void;
  externalCheckOutDate?: Date | string | null;
  setExternalCheckOutDate?: (d: Date) => void;
  externalGuestsCount?: number;
  setExternalGuestsCount?: (g: number) => void;

  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  lang?: string;
  externalSelectedVibes?: string[];
  setExternalSelectedVibes?: (val: string[] | ((prev: string[]) => string[])) => void;

  flexibleSearchMode?: "weekend" | "week" | "month" | null;
  flexibleSearchResults?: any[] | null;
  onClearFlexibleSearch?: () => void;
}

const FILTER_LOCATIONS = ["Tapovan", "Laxman Jhula", "Ram Jhula", "Riverside Area", "Upper Rishikesh"];
const FILTER_VIBES = ["Social", "Quiet", "Luxury", "Wellness", "Adventure", "Remote Work", "Family", "Retreat"];
const FILTER_COMMUNITIES = ["Solo Traveler Friendly", "Digital Nomad Friendly", "Backpacker Friendly", "Couples Friendly", "Family Friendly"];
const FILTER_EXPERIENCES = ["Riverside", "Mountain View", "Yoga", "Coworking", "Bonfire", "Café Access", "Nature", "Adventure Access"];
const FILTER_FEATURES = [
  { id: "wifi", label: "Free WiFi" },
  { id: "coworking", label: "Coworking Space" },
  { id: "cafe", label: "Café Onsite" },
  { id: "riverside", label: "Riverside Access" },
  { id: "parking", label: "Parking" },
  { id: "petFriendly", label: "Pet Friendly" },
  { id: "ac", label: "Air Conditioning" },
  { id: "hotWater", label: "Hot Water" },
  { id: "mountainView", label: "Mountain View" }
];

// Helper formula for Distance Filter (Phase 9)
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth travel radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

const RATES: Record<string, number> = {
  INR: 1.0,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0092,
  RUB: 1.12,
  CNY: 0.087,
  JPY: 1.88,
  KRW: 16.5,
  ILS: 0.044,
  AED: 0.044,
  AUD: 0.018,
  CAD: 0.0165,
  SGD: 0.016
};

export default function StaysPage({ 
  currency, 
  convertAndFormatPrice, 
  onBookStay, 
  sheetsPrices, 
  initialCategory,
  externalCheckInDate,
  setExternalCheckInDate,
  externalCheckOutDate,
  setExternalCheckOutDate,
  externalGuestsCount,
  setExternalGuestsCount,
  searchQuery: propSearchQuery,
  setSearchQuery: propSetSearchQuery,
  lang,
  externalSelectedVibes,
  setExternalSelectedVibes,
  flexibleSearchMode,
  flexibleSearchResults,
  onClearFlexibleSearch
}: StaysPageProps) {
  
  const t = (phrase: string): string => {
    return translatorT(lang || "EN", phrase);
  };
  
  // ─── STATE ARCHITECTURE (Phases 2-9) ───
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory && initialCategory !== "all" ? [initialCategory] : []
  );
  const [minPrice, setMinPrice] = useState<number>(400);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [capacityFilter, setCapacityFilter] = useState<number>(1);
  const [localSelectedVibes, setLocalSelectedVibes] = useState<string[]>([]);
  
  const selectedVibes = externalSelectedVibes !== undefined ? externalSelectedVibes : localSelectedVibes;
  const setSelectedVibes = (val: string[] | ((prev: string[]) => string[])) => {
    const updateFn = setExternalSelectedVibes !== undefined ? setExternalSelectedVibes : setLocalSelectedVibes;
    if (typeof val === "function") {
      updateFn(val(selectedVibes));
    } else {
      updateFn(val);
    }
  };

  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [distanceFilter, setDistanceFilter] = useState<number>(15); // Up to 15km
  const [sortBy, setSortBy] = useState<string>("recommended");
  const [localSearchQuery, setLocalSearchQuery] = useState<string>("");
  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
  const setSearchQuery = propSetSearchQuery !== undefined ? propSetSearchQuery : setLocalSearchQuery;
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [lastAppliedFilterType, setLastAppliedFilterType] = useState<string | null>(null);

  const parseDateToString = (d: Date | string | null | undefined, def: string): string => {
    if (!d) return def;
    if (typeof d === "string") return d;
    try {
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${da}`;
    } catch (e) {
      return def;
    }
  };

  // Sync external props for search widget integration
  const [checkInDate, setCheckInDate] = useState<string>(
    parseDateToString(externalCheckInDate, "2026-06-18")
  );
  const [checkOutDate, setCheckOutDate] = useState<string>(
    parseDateToString(externalCheckOutDate, "2026-06-21")
  );
  const [guestsCount, setGuestsCount] = useState<number>(externalGuestsCount || 2);

  const [likedStayIds, setLikedStayIds] = useState<number[]>([]);
  const [selectedStay, setSelectedStay] = useState<StayItem | null>(null);
  const [activeStayTab, setActiveStayTab] = useState<string>("gallery-sec");

  // Room / add-ons helpers
  const [selectedRoomName, setSelectedRoomName] = useState<string>("AC Dorm");
  const [activeRoomPhotoIdx, setActiveRoomPhotoIdx] = useState<number>(0);
  const [selectedRoomPrice, setSelectedRoomPrice] = useState<number>(899);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [showDatePickerPopup, setShowDatePickerPopup] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<"checkIn" | "checkOut">("checkIn");
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [stayCardImageIndex, setStayCardImageIndex] = useState<Record<number, number>>({});

  // Reset photo index when selected room changes
  useEffect(() => {
    setActiveRoomPhotoIdx(0);
  }, [selectedRoomName, selectedStay]);

  useEffect(() => {
    if (initialCategory && initialCategory !== "all") {
      setSelectedCategories([initialCategory]);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (externalCheckInDate) {
      setCheckInDate(parseDateToString(externalCheckInDate, "2026-06-18"));
    } else {
      setCheckInDate("");
    }
  }, [externalCheckInDate]);

  useEffect(() => {
    if (externalCheckOutDate) {
      setCheckOutDate(parseDateToString(externalCheckOutDate, "2026-06-21"));
    } else {
      setCheckOutDate("");
    }
  }, [externalCheckOutDate]);

  useEffect(() => {
    if (externalGuestsCount) setGuestsCount(externalGuestsCount);
  }, [externalGuestsCount]);

  // Synchronize date and guest values with parent App state
  const handleLocalCheckInChange = (val: string) => {
    setCheckInDate(val);
    if (setExternalCheckInDate) {
      if (!val) {
        setExternalCheckInDate(null);
      } else {
        const parts = val.split("-");
        if (parts.length === 3) {
          const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          setExternalCheckInDate(dObj);
        }
      }
    }
  };

  const handleLocalCheckOutChange = (val: string) => {
    setCheckOutDate(val);
    if (setExternalCheckOutDate) {
      if (!val) {
        setExternalCheckOutDate(null);
      } else {
        const parts = val.split("-");
        if (parts.length === 3) {
          const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          setExternalCheckOutDate(dObj);
        }
      }
    }
  };

  const handleLocalGuestsChange = (val: number) => {
    setGuestsCount(val);
    setExternalGuestsCount?.(val);
  };

  // ─── URL SYNCHRONIZATION ENGINE (Phase 11) ───
  useEffect(() => {
    // Parse on mount
    const params = new URLSearchParams(window.location.search);
    
    const cats = params.get("categories")?.split(",").filter(Boolean);
    if (cats && cats.length > 0) setSelectedCategories(cats);

    const minP = params.get("minPrice");
    if (minP) setMinPrice(Number(minP));

    const maxP = params.get("maxPrice");
    if (maxP) setMaxPrice(Number(maxP));

    const locs = params.get("locations")?.split(",").filter(Boolean);
    if (locs && locs.length > 0) setSelectedLocations(locs);

    const cap = params.get("capacity");
    if (cap) setCapacityFilter(Number(cap));

    const vbs = params.get("vibes")?.split(",").filter(Boolean);
    if (vbs && vbs.length > 0) setSelectedVibes(vbs);

    const comms = params.get("communities")?.split(",").filter(Boolean);
    if (comms && comms.length > 0) setSelectedCommunities(comms);

    const exps = params.get("experiences")?.split(",").filter(Boolean);
    if (exps && exps.length > 0) setSelectedExperiences(exps);

    const feats = params.get("features")?.split(",").filter(Boolean);
    if (feats && feats.length > 0) setSelectedFeatures(feats);

    const dist = params.get("distance");
    if (dist) setDistanceFilter(Number(dist));

    const sort = params.get("sortBy");
    if (sort) setSortBy(sort);

    const q = params.get("q");
    if (q) setSearchQuery(q);
  }, []);

  useEffect(() => {
    // Serialize update
    const params = new URLSearchParams();
    if (selectedCategories.length > 0) params.set("categories", selectedCategories.join(","));
    if (minPrice > 400) params.set("minPrice", String(minPrice));
    if (maxPrice < 10000) params.set("maxPrice", String(maxPrice));
    if (selectedLocations.length > 0) params.set("locations", selectedLocations.join(","));
    if (capacityFilter > 1) params.set("capacity", String(capacityFilter));
    if (selectedVibes.length > 0) params.set("vibes", selectedVibes.join(","));
    if (selectedCommunities.length > 0) params.set("communities", selectedCommunities.join(","));
    if (selectedExperiences.length > 0) params.set("experiences", selectedExperiences.join(","));
    if (selectedFeatures.length > 0) params.set("features", selectedFeatures.join(","));
    if (distanceFilter < 15) params.set("distance", String(distanceFilter));
    if (sortBy !== "recommended") params.set("sortBy", sortBy);
    if (searchQuery) params.set("q", searchQuery);

    const newQueryString = params.toString();
    const currentQueryString = window.location.search.replace(/^\?/, "");
    if (newQueryString !== currentQueryString) {
      const url = `${window.location.pathname}${newQueryString ? "?" + newQueryString : ""}`;
      window.history.replaceState(null, "", url);
    }
  }, [
    selectedCategories, minPrice, maxPrice, selectedLocations,
    capacityFilter, selectedVibes, selectedCommunities,
    selectedExperiences, selectedFeatures, distanceFilter, sortBy, searchQuery
  ]);

  // Calculated nights count helper
  const getNightsCount = () => {
    try {
      if (!checkInDate || !checkOutDate) return 3;
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 3;
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 3;
    } catch (e) {
      return 3;
    }
  };

  const formatDatePickerDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Select";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Select";
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  // Pricing override matcher
  const getOverridenPrice = (idOrKey: string | number, title: string, defaultValue: number): number => {
    if (!sheetsPrices) return defaultValue;
    const keyId = idOrKey ? idOrKey.toString().toLowerCase() : "";
    const keyTitle = title ? title.toLowerCase() : "";
    if (keyId && sheetsPrices[keyId] !== undefined) return sheetsPrices[keyId];
    if (keyTitle && sheetsPrices[keyTitle] !== undefined) return sheetsPrices[keyTitle];
    return defaultValue;
  };

  // Real-time overriden lists
  const staysSource = flexibleSearchResults && flexibleSearchResults.length > 0 ? flexibleSearchResults : ALL_STAYS;
  const staysList = staysSource.map(stay => {
    const overridenVal = getOverridenPrice(stay.id, stay.title, stay.priceValue);
    return {
      ...stay,
      priceValue: overridenVal,
      price: `₹${overridenVal}`
    };
  });

  const addonsList = ADDONS.map(addon => {
    const overridenVal = getOverridenPrice(addon.id, addon.name, addon.priceValue);
    return {
      ...addon,
      priceValue: overridenVal,
      price: `₹${overridenVal}`
    };
  });

  // ─── FILTER & DEBOUNCED SEARCH LOGIC (Phases 2-9) ───
  const filteredStays = staysList.filter(stay => {
    if (!stay.active) return false;

    // Search Query (title, location, story, features)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches = 
        stay.title.toLowerCase().includes(q) ||
        stay.loc.toLowerCase().includes(q) ||
        stay.story.toLowerCase().includes(q) ||
        stay.features.some(f => f.toLowerCase().includes(q));
      if (!matches) return false;
    }

    // Categories filter (Multi-select OR - Phase 2)
    if (selectedCategories.length > 0) {
      const matches = selectedCategories.some(cat => stay.categories.includes(cat));
      if (!matches) return false;
    }

    // Price filter (Phase 3)
    if (stay.priceValue < minPrice || stay.priceValue > maxPrice) return false;

    // Location Filter (OR - Phase 5)
    if (selectedLocations.length > 0) {
      if (!selectedLocations.includes(stay.locationGroup)) return false;
    }

    // Guest Capacity Filter (capacity >= selected - Phase 6)
    if (capacityFilter > 1) {
      if (stay.capacity < capacityFilter) return false;
    }

    // Stay Vibe Filter (Multi-select OR - Phase 7)
    if (selectedVibes.length > 0) {
      const matches = selectedVibes.some(v => {
        if (v === "Riverside") {
          return stay.locationGroup === "Riverside Area" || stay.highlights.includes("River View") || stay.experienceTags.includes("Riverside") || stay.features.includes("Riverside");
        }
        return stay.vibeTags.includes(v);
      });
      if (!matches) return false;
    }

    // Community Filters (Phase 4: OR within group)
    if (selectedCommunities.length > 0) {
      const matches = selectedCommunities.some(c => stay.travelerType.includes(c));
      if (!matches) return false;
    }

    // Experience Filters (Phase 4: OR within group)
    if (selectedExperiences.length > 0) {
      const matches = selectedExperiences.some(e => stay.experienceTags.includes(e));
      if (!matches) return false;
    }

    // Features Filters (AND across selected - Phase 8)
    if (selectedFeatures.length > 0) {
      for (const feat of selectedFeatures) {
        if (feat === "wifi" && !stay.wifi) return false;
        if (feat === "coworking" && !stay.coworking) return false;
        if (feat === "cafe" && !stay.cafe) return false;
        if (feat === "riverside" && !stay.riversideAccess) return false;
        if (feat === "parking" && !stay.parking) return false;
        if (feat === "petFriendly" && !stay.petFriendly) return false;
        if (feat === "ac" && !stay.ac) return false;
        if (feat === "hotWater" && !stay.hotWater) return false;
        if (feat === "mountainView" && !stay.mountainView) return false;
      }
    }

    // Distance Filter from Laxman Jhula Bridge Landmark (30.1300, 78.3180) (Phase 9)
    if (distanceFilter < 15) {
      const dist = getDistanceInKm(stay.latitude, stay.longitude, 30.1300, 78.3180);
      if (dist > distanceFilter) return false;
    }

    return true;
  });

  // ─── SORTING ARCHITECTURE (Phase 10) ───
  const sortedStays = [...filteredStays].sort((a, b) => {
    if (sortBy === "lowest-price") {
      return a.priceValue - b.priceValue;
    }
    if (sortBy === "highest-price") {
      return b.priceValue - a.priceValue;
    }
    if (sortBy === "most-popular") {
      return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
    }
    if (sortBy === "newest") {
      return b.id - a.id; // simulation
    }
    if (sortBy === "best-community") {
      return b.communityScore - a.communityScore;
    }
    if (sortBy === "remote-work") {
      const scoreA = (a.coworking ? 3 : 0) + (a.wifi ? 2 : 0) + a.communityScore;
      const scoreB = (b.coworking ? 3 : 0) + (b.wifi ? 2 : 0) + b.communityScore;
      return scoreB - scoreA;
    }
    // Recommended
    if (flexibleSearchMode) {
      if (a.rankingScore !== undefined && b.rankingScore !== undefined) {
        return b.rankingScore - a.rankingScore;
      }
    }
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  // Individual toggle filter helpers
  const handleCategoryToggle = (catId: string) => {
    setLastAppliedFilterType("categories");
    if (catId === "all") {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(prev => 
        prev.includes(catId) ? prev.filter(x => x !== catId) : [...prev, catId]
      );
    }
  };

  const handleLocationToggle = (loc: string) => {
    setLastAppliedFilterType("locations");
    setSelectedLocations(prev => 
      prev.includes(loc) ? prev.filter(x => x !== loc) : [...prev, loc]
    );
  };

  const handleVibeToggle = (vibe: string) => {
    setLastAppliedFilterType("vibes");
    setSelectedVibes(prev => 
      prev.includes(vibe) ? prev.filter(x => x !== vibe) : [...prev, vibe]
    );
  };

  const handleCommunityToggle = (comm: string) => {
    setLastAppliedFilterType("communities");
    setSelectedCommunities(prev => 
      prev.includes(comm) ? prev.filter(x => x !== comm) : [...prev, comm]
    );
  };

  const handleExperienceToggle = (exp: string) => {
    setLastAppliedFilterType("experiences");
    setSelectedExperiences(prev => 
      prev.includes(exp) ? prev.filter(x => x !== exp) : [...prev, exp]
    );
  };

  const handleFeatureToggle = (featId: string) => {
    setLastAppliedFilterType("features");
    setSelectedFeatures(prev => 
      prev.includes(featId) ? prev.filter(x => x !== featId) : [...prev, featId]
    );
  };

  // Undo last applied filter action (Phase 12)
  const handleUndoLastFilter = () => {
    if (!lastAppliedFilterType) return;
    if (lastAppliedFilterType === "categories") setSelectedCategories([]);
    if (lastAppliedFilterType === "locations") setSelectedLocations([]);
    if (lastAppliedFilterType === "vibes") setSelectedVibes([]);
    if (lastAppliedFilterType === "communities") setSelectedCommunities([]);
    if (lastAppliedFilterType === "experiences") setSelectedExperiences([]);
    if (lastAppliedFilterType === "features") setSelectedFeatures([]);
    setLastAppliedFilterType(null);
  };

  const handleClearAllFilters = () => {
    setSelectedCategories([]);
    setMinPrice(400);
    setMaxPrice(10000);
    setSelectedLocations([]);
    setCapacityFilter(1);
    setSelectedVibes([]);
    setSelectedCommunities([]);
    setSelectedExperiences([]);
    setSelectedFeatures([]);
    setDistanceFilter(15);
    setSortBy("recommended");
    setSearchQuery("");
    setLastAppliedFilterType(null);
  };

  const toggleWish = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (likedStayIds.includes(id)) {
      setLikedStayIds(prev => prev.filter(x => x !== id));
    } else {
      setLikedStayIds(prev => [...prev, id]);
    }
  };

  const handleOpenDrawer = (stay: StayItem | any) => {
    setSelectedStay(stay);
    setActiveStayTab("gallery-sec");
    if (stay.firstAvailableWindow) {
      if (setExternalCheckInDate) setExternalCheckInDate(new Date(stay.firstAvailableWindow.start));
      if (setExternalCheckOutDate) setExternalCheckOutDate(new Date(stay.firstAvailableWindow.end));
    }
    if (stay.roomInventory && stay.roomInventory.length > 0) {
      setSelectedRoomName(stay.roomInventory[0].name);
      setSelectedRoomPrice(stay.roomInventory[0].priceValue);
    } else {
      setSelectedRoomName(stay.categories.includes("dorms") ? "AC Dormitory" : "Supreme Studio");
      setSelectedRoomPrice(stay.priceValue);
    }
    setSelectedAddons([]);
    setBookingStatus(null);
  };

  const toggleAddon = (addonId: string) => {
    if (selectedAddons.includes(addonId)) {
      setSelectedAddons(prev => prev.filter(x => x !== addonId));
    } else {
      setSelectedAddons(prev => [...prev, addonId]);
    }
  };

  const getCumulativePrice = () => {
    let total = selectedRoomPrice;
    selectedAddons.forEach(addonId => {
      const add = addonsList.find(a => a.id === addonId);
      if (add) total += add.priceValue;
    });
    return total;
  };

  const handleInquiryTrigger = async (type: "phone" | "wa" | "check") => {
    if (!selectedStay) return;
    const finalAmt = getCumulativePrice();
    if (type === "wa") {
      setBookingStatus("Generating secure inquiry record and opening WhatsApp...");
      try {
        const payload = {
          inquiryType: "stay",
          listingId: selectedStay.id,
          listingTitle: selectedStay.title,
          category: selectedStay.category,
          roomName: selectedRoomName,
          selectedDate: checkInDate,
          selectedDates: [checkInDate, checkOutDate],
          guestCount: guestsCount,
          selectedAddons: selectedAddons,
          sourcePage: "Stays Detail Drawer"
        };
        const res = await fetch("/api/inquiries/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success && result.whatsAppUrl) {
          window.open(result.whatsAppUrl, "_blank");
          setBookingStatus(`Inquiry generated: ${result.inquiryId}! Opening WhatsApp chat...`);
        } else {
          throw new Error(result.error || "Failed to initiate dynamic inquiry.");
        }
      } catch (err: any) {
        console.error("Inquiry integration failure:", err);
        const text = `Hello! I am interested in inquiring about ${selectedStay.title} (${selectedRoomName}) with ${selectedAddons.length} addons, with a total of ${convertAndFormatPrice(finalAmt)}.`;
        window.open(`https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(text)}`, "_blank");
        setBookingStatus(`WhatsApp chat opened (fallback): ${err.message}`);
      }
    } else if (type === "phone") {
      window.location.href = `tel:+${getWhatsAppNumber()}`;
      setBookingStatus(`Calling direct response hotline at +${getWhatsAppNumber()} regarding ${selectedStay.title}...`);
    } else {
      setBookingStatus("Verifying logs and check-in availability...");
    }

    setTimeout(() => {
      setBookingStatus(null);
    }, 6500);
  };

  return (
    <div className="font-sans antialiased text-[#0F1B3C] bg-slate-50 min-h-screen">
      
      {/* ─── HERO OUTPOSTS SECTION ─── */}
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
            Cozy Refuges & Discoveries
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-3 leading-tight font-display">
            Discover Your Ideal Outpost
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 font-light max-w-xl mx-auto leading-relaxed">
            Luxury hill villas, remote work capsules, social dorms, and spiritual yoga retreats built alongside the holy river Ganga.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════
           CATEGORY STRIP COMPONENT (Phase 2 Sync)
      ════════════════════════════════════════ */}
      <div className="sticky top-0 bg-white/95 border-b border-slate-200/60 shadow-xs z-30 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          
          <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-black text-indigo-950 tracking-widest uppercase flex-shrink-0">
            <Compass className="w-4 h-4 text-indigo-600" /> Explore
          </span>

          {/* Scrolling horizontal category wrapper */}
          <div className="flex-1 overflow-x-auto scrollbar-none flex gap-2.5 items-center py-1">
            {CATEGORIES.map(cat => {
              const isActive = cat.id === "all" 
                ? selectedCategories.length === 0 
                : selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryToggle(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl cursor-pointer text-xs font-bold transition-all whitespace-nowrap shadow-xs border ${
                    isActive 
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-sm" 
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.title}</span>
                  {isActive && <Check className="w-3 h-3 text-white ml-1" />}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════
           MAIN CO-ORDINATED FILTER LAYOUT
      ════════════════════════════════════════ */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-8">
        
        {flexibleSearchMode && (
          <div className="mb-8 p-4.5 bg-indigo-50/50 border border-indigo-150 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-indigo-600/10 flex items-center justify-center text-base shrink-0 select-none">
                ✨
              </span>
              <div>
                <h4 className="text-xs font-black text-[#001166] uppercase tracking-widest leading-none">
                  Spontaneous Flexible Voyage Active
                </h4>
                <p className="text-[11px] text-[#001166] mt-1.5 font-bold">
                  Showing available properties for <span className="underline decoration-2 decoration-amber-400 font-extrabold capitalize">Any {flexibleSearchMode}</span>, ordered by dynamic availability & prestige score.
                </p>
              </div>
            </div>
            <button
              onClick={onClearFlexibleSearch}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-650 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all self-end sm:self-auto cursor-pointer border-0"
            >
              Reset Flexible Search ×
            </button>
          </div>
        )}
        
        {/* Filter Navigation Bar & Mobile Toggles */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {t("Bespoke Spaces in Uttarakhand")}
            </h2>
            <p className="text-xs text-slate-450 mt-1">
              {t("Showing")} <span className="font-bold text-indigo-650">{sortedStays.length}</span> {t("matching outposts of")} {staysList.length} {t("total curated locations")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Property */}
            <div className="relative flex-1 md:flex-none min-w-[200px]">
              <input 
                type="text"
                placeholder={t("Search stays or amenities...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-250 py-2 pl-3 pr-8 rounded-xl text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery ? (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              ) : (
                <span className="absolute right-2.5 top-2.5 text-slate-350">🔍</span>
              )}
            </div>

            {/* Sorting Dropdown (Phase 10) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-450 font-mono font-medium whitespace-nowrap">Sort By</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-slate-250 py-2 px-3 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-505"
              >
                <option value="recommended">✨ Recommended</option>
                <option value="lowest-price">💰 Price: Low to High</option>
                <option value="highest-price">💎 Price: High to Low</option>
                <option value="most-popular">🔥 Most Popular</option>
                <option value="newest">🕒 Newest Added</option>
                <option value="best-community">💬 Best Community Score</option>
                <option value="remote-work">💻 Nomad Coworx Grade</option>
              </select>
            </div>

            {/* Mobile Filter Trigger */}
            <button 
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden bg-indigo-50 text-indigo-750 px-4 py-2 border border-indigo-100 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer hover:bg-indigo-100 active:scale-95"
            >
              <span>⚙️ Filters</span>
              {selectedLocations.length + selectedVibes.length + selectedFeatures.length + selectedCommunities.length + selectedExperiences.length > 0 && (
                <span className="w-2 h-2 bg-rose-500 rounded-full inline-block" />
              )}
            </button>
          </div>
        </div>

        {/* Co-ordinated Layout Columns Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ─── FILTERS SIDEBAR PANEL (Desktop - Classes & Phases 2-10) ─── */}
          <aside className="hidden lg:block lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <span className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                ⚙️ Discovery Filters
              </span>
              <button 
                onClick={handleClearAllFilters}
                className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold tracking-tight uppercase"
              >
                Clear All
              </button>
            </div>

            {/* Price Filter Slider & Range Input (Phase 3) */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                Nightly Standard Budget ({currency})
              </label>
              <div className="flex items-center justify-between gap-2.5">
                <div className="w-1/2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] text-slate-400 font-bold block">MIN</span>
                  <input 
                    type="number" 
                    value={Math.round(minPrice * (RATES[currency] || 1.0))} 
                    onChange={(e) => {
                      const valLocal = Number(e.target.value);
                      const valInr = Math.round(valLocal / (RATES[currency] || 1.0));
                      setMinPrice(Math.max(0, valInr));
                    }}
                    className="w-full bg-transparent border-0 p-0 text-xs text-slate-800 font-bold focus:ring-0 focus:outline-none" 
                  />
                </div>
                <div className="w-1/2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] text-slate-400 font-bold block">MAX</span>
                  <input 
                    type="number" 
                    value={Math.round(maxPrice * (RATES[currency] || 1.0))} 
                    onChange={(e) => {
                      const valLocal = Number(e.target.value);
                      const valInr = Math.round(valLocal / (RATES[currency] || 1.0));
                      setMaxPrice(Math.max(minPrice, valInr));
                    }}
                    className="w-full bg-transparent border-0 p-0 text-xs text-slate-800 font-bold focus:ring-0 focus:outline-none" 
                  />
                </div>
              </div>
              <input 
                type="range"
                min={Math.round(400 * (RATES[currency] || 1.0))}
                max={Math.round(10000 * (RATES[currency] || 1.0))}
                step={Math.max(1, Math.round(100 * (RATES[currency] || 1.0)))}
                value={Math.round(maxPrice * (RATES[currency] || 1.0))}
                onChange={(e) => {
                  const valLocal = Number(e.target.value);
                  const valInr = Math.round(valLocal / (RATES[currency] || 1.0));
                  setMaxPrice(valInr);
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-[10px] text-slate-400 font-medium block">
                Range: {convertAndFormatPrice(minPrice)} - {convertAndFormatPrice(maxPrice)}+ per night
              </span>
            </div>

            {/* Geographic Location Selection (Phase 5) */}
            <div className="space-y-2 border-t pt-4 border-slate-100">
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                Geographic Areas (OR)
              </label>
              <div className="space-y-1.5">
                {FILTER_LOCATIONS.map(loc => {
                  const isChecked = selectedLocations.includes(loc);
                  return (
                    <label key={loc} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleLocationToggle(loc)}
                        className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className={isChecked ? "font-bold text-indigo-950" : "font-normal text-slate-650"}>{loc}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Distance Filter (Phase 9) */}
            <div className="space-y-2 border-t pt-4 border-slate-100">
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                Distance from Laxman Jhula Bridge
              </label>
              <input 
                type="range"
                min="1"
                max="15"
                step="1"
                value={distanceFilter}
                onChange={(e) => setDistanceFilter(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-[10px] text-slate-400 font-semibold block">
                {distanceFilter >= 15 ? "Any distance from center" : `Within ${distanceFilter} km of landmark (Bridge)`}
              </span>
            </div>

            {/* Capacity Filter (Phase 6) */}
            <div className="space-y-2 border-t pt-4 border-slate-100">
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                Minimum Guest Capacity
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 4, 6, 8].map(capNum => (
                  <button
                    key={capNum}
                    onClick={() => setCapacityFilter(capNum)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      capacityFilter === capNum
                      ? "bg-indigo-600 text-white border-transparent"
                      : "bg-slate-50 text-slate-600 border-slate-205 hover:bg-slate-100"
                    }`}
                  >
                    {capNum === 1 ? "Solo" : capNum === 8 ? "8+" : `${capNum}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Stay Vibe Filter (Phase 7) */}
            <div className="space-y-2 border-t pt-4 border-slate-100">
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                Cozy Stay Vibes (OR)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {FILTER_VIBES.map(vibe => {
                  const isSelected = selectedVibes.includes(vibe);
                  return (
                    <button
                      key={vibe}
                      onClick={() => handleVibeToggle(vibe)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                        isSelected 
                        ? "bg-indigo-50 text-indigo-850 border-indigo-300"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {vibe}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Community travelerType (Phase 4) */}
            <div className="space-y-2 border-t pt-4 border-slate-100">
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                Community Focus (OR)
              </label>
              <div className="space-y-1.5">
                {FILTER_COMMUNITIES.map(comm => {
                  const isChecked = selectedCommunities.includes(comm);
                  return (
                    <label key={comm} className="flex items-center gap-2 text-xs text-slate-705 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCommunityToggle(comm)}
                        className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className={isChecked ? "font-bold text-slate-900" : "font-normal text-slate-500"}>{comm}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Experience & Terrain Filter Tags (Phase 4) */}
            <div className="space-y-2 border-t pt-4 border-slate-100">
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                Surrounds & Access (OR)
              </label>
              <div className="space-y-1.5">
                {FILTER_EXPERIENCES.map(exp => {
                  const isChecked = selectedExperiences.includes(exp);
                  return (
                    <label key={exp} className="flex items-center gap-2 text-xs text-slate-705 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleExperienceToggle(exp)}
                        className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className={isChecked ? "font-bold text-slate-900" : "font-normal text-slate-500"}>{exp}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Amenity Features Filters (Phase 8 - AND) */}
            <div className="space-y-2 border-t pt-4 border-slate-100">
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                Vital Outpost Features (AND)
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {FILTER_FEATURES.map(feat => {
                  const isChecked = selectedFeatures.includes(feat.id);
                  return (
                    <label key={feat.id} className="flex items-center gap-2 text-xs text-slate-705 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleFeatureToggle(feat.id)}
                        className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className={isChecked ? "font-bold text-slate-900" : "font-normal text-slate-500"}>{feat.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Undo last applied filter action (Phase 12) */}
            {lastAppliedFilterType && (
              <div className="border-t pt-4 border-slate-100">
                <button
                  onClick={handleUndoLastFilter}
                  className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 py-2 rounded-xl text-[10px] font-bold tracking-wide uppercase transition-all"
                >
                  ↩ Undo Last Filter Click
                </button>
              </div>
            )}
          </aside>

          {/* ─── STAYS CATALOG CARDS GRID (75% on Desktop) ─── */}
          <div className="lg:col-span-9">
            
            {/* Quick check state helper */}
            {sortedStays.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedStays.map(stay => {
                  const isLiked = likedStayIds.includes(stay.id);
                  const distanceVal = getDistanceInKm(stay.latitude, stay.longitude, 30.1300, 78.3180).toFixed(1);
                  return (
                    <div 
                      key={stay.id} 
                      onClick={() => handleOpenDrawer(stay)}
                      className="bg-white rounded-[24px] border border-slate-200 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col justify-between"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 group/cardimg">
                        {(() => {
                          const stayPhotos = [
                            stay.img,
                            ...(stay.roomInventory || []).flatMap(r => r.photos || [])
                          ].filter((url, index, self) => url && self.indexOf(url) === index);
                          
                          const activePhotoIdx = stayCardImageIndex[stay.id] || 0;
                          const activePhotoUrl = stayPhotos[activePhotoIdx % stayPhotos.length] || stay.img;

                          return (
                            <>
                              <img 
                                src={activePhotoUrl} 
                                className="w-full h-full object-cover transition-transform duration-500 transform hover:scale-[1.03]" 
                                alt={stay.title}
                                referrerPolicy="no-referrer"
                              />

                              {stayPhotos.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextIdx = (activePhotoIdx - 1 + stayPhotos.length) % stayPhotos.length;
                                    setStayCardImageIndex(prev => ({ ...prev, [stay.id]: nextIdx }));
                                  }}
                                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-indigo-600 hover:text-white text-slate-750 flex items-center justify-center transition-all opacity-0 group-hover/cardimg:opacity-100 shadow-md backdrop-blur-xs z-10"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                              )}

                              {stayPhotos.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextIdx = (activePhotoIdx + 1) % stayPhotos.length;
                                    setStayCardImageIndex(prev => ({ ...prev, [stay.id]: nextIdx }));
                                  }}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-indigo-600 hover:text-white text-slate-750 flex items-center justify-center transition-all opacity-0 group-hover/cardimg:opacity-100 shadow-md backdrop-blur-xs z-10"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              )}

                              {stayPhotos.length > 1 && (
                                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1 z-10 pointer-events-none">
                                  {stayPhotos.slice(0, 8).map((_, dotIdx) => {
                                    const isActiveDot = dotIdx === (activePhotoIdx % stayPhotos.length);
                                    return (
                                      <span
                                        key={dotIdx}
                                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                          isActiveDot ? "bg-white w-3 scale-110" : "bg-white/50"
                                        }`}
                                      />
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          );
                        })()}
                        {stay.badges && stay.badges.length > 0 ? (
                          <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                            {stay.badges.map((badge, bIdx) => (
                              <span 
                                key={bIdx}
                                className={`font-extrabold text-[9px] uppercase px-2.5 py-1 rounded-md shadow-xs tracking-wider font-mono ${
                                  badge.includes("Verified") 
                                  ? "bg-emerald-600 text-white" 
                                  : "bg-indigo-600 text-white"
                                }`}
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        ) : stay.isPopular && (
                          <span className="absolute top-4 left-4 bg-indigo-600 text-white font-extrabold text-[10px] uppercase px-3 py-1 rounded-full shadow tracking-wider font-mono z-10">
                            popular
                          </span>
                        )}
                        <button 
                          onClick={(e) => toggleWish(e, stay.id)}
                          className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full shadow flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10"
                        >
                          <Heart className={`w-4.5 h-4.5 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-slate-500"}`} />
                        </button>
                        
                        <div className="absolute bottom-3 left-3 bg-slate-900/75 text-white font-mono text-[9px] px-2.5 py-1 rounded-full backdrop-blur-xs select-none z-10">
                          📍 {stay.locationGroup} • {distanceVal} km from bridge
                        </div>
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight line-clamp-1">
                              {stay.title}
                            </h3>
                            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold font-mono">
                              ⭐ {stay.communityScore || 4.9}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-455 line-clamp-2 mt-1 leading-relaxed text-slate-400">
                            {stay.story}
                          </p>

                          {/* Category Discovery Tags */}
                          {stay.categories && stay.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {stay.categories
                                .filter(cat => cat !== "private")
                                .slice(0, 4)
                                .map((catKey) => {
                                  const matchCat = CATEGORIES.find(c => c.id === catKey);
                                  if (!matchCat) return null;
                                  return (
                                    <span key={catKey} className="text-[9px] font-bold text-indigo-700 bg-indigo-50/50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                      {matchCat.icon} {matchCat.title}
                                    </span>
                                  );
                                })}
                            </div>
                          )}

                          {/* Tag list */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {stay.vibeTags.slice(0, 3).map((v, idx) => (
                              <span key={idx} className="text-[9px] font-bold text-indigo-600 bg-slate-100 border border-slate-205 px-2 py-0.5 rounded-full font-mono">
                                {v}
                              </span>
                            ))}
                          </div>

                          {/* Highlight icons list */}
                          <div className="flex flex-wrap gap-3 items-center mt-4 pt-3 border-t border-slate-100">
                            {stay.highlights.map((h, i) => (
                              <span key={i} className="flex items-center gap-1 text-slate-500 text-[10px] font-bold">
                                <Check className="w-3 h-3 text-emerald-600" />
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>

                        {stay.firstAvailableWindow && (
                          <div className="mt-4 p-3.5 bg-amber-50/50 border border-amber-200/40 rounded-2xl text-left shadow-xs">
                            <span className="text-[9px] font-black text-amber-900 uppercase tracking-widest block leading-none">📅 Curated Spontaneous Date</span>
                            <span className="text-xs font-black text-[#001166] mt-1.5 block">
                              {stay.firstAvailableWindow.label}
                            </span>
                            <span className="text-[10px] text-indigo-950/70 block font-bold mt-1">
                              Total Est: <span className="font-mono text-indigo-700 font-extrabold">{convertAndFormatPrice(stay.firstAvailableWindow.totalPrice)}</span> ({stay.firstAvailableWindow.nights} nights)
                            </span>
                          </div>
                        )}

                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-650">
                            <span>🌍</span> {stay.trust}
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Starts At</span>
                            <span className="text-base font-black text-indigo-650 font-mono">
                              {convertAndFormatPrice(stay.priceValue)} <span className="text-xs text-slate-400 font-light">/ night</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              
              /* ─── ZERO RESULTS EMPTY STATE HANDLING (Phase 12) ─── */
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/50 p-8 max-w-xl mx-auto shadow-xs">
                <Compass className="w-14 h-14 text-indigo-400/80 mx-auto animate-pulse mb-4" />
                <h3 className="font-extrabold text-slate-800 text-lg">No Matching Outposts Found</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  We currently do not have active inventory matching your exact criteria combinations. Let's trace back.
                </p>

                {/* Undo / Clear actions buttons */}
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {lastAppliedFilterType && (
                    <button 
                      onClick={handleUndoLastFilter}
                      className="px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
                    >
                      ↩ Undo Last Action
                    </button>
                  )}
                  <button 
                    onClick={handleClearAllFilters}
                    className="px-4 py-2 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    ✨ Reset All Filters
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-150 text-left">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Suggested Presets:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button 
                      onClick={() => {
                        handleClearAllFilters();
                        setMaxPrice(1500);
                      }} 
                      className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-120 px-3 py-1 rounded-lg"
                    >
                      Budget: Under {convertAndFormatPrice(1500)}
                    </button>
                    <button 
                      onClick={() => {
                        handleClearAllFilters();
                        setSelectedCategories(["dorms"]);
                        setSelectedVibes(["Social"]);
                      }} 
                      className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-120 px-3 py-1 rounded-lg"
                    >
                      Social Bunk Communities
                    </button>
                    <button 
                      onClick={() => {
                        handleClearAllFilters();
                        setSelectedFeatures(["coworking", "wifi"]);
                      }} 
                      className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-120 px-3 py-1 rounded-lg"
                    >
                      Connected Workations
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ─── MOBILE FILTERS COMPONENT / SLIDE-IN MODAL (Phases 2-10) ─── */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex justify-end">
          <div onClick={() => setShowMobileFilters(false)} className="absolute inset-0" />
          
          <div className="relative w-full max-w-sm bg-white h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl transition-transform duration-300">
            <div>
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <span className="text-sm font-black text-slate-900 uppercase">Filters</span>
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-400 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                
                {/* Price input */}
                <div className="space-y-2">
                  <span className="block text-[11px] font-black uppercase text-slate-400">Nightly Rate ({currency})</span>
                  <div className="flex gap-2">
                    <div className="w-1/2 p-2 bg-slate-50 border rounded-lg flex flex-col">
                      <span className="text-[8px] text-slate-400 uppercase font-bold">MIN</span>
                      <input 
                        type="number" 
                        value={Math.round(minPrice * (RATES[currency] || 1.0))} 
                        onChange={(e) => {
                          const valLocal = Number(e.target.value);
                          const valInr = Math.round(valLocal / (RATES[currency] || 1.0));
                          setMinPrice(Math.max(0, valInr));
                        }}
                        className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none" 
                      />
                    </div>
                    <div className="w-1/2 p-2 bg-slate-50 border rounded-lg flex flex-col">
                      <span className="text-[8px] text-slate-400 uppercase font-bold">MAX</span>
                      <input 
                        type="number" 
                        value={Math.round(maxPrice * (RATES[currency] || 1.0))} 
                        onChange={(e) => {
                          const valLocal = Number(e.target.value);
                          const valInr = Math.round(valLocal / (RATES[currency] || 1.0));
                          setMaxPrice(Math.max(minPrice, valInr));
                        }}
                        className="w-full bg-transparent border-0 p-0 text-xs font-bold focus:outline-none" 
                      />
                    </div>
                  </div>
                </div>

                {/* Locations */}
                <div className="space-y-2">
                  <span className="block text-[11px] font-black uppercase text-slate-400">Geographic Areas</span>
                  <div className="flex flex-wrap gap-1.5">
                    {FILTER_LOCATIONS.map(loc => {
                      const isSelected = selectedLocations.includes(loc);
                      return (
                        <button
                          key={loc}
                          onClick={() => handleLocationToggle(loc)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold ${
                            isSelected ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-600"
                          }`}
                        >
                          {loc}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Distance Filter */}
                <div className="space-y-2">
                  <span className="block text-[11px] font-black uppercase text-slate-400">Distance Limit</span>
                  <input 
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={distanceFilter}
                    onChange={(e) => setDistanceFilter(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    {distanceFilter >= 15 ? "Any distance from landmark" : `Within ${distanceFilter} km of Laxman Jhula`}
                  </span>
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                  <span className="block text-[11px] font-black uppercase text-slate-400">Guest Capacity</span>
                  <div className="flex gap-2">
                    {[1, 2, 4, 6].map(cc => (
                      <button 
                        key={cc} 
                        onClick={() => setCapacityFilter(cc)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${
                          capacityFilter === cc ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {cc === 1 ? "Solo" : `${cc}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vibes */}
                <div className="space-y-2">
                  <span className="block text-[11px] font-black uppercase text-slate-400">Vibes</span>
                  <div className="flex flex-wrap gap-1.5">
                    {FILTER_VIBES.map(vb => {
                      const isS = selectedVibes.includes(vb);
                      return (
                        <button
                          key={vb}
                          onClick={() => handleVibeToggle(vb)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                            isS ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-slate-500"
                          }`}
                        >
                          {vb}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            <div className="pt-6 border-t flex gap-3">
              <button 
                onClick={handleClearAllFilters}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-bold"
              >
                Reset
              </button>
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="w-1/2 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
           FULLSCREEN STAY DRAWER
      ════════════════════════════════════════ */}
      {selectedStay && (
        <div className="experience-drawer active">
          
          <div onClick={() => setSelectedStay(null)} className="drawer-overlay" />

          <div className="drawer-container transition-transform duration-500" style={{ width: "min(1100px, 95vw)" }}>
            
            {/* Topbar Utility */}
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-40">
              <button 
                onClick={() => setSelectedStay(null)}
                className="flex items-center gap-1 px-4 py-2 hover:bg-slate-100 text-indigo-600 text-xs font-bold rounded-full transition-all border border-slate-150"
              >
                ← Back
              </button>
              
              {/* Floating scroll indicator */}
              <div className="hidden sm:flex gap-1 items-center bg-slate-100 p-1.5 rounded-full border border-slate-200 text-[11px] font-bold select-none">
                {["gallery-sec", "rooms-sec", "videos-sec", "amenities-sec", "addons-sec", "reviews-sec", "location-sec"].map(tabId => {
                  const label = tabId.split("-")[0].toUpperCase();
                  const isActive = activeStayTab === tabId;
                  return (
                    <button
                      key={tabId}
                      onClick={() => {
                        setActiveStayTab(tabId);
                        const element = document.getElementById(tabId);
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full transition-all ${
                        isActive ? "bg-indigo-650 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setSelectedStay(null)}
                className="w-10 h-10 rounded-full border border-slate-150 bg-slate-50 hover:bg-slate-100 hover:rotate-90 transition-all duration-300 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Simulated scrollable body */}
            <div className="h-[calc(100vh-76px)] overflow-y-auto pb-24" id="stayDrawerBody">
              
              {/* Interactive Room-Specific Photo Gallery Banner */}
              {(() => {
                const currentRoom = (selectedStay.roomInventory || []).find(r => r.name === selectedRoomName);
                const roomPhotos = currentRoom?.photos || [currentRoom?.img || selectedStay.img];
                const activePhotoUrl = roomPhotos[activeRoomPhotoIdx % roomPhotos.length] || selectedStay.img;

                return (
                  <div id="gallery-sec" className="relative group bg-slate-900 overflow-hidden select-none" style={{ aspectRatio: "2.1/1" }}>
                    {/* Main Image */}
                    <img 
                      src={activePhotoUrl} 
                      className="w-full h-full object-cover filter brightness-[0.85] transition-all duration-500 transform hover:scale-[1.01]" 
                      alt={`${selectedRoomName} Gallery`}
                      referrerPolicy="no-referrer"
                    />

                    {/* Left arrow */}
                    {roomPhotos.length > 1 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveRoomPhotoIdx(prev => (prev - 1 + roomPhotos.length) % roomPhotos.length);
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-indigo-600 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xs z-10 font-bold"
                      >
                        ←
                      </button>
                    )}

                    {/* Right arrow */}
                    {roomPhotos.length > 1 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveRoomPhotoIdx(prev => (prev + 1) % roomPhotos.length);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-indigo-600 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xs z-10 font-bold"
                      >
                        →
                      </button>
                    )}

                    {/* Bottom Indicator and Thumbnails */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] bg-indigo-600/90 text-white font-extrabold px-2.5 py-1 rounded-md uppercase tracking-widest font-mono shadow-xs block w-fit">
                            Active Choice Gallery • {selectedRoomName}
                          </span>
                          <p className="text-xs text-slate-300 font-medium">
                            Viewing photo {activeRoomPhotoIdx + 1} of {roomPhotos.length}
                          </p>
                        </div>

                        {/* Interactive thumbnail strip inside the banner */}
                        {roomPhotos.length > 1 && (
                          <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-[280px] scrollbar-thin">
                            {roomPhotos.map((p, thumbIdx) => {
                              const isThumbActive = thumbIdx === activeRoomPhotoIdx;
                              return (
                                <button
                                  key={thumbIdx}
                                  onClick={() => setActiveRoomPhotoIdx(thumbIdx)}
                                  className={`w-10 sm:w-12 aspect-[4/3] rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                                    isThumbActive ? "border-indigo-500 scale-105 ring-2 ring-indigo-500/20" : "border-white/40 hover:border-white"
                                  }`}
                                >
                                  <img src={p} className="w-full h-full object-cover" alt="Thumb" referrerPolicy="no-referrer" />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Main content grid split */}
              <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Section Details */}
                <div className="lg:col-span-8 space-y-8">
                  
                  {/* Title block */}
                  <div className="space-y-3">
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                      {selectedStay.title}
                    </h2>
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{selectedStay.loc}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
                        🌍 Loved by International Travelers
                      </span>
                      <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
                        💻 Great for Workation
                      </span>
                      <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
                        ❤️ Community Favorite
                      </span>
                    </div>

                    <p className="text-slate-500 italic text-sm leading-relaxed border-l-4 border-indigo-150 pl-4 py-1 mt-4">
                      "{selectedStay.story}"
                    </p>
                  </div>

                  {/* Room choices selectors generated dynamically from selection options */}
                  <div id="rooms-sec" className="space-y-4 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        Select Your Room Choice
                      </h3>
                      <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md font-bold">
                        {selectedStay.inventorySummary?.totalRooms || 10} Rooms • {selectedStay.inventorySummary?.totalDormBeds || 16} Beds
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(selectedStay.roomInventory || []).map((room, idx) => {
                        const isSelected = selectedRoomName === room.name;
                        return (
                          <div 
                            key={idx}
                            onClick={() => { 
                              setSelectedRoomName(room.name); 
                              setSelectedRoomPrice(room.priceValue); 
                            }}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected 
                              ? "bg-indigo-50/50 border-indigo-650 shadow-md ring-1 ring-indigo-500/10" 
                              : "bg-white border-slate-200 hover:border-slate-350"
                            }`}
                          >
                            <div>
                              <div className="aspect-[16/10] rounded-xl overflow-hidden mb-3 bg-slate-100 relative">
                                <img src={room.img} className="w-full h-full object-cover" alt={room.name} referrerPolicy="no-referrer" />
                                {room.status && (
                                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-red-500 text-white shadow-xs">
                                    {room.status}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-slate-900 text-sm leading-tight">{room.name}</h4>
                                <span className="text-[10px] text-slate-400 font-medium">Qty: {room.inventory}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 lines-clamp-2 leading-relaxed">{room.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2.5">
                                {room.amenities.slice(0, 3).map((am, amIdx) => (
                                  <span key={amIdx} className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">
                                    {am}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">{room.occupancy}</span>
                              <span className="text-xs font-black text-indigo-650">
                                {convertAndFormatPrice(room.priceValue)} <span className="text-[9px] font-normal text-slate-400">/ night</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Guest videos scroll track link */}
                  <div id="videos-sec" className="space-y-4 pt-6 border-t border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Why Guests Love This Stay</h3>
                    
                    <div className="flex gap-4 overflow-x-auto scrollbar-none py-1">
                      {[
                        { flag: "🇩🇪", txt: "Solo Travel", src: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=200&q=70" },
                        { flag: "🇫🇷", txt: "Workation", src: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=200&q=70" },
                        { flag: "🇺🇸", txt: "Community", src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=200&q=70" },
                        { flag: "🇮🇳", txt: "Wellness", src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=200&q=70" },
                        { flag: "🇧🇷", txt: "Nature", src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=70" }
                      ].map((vid, idx) => (
                        <div key={idx} className="relative w-28 aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950 flex-shrink-0 cursor-pointer shadow-sm group">
                          <img src={vid.src} className="w-full h-full object-cover filter brightness-90 group-hover:scale-106 transition-transform" alt="Reel representation" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent flex flex-col justify-end p-2.5">
                            <span className="text-base select-none">{vid.flag}</span>
                            <span className="text-[10px] text-white font-bold tracking-wide mt-1">{vid.txt}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                        <span className="text-xl">🌍</span>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">International Crowd</h4>
                          <p className="text-[11px] text-slate-400 mt-1 leading-normal">Meet digital nomads and seekers representing 30+ countries.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                        <span className="text-xl">☕</span>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Café Friendly</h4>
                          <p className="text-[11px] text-slate-400 mt-1 leading-normal">Surrounded by artisanal bakeries, vegan cafés, and slow juice joints.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                        <span className="text-xl">💻</span>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Workation Ready</h4>
                          <p className="text-[11px] text-slate-400 mt-1 leading-normal">Ergonomic seating decks, dual-fiber backup routes, and power generators.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-105 rounded-2xl flex items-start gap-3">
                        <span className="text-xl">🌊</span>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Close to Ganga</h4>
                          <p className="text-[11px] text-slate-400 mt-1 leading-normal">Secure gates opening onto sandy river beaches just 3 minutes away.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amenities highlights */}
                  <div id="amenities-sec" className="space-y-4 pt-6 border-t border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Amenities &amp; Highlights</h3>
                    
                    <div className="flex flex-wrap gap-2">
                      {[
                        "High-Speed WiFi", "Acoustic Work-Booths", "Scenic Sunset Rooftop", 
                        "Ortho-beds &amp; Lockers", "Ganga-front Yoga Deck", "24/7 Power Support", 
                        "Central Hot Showers", "Cardboard Memory Kits"
                      ].map((am, i) => (
                        <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-full text-xs font-semibold">
                          <Check className="w-3.5 h-3.5 text-indigo-650" /> {am}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Add-ons list selector block */}
                  <div id="addons-sec" className="space-y-4 pt-6 border-t border-slate-100">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Guests Staying Here Often Add</h3>
                      <p className="text-xs text-slate-400 mt-1">Upgrade your comfort metrics instantly. Tap any card below to bundle it into your total rate.</p>
                    </div>

                    <div className="flex gap-4 overflow-x-auto scrollbar-none py-1">
                      {addonsList.map(ad => {
                        const isAdded = selectedAddons.includes(ad.id);
                        return (
                          <div key={ad.id} className="w-40 border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm flex-shrink-0 hover:shadow transition-shadow">
                            <div className="aspect-[16/10] bg-slate-100">
                              <img src={ad.img} className="w-full h-full object-cover" alt="Addon detail" referrerPolicy="no-referrer" />
                            </div>
                            <div className="p-3">
                              <div className="font-bold text-slate-900 text-xs tracking-tight line-clamp-1">{ad.name}</div>
                              <div className="text-[11px] text-indigo-600 font-bold mt-1">{ad.price}</div>
                              
                              <button 
                                onClick={() => toggleAddon(ad.id)}
                                className={`w-full py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase mt-2.5 transition-all text-center ${
                                  isAdded 
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                                  : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                                }`}
                              >
                                {isAdded ? "Added!" : "Add To Stay"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Location explore around */}
                  <div id="location-sec" className="space-y-4 pt-6 border-t border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Explore the Vicinity</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { title: "To Ganga River", dist: "3 mins walk" },
                        { title: "To Laxman Jhula Bridge", dist: "5 mins walk" },
                        { title: "To Organic Vegan Cafés", dist: "3 mins walk" },
                        { title: "To Sound Healing Temples", dist: "4 mins walk" },
                        { title: "To Co-Working Lounges", dist: "6 mins walk" }
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 border border-slate-150 rounded-xl flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-indigo-650 rounded-full flex-shrink-0" />
                          <div>
                            <div className="text-xs font-black text-slate-900">{item.title}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{item.dist}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reviews lists block */}
                  <div id="reviews-sec" className="space-y-4 pt-6 border-t border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Verified Reviews</h3>
                    
                    <div className="space-y-4">
                      {[
                        { author: "Lucas M. • Germany", type: "Digital Nomad • 2 weeks", r: 5, body: "Stayed for 2 weeks in Tapovan. High speed back-ups saved several active zoom lines. The Saturday fire is fantastic!" },
                        { author: "Amélie R. • France", type: "Solo Traveler • 5 nights", r: 5, body: "Extremely secure, incredibly warm. Solitary walks by the river beach are majestic. Vibe is entirely low pressure." },
                        { author: "Priya K. • Mumbai", type: "Couple • 3 nights", r: 5, body: "Felt premium yet shared. Highly recommend the sunset soundbowl meditation." }
                      ].map((rev, i) => (
                        <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800">{rev.author}</span>
                            <span className="text-[10px] text-slate-400">{rev.type}</span>
                          </div>
                          <div className="text-yellow-500 text-xs">{"★".repeat(rev.r)}</div>
                          <p className="text-xs text-slate-500 leading-relaxed font-light">"{rev.body}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Sticky Inquiry Form */}
                <div 
                  className="lg:col-span-4 sticky top-24 bg-white border border-indigo-150 rounded-[28px] p-6 shadow-xl space-y-5"
                  style={{ fontFamily: "'Comfortaa', sans-serif" }}
                >
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-[#001166] text-base">Book Accommodation</h3>
                    <p className="text-[11px] text-[#001166]/60 font-light">Select dates and complete your reservation instantly.</p>
                  </div>

                  {/* Dates and Guests Selector */}
                  <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[#001166]/10 text-xs relative">
                    <div 
                      className="space-y-1.5 cursor-pointer text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (showDatePickerPopup && focusedField === "checkIn") {
                          setShowDatePickerPopup(false);
                        } else {
                          setFocusedField("checkIn");
                          setShowDatePickerPopup(true);
                        }
                      }}
                    >
                      <label className="text-[9px] font-black uppercase text-[#001166]/60 tracking-wider cursor-pointer">Check-In</label>
                      <div className="w-full px-3.5 py-2.5 border border-[#001166]/8 rounded-2xl text-[#001166] bg-[#001166]/4 hover:bg-[#001166]/8 flex items-center justify-between transition-all">
                        <span className="font-bold text-xs">{formatDatePickerDisplayDate(checkInDate)}</span>
                        <Calendar className="w-3.5 h-3.5 text-[#001166]/60" />
                      </div>
                    </div>
                    <div 
                      className="space-y-1.5 cursor-pointer text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (showDatePickerPopup && focusedField === "checkOut") {
                          setShowDatePickerPopup(false);
                        } else {
                          setFocusedField("checkOut");
                          setShowDatePickerPopup(true);
                        }
                      }}
                    >
                      <label className="text-[9px] font-black uppercase text-[#001166]/60 tracking-wider cursor-pointer">Check-Out</label>
                      <div className="w-full px-3.5 py-2.5 border border-[#001166]/8 rounded-2xl text-[#001166] bg-[#001166]/4 hover:bg-[#001166]/8 flex items-center justify-between transition-all">
                        <span className="font-bold text-xs">{formatDatePickerDisplayDate(checkOutDate)}</span>
                        <Calendar className="w-3.5 h-3.5 text-[#001166]/60" />
                      </div>
                    </div>

                    {showDatePickerPopup && (
                      <>
                        <div 
                          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-none" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDatePickerPopup(false);
                          }}
                        />
                        <div className="fixed md:absolute top-1/2 md:top-[108%] left-1/2 md:left-auto md:right-0 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 z-50 w-[92vw] max-w-[340px] md:w-[320px] md:max-w-none select-none">
                          <UbexDatePicker
                          checkIn={checkInDate}
                          checkOut={checkOutDate}
                          initialFocusedField={focusedField}
                          onChange={(inD, outD, isCompleted) => {
                            if (inD) {
                              const yr = inD.getFullYear();
                              const mo = String(inD.getMonth() + 1).padStart(2, '0');
                              const da = String(inD.getDate()).padStart(2, '0');
                              handleLocalCheckInChange(`${yr}-${mo}-${da}`);
                            } else {
                              handleLocalCheckInChange("");
                            }

                            if (outD) {
                              const yr = outD.getFullYear();
                              const mo = String(outD.getMonth() + 1).padStart(2, '0');
                              const da = String(outD.getDate()).padStart(2, '0');
                              handleLocalCheckOutChange(`${yr}-${mo}-${da}`);
                            } else {
                              handleLocalCheckOutChange("");
                            }

                            if (isCompleted) {
                              setShowDatePickerPopup(false);
                            }
                          }}
                          onClose={() => setShowDatePickerPopup(false)}
                          className="!max-w-full font-sans border border-[#001166]/10"
                        />
                      </div>
                    </>
                    )}
                    <div className="col-span-2 space-y-1.5 text-left">
                      <label className="text-[9px] font-black uppercase text-[#001166]/60 tracking-wider">Guests</label>
                      <div className="flex items-center justify-between border border-[#001166]/8 rounded-2xl p-2 bg-[#001166]/4">
                        <span className="text-[#001166] pl-2.5 font-bold text-xs">{guestsCount} Guest{guestsCount > 1 ? "s" : ""}</span>
                        <div className="flex gap-1.5 pr-1">
                          <button 
                            type="button"
                            onClick={() => setGuestsCount(prev => {
                              const nextVal = Math.max(prev - 1, 1);
                              if (setExternalGuestsCount) setExternalGuestsCount(nextVal);
                              return nextVal;
                            })}
                            className="w-7 h-7 bg-white hover:bg-indigo-50 border border-[#001166]/12 rounded-full flex items-center justify-center font-bold text-[#001166] transition-all cursor-pointer shadow-sm select-none"
                          >
                            -
                          </button>
                          <button 
                            type="button"
                            onClick={() => setGuestsCount(prev => {
                              const nextVal = prev + 1;
                              if (setExternalGuestsCount) setExternalGuestsCount(nextVal);
                              return nextVal;
                            })}
                            className="w-7 h-7 bg-indigo-950 text-white rounded-full flex items-center justify-center font-bold text-xs transition-all cursor-pointer shadow-sm select-none"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
                    
                    {/* Selected Room line item */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Room Choice ({selectedRoomName})</span>
                      <span className="font-bold text-slate-800">{convertAndFormatPrice(selectedRoomPrice)}</span>
                    </div>

                    {/* All added addon checklist names */}
                    {selectedAddons.map(addonId => {
                      const add = addonsList.find(a => a.id === addonId);
                      if (!add) return null;
                      return (
                        <div key={addonId} className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 text-[11px]">{add.name} addon</span>
                          <span className="font-semibold text-slate-600">{convertAndFormatPrice(add.priceValue)}</span>
                        </div>
                      );
                    })}

                    <hr className="border-slate-200" />

                    {/* Final cumulative pricing */}
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Rate per Night</span>
                      <span className="text-2xl font-black text-indigo-650 tracking-tight">
                        {convertAndFormatPrice(getCumulativePrice())}
                        <span className="text-xs text-slate-400 font-normal"> / nt</span>
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-baseline pt-1 border-t border-dashed border-slate-200">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Est. Sum ({getNightsCount()} nights)</span>
                      <span className="text-xl font-bold text-indigo-650 tracking-tight text-right">
                        {convertAndFormatPrice(getCumulativePrice() * getNightsCount())}
                      </span>
                    </div>
                  </div>

                  {bookingStatus && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium rounded-xl leading-relaxed animate-pulse">
                      {bookingStatus}
                    </div>
                  )}

                  <div className="space-y-2">
                    <button 
                      type="button"
                      onClick={() => {
                        onBookStay(
                          selectedStay, 
                          selectedRoomName, 
                          getCumulativePrice(), 
                          selectedAddons, 
                          checkInDate, 
                          checkOutDate, 
                          getNightsCount(), 
                          guestsCount
                        );
                      }}
                      className="w-full py-4 bg-indigo-600 hover:bg-slate-900 border border-indigo-400/30 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all hover:-translate-y-0.5"
                    >
                      Book Stay
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleInquiryTrigger("phone")}
                      className="w-full py-2.5 bg-indigo-50 hover:bg-slate-100 text-indigo-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Stay Specialist
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => handleInquiryTrigger("wa")}
                      className="w-full py-2.5 bg-emerald-50 hover:bg-slate-100 text-emerald-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" /> WhatsApp Specialist
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div className="text-[10px] text-slate-400 font-bold">
                      <span className="text-base block mb-0.5">⚡</span> Instant Response
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">
                      <span className="text-base block mb-0.5">🚫</span> No Booking Fees
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">
                      <span className="text-base block mb-0.5">📍</span> Local Support
                    </div>
                  </div>

                </div>

              </div>
              
            </div>

            {/* Simulated Handheld Sticky Footer Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex items-center justify-between z-50 shadow-lg">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Est. total rate</span>
                <span className="text-lg font-black text-slate-900">{convertAndFormatPrice(getCumulativePrice())}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleInquiryTrigger("phone")}
                  className="px-4 py-2.5 bg-indigo-650 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </button>
                <button 
                  onClick={() => handleInquiryTrigger("wa")}
                  className="px-4 py-2.5 bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-white" /> WA
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
