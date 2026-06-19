import { Experience, Stay, Review, RecurringEvent, CommunityEvent } from "./types";

export const EXPERIENCES: Experience[] = [
  {
    id: "rafting",
    category: "Adventure",
    title: "White Water Rafting",
    price: "₹799",
    description: "Ride the rapids of the mighty Ganges with certified river experts.",
    longDescription: "Get ready for the ultimate river challenge! Tackle class II, III, and IV rapids under the guidance of our internationally-certified safety personnel. Enjoy cliff jumping, stunning river canyon views, and a traditional riverside hot spiced tea.",
    mainImage: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=1200",
    galleryImages: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600",
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=600",
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600"
    ],
    duration: "2-4 Hours",
    meetingPoint: "UbEx Adventure Base Camp, Tapovan",
    minAge: "14+",
    difficulty: "Moderate",
    inclusions: [
      "Certified River Guide & Safety kayaker",
      "US Coast Guard-approved premium life jackets and helmets",
      "Complimentary dry-bags for non-waterproof items",
      "High-definition helmet GoPro clips & photography points",
      "Basecamp hot refreshments"
    ],
    exclusions: [
      "Personal items and towels",
      "Hotel pick-up transfer services (can be customized)",
      "Premium food trail add-ons"
    ],
    timings: ["Morning Slot (8:00 AM)", "Noon Slot (11:30 AM)", "Sunset Slot (3:00 PM)"],
    faqs: [
      {
        question: "Is rafting safe?",
        answer: "Yes, absolutely! We strictly utilize high-grade rafts, US-CG life vests, safety helmets, and each raft is controlled by a licensed guide with a backup safety kayaker."
      },
      {
        question: "Can non-swimmers participate?",
        answer: "Yes! The safety gear will keep you afloat comfortably and guides provide complete dry-land safety orientations beforehand."
      },
      {
        question: "What should I wear?",
        answer: "We recommend quick-drying activewear (t-shirts & shorts or swimsuits) and secure strapped sandals. Avoid cotton if possible."
      }
    ],
    variants: [
      {
        name: "12 KM (Tapovan Beginner)",
        price: "₹799",
        duration: "2 Hours",
        description: "Perfect for family and first-timers. Navigates 3 active Grade II rapids.",
        priceValue: 799
      },
      {
        name: "16 KM (Shivpuri Mid-Thrill)",
        price: "₹999",
        duration: "3 Hours",
        description: "Our most popular track. Handles rapids like Golf Course & Roller Coaster.",
        priceValue: 999
      },
      {
        name: "24 KM (Marine Drive Pro-Thrill)",
        price: "₹1,499",
        duration: "5 Hours",
        description: "Full action challenge with deep canyon runs and multiple high class rapids.",
        priceValue: 1499
      }
    ]
  },
  {
    id: "bungee",
    category: "Adventure",
    title: "Bungee Jumping",
    price: "₹3,499",
    description: "India's highest and fallback exciting free-fall leap of faith.",
    longDescription: "Stand at the edge of our 83-meter platform suspended high over a pristine stream tributary of the Ganges. Leap into pure wind and enjoy the massive bounce and scenic forest views. Fully certified Swiss experts designed this system.",
    mainImage: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200",
    galleryImages: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600",
      "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=600",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=600",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600"
    ],
    duration: "1.5 Hours",
    meetingPoint: "Mohanchatti Bungee drop station",
    minAge: "12+",
    difficulty: "Challenging",
    inclusions: [
      "Licensed Jump Masters and safety harness checks",
      "Laminated jump completion certificate",
      "Safety briefing video walkthroughs",
      "Interactive health diagnostic preview"
    ],
    exclusions: [
      "Souvenir high-res video (available at ₹800 extra)",
      "Food and mineral drinks"
    ],
    timings: ["Morning Session (9:00 AM)", "Midday Session (1:00 PM)", "Evening Glow Jump (4:30 PM)"],
    faqs: [
      {
        question: "Is there a weight limit?",
        answer: "Yes, jumping is available for guests weighing between 35kg and 125kg."
      },
      {
        question: "Is bungee jumping safe?",
        answer: "Yes! Our platforms are operated with advanced redundant locks and cords that are replaced strictly after preset cycles. Built in collaboration with global adventure engineers."
      }
    ],
    variants: [
      {
        name: "Classic Over-Creek Bungee",
        price: "₹3,499",
        duration: "1 Hour",
        description: "The hallmark 82-meter vertical leap. Jump off with raw adrenaline.",
        priceValue: 3499
      },
      {
        name: "Splash Bungee (Deep Drop)",
        price: "₹3,999",
        duration: "1.5 Hours",
        description: "Unravel our special cable drop where you slide close enough to touch water.",
        priceValue: 3999
      },
      {
        name: "Couple Bungee (Tandem Leap)",
        price: "₹6,999",
        duration: "1.5 Hours",
        description: "Shared memories! Jump together off the edge tethered in secure tandem wraps.",
        priceValue: 6999
      }
    ]
  },
  {
    id: "ganga-aarti",
    category: "Spiritual",
    title: "Ganga Aarti Walk",
    price: "₹299",
    description: "Daily authentic twilight stroll & prayer ritual along local ghats.",
    longDescription: "Avoid the tourist rush. Join our local insider as we navigate hidden walkways in old Rishikesh, understanding the deep cultural heritage and attending the legendary evening prayer (Aarti) at Triveni Ghat. Participate in releasing clay lamp flowers into the waters.",
    mainImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=1200",
    galleryImages: [
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600",
      "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=600",
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600",
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600"
    ],
    duration: "2 Hours",
    meetingPoint: "Ram Jhula Entrance Point, Rishikesh",
    minAge: "All Ages",
    difficulty: "Easy",
    inclusions: [
      "Traditional handcrafted floral clay lamp (Diyya)",
      "Narrative headset & english/hindi storytelling expert",
      "Local ayurvedic refreshing herbal tea wrap"
    ],
    exclusions: [
      "Shoes bags fees (nominal ₹10)",
      "Personal temple offerings"
    ],
    timings: ["Evening Walk (5:15 PM)"],
    faqs: [
      {
        question: "Is this tour appropriate for family groups?",
        answer: "A beautiful slow walking tour, perfect for elderly relatives, parents, and children."
      }
    ],
    variants: [
      {
        name: "Local Heritage & Aarti Walk",
        price: "₹299",
        duration: "2.5 Hours",
        description: "Our signature evening walk through markets, local history ending at the prayers.",
        priceValue: 299
      }
    ]
  },
  {
    id: "food-trail",
    category: "Food Trails",
    title: "Rishikesh Food Trail",
    price: "₹1,200",
    description: "Explore hidden organic cafes, local chaat, and spiced Ayurvedic menus.",
    longDescription: "Indulge in Rishikesh's unique cafe counterculture. We guide you from traditional deep street snacks to modern superfood organic establishments. Enjoy tastings of authentic lassi, healthy wellness salads, hot pakoras, and pure local kulfi.",
    mainImage: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200",
    galleryImages: [
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600",
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600",
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=600",
      "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=600"
    ],
    duration: "3 Hours",
    meetingPoint: "UbEx Cafe Lounge, Laxman Jhula",
    minAge: "6+",
    difficulty: "Easy",
    inclusions: [
      "6 curated food and drink tastings at verified vendors",
      "Safe mineral bottled water supply",
      "Local foodie guide notes & recipes booklet"
    ],
    exclusions: [
      "Over-the-limit additional dishes",
      "Private taxi pickups"
    ],
    timings: ["Lunch Trail (12:00 PM)", "Evening Cafe Explorer (4:30 PM)"],
    faqs: [
      {
        question: "Are there vegan options?",
        answer: "Yes, Rishikesh is 100% vegetarian. Most cafe stops easily support vegan and dairy-free preferences."
      }
    ],
    variants: [
      {
        name: "Standard Foodie Package",
        price: "₹1,200",
        duration: "3 Hours",
        description: "Taste at 6 standard local spots, full guide coverage included.",
        priceValue: 1200
      }
    ]
  },
  {
    id: "earth-pulse",
    category: "Community",
    title: "Earth Pulse Cleanup",
    price: "Free",
    description: "River clearing and eco-trail community meet followed by bonfire talks.",
    longDescription: "Travel with direct meaning. Join other slow-travelers, local students, and nomads for a morning cleaning up river deposits and trail bottlenecks. Followed by hot local chai and open conversation around the forest community.",
    mainImage: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200",
    galleryImages: [
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=600",
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600",
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600"
    ],
    duration: "3 Hours",
    meetingPoint: "UbEx Co-Living Hub yard",
    minAge: "All ages",
    difficulty: "Easy",
    inclusions: [
      "Biodegradable safety cloves, waste bags, and sanitizers",
      "Unlimited fresh cardamom tea & snacks",
      "Exclusive 'Earth Pulse Eco-Warrior' graphic badge"
    ],
    exclusions: [],
    timings: ["Morning Shift (9:45 AM)"],
    faqs: [
      {
        question: "Is this entirely free?",
        answer: "Yes! There are absolutely no charges. This is our community pledge to the Ganga river valley."
      }
    ],
    variants: [
      {
        name: "Eco-Volunteer Pass",
        price: "Free",
        duration: "3 Hours",
        description: "Support our local conservation efforts. Meeting at our main co-living space.",
        priceValue: 0
      }
    ]
  },
  {
    id: "wellness-session",
    category: "Wellness",
    title: "Group Wellness Session",
    price: "₹299",
    description: "Ganga-front yoga, Tibetan sound healing bowls, and guided dhyana.",
    longDescription: "Relax and rejuvenate. Sink into gentle breathwork, Kundalini-inspired stretching, and sound baths curated under ancient high-resonance healing bowls overlooking soundscapes of the roaring River Ganges.",
    mainImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200",
    galleryImages: [
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=600",
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600",
      "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=600",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600"
    ],
    duration: "2 Hours",
    meetingPoint: "UbEx Wellness Deck, Rishikesh",
    minAge: "10+",
    difficulty: "Easy",
    inclusions: [
      "Premium yoga mats, blocks, and straps",
      "Aromatic oil head rub therapy",
      "Cold-pressed organic hibiscus immunity shot"
    ],
    exclusions: [
      "Private masterclass customization (available individually)"
    ],
    timings: ["Sunrise Session (6:30 AM)", "Sunset Healing (5:00 PM)"],
    faqs: [
      {
        question: "Is this suitable for absolute beginners?",
        answer: "Yes! Our wellness masters adapt the postures to meet novices and advance practitioners smoothly."
      }
    ],
    variants: [
      {
        name: "Introductory Yoga & Sound Session",
        price: "₹299",
        duration: "2 Hours",
        description: "A calming group session combining flow, sound bowl healing, and standard tea.",
        priceValue: 299
      },
      {
        name: "Premium Ayurvedic Wellness & Massage",
        price: "₹1,499",
        duration: "3 Hours",
        description: "Includes the standard session plus a customized 60-min therapeutic shoulder & foot oil deep alignment.",
        priceValue: 1499
      }
    ]
  },
  {
    id: "breakfast-ride",
    category: "Community",
    title: "Breakfast Ride",
    price: "₹399",
    description: "Dawn motorcycle convoy, sweeping curves, and roadside mountain hot breakfast.",
    longDescription: "Kickstart your motorcycle or hop as a pillion with fellow riders! Travel our curated route passing dense pine woods and steep bends to catch sunrise at a spectacular cliff cottage. Re-energize over steaming parathas, eggs, and freshly brewed hill-chai.",
    mainImage: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200",
    galleryImages: [
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=600",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600",
      "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=600"
    ],
    duration: "6 Hours",
    meetingPoint: "UbEx Co-Living Hub garage",
    minAge: "18+ (Drives), 14+ (Pillion)",
    difficulty: "Moderate",
    inclusions: [
      "Convoy marshal & maintenance support vehicle",
      "Safety gear (conforming riding gloves, spare helmets)",
      "Multi-course local breakfast with hot Himalayan chai"
    ],
    exclusions: [
      "Motorbike rental (can be added starting at ₹500/day description)",
      "Fuel costs"
    ],
    timings: ["Early Departure (5:00 AM)"],
    faqs: [
      {
        question: "Can I join as a pillion passenger?",
        answer: "Yes, absolutely! If you don't drive, we can pair you up with experienced riders in our squad."
      }
    ],
    variants: [
      {
        name: "Convoy Join Pass (Bring own bike)",
        price: "₹399",
        duration: "6 Hours",
        description: "Standard ticket covering convoy marshal, mechanical assistance, and full hill breakfast.",
        priceValue: 399
      },
      {
        name: "Convoy Pass + Enfield 350 Rental",
        price: "₹1,299",
        duration: "1 Day",
        description: "Full pass including the hill breakfast plus a Royal Enfield Classic bike rental for 24 hours.",
        priceValue: 1299
      }
    ]
  },
  {
    id: "riders-retreat",
    category: "Multi-Day",
    title: "Riders Retreat",
    price: "₹1,999",
    description: "Epic weekend motorcycle tours crossing Garhwal mountain passes.",
    longDescription: "Escape deep into ancient Indian landscapes. We handle bike coordination, local lodging arrangements, backup fuel, and support vehicles so you can drive beautiful curves through Chopta, Devprayag, and pine tree forests with a fun-filled community.",
    mainImage: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200",
    galleryImages: [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600",
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=600",
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600"
    ],
    duration: "3 Days",
    meetingPoint: "UbEx Garage Terminal",
    minAge: "18+",
    difficulty: "Challenging",
    inclusions: [
      "2-night stay in cozy partner boutique homestays (shared)",
      "All meals (Mountain dinners, local lunches)",
      "Route captain, mechanic, backup pickup truck for bags and spares"
    ],
    exclusions: [
      "Personal bike fuel",
      "Alcohol & personal shopping"
    ],
    timings: ["Friday departure (6:00 AM)"],
    faqs: [
      {
        question: "Is license required?",
        answer: "A valid motorcycle driving license is strictly required for driving. Pillion riders do not require it."
      }
    ],
    variants: [
      {
        name: "Standard Rider Entry",
        price: "₹1,999",
        duration: "3 Days",
        description: "Join the convoy with your own bike. Includes double-share stays and all meals.",
        priceValue: 1999
      },
      {
        name: "Rider Entry + Royal Enfield Rental",
        price: "₹5,499",
        duration: "3 Days",
        description: "Complete adventure package. Includes Royal Enfield Himalayan bike rental for 3 full days + backup support.",
        priceValue: 5499
      }
    ]
  }
];

