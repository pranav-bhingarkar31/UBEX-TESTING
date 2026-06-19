/**
 * Calendar Integration Utilities for Google Calendar REST API,
 * Google Calendar Links, and Apple Calendar ICS files.
 */

// Format Date for Google Calendar Links (YYYYMMDDTHHMMSSZ)
const formatCalendarDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

export interface CalendarEventData {
  title: string;
  description: string;
  start: Date;
  end: Date;
  location?: string;
}

/**
 * Creates a static Add-to-Google-Calendar template URL
 */
export function makeGoogleCalendarUrl(event: CalendarEventData): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatCalendarDate(event.start)}/${formatCalendarDate(event.end)}`,
    details: event.description,
  });
  if (event.location) {
    params.append("location", event.location);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates and triggers download of an Apple Calendar / standard iCalendar (.ics) file
 * with a built-in reminder trigger.
 */
export function downloadIcsFile(event: CalendarEventData) {
  const startStr = formatCalendarDate(event.start);
  const endStr = formatCalendarDate(event.end);
  const stampStr = formatCalendarDate(new Date());

  const cleanText = (str: string) => {
    return str
      .replace(/\\/g, "\\\\")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
      .replace(/\n/g, "\\n");
  };

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UbEx Outposts//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:ubex-${Date.now()}-${Math.floor(Math.random() * 100000)}@ubex.travel`,
    `DTSTAMP:${stampStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${cleanText(event.title)}`,
    `DESCRIPTION:${cleanText(event.description)}`,
  ];

  if (event.location) {
    icsLines.push(`LOCATION:${cleanText(event.location)}`);
  }

  // Set Reminder 30 minutes before the event start
  icsLines.push(
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${cleanText(event.title)}`,
    "END:VALARM"
  );

  // Set secondary reminder 1 day before
  icsLines.push(
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${cleanText(event.title)}`,
    "END:VALARM"
  );

  icsLines.push("END:VEVENT", "END:VCALENDAR");

  const icsContent = icsLines.join("\r\n");
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_reminder.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Creates an event in the user's Google Calendar using Google Calendar REST API
 */
export async function addEventToGoogleCalendarApi(
  accessToken: string,
  event: CalendarEventData
): Promise<any> {
  const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
  
  const body = {
    summary: event.title,
    description: event.description,
    location: event.location || "UbEx Outpost, Rishikesh, Uttarakhand, India",
    start: {
      dateTime: event.start.toISOString(),
      timeZone: "UTC"
    },
    end: {
      dateTime: event.end.toISOString(),
      timeZone: "UTC"
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 30 }, // 30 minutes before
        { method: "popup", minutes: 1440 } // 1 day before
      ]
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Calendar API Error: ${errText}`);
  }

  return response.json();
}

/**
 * Calculates next date for a weekly recurring day of the week
 */
export function getNextOccurrenceOfDay(dayAbbrev: string, timeStr: string): { start: Date; end: Date } {
  const now = new Date();
  const dayMap: Record<string, number> = {
    SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6
  };
  
  const targetDay = dayMap[dayAbbrev.toUpperCase()] ?? now.getDay();
  let daysToAdd = (targetDay - now.getDay() + 7) % 7;

  // Schedule next week if it's today but already in the past
  const timeUpper = timeStr.toUpperCase();
  let hour = 12;
  let min = 0;

  // Simple time extraction logic (e.g., "7:00 PM Onwards" -> 19, "6:30 AM" -> 6)
  const timeMatch = timeStr.match(/(\d+):?(\d+)?/);
  if (timeMatch) {
    const parsedHour = parseInt(timeMatch[1], 10);
    const parsedMin = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    hour = parsedHour;
    min = parsedMin;
    
    if (timeUpper.includes("PM") && parsedHour < 12) {
      hour += 12;
    } else if (timeUpper.includes("AM") && parsedHour === 12) {
      hour = 0;
    }
  }

  const resultStart = new Date(now);
  resultStart.setDate(now.getDate() + daysToAdd);
  resultStart.setHours(hour, min, 0, 0);

  if (resultStart.getTime() <= now.getTime()) {
    resultStart.setDate(resultStart.getDate() + 7);
  }

  const resultEnd = new Date(resultStart);
  resultEnd.setHours(resultEnd.getHours() + 2); // Default 2 hours event duration

  return { start: resultStart, end: resultEnd };
}

/**
 * Formats a Booking date and time into start and end Dates
 */
export function getDatesFromBooking(bookingDate: string, slotTime: string): { start: Date; end: Date } {
  const now = new Date();
  let start = new Date(bookingDate);
  
  // Guard if bookingDate string is invalid
  if (isNaN(start.getTime())) {
    start = new Date();
  }

  let hour = 12;
  let min = 0;
  
  const timeUpper = slotTime.toUpperCase();
  const timeMatch = slotTime.match(/(\d+):?(\d+)?/);
  if (timeMatch) {
    let parsedHour = parseInt(timeMatch[1], 10);
    const parsedMin = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    hour = parsedHour;
    min = parsedMin;

    if (timeUpper.includes("PM") && parsedHour < 12) {
      hour += 12;
    } else if (timeUpper.includes("AM") && parsedHour === 12) {
      hour = 0;
    }
  } else if (timeUpper.includes("CHECK-IN")) {
    hour = 12; // default check-in time
  }

  start.setHours(hour, min, 0, 0);
  
  // default end time to 2 hours later, or next day if lodging checkin
  const end = new Date(start);
  if (timeUpper.includes("CHECK-IN")) {
    end.setDate(end.getDate() + 1); // 1-night duration
    end.setHours(11, 0, 0, 0); // 11 AM check-out
  } else {
    end.setHours(end.getHours() + 2);
  }

  return { start, end };
}
