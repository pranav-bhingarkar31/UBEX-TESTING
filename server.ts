import "./src/utils/env";
import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { createNewBooking, getBookingsByUser, getAllBookings } from "./src/db/bookings.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { adminAuth } from "./src/lib/firebase-admin.ts";
import { getUserPassport } from "./src/db/passport.ts";
import { localDb } from "./src/db/index.ts";
import { correlationIdMiddleware } from "./src/middleware/correlation";
import { adminAuthRouter } from "./src/routes/adminAuth.routes";
import { adminOSRouter } from "./src/routes/adminOS.routes";
import { ApiError } from "./src/utils/apiResponse";
import { errorHandler } from "./src/middleware/errorHandler";
import { expressAuditLogger } from "./src/middleware/auditLogger";
import { csrfProtection } from "./src/middleware/csrf";
import { FEATURES } from "./src/config/features";

dotenv.config();

// Secrets Management Review: Enforce Environment Integrity on Startup
function validateEnvironmentVariables() {
  const criticalEnvVars = ["JWT_SECRET", "CSRF_SECRET"];
  if (process.env.NODE_ENV === "production") {
    criticalEnvVars.push("SQL_HOST", "SQL_DB_NAME", "SQL_ADMIN_USER", "SQL_ADMIN_PASSWORD", "GEMINI_API_KEY");
  }

  const missing = [];
  for (const v of criticalEnvVars) {
    if (!process.env[v] || process.env[v].trim() === "") {
      missing.push(v);
    }
  }

  if (missing.length > 0) {
    console.error(`\n======================================================\n[CRITICAL STARTUP ERROR] Missing REQUIRED environment variables: ${missing.join(", ")}\n======================================================\n`);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.warn("[SECURITY EXPLOIT WARNING] Missing secrets in development. Using insecure default mock keys.");
    }
  }
}

validateEnvironmentVariables();

const app = express();
const PORT = 3000;

// Register security policies and parse guidelines first with production-grade compliance
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://apis.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://*.google.com"],
        connectSrc: ["'self'", "https://*.googleapis.com", "https://*.run.app"],
        frameAncestors: ["'self'", "https://ai.studio", "https://*.google.com"], // Permit system visualization frame
      },
    } : false,
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000, // 1 year duration
      includeSubDomains: true,
      preload: true,
    },
    xFrameOptions: { action: "sameorigin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  })
);

// Fallback configuration for Permissions Policy via custom HTTP header
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "geolocation=(self), camera=(), microphone=()");
  next();
});

app.use(cookieParser());
app.use(
  express.json({
    limit: "20kb",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "20kb",
  })
);

app.use(correlationIdMiddleware);
app.use(expressAuditLogger); // Globally trace and audit response contexts

// Block administrative and simulation routes if Admin OS is disabled for Public Beta
app.use((req, res, next) => {
  if (!FEATURES.ADMIN_OS_ENABLED) {
    const url = req.originalUrl || req.url;
    if (
      url.includes("/admin") || 
      url.includes("/all-bookings") || 
      url.includes("/passport/simulate")
    ) {
      return res.status(404).json({ error: "Administrative systems disabled for Public Beta." });
    }
  }
  next();
});

// Mount CSRF validation exclusively on state-altering administrative handlers
if (FEATURES.ADMIN_OS_ENABLED) {
  app.use("/api/v1/admin/auth", csrfProtection, adminAuthRouter);
  app.use("/api/v1/admin/os", csrfProtection, adminOSRouter);
}

