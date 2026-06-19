import fs from "fs";
import path from "path";

const DB_FILE_PATH = path.join(process.cwd(), "local_db.json");

interface LocalDb {
  users: Array<{
    id: number;
    uid: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    status: "Active" | "Suspended" | "Deleted" | "Banned";
    registrationDate?: string;
    lastLogin?: string;
    passportLevel: number;
    isVerified: boolean;
    createdAt: string;
  }>;
  bookings: Array<{
    id: number;
    bookingId: string;
    userId: number | null;
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    country: string;
    arrivalTime: string;
    travelPurpose: string;
    specialNotes: string;
    marketingConsent: boolean;
    paymentType: string;
    selectedAddons: any[];
    cartStays: any[];
    cartExperiences: any[];
    amountPayable: number;
    amountPaid: number;
    amountRemaining: number;
    currency: string;
    createdAt: string;
    status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
    statusDate?: string;
  }>;
  stays: Array<{
    id: string;
    title: string;
    category: "Luxury" | "Family" | "Workation" | "Dorm" | "Long-Stay";
    image: string;
    description: string;
    price: string;
    priceValue: number;
    rating: string;
    features: string[];
    isArchived: boolean;
    capacity: number;
    blockedDates: string[];
    maintenanceDates: string[];
    dynamicPriceOverride?: number;
  }>;
  experiences: Array<{
    id: string;
    category: string;
    title: string;
    price: string;
    description: string;
    longDescription: string;
    mainImage: string;
    galleryImages: string[];
    duration: string;
    meetingPoint: string;
    minAge: string;
    difficulty: "Easy" | "Moderate" | "Challenging";
    inclusions: string[];
    exclusions: string[];
    timings: string[];
    faqs: any[];
    variants: any[];
    isArchived: boolean;
    capacity: number;
    scheduledDates: string[];
  }>;
  system_settings: {
    maintenanceMode: boolean;
    featureFlags: {
      enableMfaEscalation: boolean;
      enableCmsSyncAlerts: boolean;
      enableStripeMockFallback: boolean;
      restrictRegistrations: boolean;
    };
    platformConfig: {
      supportEmail: string;
      opsHotline: string;
      maxOccupancyPerBooking: number;
    };
    securityConfig: {
      passwordMinLength: number;
      maxOtpSendRetries: number;
      enforceSessionLock: boolean;
    };
  };
  badge_definitions: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
    xpAwarded: number;
    activityType: string;
  }>;
  achievement_definitions: Array<{
    id: string;
    name: string;
    icon: string;
    type: "destination" | "combo" | "stay" | "social";
    description: string;
    requirements: any;
    xpAwarded: number;
  }>;
  reward_definitions: Array<{
    id: string;
    name: string;
    description: string;
    badgesRequired: number;
    couponCode?: string;
  }>;
  user_xp: Array<{ userId: number; xp: number }>;
  user_badges: Array<{ id: number; userId: number; badgeId: string; earnedAt: string }>;
  user_achievements: Array<{ id: number; userId: number; achievementId: string; earnedAt: string }>;
  user_destination_progress: Array<{ id: number; userId: number; destination: string; experiencesCompleted: number }>;
  user_rewards: Array<{ id: number; userId: number; rewardId: string; status: string; claimedAt?: string }>;
  reviews: Array<{
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
    photos?: string[];
    videos?: string[];
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
  }>;
  inquiries?: Array<{
    inquiryId: string;
    inquiryType: string;
    listingId: string | null;
    listingTitle: string;
    category?: string | null;
    roomName?: string | null;
    experienceName?: string | null;
    selectedDate?: string | null;
    selectedDates?: string[] | null;
    guestCount?: number;
    visitorCount?: number | null;
    selectedAddons?: string[] | null;
    sourcePage?: string;
    deviceType?: string;
    userAgent?: string;
    inquiryStatus: "pending" | "contacted" | "qualified" | "converted" | "cancelled";
    createdAt: string;
  }>;
}