export const STAYS: Stay[] = [
  {
    id: "stay-luxury-villa",
    title: "Mountain Whisper Luxury Villa",
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1400",
    description: "Premium independent villas with private infinity plunges overlooking ancient valleys.",
    price: "₹12,499",
    priceValue: 12499,
    rating: "4.95",
    features: ["Infinity pool", "En-suite sauna", "Private chef assistance", "High-speed Wi-Fi"]
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
    features: ["Spacious rooms", "Kitchen accesses", "Child friendly area", "Yoga lawns"]
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
    features: ["Dual Fiber back-ups", "Acoustic booths", "Nomad community", "Yoga deck"]
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
    features: ["Shared lounges", "Bunk lockers", "Weekly bonfire meets", "Workplace cafe"]
  }
];

export const REVIEWS: Review[] = [
  {
    id: "sarah-germany",
    author: "Sarah",
    origin: "Germany",
    ratingValue: 5,
    highlightText: "Highlight of our Rishikesh trip!",
    fullText: "White Water Rafting with UbEx was incredible. Our guide was incredibly calm and spoke perfect English. Safety checks were reassuring, and the rapid runs felt super thrilling! Will definitely book again.",
    date: "May 2026"
  },
  {
    id: "aditya-mumbai",
    author: "Aditya",
    origin: "Mumbai",
    ratingValue: 5,
    highlightText: "Authentic, scenic and peaceful walk",
    fullText: "The exclusive route taken on Ganga Aarti Walk was simply stellar. Avoided major crowd hubs and we got extremely close to Triveni Ghat where priests explained the prayers details. Exceptional local insight.",
    date: "June 2026"
  },
  {
    id: "olivia-australia",
    author: "Olivia",
    origin: "Australia",
    ratingValue: 5,
    highlightText: "Earth Pulse was our favourite event!",
    fullText: "It was so fulfilling to volunteer for the river beach cleanup. Met a massive group of creative nomads and we had such a heartfelt group session and chat around the campfire at night. Excellent! Highly recommend.",
    date: "April 2026"
  }
];

