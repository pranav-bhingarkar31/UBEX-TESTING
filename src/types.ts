/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExperienceVariant {
  name: string;
  price: string;
  duration?: string;
  description?: string;
  priceValue: number;
}

export interface ExperienceFAQ {
  question: string;
  answer: string;
}

export interface Experience {
  id: string; // e.g. "rafting"
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
  faqs: ExperienceFAQ[];
  variants: ExperienceVariant[];
}

export interface Stay {
  id: string;
  title: string;
  category: "Luxury" | "Family" | "Workation" | "Dorm" | "Long-Stay";
  image: string;
  description: string;
  price: string;
  priceValue: number;
  rating: string;
  features: string[];
}

export interface Review {
  id: string;
  author: string;
  origin: string;
  ratingValue: number;
  highlightText: string;
  fullText: string;
  date: string;
}

export interface RecurringEvent {
  id: string;
  title: string;
  frequency: string;
  timing: string;
  experienceId?: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  dateStr: string;
  timing: string;
  slotsRemaining: number;
}

export interface Booking {
  id: string;
  experienceId: string;
  experienceTitle: string;
  variantName: string;
  price: number;
  currency: string;
  bookingDate: string;
  slotTime: string;
  guestsCount: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  totalPaid: number;
  status: "Confirmed" | "Pending" | "Completed";
  statusDate: string;
}