const DEFAULT_BADGES: LocalDb["badge_definitions"] = [
  { id: "rafting_master", name: "Rafting Master", icon: "🌊", color: "sky", description: "Complete a river rafting run on the Ganges Flow", xpAwarded: 100, activityType: "rafting" },
  { id: "bungee_brave", name: "Bungee Brave", icon: "🪂", color: "red", description: "Conquer India's highest vertical leap jump", xpAwarded: 150, activityType: "bungee" },
  { id: "camp_explorer", name: "Camp Explorer", icon: "🏕", color: "emerald", description: "Spend a night camping under the stars", xpAwarded: 80, activityType: "camping" },
  { id: "climbing_pro", name: "Climbing Pro", icon: "🧗", color: "amber", description: "Ascend mountain cliff faces safely", xpAwarded: 120, activityType: "climbing" },
  { id: "kayak_king", name: "Kayak King", icon: "🚣", color: "indigo", description: "Paddle solo across rapids & reservoirs", xpAwarded: 110, activityType: "kayaking" },
  { id: "biking_beast", name: "Biking Beast", icon: "🚵", color: "orange", description: "Blaze down steep dirt forest trails", xpAwarded: 100, activityType: "biking" },
  { id: "trek_titan", name: "Trek Titan", icon: "🥾", color: "lime", description: "Ascend beautiful mountain outposts", xpAwarded: 90, activityType: "trekking" },
  { id: "sky_rider", name: "Sky Rider", icon: "🦅", color: "cyan", description: "Fly high over valleys like an eagle", xpAwarded: 140, activityType: "paragliding" },
  { id: "terrain_conqueror", name: "Terrain Conqueror", icon: "🏎", color: "yellow", description: "Handle off-road mountain dust loops", xpAwarded: 100, activityType: "atv" },
  { id: "zipline_daredevil", name: "Zipline Daredevil", icon: "⚡", color: "purple", description: "Zip across high river tributaries", xpAwarded: 90, activityType: "zipline" }
];