export const RECURRING_EVENTS: RecurringEvent[] = [
  {
    id: "rec-aarti",
    title: "Daily Ganga Aarti Walk",
    frequency: "Every Day",
    timing: "5:30 PM",
    experienceId: "ganga-aarti"
  },
  {
    id: "rec-cleanup",
    title: "Earth Pulse Beach Cleanup",
    frequency: "2nd Wednesday of Month",
    timing: "9:45 AM",
    experienceId: "earth-pulse"
  },
  {
    id: "rec-openmic",
    title: "JamSam Community Open Mic",
    frequency: "4th Saturday of Month",
    timing: "7:00 PM"
  },
  {
    id: "rec-ride",
    title: "Dawn Breakfast Convoy",
    frequency: "1st & 4th Sunday of Month",
    timing: "5:00 AM",
    experienceId: "breakfast-ride"
  },
  {
    id: "rec-meditation",
    title: "Tibetan Group Meditation",
    frequency: "2nd Thursday of Month",
    timing: "8:00 AM"
  },
  {
    id: "rec-wellness",
    title: "Ganga Sundown Sound Baths",
    frequency: "2nd Saturday of Month",
    timing: "5:00 PM",
    experienceId: "wellness-session"
  }
];

export const COMMUNITY_EVENTS: CommunityEvent[] = [
  {
    id: "comm-sanskriti",
    title: "Sanskriti Sangam",
    description: "Local music showcase, traditional Garhwali sitar rhythms, and storytelling around the deck fire.",
    dateStr: "Next Tuesday",
    timing: "6:30 PM",
    slotsRemaining: 14
  },
  {
    id: "comm-movie",
    title: "Community Movie Night",
    description: "Enjoy mountain conservation documentaries and inspiring slow-travel films followed by open debate.",
    dateStr: "Next Thursday",
    timing: "8:00 PM",
    slotsRemaining: 25
  },
  {
    id: "comm-founders",
    title: "Founders & Builders Circle",
    description: "An unstructured social mixer for tech creators, remote workers, and local makers to cross-pollinate ideas.",
    dateStr: "Next Friday",
    timing: "7:30 PM",
    slotsRemaining: 9
  },
  {
    id: "comm-fitness",
    title: "Fitness Accountability Day",
    description: "Sunrise river jogs and cross-training session with our fitness squad, followed by organic green juice shots.",
    dateStr: "Every Monday",
    timing: "6:00 AM",
    slotsRemaining: 18
  }
];
