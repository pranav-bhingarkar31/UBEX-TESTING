import { localDb } from "./index.ts";

export interface PassportState {
  userId: number;
  xp: number;
  level: {
    current: number;
    name: string;
    icon: string;
    minXp: number;
    maxXp: number;
    progress: number; // 0 to 100
    nextMilestone: string;
  };
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
    earned: boolean;
    earnedAt?: string;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    icon: string;
    type: string;
    description: string;
    earned: boolean;
    earnedAt?: string;
  }>;
  destinations: Array<{
    id: string;
    name: string;
    icon: string;
    earned: boolean;
    completedCount: number;
  }>;
  rewards: Array<{
    id: string;
    name: string;
    description: string;
    badgesRequired: number;
    earned: boolean;
    couponCode?: string;
  }>;
}

// Level boundaries
const LEVELS = [
  { level: 1, name: "New Explorer", icon: "🌱", minXp: 0, maxXp: 250, milestone: "Wanderer" },
  { level: 2, name: "Wanderer", icon: "🧭", minXp: 250, maxXp: 1000, milestone: "Adventurer" },
  { level: 3, name: "Adventurer", icon: "🏔", minXp: 1000, maxXp: 2500, milestone: "Explorer Elite" },
  { level: 4, name: "Explorer Elite", icon: "🌍", minXp: 2500, maxXp: 5000, milestone: "UbEx Legend" },
  { level: 5, name: "UbEx Legend", icon: "👑", minXp: 5000, maxXp: 999999, milestone: "Max level reached!" }
];