const DEFAULT_ACHIEVEMENTS: LocalDb["achievement_definitions"] = [
  // Destination Collections
  { id: "rishikesh_explorer", name: "Rishikesh Explorer", icon: "🧭", type: "destination", description: "Explore the ancient spiritual and yoga hub of Rishikesh", requirements: { destination: "Rishikesh" }, xpAwarded: 100 },
  { id: "mussoorie_explorer", name: "Mussoorie Explorer", icon: "🌫", type: "destination", description: "Wander through the misty hills of Mussoorie", requirements: { destination: "Mussoorie" }, xpAwarded: 100 },
  { id: "auli_explorer", name: "Auli Explorer", icon: "🎿", type: "destination", description: "Ski across the steep snowy mountains of Auli", requirements: { destination: "Auli" }, xpAwarded: 100 },
  { id: "nainital_explorer", name: "Nainital Explorer", icon: "⛵", type: "destination", description: "Sail through the serene lakes of Nainital", requirements: { destination: "Nainital" }, xpAwarded: 100 },
  { id: "chopta_explorer", name: "Chopta Explorer", icon: "🏔", type: "destination", description: "Trek the valleys of India's mini Switzerland", requirements: { destination: "Chopta" }, xpAwarded: 100 },
  { id: "uttarakhand_master", name: "Uttarakhand Master", icon: "🏆", type: "destination", description: "Complete all Uttarakhand destination explorations", requirements: { requiresAll: ["rishikesh_explorer", "mussoorie_explorer", "auli_explorer", "nainital_explorer", "chopta_explorer"] }, xpAwarded: 300 },
  
  { id: "himachal_explorer", name: "Himachal Explorer", icon: "🏔", type: "destination", description: "Traverse the high altitude passes of Himachal", requirements: { destination: "Himachal" }, xpAwarded: 150 },
  { id: "goa_explorer", name: "Goa Explorer", icon: "🏖", type: "destination", description: "Dance on the golden sunset beaches of Goa", requirements: { destination: "Goa" }, xpAwarded: 150 },
  { id: "rajasthan_explorer", name: "Rajasthan Explorer", icon: "🐫", type: "destination", description: "Camp on the royal desert dunes of Rajasthan", requirements: { destination: "Rajasthan" }, xpAwarded: 150 },
  { id: "kashmir_explorer", name: "Kashmir Explorer", icon: "🌸", type: "destination", description: "Drift in a shikara over Dal lake in Kashmir", requirements: { destination: "Kashmir" }, xpAwarded: 150 },

  // Combos
  { id: "extreme_adventurer", name: "Extreme Adventurer", icon: "🔥", type: "combo", description: "Complete a combo of River Rafting + Bungee Jumping + Camping", requirements: { activities: ["rafting", "bungee", "camping"] }, xpAwarded: 250 },
  { id: "mountain_nomad", name: "Mountain Nomad", icon: "🌌", type: "combo", description: "Complete Camping + Trekking + Stargazing experiences", requirements: { activities: ["camping", "trekking", "wellness_session"] }, xpAwarded: 200 },
  { id: "river_explorer", name: "River Explorer", icon: "🌊", type: "combo", description: "Complete Rafting + Kayaking + Riverside Stay combo", requirements: { activities: ["rafting", "kayaking", "stay_luxury_villa"] }, xpAwarded: 200 },
  { id: "digital_nomad", name: "Digital Nomad", icon: "💻", type: "combo", description: "Combine Workation Stay + Trek + Local Cafe Food Trail", requirements: { activities: ["stay_workation", "trekking", "food_trail"] }, xpAwarded: 200 },

  // Stays
  { id: "stay_explorer", name: "Stay Explorer", icon: "🏡", type: "stay", description: "Book your first curated stay outpost with UbEx", requirements: { staysCount: 1 }, xpAwarded: 50 },
  { id: "stay_collector", name: "Stay Collector", icon: "🏘", type: "stay", description: "Reside at 5 unique outposts of UbEx across regions", requirements: { staysCount: 5 }, xpAwarded: 150 },
  { id: "stay_conqueror", name: "Stay Conqueror", icon: "🏰", type: "stay", description: "Stay in 10 separate UbEx lodging configurations", requirements: { staysCount: 10 }, xpAwarded: 300 },
  { id: "complete_traveler", name: "Complete Traveler", icon: "🎒", type: "stay", description: "Combine both a Stay and a Local Experience reservation", requirements: { stayAndExperience: true }, xpAwarded: 120 },
  { id: "premium_explorer", name: "Premium Explorer", icon: "✨", type: "stay", description: "Reserve a curated Luxury Villa stay experience", requirements: { premiumStay: true }, xpAwarded: 100 },

  // Social
  { id: "storyteller", name: "Storyteller", icon: "📸", type: "social", description: "Share your travel highlight photos with the community", requirements: { photos: 1 }, xpAwarded: 40 },
  { id: "creator", name: "Creator", icon: "🎥", type: "social", description: "Post video reels of your crazy adventures", requirements: { reels: 1 }, xpAwarded: 50 },
  { id: "reviewer", name: "Reviewer", icon: "⭐", type: "social", description: "Submit your verified review feed rating", requirements: { reviews: 1 }, xpAwarded: 20 },
  { id: "trusted_reviewer", name: "Trusted Reviewer", icon: "🏅", type: "social", description: "Contribute 10 verified ratings for local outposts", requirements: { reviews: 10 }, xpAwarded: 150 },
  { id: "group_leader", name: "Group Leader", icon: "👥", type: "social", description: "Created or booked a collective group of 4 or more adventurers", requirements: { groupGuests: 4 }, xpAwarded: 100 }
];