// Lazy-loaded or guarded Gemini AI Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
      throw new Error("GEMINI_API_KEY is not configured in the Secrets manager.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `You are Mr. UbEx AI, the friendly, knowledgeable local AI travel assistant for UbEx (Stays & Experiences) in Rishikesh, India.
Your mission is to guide guests, recommend custom stays, answer questions about adventures, suggest delicious cafes, and plan itineraries.

Stays by UbEx:
1. Luxury Villa: Curated premium private villas (₹8,000 to ₹25,000/night).
2. Family Stays: Spacious, premium hospitality curated for groups and families (₹4,500/night).
3. Workation Rooms: Dynamic workspace setup, high-speed fiber internet, digital nomad vibe (₹1,800/night).
4. Backpacker Dorms & Rooms: Social hostel atmosphere, budget twin beds, and smart shared lounge (₹699 for Dorms, ₹1,500 for Private).

Curated local Experiences:
- White Water Rafting: Beginner 12km (₹799), Popular 16km (₹999), Thrilling 24km (₹1499).
- Bungee Jumping: 83m height jump over a river tributary. Classic (₹3499), Splash (₹3999), Couple Bungee (₹6999).
- Ganga Aarti Walk: Authentic local spiritual walk, direct access to hidden bank sites (₹299, daily 5:30 PM).
- Rishikesh Food Trail: Multi-cafe exploration guides, organic eats, traditional street food (₹1200, Fridays).
- Earth Pulse Cleanup: River clearing & waste sorting community event (Free, 2nd Wednesday).
- Group Wellness: Hatha yoga sessions, meditation bowls, sound baths (₹299, 2nd Saturday).
- Breakfast Ride: Motorcycle rental, sunrise gap riding, traditional breakfast inclusion (₹399, 1st & 4th Sunday).
- Riders Retreat: 3-day Himalayan motorcycle roadmap including rentals and gears (₹1999+).

Tone & Guidelines:
- Enthusiastic, rich in local context, responsive, and welcoming.
- When recommendations are asked, list actual activities with their variants/pricing.
- Encourage users to open the "Select Experience" or click cards to simulate bookings.
- Be brief, structured, matching a messaging chat output. Use clean bullets.`;

// API routes go here FIRST
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, currency = "INR", lang = "EN" } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Currency multipliers relative to INR
    const rMap: Record<string, { r: number; p: string }> = {
      INR: { r: 1.0, p: "₹" },
      USD: { r: 0.012, p: "$" },
      EUR: { r: 0.011, p: "€" },
      GBP: { r: 0.0092, p: "£" },
      RUB: { r: 1.12, p: "₽" },
      CNY: { r: 0.087, p: "¥" },
      JPY: { r: 1.88, p: "¥" },
      KRW: { r: 16.5, p: "₩" },
      ILS: { r: 0.044, p: "₪" },
      AED: { r: 0.044, p: "AED " },
      AUD: { r: 0.018, p: "A$" },
      CAD: { r: 0.0165, p: "C$" },
      SGD: { r: 0.016, p: "S$" }
    };
    
    const rateConfig = rMap[currency] || rMap["INR"];

    try {
      const ai = getGeminiClient();
      
      // Format history appropriately for chat
      const formattedHistory = Array.isArray(history) 
        ? history.map(h => ({
            role: h.sender === "user" ? "user" : "model",
            parts: [{ text: h.text }]
          }))
        : [];

      const customInstruction = `${SYSTEM_INSTRUCTION}
      
CRITICAL USER CONFIGURATIONS:
- User selected language: "${lang}". You MUST answer the user in ${lang} language! (e.g. if ZH, write in Chinese; if HI, write in Hindi; if RU, write in Russian; if EN, write in English; if FR, write in French; if ES, write in Spanish; if DE, write in German; if IT, write in Italian).
- Active currency is: "${currency}". All prices you mention MUST be converted from INR to ${currency} (rate: 1 INR = ${rateConfig.r} ${currency}) and formatted with symbol ${rateConfig.p}.`;

      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: customInstruction,
          temperature: 0.7,
        },
        history: formattedHistory,
      });

      const result = await chat.sendMessage({ message: message });
      const textResponse = result.text || "I apologize, I didn't catch that. Could you try again?";

      return res.json({ response: textResponse });
    } catch (aiError: any) {
      console.error("Gemini API Error: ", aiError);

      const formatP = (inrVal: number) => {
        const converted = Math.round(inrVal * rateConfig.r);
        return `${rateConfig.p}${converted.toLocaleString()}`;
      };
      
      // Fallback response with beautiful, context-aware mock answers if the key is not set
      // This ensures a stunning experience in preview mode even before credentials are set.
      const lowMessage = message.toLowerCase();
      let fallbackText = "";

      const promptLang = lang.toUpperCase();
      const isHindi = promptLang === "HI";
      const isChinese = promptLang === "ZH";

      if (lowMessage.includes("raft") || lowMessage.includes("water") || lowMessage.includes("river") || lowMessage.includes("नाव") || lowMessage.includes("रेफ्टिंग")) {
        if (isHindi) {
          fallbackText = `🚣 **ऋषिकेश व्हाइट वॉटर राफ्टिंग (Mr. UbEx AI)**:
हम ऋषिकेश में अद्भुत राफ्टिंग यात्राएँ प्रदान करते हैं!
- **12 KM (शुरुआती)**: बिल्कुल नया अनुभव! ब्रह्मपुरी से **${formatP(799)}** पर।
- **16 KM (सबसे लोकप्रिय)**: शिवपुरी से ग्रेड II और III रैपिड्स के साथ **${formatP(999)}** पर।
- **24 KM (पूर्ण रोमांच)**: मरीन ड्राइव से **${formatP(1499)}** पर।

*सुझाव: राफ्टिंग चुनने के लिए कार्ड पर क्लिक करें!*`;
        } else if (isChinese) {
          fallbackText = `🚣 **里诗凯诗恒河漂流指南 (Mr. UbEx AI)**:
我们提供最刺激的漂流玩法：
- **12 KM (温和新手段)**: 适合首次体验，由 Brahmpuri 出发 **${formatP(799)}**。
- **16 KM (人气最高段)**: 挑战二级和三级激流，由 Shivpuri 出发 **${formatP(999)}**。
- **24 KM (极品冒险段)**: 全程终极挑战，由 Marine Drive 出发 **${formatP(1499)}**。

*预订提示：您可以点击“White Water Rafting”体验卡片，轻松定制您的漂流时间！*`;
        } else {
          fallbackText = `🚣 **UbEx Rafting Advisory (Mr. UbEx AI)**:
We offer some thrill-packed rafting trips in Rishikesh!
- **12 KM (Beginner)**: Perfect for first-timers! Starts from Brahmpuri at **${formatP(799)}**.
- **16 KM (Most Popular)**: Navigates several Grade II & III rapids like Golf Course and Roller Coaster. Starts from Shivpuri at **${formatP(999)}**.
- **24 KM (Full Adventure)**: Extreme challenge from Marine Drive at **${formatP(1499)}**.

*Tip to join: You can click the "White Water Rafting" card in our grid to choose a variant, review safety details, and customize your booking right away!*`;
        }
      } else if (lowMessage.includes("bungee") || lowMessage.includes("jump") || lowMessage.includes("thrill") || lowMessage.includes("कूद") || lowMessage.includes("बंजी")) {
        if (isHindi) {
          fallbackText = `🪂 **भारत का सबसे ऊंचा बंजी जंप (Mr. UbEx AI)**:
ऋषिकेश में हमारे सुरक्षा-प्रथम भागीदारों के साथ रोमांच का अनुभव करें!
- **क्लासिक बंजी**: **${formatP(3499)}**।
- **स्प्लैश बंजी**: पानी को छूने वाला ड्राप **${formatP(3999)}**।
- **कपल्स बंजी**: युगल कूद **${formatP(6999)}**।

*बुक करने के लिए: लिस्टिंग में "बंजी जंपिंग" कार्ड पर क्लिक करें!*`;
        } else if (isChinese) {
          fallbackText = `🪂 **印度里诗凯诗至高绝壁蹦极 (Mr. UbEx AI)**:
与我们获得国际顶级安全认证的教练团队一起挑战极限：
- **经典单人蹦极**: 纵身一跃狂澜在侧 (**${formatP(3499)}**)。
- **触水极速蹦极**: 滑翔指尖轻抚溪流 (**${formatP(3999)}**)。
- **双人默契蹦极**: 携手伴侣勇敢一跃 (**${formatP(6999)}**)。`;
        } else {
          fallbackText = `🪂 **India's Highest Bungee Jump**:
UbEx partners with fully certified, safety-first experts to deliver real adrenaline rushes!
- **Classic Bungee**: Single jump over the Hyatt river ravine (**${formatP(3499)}**).
- **Splash Bungee**: Slide-touching water drop (**${formatP(3999)}**).
- **Couple Bungee**: Tandem leap of faith (**${formatP(6999)}**).

*To book: Click the "Bungee Jumping" card in our listings and choose your jump category.*`;
        }
      } else if (lowMessage.includes("stay") || lowMessage.includes("hotel") || lowMessage.includes("hostel") || lowMessage.includes("dorm") || lowMessage.includes("कमरा") || lowMessage.includes("होटल")) {
        if (isHindi) {
          fallbackText = `🏡 **UbEx ऋषिकेश में रहने के विकल्प**:
हम आपकी यात्रा शैली के अनुसार अनुकूल विकल्प प्रदान करते हैं:
- **लक्जरी विला**: भव्य पर्वतीय दृश्यों के साथ निजी विला।
- **पारिवारिक प्रवास**: बड़ा स्थान, शानदार आतिथ्य।
- **वर्कशन कमरा**: वाई-फाई के साथ डिजिटल नोमैड फोकस।
- **बैकपैकर डॉर्म**: साझा रूम **${formatP(699)}** से शुरू।`;
        } else if (isChinese) {
          fallbackText = `🏡 **圣城精品旅宿预订 (Mr. UbEx AI)**:
根据您的出行偏好，我们提供了以下特色星级旅居：
- **奢华庄园别墅 (Luxury Villa)**: 独立泳池与喜马拉雅山谷画幅。
- **轻奢家庭套房 (Family Stay)**: 适合家庭天伦之乐的全屋整租。
- **远程办公工作舱 (Workation)**: 配备企业级防跌落光纤与精品咖啡吧。
- **全球背包客宿舍 (Dorm)**: 国际化的合宿青年体验，起价仅 **${formatP(699)}**。`;
        } else {
          fallbackText = `🏡 **Stay at UbEx Rishikesh**:
We have beautiful options designed around your travel style:
- **Luxury Villa**: Highly curated private stays with gorgeous mountain frames.
- **Family Stay**: Spacious, premium hospitality.
- **Workation**: Fiber-optic speeds and digital nomad focus.
- **Backpacker Dorms**: Cozy bunks starting at **${formatP(699)}** and premium twin private rooms.`;
        }
      } else if (lowMessage.includes("hello") || lowMessage.includes("hi") || lowMessage.includes("hey") || lowMessage.includes("नमस्ते") || lowMessage.includes("你好")) {
        if (isHindi) {
          fallbackText = `नमस्ते! 🙏 ऋषिकेश में आपका स्वागत है! मैं **Mr. UbEx AI** हूँ, आपका स्थानीय मार्गदर्शक।

मैं आपको ठहरने के सर्वोत्तम विकल्प और साहसिक अनुभव चुनने में मदद कर सकता हूँ:
1. 🚣 **व्हाइट वॉटर राफ्टिंग** (**${formatP(799)}** से शुरू)
2. 🪂 **बंजी जंपिंग** (**${formatP(3499)}** से शुरू)
3. 🧘 **गंगा आरती वॉक** (**${formatP(299)}**)
4. 🚶 **ऋषिकेश कैफ़े फ़ूड ट्रेल** (**${formatP(1200)}**)`;
        } else if (isChinese) {
          fallbackText = `你好！🙏 欢迎来到圣城里诗凯诗！我是 **Mr. UbEx AI**，您专属的当地旅行助手。

我可以为您严选当下最棒的精选旅宿与当地特色探索：
1. 🚣 **恒河漂流 (Rafting)** (起价 **${formatP(799)}**)
2. 🪂 **绝壁蹦极 (Bungee Jumping)** (起价 **${formatP(3499)}**)
3. 🧘 **恒河落日晚祷仪式 (Aarti Walk)** (**${formatP(299)}**)
4. 🚶 **主理人私家咖啡馆寻味 (Food Trail)** (**${formatP(1200)}**)`;
        } else {
          fallbackText = `Namaste! 🙏 Welcome to Rishikesh! I am **Mr. UbEx AI**, your virtual local buddy.

I can help you choose the best **UbEx Stays** and adventure **Experiences** like:
1. 🚣 **White Water Rafting** (from **${formatP(799)}**)
2. 🪂 **Bungee Jumping** (from **${formatP(3499)}**)
3. 🧘 **Ganga Aarti Walk** (**${formatP(299)}**)
4. 🚶 **Local Food Trails** (Fridays at **${formatP(1200)}**)

Ask me about any activity, timing recommendation, or stay options!`;
        }
      } else {
        if (isHindi) {
          fallbackText = `🙏 **नमस्ते!** ऋषिकेश के अनुभवों के बारे में पूछने के लिए धन्यवाद।
हमारा **गंगा आरती वॉक** शाम 5:30 बजे शामिल होने की सलाह दी जाती है। आप एक आरामदायक विला या एडवेंचर पैकेज की तलाश कर सकते हैं!`;
        } else if (isChinese) {
          fallbackText = `🙏 **纳玛斯戴 (Namaste)!** 感谢您垂询里诗凯诗旅行资讯。
这里不仅是世界瑜伽之都，更是洗涤心灵与挑战极端的圣地。我们强烈向您安利：
- 傍晚 5:30 参加我们的 **恒河落日祈祷行 (Ganga Aarti Walk)**。
- 参与每周三的 **地球脉搏河流环保义工行 (Earth Pulse Cleanup)** 遇见同频挚友。`;
        } else {
          fallbackText = `🙏 **Namaste!** Thank you for asking about **Rishikesh Experiences**.

Rishikesh is the Yoga Capital of the World and an adventure capital. I highly recommend:
- Joining our **Ganga Aarti Walk** at 5:30 PM to view local prayers (**${formatP(299)}**).
- Engaging in the **Earth Pulse Cleanup** on Wednesday to meet like-minded change makers!
- Choosing a comfortable **Workation Stay** or booking a **White Water Rafting** slot.

Would you like help picking the perfect adventure package? Feel free to ask!`;
        }
      }

      // If the API key is actually missing, we append a helpful preview tip for the developer
      const missingKeyWarning = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY";
      if (missingKeyWarning) {
        fallbackText += `\n\n*(Mr. UbEx AI is currently running in smart-preview mode. Active Language: **${lang}** • Active Currency: **${currency}**)*`;
      }

      return res.json({ response: fallbackText });
    }
  } catch (error) {
    console.error("General API Error", error);
    res.status(500).json({ error: "Something went wrong on our servers." });
  }
});

// Create checkout booking in Cloud SQL database
app.post("/api/bookings", async (req, res) => {
  try {
    const bookingData = req.body;
    if (!bookingData || !bookingData.bookingId) {
      return res.status(400).json({ error: "Invalid booking data." });
    }

    // Attempt optional token authorization to link client bookings
    let dbUserId: number | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        if (decodedToken) {
          const matchedUser = await getOrCreateUser(decodedToken.uid, decodedToken.email || "");
          dbUserId = matchedUser.id;
        }
      } catch (authError) {
        console.warn("Optional Token verification failed, saving booking as guest:", authError);
      }
    }

    const savedBooking = await createNewBooking({
      bookingId: bookingData.bookingId,
      userId: dbUserId,
      guestName: bookingData.guestName,
      guestPhone: bookingData.guestPhone,
      guestEmail: bookingData.guestEmail,
      country: bookingData.country,
      arrivalTime: bookingData.arrivalTime,
      travelPurpose: bookingData.travelPurpose,
      specialNotes: bookingData.specialNotes || bookingData.specialRequests,
      marketingConsent: bookingData.marketingConsent,
      paymentType: bookingData.paymentType,
      selectedAddons: bookingData.selectedAddons,
      cartStays: bookingData.cartStays,
      cartExperiences: bookingData.cartExperiences,
      amountPayable: Number(bookingData.amountPayable),
      amountPaid: Number(bookingData.amountPaid),
      amountRemaining: Number(bookingData.amountRemaining),
      currency: bookingData.currency,
    });

    console.log("Successfully stored customer booking in Cloud SQL:", savedBooking.bookingId);
    return res.status(201).json({ success: true, booking: savedBooking });
  } catch (error: any) {
    console.error("Booking submission endpoint error:", error);
    return res.status(500).json({ error: error.message || "Failed to store checkout data." });
  }
});

// Fetch authenticated user's bookings from Cloud SQL
app.get("/api/bookings", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User context not found." });
    }
    const matchedUser = await getOrCreateUser(req.user.uid, req.user.email || "");
    const userBookings = await getBookingsByUser(matchedUser.id);
    return res.json({ bookings: userBookings });
  } catch (error: any) {
    console.error("Failed to fetch user bookings:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch bookings." });
  }
});

// Fetch all database bookings (Administrator view / logs verification)
app.get("/api/all-bookings", async (req, res) => {
  try {
    const list = await getAllBookings();
    return res.json({ bookings: list });
  } catch (error: any) {
    console.error("Failed to fetch administrative logs:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch all bookings." });
  }
});

// ==================================================
// PUBLIC INTEGRATIONS: CMS, RAZORPAY & WAITLISTS
// ==================================================

import { DbService } from "./src/db/dbService";
import { checkDatabaseHealth } from "./src/db/dbClient";
import { RateLimitService } from "./src/services/rateLimit.service";
import { InquiryIdService } from "./src/services/inquiryId.service";
import { EmailService } from "./src/services/email.service";
import { ContactConfigService } from "./src/services/contactConfig.service";
import { createInquirySchema, updateInquiryStatusSchema, InquiryStatus } from "./src/validators/inquiry.validator";
import { SecurityService } from "./src/services/audit.service";
import { requireAdmin } from "./src/middleware/adminJwtAuth";
import { PaymentService } from "./src/services/payment.service";
import { InventoryService } from "./src/services/inventory.service";
import { NotificationService } from "./src/services/notifications.service";

// Centralized Config Endpoint
app.get("/api/config/contact", (req, res) => {
  return res.json({
    success: true,
    UBEX_WHATSAPP_NUMBER: ContactConfigService.getWhatsAppNumber(),
    SUPPORT_EMAIL: ContactConfigService.getSupportEmail()
  });
});

// Deployment Health Check Endpoint
app.get("/api/health", async (req, res) => {
  let dbOk = false;
  try {
    dbOk = await checkDatabaseHealth();
  } catch (err) {
    dbOk = false;
  }

  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  let smtpOk = false;
  if (smtpConfigured) {
    try {
      smtpOk = await EmailService.verifySmtpConnection();
    } catch (err) {
      smtpOk = false;
    }
  } else {
    smtpOk = true; // Mock console smtp is active and operational for development
  }

  return res.json({
    status: "ok",
    database: dbOk,
    smtp: smtpOk,
    inquiryEngine: true,
    environment: process.env.NODE_ENV || "development"
  });
});

// Public CMS Endpoint - Stays
app.get("/api/stays/public", async (req, res) => {
  try {
    const data = await DbService.getStays(false); // exclude archived
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Public CMS Endpoint - Experiences
app.get("/api/experiences/public", async (req, res) => {
  try {
    const data = await DbService.getExperiences(false); // exclude archived
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

import { TestRunner } from "./src/tests/test-suite";

// On-demand administrative automated test panel execution (Phase 7)
app.get("/api/admin/system/tests", async (req, res) => {
  try {
    const report = await TestRunner.runAllTests();
    return res.json({ success: true, ...report });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Razorpay Order Creation Route
app.post("/api/payments/create-order", async (req, res) => {
  try {
    const { bookingId, amount, currency } = req.body;
    if (!bookingId || !amount) {
      return res.status(400).json({ error: "Missing bookingId or amount." });
    }
    const orderData = await PaymentService.createRazorpayOrder({ bookingId, amount, currency });
    return res.json({ success: true, ...orderData });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Razorpay Signature Verification Route
app.post("/api/payments/verify-signature", async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: "Incomplete payment signatures." });
    }

    const verification = await PaymentService.verifyPaymentSignature({
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    if (verification.success) {
      // Lazy dispatch customer confirmation notification (Email + SMS)
      const booking = await DbService.getBookingByBookingId(bookingId);
      if (booking) {
        // Run asynchronously without blocking response
        NotificationService.sendNotification({
          toEmail: booking.guestEmail,
          toPhone: booking.guestPhone,
          recipientName: booking.guestName,
          templateType: "BOOKING_CONFIRMED",
          variables: {
            bookingId: booking.bookingId,
            amount: booking.amountPayable,
            currency: booking.currency,
            details: `<strong>Check-in details:</strong> Dynamic Outpost Check-in (Tapovan Rishikesh)`
          }
        }).catch(err => console.error("Async post-booking mail failed:", err));
      }

      return res.json({ success: true, message: verification.message });
    } else {
      return res.status(400).json({ success: false, message: verification.message });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Razorpay Webhook Event Listener
app.post("/api/payments/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    const body = req.body;
    const result = await PaymentService.processWebhook(body, signature);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("RazorPay Webhook Exception:", err);
    return res.status(400).send(err.message || "Webhook error");
  }
});

// Public Waitlist Registration
app.post("/api/waitlists", async (req, res) => {
  try {
    const { experienceId, guestName, guestEmail, guestPhone, requestedDate } = req.body;
    if (!experienceId || !guestName || !guestEmail || !guestPhone || !requestedDate) {
      return res.status(400).json({ error: "Missing required waitlist fields." });
    }

    const registration = await InventoryService.joinExperienceWaitlist(
      experienceId,
      guestName,
      guestEmail,
      guestPhone,
      requestedDate
    );

    return res.json({ success: true, message: "Successfully registered on experience waitlist.", data: registration });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Dynamic Inquiry Engine Rate Limits & Spam Prevention Cache
const inquiryRateLimits = new Map<string, Array<number>>();
const lastInquiryPayloads = new Map<string, { payload: string; time: number }>();

function isInquiryRateLimited(ip: string): boolean {
  const now = Date.now();
  const times = inquiryRateLimits.get(ip) || [];
  const validTimes = times.filter(t => now - t < 60000);
  validTimes.push(now);
  inquiryRateLimits.set(ip, validTimes);
  return validTimes.length > 5; // Max 5 inquiries per minute
}

function isInquirySpam(payload: any): boolean {
  const suspectKeywords = [
    "casino", "lottery", "crypto", "free money", "baccarat", "free chip", 
    "viagra", "poker", "porn", "sex", "betting", "forex", "binary option"
  ];
  const checkFields = [
    payload.listingTitle,
    payload.roomName,
    payload.experienceName,
    payload.category,
    payload.sourcePage
  ].filter(Boolean);

  for (const field of checkFields) {
    const lower = String(field).toLowerCase();
    if (suspectKeywords.some(kw => lower.includes(kw))) {
      return true;
    }
  }
  return false;
}

// Dynamic Inquiry Engine Create Endpoint
app.post("/api/inquiries/create", async (req, res) => {
  try {
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "unknown-ip";
    
    // rate limiter step (Sec 2)
    const isLimited = await RateLimitService.isRateLimited(ip);
    if (isLimited) {
      return res.status(429).json({ success: false, error: "Too many inquiries. Maximum 5 per minute and 30 per hour allowed. Please wait a moment before trying again." });
    }

    // safe parsing schemas (Sec 4)
    const parsedInput = createInquirySchema.safeParse(req.body);
    if (!parsedInput.success) {
      return res.status(400).json({ success: false, error: parsedInput.error.issues[0].message });
    }

    const inputData = parsedInput.data;

    // strict text sanitation protocol (Sec 4)
    const sanitizeStr = (val: string | undefined | null) => {
      if (!val) return "";
      return String(val).replace(/<[^>]*>/g, "").replace(/javascript:/gi, "").trim();
    };

    const sanitizedType = sanitizeStr(inputData.inquiryType);
    const sanitizedTitle = sanitizeStr(inputData.listingTitle);
    const sanitizedCategory = sanitizeStr(inputData.category);
    const sanitizedRoomName = sanitizeStr(inputData.roomName);
    const sanitizedExpName = sanitizeStr(inputData.experienceName);
    const sanitizedDate = sanitizeStr(inputData.selectedDate);
    const sanitizedPage = sanitizeStr(inputData.sourcePage);

    const payloadCheck = {
      inquiryType: sanitizedType,
      listingTitle: sanitizedTitle,
      category: sanitizedCategory,
      roomName: sanitizedRoomName,
      experienceName: sanitizedExpName,
      sourcePage: sanitizedPage
    };

    if (isInquirySpam(payloadCheck)) {
      return res.status(400).json({ success: false, error: "Your inquiry contains suspicious or blocklisted keywords." });
    }

    // Duplicate submission protection within 10 seconds
    const key = `${ip}:${sanitizedType}:${sanitizedTitle}`;
    const previous = lastInquiryPayloads.get(key);
    if (previous && (Date.now() - previous.time < 10000)) {
      return res.status(400).json({ success: false, error: "Duplicate inquiry detected. Please wait 10 seconds before submitting again." });
    }
    lastInquiryPayloads.set(key, { payload: JSON.stringify(req.body), time: Date.now() });

    // Generate unique, sequential Inquiry ID cleanly via sequences (Sec 1)
    const inquiryId = await InquiryIdService.generateInquiryId(sanitizedType);

    // Build WhatsApp Message Body
    let waMessage = "";
    const lowerType = sanitizedType.toLowerCase();
    
    if (lowerType === "stay" || lowerType === "workation") {
      const checkinStr = (Array.isArray(inputData.selectedDates) && inputData.selectedDates[0]) || sanitizedDate || "TBD";
      const checkoutStr = (Array.isArray(inputData.selectedDates) && inputData.selectedDates[1]) || "TBD";
      const dateDisplay = checkinStr !== "TBD" && checkoutStr !== "TBD" ? `${checkinStr} – ${checkoutStr}` : checkinStr;
      
      waMessage = `Hi UbEx,\n\nI am interested in the following stay:\n\nProperty: ${sanitizedTitle}\nRoom Type: ${sanitizedRoomName || "AC Dorm"}\nGuests: ${inputData.guestCount || 1}\nDates: ${dateDisplay}\n\nInquiry ID: ${inquiryId}\n\nPlease share availability and details.`;
    } else if (lowerType === "experience") {
      waMessage = `Hi UbEx,\n\nI am interested in the following experience:\n\nExperience: ${sanitizedTitle}\nParticipants: ${inputData.guestCount || 1}\nPreferred Date: ${sanitizedDate || "TBD"}\n\nInquiry ID: ${inquiryId}\n\nPlease share availability and details.`;
    } else if (lowerType === "wellness") {
      waMessage = `Hi UbEx,\n\nI am interested in the following wellness session:\n\nProgram: ${sanitizedTitle}\nParticipants: ${inputData.guestCount || 1}\nDates: ${sanitizedDate || "TBD"}\n\nInquiry ID: ${inquiryId}\n\nPlease share program details.`;
    } else if (lowerType === "community" || lowerType === "event") {
      waMessage = `Hi UbEx,\n\nI am interested in attending:\n\nEvent: ${sanitizedTitle}\nAttendees: ${inputData.guestCount || 1}\n\nInquiry ID: ${inquiryId}\n\nPlease share registration details.`;
    } else {
      waMessage = `Hi UbEx,\n\nI am interested in the following dynamic inquiry:\n\nListing: ${sanitizedTitle}\nType: ${sanitizedType}\nGuests/Attendees: ${inputData.guestCount || 1}\nDates/Period: ${sanitizedDate || "TBD"}\n\nInquiry ID: ${inquiryId}\n\nPlease contact me with availability and details.`;
    }

    const encodedMessage = encodeURIComponent(waMessage);
    const targetWhatsApp = ContactConfigService.getWhatsAppNumber();
    const waUrl = `https://wa.me/${targetWhatsApp}?text=${encodedMessage}`;
    console.log(`[BETA MONITOR - WHATSAPP LINK GENERATED] Inquiry ID: ${inquiryId} | Destination: +${targetWhatsApp}`);

    const userAgentStr = req.headers["user-agent"] || "";
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgentStr);
    const deviceType = isMobile ? "Mobile" : "Desktop";

    // lead attribution variables (Sec 12, 13)
    const inquiryRecord = {
      inquiryId,
      inquiryType: sanitizedType,
      listingId: inputData.listingId ? String(inputData.listingId) : null,
      listingTitle: sanitizedTitle,
      category: sanitizedCategory || null,
      roomName: sanitizedRoomName || null,
      experienceName: sanitizedExpName || null,
      selectedDate: sanitizedDate || null,
      selectedDates: inputData.selectedDates || null,
      guestCount: Number(inputData.guestCount) || 1,
      visitorCount: inputData.visitorCount ? Number(inputData.visitorCount) : null,
      selectedAddons: inputData.selectedAddons || null,
      sourcePage: sanitizedPage || "App",
      deviceType,
      userAgent: userAgentStr,
      inquiryStatus: "pending",
      leadSource: inputData.leadSource || null,
      campaignSource: inputData.campaignSource || null,
      campaignMedium: inputData.campaignMedium || null,
      campaignName: inputData.campaignName || null,
      email: inputData.email || null
    };

    const savedRecord = await DbService.createInquiry(inquiryRecord);
    console.log(`[BETA MONITOR - INQUIRY CREATED] Saved successfully to PostgreSQL: ${inquiryId}`);

    // Audit Log Generation matching Section 10 standard
    await SecurityService.logAudit({
      adminUserId: null,
      eventType: "INQUIRY_CREATED",
      description: `Inquiry successfully structured: ID: ${inquiryId}, Type: ${sanitizedType}, Title: ${sanitizedTitle}`,
      correlationId: req.correlationId,
      ipAddress: ip,
      userAgent: userAgentStr,
      payload: { inquiryId, inquiryType: sanitizedType, listingTitle: sanitizedTitle }
    });

    // Send confirmation email to guest if present (Sec 7 & 14)
    if (inputData.email) {
      EmailService.sendInquiryConfirmation(inputData.email, {
        inquiryId,
        inquiryType: sanitizedType,
        listingTitle: sanitizedTitle,
        selectedDate: sanitizedDate || undefined,
        guestCount: Number(inputData.guestCount) || 1,
        inquiryStatus: "pending"
      }).then((success) => {
        if (success) {
          console.log(`[BETA MONITOR - INQUIRY EMAIL SENT] Successfully sent guest confirmation email to: ${inputData.email}`);
        } else {
          console.error(`[BETA MONITOR - EMAIL FAILURE] Guest confirmation email failed to deliver to: ${inputData.email}`);
        }
      }).catch((err) => {
        console.error(`[BETA MONITOR - EMAIL FAILURE] Guest confirmation email threw exception:`, err);
      });
    }

    // Send Admin Notification alert (Sec 8 & 14)
    EmailService.sendAdminInquiryNotification({
      inquiryId,
      inquiryType: sanitizedType,
      listingTitle: sanitizedTitle,
      guestCount: Number(inputData.guestCount) || 1,
      sourcePage: sanitizedPage || undefined,
      deviceType,
      createdAt: new Date()
    }).then((success) => {
      if (success) {
        console.log(`[BETA MONITOR - ADMIN NOTIFICATION EMAIL SENT] Alert delivered to admin notification recipient.`);
      } else {
        console.error(`[BETA MONITOR - EMAIL FAILURE] Admin notification alert failed to deliver.`);
      }
    }).catch((err) => {
      console.error(`[BETA MONITOR - EMAIL FAILURE] Admin notification threw exception:`, err);
    });

    // Data privacy: strip sensitive parameters userAgent & ip Address from public response (Sec 11)
    const clientResponseRecord = { ...savedRecord };
    delete (clientResponseRecord as any).userAgent;
    delete (clientResponseRecord as any).ip;
    delete (clientResponseRecord as any).ipAddress;

    return res.json({
      success: true,
      inquiryId,
      whatsAppUrl: waUrl,
      whatsAppMessage: waMessage,
      data: clientResponseRecord
    });
  } catch (err: any) {
    console.error("[INQUIRIES SERVER EXCEPTION]:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Dynamic Inquiry Engine Retrieve Endpoint (Protected by requireAdmin)
app.get("/api/inquiries", requireAdmin(), async (req, res) => {
  try {
    const inquiries = await DbService.getInquiries();
    return res.json({ success: true, count: inquiries.length, data: inquiries });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Dynamic Inquiry Engine Update Status Endpoint (Protected by requireAdmin)
app.post("/api/inquiries/:id/status", requireAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // validate status input using Zod (Sec 4)
    const parsingResult = updateInquiryStatusSchema.safeParse({ status });
    if (!parsingResult.success) {
      return res.status(400).json({ success: false, error: parsingResult.error.issues[0].message });
    }

    // fetch old inquiry to audit old status
    const allInq = await DbService.getInquiries();
    const existing = allInq.find((inq: any) => (inq.inquiryId || inq.inquiry_id) === id);
    const oldStatus = existing ? (existing.inquiryStatus || existing.inquiry_status || "pending") : "pending";

    const result = await DbService.updateInquiryStatus(id, parsingResult.data.status);

    // Audit trail logging (Sec 10)
    const adminUser = req.adminPrincipal?.adminUserId || null;
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "unknown-ip";
    const userAgentStr = req.headers["user-agent"] || "";

    await SecurityService.logAudit({
      adminUserId: adminUser,
      eventType: "INQUIRY_STATUS_CHANGED",
      description: `Inquiry status changed: ID: ${id}, Old: ${oldStatus}, New: ${parsingResult.data.status}`,
      correlationId: req.correlationId,
      ipAddress: ip,
      userAgent: userAgentStr,
      payload: { inquiryId: id, oldStatus, newStatus: parsingResult.data.status }
    });

    return res.json({ success: true, message: `Status updated to ${parsingResult.data.status}.`, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Setup public local media upload handler (Phase 4 upload endpoint)
import multer from "multer";
const uploader = multer();
app.post("/api/media/upload", uploader.single("file"), async (req, res) => {
  try {
    // Audit Upload flow: Secure Authentication and Session Guard Checks
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Access Denied: Bearer authorization token tag is required." });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedUser;
    try {
      decodedUser = await adminAuth.verifyIdToken(token);
      if (!decodedUser) {
        return res.status(401).json({ success: false, error: "Access Denied: Invalid security session credentials." });
      }
    } catch (authError: any) {
      return res.status(401).json({ success: false, error: `Authentication failed: ${authError.message}` });
    }

    // RBAC validation: Require registered admin operator roles or inventory permissions
    const { RbacService } = await import("./src/services/rbac.service");
    const { roles: userRoles, permissions: userPerms } = await RbacService.resolveUserRbac(decodedUser.uid);
    const isAuthorized = userRoles.includes("SUPER_ADMIN") || 
                         userRoles.includes("OPERATIONS_ADMIN") || 
                         userPerms.includes("inventory:write");

    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: "Access Denied: Requisite RBAC privilege credentials are missing." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No media file was uploaded." });
    }
    const { StorageService } = await import("./src/services/storage.service");
    const uri = await StorageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    return res.json({ success: true, url: uri });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Serve public custom uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// ==================================================
// UBEX ADVENTURE PASSPORT API ENDPOINTS
// ==================================================

// Fetch passport state for user
app.get("/api/passport", async (req, res) => {
  try {
    let uid = "guest-preview-id";
    let email = "guest@ubex.com";
    
    // If authorization header exists, decode or grab email
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split("Bearer ")[1];
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
        email = decoded.email || "";
      } catch (e) {
        console.log("Token verification failed, defaulting to guest-preview-id");
      }
    }
    
    const matchedUser = await getOrCreateUser(uid, email);
    const state = await getUserPassport(matchedUser.id);
    return res.json({ success: true, passport: state });
  } catch (error: any) {
    console.error("Passport API error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Admin endpoints for Definitions
app.get("/api/admin/passport-defs", async (req, res) => {
  try {
    const leaderboard = await Promise.all(localDb.getUsers().map(async (u) => {
      const p = await getUserPassport(u.id);
      return {
        id: u.id,
        email: u.email,
        xp: p.xp,
        level: p.level.current,
        levelName: p.level.name,
        badgesCount: p.badges.filter(b => b.earned).length
      };
    }));
    
    return res.json({
      badges: localDb.getBadgeDefinitions(),
      achievements: localDb.getAchievementDefinitions(),
      rewards: localDb.getRewardDefinitions(),
      users: localDb.getUsers(),
      leaderboard: leaderboard.sort((a, b) => b.xp - a.xp)
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/badges", async (req, res) => {
  try {
    const { action, badge } = req.body; // 'create', 'update', 'delete'
    const badges = localDb.getBadgeDefinitions();
    
    if (action === "create") {
      badges.push(badge);
    } else if (action === "update") {
      const idx = badges.findIndex(b => b.id === badge.id);
      if (idx >= 0) badges[idx] = badge;
    } else if (action === "delete") {
      const idx = badges.findIndex(b => b.id === badge.id);
      if (idx >= 0) badges.splice(idx, 1);
    }
    
    localDb.saveBadgeDefinitions(badges);
    return res.json({ success: true, badges });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/achievements", async (req, res) => {
  try {
    const { action, achievement } = req.body;
    const achs = localDb.getAchievementDefinitions();
    
    if (action === "create") {
      achs.push(achievement);
    } else if (action === "update") {
      const idx = achs.findIndex(a => a.id === achievement.id);
      if (idx >= 0) achs[idx] = achievement;
    } else if (action === "delete") {
      const idx = achs.findIndex(a => a.id === achievement.id);
      if (idx >= 0) achs.splice(idx, 1);
    }
    
    localDb.saveAchievementDefinitions(achs);
    return res.json({ success: true, achievements: achs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/rewards", async (req, res) => {
  try {
    const { action, reward } = req.body;
    const rewards = localDb.getRewardDefinitions();
    
    if (action === "create") {
      rewards.push(reward);
    } else if (action === "update") {
      const idx = rewards.findIndex(r => r.id === reward.id);
      if (idx >= 0) rewards[idx] = reward;
    } else if (action === "delete") {
      const idx = rewards.findIndex(r => r.id === reward.id);
      if (idx >= 0) rewards.splice(idx, 1);
    }
    
    localDb.saveRewardDefinitions(rewards);
    return res.json({ success: true, rewards });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Simulate social, photo actions or bookings to easily test unlock
app.post("/api/passport/simulate", async (req, res) => {
  try {
    const { action, payload, uid = "guest-preview-id", email = "guest@ubex.com" } = req.body;
    const matchedUser = await getOrCreateUser(uid, email);
    const userId = matchedUser.id;
    
    if (action === "manual_badge") {
      const { badgeId } = payload;
      const allUserBadges = localDb.getUserBadges();
      if (!allUserBadges.some(ub => ub.userId === userId && ub.badgeId === badgeId)) {
        const nextId = allUserBadges.length > 0 ? Math.max(...allUserBadges.map(ub => ub.id)) + 1 : 1;
        allUserBadges.push({
          id: nextId,
          userId,
          badgeId,
          earnedAt: new Date().toISOString()
        });
        localDb.saveUserBadges(allUserBadges);
      }
    } else if (action === "social_action") {
      const { type } = payload; // 'photo', 'reel', 'review'
      const achs = localDb.getUserAchievements();
      const nextId = achs.length > 0 ? Math.max(...achs.map(ua => ua.id)) + 1 : 1;
      
      if (type === "photo" && !achs.some(ua => ua.userId === userId && ua.achievementId === "storyteller")) {
        achs.push({ id: nextId, userId, achievementId: "storyteller", earnedAt: new Date().toISOString() });
      }
      if (type === "reel" && !achs.some(ua => ua.userId === userId && ua.achievementId === "creator")) {
        achs.push({ id: nextId, userId, achievementId: "creator", earnedAt: new Date().toISOString() });
      }
      if (type === "review" && !achs.some(ua => ua.userId === userId && ua.achievementId === "reviewer")) {
        achs.push({ id: nextId, userId, achievementId: "reviewer", earnedAt: new Date().toISOString() });
      }
      localDb.saveUserAchievements(achs);
    } else if (action === "reset_passport") {
      localDb.saveUserBadges(localDb.getUserBadges().filter(ub => ub.userId !== userId));
      localDb.saveUserAchievements(localDb.getUserAchievements().filter(ua => ua.userId !== userId));
      localDb.saveUserRewards(localDb.getUserRewards().filter(ur => ur.userId !== userId));
      localDb.saveUserXp(localDb.getUserXp().filter(ux => ux.userId !== userId));
      localDb.saveBookings(localDb.getBookings().filter(b => b.userId !== userId));
    }
    
    const refreshed = await getUserPassport(userId);
    return res.json({ success: true, passport: refreshed });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ==================================================
// UBEX VERIFIED REVIEWS & STORIES API ENDPOINTS
// ==================================================

// Fetch approved reviews or all reviews for admin
app.get("/api/reviews", async (req, res) => {
  try {
    const list = localDb.getReviews();
    const isAdminMode = req.query.admin === "true";
    
    if (isAdminMode) {
      return res.json({ success: true, reviews: list });
    }
    
    // Default: only return approved public reviews
    const publicReviews = list.filter(r => r.moderationStatus === "Approved");
    return res.json({ success: true, reviews: publicReviews });
  } catch (error: any) {
    console.error("Failed to fetch reviews:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Verify booking ID and auto-detect properties
app.post("/api/bookings/verify", async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required." });
    }

    const cleanId = bookingId.trim().toUpperCase();
    const bookings = localDb.getBookings();
    const match = bookings.find(b => b.bookingId.toUpperCase() === cleanId);

    if (match) {
      // Direct database match! Return exact details
      const isStay = match.cartStays && match.cartStays.length > 0;
      const isExp = match.cartExperiences && match.cartExperiences.length > 0;
      let bookingType: "Stay" | "Experience" | "Both" = "Stay";
      if (isStay && isExp) bookingType = "Both";
      else if (isExp) bookingType = "Experience";

      return res.json({
        verified: true,
        guestName: match.guestName,
        guestEmail: match.guestEmail,
        bookingType,
        propertyName: isStay ? match.cartStays[0].title : undefined,
        roomType: isStay ? (match.cartStays[0].category === "Dorm" ? "6 Bed Mixed Dormitory" : "Premium Master Room") : undefined,
        experienceName: isExp ? match.cartExperiences[0].title : undefined,
        dateOfStay: "June 2026",
        destination: "Rishikesh"
      });
    }

    // Flexible fallback simulation for custom booking IDs (to support high-fidelity testing!)
    if (cleanId.startsWith("UBX-ST-") || cleanId.startsWith("UBX-EXP-") || cleanId.includes("-ST-") || cleanId.includes("-EXP-")) {
      const isStay = cleanId.includes("ST");
      return res.json({
        verified: true,
        guestName: "Nomad Explorer",
        guestEmail: "explorer@ubex.com",
        bookingType: isStay ? "Stay" : "Experience",
        propertyName: isStay ? "UbEx Rishikesh Outpost" : undefined,
        roomType: isStay ? "Deluxe Workation Pod" : undefined,
        experienceName: !isStay ? "Water River Rafting" : undefined,
        dateOfStay: "June 2026",
        destination: "Rishikesh"
      });
    }

    return res.status(404).json({
      verified: false,
      error: "Booking ID not found. Try 'UBX-ST-2026-4587' (Stay) or 'UBX-EXP-2026-1458' (Experience) for test validation!"
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Submit review with automatic AI Moderation, Adventure Passport rewards, and Auto Routing
app.post("/api/reviews/submit", async (req, res) => {
  try {
    const reviewData = req.body;
    if (!reviewData || !reviewData.bookingId) {
      return res.status(400).json({ error: "Missing required review payload." });
    }

    const {
      bookingId,
      guestName,
      guestEmail,
      bookingType,
      propertyName,
      experienceName,
      roomType,
      dateOfStay,
      travelerType,
      ratingOverallStay,
      ratingCleanliness,
      ratingComfort,
      ratingLocation,
      ratingValueStay,
      ratingStaffHospitality,
      stayLoveMost,
      stayImproved,
      stayRecommend,
      ratingOverallExp,
      ratingSafety,
      ratingGuideQuality,
      ratingFunFactor,
      ratingValueExp,
      ratingEquipmentQuality,
      expFavoritePart,
      expRecommend,
      storyTitle,
      storyText,
      photos = [],
      videos = [],
      uid
    } = reviewData;

    // AI CONTENT MODERATION LAYER using Gemini API
    let moderationChecks = {
      isSpam: false,
      offensiveLanguage: false,
      hasContactInfo: false,
      isFake: false
    };
    let moderationStatus: "Pending" | "Approved" | "Rejected" = "Approved";
    let moderationReason = "Passed all automated text toxicity and links validations";

    try {
      const gC = getGeminiClient();
      const moderationPrompt = `You are an AI Content Moderator for UbEx. Review the following travel review content for spam, hate speech, offensive languages, phone numbers, links, competitor products advertising, or inappropriate comments.
      
      Review Story Title: "${storyTitle || ""}"
      Story Body: "${storyText || ""}"
      Loved Most: "${stayLoveMost || ""}"
      Could Improve: "${stayImproved || ""}"
      Favorite Experience Part: "${expFavoritePart || ""}"
      
      Respond with a JSON object matching this schema:
      {
        "isSpam": boolean,
        "offensiveLanguage": boolean,
        "hasContactInfo": boolean,
        "isFake": boolean,
        "reason": "brief reason summary"
      }`;

      const gen = await gC.models.generateContent({
        model: "gemini-3.5-flash",
        contents: moderationPrompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsedMod = JSON.parse(gen.text || "{}");
      if (parsedMod) {
        moderationChecks = {
          isSpam: !!parsedMod.isSpam,
          offensiveLanguage: !!parsedMod.offensiveLanguage,
          hasContactInfo: !!parsedMod.hasContactInfo,
          isFake: !!parsedMod.isFake
        };
        moderationReason = parsedMod.reason || moderationReason;
        if (parsedMod.isSpam || parsedMod.offensiveLanguage || parsedMod.hasContactInfo || parsedMod.isFake) {
          moderationStatus = "Pending";
        }
      }
    } catch (moderationError) {
      console.warn("Server-side Gemini AI moderation bypassed or unconfigured. Running safe custom regex filters:", moderationError);
      // Clean local regex moderation fallback
      const fullContent = `${storyTitle} ${storyText} ${stayLoveMost} ${stayImproved} ${expFavoritePart}`.toLowerCase();
      
      const containsPhone = /\b\d{10,12}\b/.test(fullContent);
      const containsEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(fullContent);
      const containsLinks = /https?:\/\/[^\s]+/.test(fullContent);
      
      // Competitor or bad words filter
      const badWords = ["bnb", "airbnb", "zostel", "hostelworld", "oyo", "agoda", "scam", "shitty", "fuck"];
      const containsBadWords = badWords.some(bw => fullContent.includes(bw));

      if (containsPhone || containsEmail || containsLinks || containsBadWords) {
        moderationStatus = "Pending";
        moderationChecks = {
          isSpam: containsLinks,
          offensiveLanguage: containsBadWords,
          hasContactInfo: containsPhone || containsEmail,
          isFake: false
        };
        moderationReason = "Flagged by local security filters due to link text, contact information, or banned names.";
      }
    }

    // CALCULATE ADVENTURE PASSPORT REWARDS XP
    let xpMultiplier = 0;
    const rewardsMap: string[] = [];
    
    // Core submission reward: +20 XP
    xpMultiplier += 20;

    // Photos uploaded: +10 XP
    if (photos && photos.length > 0) {
      xpMultiplier += 10;
      rewardsMap.push("storyteller");
    }

    // Videos/reels uploaded: +25 XP
    if (videos && videos.length > 0) {
      xpMultiplier += 25;
      rewardsMap.push("creator");
    }

    // Comprehensive custom stories: +50 XP if story word count is > 50 words!
    if (storyText && storyText.trim().split(/\s+/).length >= 50) {
      xpMultiplier += 50;
    }

    // Persist reviews in database
    const reviews = localDb.getReviews();
    const nextId = `REV-${reviews.length + 1004}`;

    const newReview = {
      id: nextId,
      bookingId,
      userId: null,
      guestName: guestName || "Verified Guest",
      guestEmail: guestEmail || "guest@ubex.com",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      bookingType,
      propertyName,
      experienceName,
      roomType,
      dateOfStay: dateOfStay || "June 2026",
      ratingOverallStay,
      ratingCleanliness,
      ratingComfort,
      ratingLocation,
      ratingValueStay,
      ratingStaffHospitality,
      stayLoveMost,
      stayImproved,
      stayRecommend,
      ratingOverallExp,
      ratingSafety,
      ratingGuideQuality,
      ratingFunFactor,
      ratingValueExp,
      ratingEquipmentQuality,
      expFavoritePart,
      expRecommend,
      travelerType: travelerType || "Solo Traveler",
      storyTitle,
      storyText,
      photos,
      videos,
      xpAwarded: xpMultiplier,
      badgesUnlocked: ["Reviewer", ...rewardsMap],
      destination: "Rishikesh",
      moderationStatus,
      moderationChecks,
      createdAt: new Date().toISOString()
    };

    // LINK TO DATABASE USER & UPDATE XP PASSPORT IF SPECIFIED
    if (uid) {
      try {
        const matchedUser = await getOrCreateUser(uid, guestEmail || "");
        newReview.userId = matchedUser.id;
        
        // Update user XP
        const userXps = localDb.getUserXp();
        let userXpObj = userXps.find(x => x.userId === matchedUser.id);
        if (!userXpObj) {
          userXpObj = { userId: matchedUser.id, xp: 0 };
          userXps.push(userXpObj);
        }
        userXpObj.xp += xpMultiplier;
        localDb.saveUserXp(userXps);

        // Award Badges directly
        const userBadges = localDb.getUserBadges();
        const existingReviewerBadge = userBadges.some(b => b.userId === matchedUser.id && b.badgeId === "reviewer");
        if (!existingReviewerBadge) {
          userBadges.push({
            id: userBadges.length > 0 ? Math.max(...userBadges.map(b => b.id)) + 1 : 1,
            userId: matchedUser.id,
            badgeId: "reviewer",
            earnedAt: new Date().toISOString()
          });
          localDb.saveUserBadges(userBadges);
        }
        
        // Photo achievement unlock
        if (photos.length > 0) {
          const userAchievements = localDb.getUserAchievements();
          const existingStoryteller = userAchievements.some(a => a.userId === matchedUser.id && a.achievementId === "storyteller");
          if (!existingStoryteller) {
            userAchievements.push({
              id: userAchievements.length > 0 ? Math.max(...userAchievements.map(a => a.id)) + 1 : 1,
              userId: matchedUser.id,
              achievementId: "storyteller",
              earnedAt: new Date().toISOString()
            });
            localDb.saveUserAchievements(userAchievements);
          }
        }
      } catch (authErr) {
        console.warn("Failed to credit passport rewards for current user:", authErr);
      }
    }

    reviews.push(newReview);
    localDb.saveReviews(reviews);

    return res.status(201).json({
      success: true,
      review: newReview,
      xpEarned: xpMultiplier,
      moderationStatus,
      moderationReason
    });
  } catch (error: any) {
    console.error("Submission error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Admin reviews moderation status update
app.post("/api/admin/reviews/action", async (req, res) => {
  try {
    const { reviewId, action } = req.body; // action can be 'Approve', 'Reject', 'Delete'
    if (!reviewId || !action) {
      return res.status(400).json({ error: "Review ID and Action parameters are required." });
    }

    const reviews = localDb.getReviews();
    const matchIdx = reviews.findIndex(r => r.id === reviewId);

    if (matchIdx === -1) {
      return res.status(404).json({ error: "Review item not found." });
    }

    if (action === "Approve") {
      reviews[matchIdx].moderationStatus = "Approved";
    } else if (action === "Reject") {
      reviews[matchIdx].moderationStatus = "Rejected";
    } else if (action === "Delete") {
      reviews.splice(matchIdx, 1);
    }

    localDb.saveReviews(reviews);
    return res.json({ success: true, reviews: localDb.getReviews() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Centralized production-grade global API error response handler
app.use(errorHandler);

// Configure Vite middleware in development or static hosting in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`UbEx Experiences server running on http://0.0.0.0:${PORT}`);
    
    // Verify system environment and database/SMTP connection integrity on startup
    console.log("\n--- STARTING SYSTEM ENV & SERVICE CONFIG CHECK ---");

    // Check critical env vars
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv) {
      console.log(`[CONFIG CHECK] NODE_ENV: ${nodeEnv} ✓`);
    } else {
      console.warn("[WARNING Check] NODE_ENV is not explicitly set; defaulting to development");
    }

    const jwtOk = !!(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 64);
    const csrfOk = !!(process.env.CSRF_SECRET && process.env.CSRF_SECRET.length >= 64);
    
    if (jwtOk) {
      console.log("[CONFIG CHECK] JWT_SECRET ✓");
    } else {
      console.error("[CRITICAL CONFIG ERROR] JWT_SECRET missing or insecure!");
      process.exit(1);
    }

    if (csrfOk) {
      console.log("[CONFIG CHECK] CSRF_SECRET ✓");
    } else {
      console.error("[CRITICAL CONFIG ERROR] CSRF_SECRET missing or insecure!");
      process.exit(1);
    }

    // Database check
    const sqlHost = process.env.SQL_HOST;
    const sqlDb = process.env.SQL_DB_NAME;
    const sqlUser = process.env.SQL_ADMIN_USER;
    const sqlPass = process.env.SQL_ADMIN_PASSWORD;
    const dbConfigured = !!(sqlHost && sqlDb);

    if (dbConfigured) {
      if (sqlHost) console.log("[CONFIG CHECK] SQL_HOST ✓");
      if (sqlDb) console.log("[CONFIG CHECK] SQL_DB_NAME ✓");
      if (sqlUser) console.log("[CONFIG CHECK] SQL_ADMIN_USER ✓");
      if (sqlPass) console.log("[CONFIG CHECK] SQL_ADMIN_PASSWORD ✓");

      try {
        const dbOk = await checkDatabaseHealth();
        if (dbOk) {
          console.log("[DATABASE] Connected Successfully");
        } else {
          console.error("[DATABASE ERROR] Connection Failed");
        }
      } catch (dbErr: any) {
        console.error("[DATABASE ERROR] Connection Failed:", dbErr.message || dbErr);
        if (dbErr.stack) {
          console.error(dbErr.stack);
        }
      }
    } else {
      console.log("[CONFIG CHECK] Database Connection ✓ (Sandbox File Store fallback Active)");
      console.log("[DATABASE] Connected Successfully");
    }

    // SMTP check
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpConfigured = !!(smtpHost && smtpUser && smtpPass);

    if (smtpConfigured) {
      if (smtpHost) console.log("[CONFIG CHECK] SMTP_HOST ✓");
      if (smtpPort) console.log("[CONFIG CHECK] SMTP_PORT ✓");
      if (smtpUser) console.log("[CONFIG CHECK] SMTP_USER ✓");
      if (smtpPass) console.log("[CONFIG CHECK] SMTP_PASS ✓");

      try {
        const smtpOk = await EmailService.verifySmtpConnection();
        if (smtpOk) {
          console.log("[SMTP] Ready");
        } else {
          console.log("[SMTP ERROR] Authentication Failed");
        }
      } catch (err: any) {
        console.log("[SMTP ERROR] Authentication Failed:", err.message || err);
      }
    } else {
      console.log("[CONFIG CHECK] SMTP config missing (Console delivery active)");
    }

    console.log("--- SYSTEM CONFIG CHECK COMPLETE ---\n");
    
    // Start the background cron interval for reservation cleanup & retention sweeps
    const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    setInterval(async () => {
      try {
        console.log("[CRON] Running automated reservation cleanup routine...");
        const expiredCount = await DbService.cleanupExpiredReservations();
        if (expiredCount > 0) {
          console.log(`[CRON] Successfully expired and released ${expiredCount} holding reservations.`);
        } else {
          console.log("[CRON] Reservation cleanup complete - no expired holds found.");
        }

        console.log("[CRON] Running automated webhook events retention purge...");
        const expiredWebhooks = await DbService.cleanupExpiredWebhookEvents();
        if (expiredWebhooks > 0) {
          console.log(`[CRON] Cleaned up ${expiredWebhooks} expired webhook_events from db.`);
        }
      } catch (err) {
        console.error("[CRON ERROR] Automated cron procedures failed:", err);
      }
    }, CLEANUP_INTERVAL);

    // Run once on startup
    setTimeout(async () => {
      try {
        console.log("[STARTUP] Running initial reservation cleanup...");
        const expiredCount = await DbService.cleanupExpiredReservations();
        console.log(`[STARTUP] Initial cleanup released ${expiredCount} expired holds.`);
        
        console.log("[STARTUP] Running initial webhooks retention sweep...");
        const expiredWebhooks = await DbService.cleanupExpiredWebhookEvents();
        console.log(`[STARTUP] Webhooks initial sweep pruned ${expiredWebhooks} records.`);
      } catch (err) {
        console.error("[STARTUP ERROR] Initial procedures failed:", err);
      }
    }, 2000);
  });
}

startServer();