export async function getUserPassport(userId: number): Promise<PassportState> {
  const bookings = localDb.getBookings().filter(b => b.userId === userId);
  
  const badgeDefs = localDb.getBadgeDefinitions();
  const achDefs = localDb.getAchievementDefinitions();
  const rewardDefs = localDb.getRewardDefinitions();
  
  const userBadges = localDb.getUserBadges().filter(ub => ub.userId === userId);
  const userAchs = localDb.getUserAchievements().filter(ua => ua.userId === userId);
  const userRewards = localDb.getUserRewards().filter(ur => ur.userId === userId);
  const destProgress = localDb.getUserDestinationProgress().filter(dp => dp.userId === userId);
  
  // 1. Evaluate booking histories to Auto-Award Badges
  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
  const newlyEarnedBadges: string[] = [];

  // Map activities present in user's bookings to auto-award badges
  bookings.forEach(b => {
    // Check inside experiences
    if (b.cartExperiences && Array.isArray(b.cartExperiences)) {
      b.cartExperiences.forEach((exp: any) => {
        const expIdLower = String(exp.experienceId || exp.id || "").toLowerCase();
        
        if (expIdLower.includes("raft") && !earnedBadgeIds.has("rafting_master")) {
          newlyEarnedBadges.push("rafting_master");
          earnedBadgeIds.add("rafting_master");
        }
        if (expIdLower.includes("bungee") && !earnedBadgeIds.has("bungee_brave")) {
          newlyEarnedBadges.push("bungee_brave");
          earnedBadgeIds.add("bungee_brave");
        }
        if (expIdLower.includes("camp") && !earnedBadgeIds.has("camp_explorer")) {
          newlyEarnedBadges.push("camp_explorer");
          earnedBadgeIds.add("camp_explorer");
        }
        if (expIdLower.includes("climb") && !earnedBadgeIds.has("climbing_pro")) {
          newlyEarnedBadges.push("climbing_pro");
          earnedBadgeIds.add("climbing_pro");
        }
        if (expIdLower.includes("kayak") && !earnedBadgeIds.has("kayak_king")) {
          newlyEarnedBadges.push("kayak_king");
          earnedBadgeIds.add("kayak_king");
        }
        if (expIdLower.includes("bike") && !earnedBadgeIds.has("biking_beast")) {
          newlyEarnedBadges.push("biking_beast");
          earnedBadgeIds.add("biking_beast");
        }
        if ((expIdLower.includes("trek") || expIdLower.includes("hiking") || expIdLower.includes("trail")) && !earnedBadgeIds.has("trek_titan")) {
          newlyEarnedBadges.push("trek_titan");
          earnedBadgeIds.add("trek_titan");
        }
        if (expIdLower.includes("sky") || expIdLower.includes("fly") && !earnedBadgeIds.has("sky_rider")) {
          newlyEarnedBadges.push("sky_rider");
          earnedBadgeIds.add("sky_rider");
        }
        if (expIdLower.includes("atv") && !earnedBadgeIds.has("terrain_conqueror")) {
          newlyEarnedBadges.push("terrain_conqueror");
          earnedBadgeIds.add("terrain_conqueror");
        }
        if (expIdLower.includes("zipline") && !earnedBadgeIds.has("zipline_daredevil")) {
          newlyEarnedBadges.push("zipline_daredevil");
          earnedBadgeIds.add("zipline_daredevil");
        }
      });
    }
  });

  // Save new automated badges to Database
  if (newlyEarnedBadges.length > 0) {
    const allUserBadges = localDb.getUserBadges();
    let nextId = allUserBadges.length > 0 ? Math.max(...allUserBadges.map(ub => ub.id)) + 1 : 1;
    
    newlyEarnedBadges.forEach(badgeId => {
      allUserBadges.push({
        id: nextId++,
        userId,
        badgeId,
        earnedAt: new Date().toISOString()
      });
    });
    localDb.saveUserBadges(allUserBadges);
  }

  // Reload user badges after saving
  const updatedUserBadges = localDb.getUserBadges().filter(ub => ub.userId === userId);
  const finalBadgeIds = new Set(updatedUserBadges.map(ub => ub.badgeId));

  // 2. Evaluate stay achievements
  const earnedAchievementIds = new Set(userAchs.map(ua => ua.achievementId));
  const newlyEarnedAchs: string[] = [];
  
  const hasStays = bookings.some(b => b.cartStays && b.cartStays.length > 0);
  const stayBookingsCount = bookings.filter(b => b.cartStays && b.cartStays.length > 0).length;
  
  if (stayBookingsCount >= 1 && !earnedAchievementIds.has("stay_explorer")) {
    newlyEarnedAchs.push("stay_explorer");
    earnedAchievementIds.add("stay_explorer");
  }
  if (stayBookingsCount >= 5 && !earnedAchievementIds.has("stay_collector")) {
    newlyEarnedAchs.push("stay_collector");
    earnedAchievementIds.add("stay_collector");
  }
  if (stayBookingsCount >= 10 && !earnedAchievementIds.has("stay_conqueror")) {
    newlyEarnedAchs.push("stay_conqueror");
    earnedAchievementIds.add("stay_conqueror");
  }

  // Combined stays + experience booking
  const hasExp = bookings.some(b => b.cartExperiences && b.cartExperiences.length > 0);
  if (hasStays && hasExp && !earnedAchievementIds.has("complete_traveler")) {
    newlyEarnedAchs.push("complete_traveler");
    earnedAchievementIds.add("complete_traveler");
  }

  // Premium stay: stay-luxury-villa
  const hasLuxuryStay = bookings.some(b => b.cartStays && b.cartStays.some((s: any) => String(s.stayId || s.id || "").includes("villa")));
  if (hasLuxuryStay && !earnedAchievementIds.has("premium_explorer")) {
    newlyEarnedAchs.push("premium_explorer");
    earnedAchievementIds.add("premium_explorer");
  }

  // 3. Evaluate Destination progress & master
  // For each booking, see if they passed destination context. Let's pre-populate destinations.
  const visitedDestinations = new Set<string>();
  
  // Extract destinations from booking attributes
  bookings.forEach(b => {
    if (b.country && b.country !== "India" && b.country.trim() !== "") {
      // Sometimes our previous DB might have used country parameter to store destination for simulation!
      visitedDestinations.add(b.country);
    }
    // Check if stays contain destination tags
    if (b.cartStays && Array.isArray(b.cartStays)) {
      b.cartStays.forEach((s: any) => {
        if (s.destination) visitedDestinations.add(s.destination);
        else visitedDestinations.add("Rishikesh"); // Fallback
      });
    }
    // Check if experiences contain destination tags
    if (b.cartExperiences && Array.isArray(b.cartExperiences)) {
      b.cartExperiences.forEach((e: any) => {
        if (e.destination) visitedDestinations.add(e.destination);
        else visitedDestinations.add("Rishikesh"); // Fallback
      });
    }
  });

  // Initialize progress records if missing
  const destinationsToCheck = ["Rishikesh", "Mussoorie", "Auli", "Nainital", "Chopta", "Himachal", "Goa", "Rajasthan", "Kashmir"];
  destinationsToCheck.forEach(dest => {
    const records = destProgress.find(dp => dp.destination === dest);
    if (visitedDestinations.has(dest) && (!records || records.experiencesCompleted === 0)) {
      // Award destination badge
      const achId = `${dest.toLowerCase()}_explorer`;
      if (!earnedAchievementIds.has(achId)) {
        newlyEarnedAchs.push(achId);
        earnedAchievementIds.add(achId);
      }
    }
  });

  // Check Uttarakhand Master: Rishikesh, Mussoorie, Auli, Nainital, Chopta
  const hasRishikesh = earnedAchievementIds.has("rishikesh_explorer");
  const hasMussoorie = earnedAchievementIds.has("mussoorie_explorer");
  const hasAuli = earnedAchievementIds.has("auli_explorer");
  const hasNainital = earnedAchievementIds.has("nainital_explorer");
  const hasChopta = earnedAchievementIds.has("chopta_explorer");

  if (hasRishikesh && hasMussoorie && hasAuli && hasNainital && hasChopta && !earnedAchievementIds.has("uttarakhand_master")) {
    newlyEarnedAchs.push("uttarakhand_master");
    earnedAchievementIds.add("uttarakhand_master");
  }

  // 4. Combos checks
  const hasRaftingBadge = finalBadgeIds.has("rafting_master");
  const hasBungeeBadge = finalBadgeIds.has("bungee_brave");
  const hasCampBadge = finalBadgeIds.has("camp_explorer");
  const hasTrekBadge = finalBadgeIds.has("trek_titan");
  const hasKayakBadge = finalBadgeIds.has("kayak_king");
  
  const hasStargazing = bookings.some(b => b.cartExperiences && b.cartExperiences.some((e: any) => String(e.experienceId || e.id || "").includes("wellness") || String(e.experienceId || e.id || "").includes("session")));
  const hasRiversideStay = bookings.some(b => b.cartStays && b.cartStays.some((s: any) => String(s.stayId || s.id || "").includes("villa") || String(s.stayId || s.id || "").includes("dorms")));
  const hasWorkationStay = bookings.some(b => b.cartStays && b.cartStays.some((s: any) => String(s.stayId || s.id || "").includes("workation")));
  const hasCafeTrial = bookings.some(b => b.cartExperiences && b.cartExperiences.some((e: any) => String(e.experienceId || e.id || "").includes("food")));

  // Extreme Adventurer: Rafting + Bungee + Camping
  if (hasRaftingBadge && hasBungeeBadge && hasCampBadge && !earnedAchievementIds.has("extreme_adventurer")) {
    newlyEarnedAchs.push("extreme_adventurer");
    earnedAchievementIds.add("extreme_adventurer");
  }
  // Mountain Nomad: Camping + Trekking + Stargazing/Wellness
  if (hasCampBadge && hasTrekBadge && hasStargazing && !earnedAchievementIds.has("mountain_nomad")) {
    newlyEarnedAchs.push("mountain_nomad");
    earnedAchievementIds.add("mountain_nomad");
  }
  // River Explorer: Rafting + Kayaking + Riverside Stay
  if (hasRaftingBadge && hasKayakBadge && hasRiversideStay && !earnedAchievementIds.has("river_explorer")) {
    newlyEarnedAchs.push("river_explorer");
    earnedAchievementIds.add("river_explorer");
  }
  // Digital Nomad: Workation Stay + Trek + Cafe Experience
  if (hasWorkationStay && hasTrekBadge && hasCafeTrial && !earnedAchievementIds.has("digital_nomad")) {
    newlyEarnedAchs.push("digital_nomad");
    earnedAchievementIds.add("digital_nomad");
  }

  // Save new achievements
  if (newlyEarnedAchs.length > 0) {
    const allUserAchs = localDb.getUserAchievements();
    let nextId = allUserAchs.length > 0 ? Math.max(...allUserAchs.map(ua => ua.id)) + 1 : 1;
    newlyEarnedAchs.forEach(achievementId => {
      allUserAchs.push({
        id: nextId++,
        userId,
        achievementId,
        earnedAt: new Date().toISOString()
      });
    });
    localDb.saveUserAchievements(allUserAchs);
  }

  // Reload user Achievements after updates
  const finalAchievements = localDb.getUserAchievements().filter(ua => ua.userId === userId);
  const finalAchievementIds = new Set(finalAchievements.map(ua => ua.achievementId));

  // 5. XP Calculation
  // Base XP: Each badge gives its xpAwarded. Each stay gives 50. Each booking gives 50.
  let totalXp = 0;
  
  // Sum of custom definitions
  updatedUserBadges.forEach(ub => {
    const def = badgeDefs.find(b => b.id === ub.badgeId);
    if (def) totalXp += def.xpAwarded;
  });

  finalAchievements.forEach(ua => {
    const def = achDefs.find(a => a.id === ua.achievementId);
    if (def) totalXp += def.xpAwarded;
  });

  // Booking base XP (50 XP for staying and booking)
  totalXp += bookings.length * 50;

  // Sync / write XP record to localDb
  const allUserXp = localDb.getUserXp();
  const xpRecordIdx = allUserXp.findIndex(ux => ux.userId === userId);
  if (xpRecordIdx >= 0) {
    allUserXp[xpRecordIdx].xp = totalXp;
  } else {
    allUserXp.push({ userId, xp: totalXp });
  }
  localDb.saveUserXp(allUserXp);

  // 6. Level Evaluation
  const currentXp = totalXp;
  const matchedLevel = LEVELS.find(l => currentXp >= l.minXp && currentXp < l.maxXp) || LEVELS[LEVELS.length - 1];
  
  const xpDiff = matchedLevel.maxXp - matchedLevel.minXp;
  const currentProgressXp = currentXp - matchedLevel.minXp;
  const progressPercent = xpDiff > 0 ? Math.min(100, Math.floor((currentProgressXp / xpDiff) * 100)) : 100;

  // 7. Reward Evaluations
  // 10 Badges -> 5% Discount
  // 20 Badges -> Priority Support
  // 30 Badges -> Exclusive Experiences
  // 50 Badges -> UbEx Elite Club Room upgraded
  const badgeEarnedCount = updatedUserBadges.length;
  const newlyEarnedRewards: string[] = [];

  const earnedRewardIds = new Set(userRewards.map(ur => ur.rewardId));

  rewardDefs.forEach(rew => {
    if (badgeEarnedCount >= rew.badgesRequired && !earnedRewardIds.has(rew.id)) {
      newlyEarnedRewards.push(rew.id);
      earnedRewardIds.add(rew.id);
    }
  });

  if (newlyEarnedRewards.length > 0) {
    const allUserRewards = localDb.getUserRewards();
    let nextId = allUserRewards.length > 0 ? Math.max(...allUserRewards.map(ur => ur.id)) + 1 : 1;
    newlyEarnedRewards.forEach(rewardId => {
      allUserRewards.push({
        id: nextId++,
        userId,
        rewardId,
        status: "unlocked",
        claimedAt: new Date().toISOString()
      });
    });
    localDb.saveUserRewards(allUserRewards);
  }

  const finalRewardsList = localDb.getUserRewards().filter(ur => ur.userId === userId);

  // Build combined Passport state
  const badgesState = badgeDefs.map(def => {
    const earnedRec = updatedUserBadges.find(ub => ub.badgeId === def.id);
    return {
      id: def.id,
      name: def.name,
      icon: def.icon,
      color: def.color,
      description: def.description,
      earned: !!earnedRec,
      earnedAt: earnedRec?.earnedAt
    };
  });

  const achievementsState = achDefs.map(def => {
    const earnedRec = finalAchievements.find(ua => ua.achievementId === def.id);
    return {
      id: def.id,
      name: def.name,
      icon: def.icon,
      type: def.type,
      description: def.description,
      earned: !!earnedRec,
      earnedAt: earnedRec?.earnedAt
    };
  });

  const destinationsState = destinationsToCheck.map(dest => {
    const achId = `${dest.toLowerCase()}_explorer`;
    const earned = finalAchievementIds.has(achId);
    return {
      id: achId,
      name: `${dest} Explorer`,
      icon: dest === "Rishikesh" ? "🧭" : dest === "Mussoorie" ? "🌫" : dest === "Auli" ? "🎿" : dest === "Nainital" ? "⛵" : dest === "Chopta" ? "🏔" : dest === "Himachal" ? "🌲" : dest === "Goa" ? "🏖" : dest === "Rajasthan" ? "🐫" : "🌸",
      earned,
      completedCount: earned ? 1 : 0
    };
  });

  const rewardsState = rewardDefs.map(def => {
    const unlockedRec = finalRewardsList.find(ur => ur.rewardId === def.id);
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      badgesRequired: def.badgesRequired,
      earned: !!unlockedRec,
      couponCode: def.couponCode
    };
  });

  return {
    userId,
    xp: currentXp,
    level: {
      current: matchedLevel.level,
      name: matchedLevel.name,
      icon: matchedLevel.icon,
      minXp: matchedLevel.minXp,
      maxXp: matchedLevel.maxXp,
      progress: progressPercent,
      nextMilestone: matchedLevel.milestone
    },
    badges: badgesState,
    achievements: achievementsState,
    destinations: destinationsState,
    rewards: rewardsState
  };
}