const DEFAULT_REWARDS: LocalDb["reward_definitions"] = [
  { id: "reward_discount_5", name: "5% Discount Voucher", description: "Unlock a flat 5% off on your next adventure", badgesRequired: 10, couponCode: "UBEX5PASS" },
  { id: "reward_priority", name: "Priority Support Line", description: "Gain direct, immediate access to priority concierge chat hotline", badgesRequired: 20 },
  { id: "reward_exclusive", name: "Exclusive Secret Journeys", description: "Unlock invites to hidden mountain camp grounds & high-value offsite runs", badgesRequired: 30 },
  { id: "reward_elite_club", name: "UbEx Elite Club Membership", description: "Lifetime premium status, late checkout, free room upgrades and VIP lounge access", badgesRequired: 50 }
];

const DEFAULT_STAYS: LocalDb["stays"] = [
  {
    id: "stay-luxury-villa",
    title: "Mountain Whisper Luxury Villa",
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1400",
    description: "Premium independent villas with private infinity plunges overlooking ancient valleys.",
    price: "₹12,499",
    priceValue: 12499,
    rating: "4.95",
    features: ["Infinity pool", "En-suite sauna", "Private chef assistance", "High-speed Wi-Fi"],
    isArchived: false,
    capacity: 10,
    blockedDates: [],
    maintenanceDates: []
  },
  {
    id: "stay-family",
    title: "Heritage Riverbank Family House",
    category: "Family",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1400",
    description: "Comfortable family suites, fully secured lawns, and deep river views.",
    price: "₹5,499",
    priceValue: 5499,
    rating: "4.88",
    features: ["Spacious rooms", "Kitchen accesses", "Child friendly area", "Yoga lawns"],
    isArchived: false,
    capacity: 15,
    blockedDates: [],
    maintenanceDates: []
  },
  {
    id: "stay-workation",
    title: "UbEx Tapovan Nomad Workation",
    category: "Workation",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1400",
    description: "Dedicated acoustic desks, dual high-speed fibers, pool access, and community lounges.",
    price: "₹1,799",
    priceValue: 1799,
    rating: "4.92",
    features: ["Dual Fiber back-ups", "Acoustic booths", "Nomad community", "Yoga deck"],
    isArchived: false,
    capacity: 30,
    blockedDates: [],
    maintenanceDates: []
  },
  {
    id: "stay-dorms",
    title: "UbEx Ganga Bunk Hostel",
    category: "Dorm",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1400",
    description: "Premium orthopedic bunks, shared community kitchen, social fire decks, and cafes.",
    price: "₹699",
    priceValue: 699,
    rating: "4.82",
    features: ["Shared lounges", "Bunk lockers", "Weekly bonfire meets", "Workplace cafe"],
    isArchived: false,
    capacity: 50,
    blockedDates: [],
    maintenanceDates: []
  }
];

const DEFAULT_EXPERIENCES: LocalDb["experiences"] = [
  {
    id: "rafting",
    category: "Adventure",
    title: "White Water Rafting",
    price: "₹799",
    description: "Ride the rapids of the mighty Ganges with certified river experts.",
    longDescription: "Get ready for the ultimate river challenge! Tackle class II, III, and IV rapids under the guidance of our internationally-certified safety personnel.",
    mainImage: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=1200",
    galleryImages: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600"
    ],
    duration: "2-4 Hours",
    meetingPoint: "UbEx Adventure Base Camp, Tapovan",
    minAge: "14+",
    difficulty: "Moderate",
    inclusions: ["Certified River Guide", "US Coast Guard life vest"],
    exclusions: ["Personal items"],
    timings: ["Morning Slot (8:00 AM)", "Sunset Slot (3:00 PM)"],
    faqs: [],
    variants: [
      { name: "12 KM Tapovan", price: "₹799", priceValue: 799 }
    ],
    isArchived: false,
    capacity: 20,
    scheduledDates: ["2026-06-20"]
  },
  {
    id: "bungee",
    category: "Adventure",
    title: "Bungee Jumping",
    price: "₹3,499",
    description: "India's highest vertical leap jump.",
    longDescription: "Jump with redundant locks and harness systems overlooking soundscapes of Rishikesh valley streams.",
    mainImage: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200",
    galleryImages: [],
    duration: "1.5 Hours",
    meetingPoint: "Mohanchatti Bungee drop station",
    minAge: "12+",
    difficulty: "Challenging",
    inclusions: ["Jump master assistance", "Certificate"],
    exclusions: ["Video footage"],
    timings: ["Morning Session (9:00 AM)"],
    faqs: [],
    variants: [{ name: "Classic Bungee", price: "₹3,499", priceValue: 3499 }],
    isArchived: false,
    capacity: 10,
    scheduledDates: ["2026-06-20"]
  }
];

const DEFAULT_SYSTEM_SETTINGS = {
  maintenanceMode: false,
  featureFlags: {
    enableMfaEscalation: true,
    enableCmsSyncAlerts: true,
    enableStripeMockFallback: true,
    restrictRegistrations: false
  },
  platformConfig: {
    supportEmail: "ops@ubex.com",
    opsHotline: "+91 1800 240 9051",
    maxOccupancyPerBooking: 10
  },
  securityConfig: {
    passwordMinLength: 8,
    maxOtpSendRetries: 3,
    enforceSessionLock: true
  }
};

function readDb(): LocalDb {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      
      // Ensure passport schemas are initialized
      if (!parsed.badge_definitions) parsed.badge_definitions = DEFAULT_BADGES;
      if (!parsed.achievement_definitions) parsed.achievement_definitions = DEFAULT_ACHIEVEMENTS;
      if (!parsed.reward_definitions) parsed.reward_definitions = DEFAULT_REWARDS;
      if (!parsed.user_xp) parsed.user_xp = [];
      if (!parsed.user_badges) parsed.user_badges = [];
      if (!parsed.user_achievements) parsed.user_achievements = [];
      if (!parsed.user_destination_progress) parsed.user_destination_progress = [];
      if (!parsed.user_rewards) parsed.user_rewards = [];
      if (!parsed.reviews) parsed.reviews = [];
      if (!parsed.stays) parsed.stays = DEFAULT_STAYS;
      if (!parsed.experiences) parsed.experiences = DEFAULT_EXPERIENCES;
      if (!parsed.system_settings) parsed.system_settings = DEFAULT_SYSTEM_SETTINGS;
      if (!parsed.users) parsed.users = [];
      if (!parsed.bookings) parsed.bookings = [];

      // Add default users if users array is completely empty to populate User Directory
      if (parsed.users.length === 0) {
        parsed.users = [
          { id: 1, uid: "usr_rishikesh_9021", email: "kalpeshloon@gmail.com", firstName: "Kalpesh", lastName: "Loon", phone: "+91 9988776655", status: "Active", registrationDate: "2026-04-12T10:00:00.000Z", lastLogin: "2026-06-15T10:20:00.000Z", passportLevel: 3, isVerified: true, createdAt: "2026-04-12T10:00:00.000Z" },
          { id: 2, uid: "usr_himalayas_1042", email: "nisha@example.com", firstName: "Nisha", lastName: "Sharma", phone: "+91 9876543210", status: "Active", registrationDate: "2026-05-01T08:00:00.000Z", lastLogin: "2026-06-14T11:45:00.000Z", passportLevel: 1, isVerified: false, createdAt: "2026-05-01T08:00:00.000Z" },
          { id: 3, uid: "usr_nomad_8831", email: "sarah@gmail.com", firstName: "Sarah", lastName: "M.", phone: "+49 176 1234567", status: "Suspended", registrationDate: "2026-03-20T14:00:00.000Z", lastLogin: "2026-05-20T10:15:00.000Z", passportLevel: 2, isVerified: true, createdAt: "2026-03-20T14:00:00.000Z" }
        ];
      }

      return parsed;
    }
  } catch (err) {
    console.error("Failed to read local DB file:", err);
  }
  
  // Return default state if reading fails or file does not exist
  return { 
    users: [
      { id: 1, uid: "usr_rishikesh_9021", email: "kalpeshloon@gmail.com", firstName: "Kalpesh", lastName: "Loon", phone: "+91 9988776655", status: "Active", registrationDate: "2026-04-12T10:00:00.000Z", lastLogin: "2026-06-15T10:20:00.000Z", passportLevel: 3, isVerified: true, createdAt: "2026-04-12T10:00:00.000Z" },
      { id: 2, uid: "usr_himalayas_1042", email: "nisha@example.com", firstName: "Nisha", lastName: "Sharma", phone: "+91 9876543210", status: "Active", registrationDate: "2026-05-01T08:00:00.000Z", lastLogin: "2026-06-14T11:45:00.000Z", passportLevel: 1, isVerified: false, createdAt: "2026-05-01T08:00:00.000Z" },
      { id: 3, uid: "usr_nomad_8831", email: "sarah@gmail.com", firstName: "Sarah", lastName: "M.", phone: "+49 176 1234567", status: "Suspended", registrationDate: "2026-03-20T14:00:00.000Z", lastLogin: "2026-05-20T10:15:00.000Z", passportLevel: 2, isVerified: true, createdAt: "2026-03-20T14:00:00.000Z" }
    ], 
    bookings: [],
    badge_definitions: DEFAULT_BADGES,
    achievement_definitions: DEFAULT_ACHIEVEMENTS,
    reward_definitions: DEFAULT_REWARDS,
    user_xp: [],
    user_badges: [],
    user_achievements: [],
    user_destination_progress: [],
    user_rewards: [],
    reviews: [],
    stays: DEFAULT_STAYS,
    experiences: DEFAULT_EXPERIENCES,
    system_settings: DEFAULT_SYSTEM_SETTINGS
  };
}

function writeDb(data: LocalDb) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write local DB file:", err);
  }
}

export const localDb = {
  getUsers: () => readDb().users,
  saveUsers: (users: LocalDb["users"]) => {
    const db = readDb();
    db.users = users;
    writeDb(db);
  },
  getBookings: () => readDb().bookings,
  saveBookings: (bookings: LocalDb["bookings"]) => {
    const db = readDb();
    db.bookings = bookings;
    writeDb(db);
  },
  
  // Passport-related methods
  getBadgeDefinitions: () => readDb().badge_definitions,
  saveBadgeDefinitions: (badge_definitions: LocalDb["badge_definitions"]) => {
    const db = readDb();
    db.badge_definitions = badge_definitions;
    writeDb(db);
  },
  
  getAchievementDefinitions: () => readDb().achievement_definitions,
  saveAchievementDefinitions: (achievement_definitions: LocalDb["achievement_definitions"]) => {
    const db = readDb();
    db.achievement_definitions = achievement_definitions;
    writeDb(db);
  },
  
  getRewardDefinitions: () => readDb().reward_definitions,
  saveRewardDefinitions: (reward_definitions: LocalDb["reward_definitions"]) => {
    const db = readDb();
    db.reward_definitions = reward_definitions;
    writeDb(db);
  },
  
  getUserXp: () => readDb().user_xp,
  saveUserXp: (user_xp: LocalDb["user_xp"]) => {
    const db = readDb();
    db.user_xp = user_xp;
    writeDb(db);
  },
  
  getUserBadges: () => readDb().user_badges,
  saveUserBadges: (user_badges: LocalDb["user_badges"]) => {
    const db = readDb();
    db.user_badges = user_badges;
    writeDb(db);
  },
  
  getUserAchievements: () => readDb().user_achievements,
  saveUserAchievements: (user_achievements: LocalDb["user_achievements"]) => {
    const db = readDb();
    db.user_achievements = user_achievements;
    writeDb(db);
  },
  
  getUserDestinationProgress: () => readDb().user_destination_progress,
  saveUserDestinationProgress: (user_destination_progress: LocalDb["user_destination_progress"]) => {
    const db = readDb();
    db.user_destination_progress = user_destination_progress;
    writeDb(db);
  },
  
  getUserRewards: () => readDb().user_rewards,
  saveUserRewards: (user_rewards: LocalDb["user_rewards"]) => {
    const db = readDb();
    db.user_rewards = user_rewards;
    writeDb(db);
  },
  
  getReviews: () => {
    const db = readDb();
    // Auto-seed some beautiful reviews if none exist
    if (!db.reviews || db.reviews.length === 0) {
      db.reviews = [
        {
          id: "REV-1001",
          bookingId: "UBX-ST-2026-4587",
          userId: 1,
          guestName: "Kalpesh Loon",
          guestEmail: "kalpeshloon@gmail.com",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
          bookingType: "Stay",
          propertyName: "UbEx Ganga View Luxury Villa",
          roomType: "Premium Master Villa Room",
          dateOfStay: "June 2026",
          ratingOverallStay: 5,
          ratingCleanliness: 5,
          ratingComfort: 5,
          ratingLocation: 5,
          ratingValueStay: 4,
          ratingStaffHospitality: 5,
          stayLoveMost: "The infinity pool over the sacred Ganga river is sensational. Beautiful evening yoga shala too!",
          stayImproved: "Maybe add more vegan breakfast selections.",
          stayRecommend: true,
          travelerType: "Workation",
          storyTitle: "Yoga & Coding by the Himalayas",
          storyText: "Spent three magical days working remotely with the river breeze in my hair. The dual fiber backups in the lounge area let me deploy server changes smoothly under the peak shadow of trees. Absolutely recommended for any tech nerd looking to find inner peace.",
          photos: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80"],
          videos: [],
          xpAwarded: 80,
          badgesUnlocked: ["Reviewer", "Storyteller"],
          destination: "Rishikesh",
          moderationStatus: "Approved",
          createdAt: "2026-06-15T08:00:00.000Z"
        },
        {
          id: "REV-1002",
          bookingId: "UBX-EXP-2026-1458",
          userId: null,
          guestName: "Nisha Sharma",
          guestEmail: "nisha@example.com",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
          bookingType: "Experience",
          experienceName: "White Water Rafting",
          dateOfStay: "June 2026",
          ratingOverallExp: 5,
          ratingSafety: 5,
          ratingGuideQuality: 5,
          ratingFunFactor: 5,
          ratingValueExp: 5,
          ratingEquipmentQuality: 5,
          expFavoritePart: "Tackling the Roller Coaster Grade III rapids in Shivpuri! Absolutely heart-pounding.",
          expRecommend: true,
          travelerType: "Friends",
          storyTitle: "Conquering the Ganges Rapids",
          storyText: "Best rafting experience of my life! Our safety certified guide was extremely thorough and professional. The water was refreshing, and the cliff-jumping midpoint was an absolute highlight.",
          photos: ["https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=800&q=80"],
          videos: [],
          xpAwarded: 30,
          badgesUnlocked: ["Reviewer"],
          destination: "Rishikesh",
          moderationStatus: "Approved",
          createdAt: "2026-06-14T14:30:00.000Z"
        },
        {
          id: "REV-1003",
          bookingId: "UBX-ST-2026-9999",
          userId: null,
          guestName: "Sarah M.",
          guestEmail: "sarah@gmail.com",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80",
          bookingType: "Both",
          propertyName: "UbEx Workation & Co-living",
          roomType: "Private Double Studio",
          experienceName: "Tibetan Group Meditation",
          dateOfStay: "May 2026",
          ratingOverallStay: 5,
          ratingCleanliness: 5,
          ratingComfort: 5,
          ratingLocation: 5,
          ratingValueStay: 5,
          ratingStaffHospitality: 5,
          stayLoveMost: "Extremely tidy co-living vibes, friendly hosts, and top-tier community dinners.",
          stayRecommend: true,
          ratingOverallExp: 5,
          ratingSafety: 5,
          ratingGuideQuality: 5,
          ratingFunFactor: 4,
          ratingValueExp: 5,
          ratingEquipmentQuality: 5,
          expFavoritePart: "Sound bath with ancient metal singing bowls.",
          expRecommend: true,
          travelerType: "Solo Traveler",
          storyTitle: "Healing Escape in Rishikesh",
          storyText: "As a solo female traveler, safety and community mean everything. UbEx provided an incredibly clean, friendly workspace and arranged sunrise meditations which were completely transcendent.",
          photos: ["https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80"],
          videos: [],
          xpAwarded: 80,
          badgesUnlocked: ["Reviewer", "Creator"],
          destination: "Rishikesh",
          moderationStatus: "Approved",
          createdAt: "2026-05-20T10:15:00.000Z"
        }
      ];
      writeDb(db);
    }
    
    // Auto-seed basic bookings to verify easily
    const bookings = db.bookings || [];
    if (bookings.length === 0) {
      db.bookings = [
        {
          id: 1,
          bookingId: "UBX-ST-2026-4587",
          userId: 1,
          guestName: "Kalpesh Loon",
          guestPhone: "+91 9988776655",
          guestEmail: "kalpeshloon@gmail.com",
          country: "India",
          arrivalTime: "12:00 PM",
          travelPurpose: "Remote workation & spiritual search",
          specialNotes: "High floors close to wifi routers",
          marketingConsent: true,
          paymentType: "Pay At Property",
          selectedAddons: [],
          cartStays: [{ id: "stay-luxury", title: "UbEx Ganga View Luxury Villa", category: "Luxury", price: "₹12,000", priceValue: 12000, days: 3 }],
          cartExperiences: [],
          amountPayable: 36000,
          amountPaid: 36000,
          amountRemaining: 0,
          currency: "INR",
          createdAt: "2026-06-12T10:00:00.000Z",
          status: "Confirmed"
        },
        {
          id: 2,
          bookingId: "UBX-EXP-2026-1458",
          userId: null,
          guestName: "Nisha Sharma",
          guestPhone: "+91 9876543210",
          guestEmail: "nisha@example.com",
          country: "India",
          arrivalTime: "9:00 AM",
          travelPurpose: "Friend outing",
          specialNotes: "Requires vegetarian mid-trip packed meals",
          marketingConsent: false,
          paymentType: "Online Prepay",
          selectedAddons: [],
          cartStays: [],
          cartExperiences: [{ id: "rafting", title: "White Water Rafting", variant: "16 KM Popular Run", price: "₹999", priceValue: 999, guests: 2 }],
          amountPayable: 1998,
          amountPaid: 1998,
          amountRemaining: 0,
          currency: "INR",
          createdAt: "2026-06-14T11:00:00.000Z",
          status: "Confirmed"
        }
      ];
      writeDb(db);
    }

    return db.reviews;
  },
  
  saveReviews: (reviews: LocalDb["reviews"]) => {
    const db = readDb();
    db.reviews = reviews;
    writeDb(db);
  },

  getStays: () => readDb().stays || [],
  saveStays: (stays: LocalDb["stays"]) => {
    const db = readDb();
    db.stays = stays;
    writeDb(db);
  },

  getExperiences: () => readDb().experiences || [],
  saveExperiences: (experiences: LocalDb["experiences"]) => {
    const db = readDb();
    db.experiences = experiences;
    writeDb(db);
  },

  getSystemSettings: () => readDb().system_settings || DEFAULT_SYSTEM_SETTINGS,
  saveSystemSettings: (settings: LocalDb["system_settings"]) => {
    const db = readDb();
    db.system_settings = settings;
    writeDb(db);
  },

  getInquiries: () => readDb().inquiries || [],
  saveInquiries: (inquiries: LocalDb["inquiries"]) => {
    const db = readDb();
    db.inquiries = inquiries;
    writeDb(db);
  }
};

