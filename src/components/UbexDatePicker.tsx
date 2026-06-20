import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Calendar } from "lucide-react";

interface UbexDatePickerProps {
  checkIn: Date | string | null;
  checkOut: Date | string | null;
  onChange: (checkIn: Date | null, checkOut: Date | null, isCompleted?: boolean) => void;
  onClose?: () => void;
  className?: string;
  initialFocusedField?: "checkIn" | "checkOut";
  singleDateOnly?: boolean;
}

export const UbexDatePicker: React.FC<UbexDatePickerProps> = ({
  checkIn,
  checkOut,
  onChange,
  onClose,
  className = "",
  initialFocusedField = "checkIn",
  singleDateOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<"dates" | "flexible">("dates");
  const [flexibility, setFlexibility] = useState<string>("exact");
  const [focusedField, setFocusedField] = useState<"checkIn" | "checkOut">(initialFocusedField);

  // Sync focused field if the initialFocusedField prop changes externally
  useEffect(() => {
    setFocusedField(initialFocusedField);
  }, [initialFocusedField]);

  // Robust parsing of checkIn and checkOut inputs to Date objects
  const parseToDate = (d: any): Date | null => {
    if (!d) return null;
    if (typeof d.getTime === "function") {
      const time = d.getTime();
      if (!isNaN(time)) return new Date(time);
    }
    try {
      const dStr = String(d).trim();
      if (!dStr) return null;

      // Check if it matches exactly YYYY-MM-DD
      const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (ymdRegex.test(dStr)) {
        const [year, month, day] = dStr.split("-").map(Number);
        const dateObj = new Date(year, month - 1, day);
        if (!isNaN(dateObj.getTime())) return dateObj;
      }

      const parsed = new Date(dStr);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch {
      // Fail gracefully
    }
    return null;
  };

  const checkInDate = parseToDate(checkIn);
  const checkOutDate = parseToDate(checkOut);

  // State to hold the currently viewed active month (single-month view fits all screen sizes perfectly!)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const base = checkInDate || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  // Sync active calendar month view to matched check-in whenever check-in changes externally
  useEffect(() => {
    if (checkInDate) {
      setCurrentMonth(new Date(checkInDate.getFullYear(), checkInDate.getMonth(), 1));
    }
  }, [checkIn]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const todayVal = new Date();
  todayVal.setHours(0, 0, 0, 0);

  const isSameDay = (d1: Date, d2: Date): boolean => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isSelected = (date: Date): boolean => {
    if (singleDateOnly) {
      return checkInDate !== null && isSameDay(date, checkInDate);
    }
    return (
      (checkInDate !== null && isSameDay(date, checkInDate)) ||
      (checkOutDate !== null && isSameDay(date, checkOutDate))
    );
  };

  const isInRange = (date: Date): boolean => {
    if (singleDateOnly) return false;
    if (!checkInDate || !checkOutDate) return false;
    return date > checkInDate && date < checkOutDate;
  };

  const handleDayClick = (dateObj: Date, e: React.MouseEvent) => {
    e.stopPropagation();

    // Disable selection of dates prior to today to ensure logic correctness
    if (dateObj < todayVal) return;

    if (singleDateOnly) {
      onChange(dateObj, null, true);
      if (onClose) onClose();
      return;
    }

    if (focusedField === "checkIn") {
      // If user selected check-in date after or equal to current check-out, clear check-out
      if (checkOutDate && dateObj >= checkOutDate) {
        onChange(dateObj, null, false);
      } else {
        onChange(dateObj, checkOutDate, false);
      }
      // Auto move focus to check-out to make selection flow highly interactive and progressive!
      setFocusedField("checkOut");
    } else {
      // User is selecting the check-out date
      if (!checkInDate) {
        // No check in yet, treat this selection as check-in instead
        onChange(dateObj, null, false);
        setFocusedField("checkOut");
      } else if (dateObj <= checkInDate) {
        // Selected checkout is before or same as check-in, set it as new check-in and clear check-out
        onChange(dateObj, null, false);
        setFocusedField("checkOut");
      } else {
        // Range selection is complete!
        onChange(checkInDate, dateObj, true);
      }
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysGrid = [];
  // Empty slots for alignment - matching the layout of the original calendar
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(<div key={`empty-${i}`} className="ubex-dp-day empty" />);
  }

  // Active days items - leveraging predefined styling in index.css for optimal Ubex design consistency
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month, d);
    dateObj.setHours(0, 0, 0, 0);

    const isPast = dateObj < todayVal;
    const selected = isSelected(dateObj);
    const inR = isInRange(dateObj);
    const isToday = isSameDay(dateObj, todayVal);
    
    // Check-in / Check-out specific dates
    const checkInActive = checkInDate && isSameDay(dateObj, checkInDate);
    const checkOutActive = checkOutDate && isSameDay(dateObj, checkOutDate);

    daysGrid.push(
      <button
        key={`day-${d}`}
        type="button"
        disabled={isPast}
        onClick={(e) => handleDayClick(dateObj, e)}
        className={`ubex-dp-day ${isPast ? "past" : ""} ${selected ? "selected" : ""} ${inR ? "in-range" : ""} ${isToday ? "today" : ""} relative overflow-visible`}
      >
        {/* Dynamic backdrop connections for beautiful premium range visualization */}
        {inR && (
          <div className="absolute inset-y-0 -left-1 -right-1 bg-indigo-650/10 -z-10" />
        )}
        {checkInActive && checkOutDate && (
          <div className="absolute inset-y-0 right-0 left-1/2 bg-indigo-650/10 -z-10" />
        )}
        {checkOutActive && checkInDate && (
          <div className="absolute inset-y-0 left-0 right-1/2 bg-indigo-650/10 -z-10" />
        )}
        <span className="relative z-10">{d}</span>
      </button>
    );
  }

  const flexibilityPills = [
    { id: "exact", label: "Exact dates" },
    { id: "1day", label: "± 1 day" },
    { id: "3days", label: "± 3 days" },
    { id: "7days", label: "± 7 days" },
  ];

  return (
    <div
      className={`ubex-datepicker shadow-2xl p-5 select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
      style={{ 
        position: "relative", 
        top: "auto", 
        left: "auto",
        transform: "none",
        fontFamily: "'Comfortaa', sans-serif" 
      }}
    >
      {/* Tab Switcher - using comfortable style and cohesive contrast */}
      {!singleDateOnly && (
        <div className="flex items-center justify-between border-b border-indigo-100/40 pb-3 mb-4">
          <div className="flex gap-1.5 bg-[#001166]/5 p-1 rounded-xl text-[10px] font-black uppercase tracking-wider">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("dates");
              }}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "dates"
                  ? "bg-[#001166] text-white shadow-sm"
                  : "text-indigo-950/60 hover:text-[#001166] hover:bg-white/50"
              }`}
            >
              Dates
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("flexible");
              }}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "flexible"
                  ? "bg-[#001166] text-white shadow-sm"
                  : "text-indigo-950/60 hover:text-[#001166] hover:bg-white/50"
              }`}
            >
              Flexible
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 text-indigo-950/40 hover:text-[#001166] rounded-xl hover:bg-indigo-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {singleDateOnly && onClose && (
        <div className="flex items-center justify-between pb-2 mb-3">
          <div className="text-xs font-black text-[#001166] tracking-wider uppercase">
            Select Date
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 text-indigo-950/40 hover:text-[#001166] rounded-xl hover:bg-indigo-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === "dates" || singleDateOnly ? (
        <>
          {/* Active Field Highlight Panel */}
          {!singleDateOnly && (
            <div className="grid grid-cols-2 gap-1.5 bg-indigo-50/40 p-1 rounded-xl mb-4 border border-indigo-100/30">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFocusedField("checkIn");
                }}
                className={`py-2 px-2.5 rounded-lg text-left transition-all cursor-pointer ${
                  focusedField === "checkIn"
                    ? "bg-white shadow-sm border border-indigo-100"
                    : "bg-transparent border border-transparent hover:bg-indigo-100/20"
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className={`w-1 h-1 rounded-full ${focusedField === "checkIn" ? "bg-indigo-650" : "bg-slate-400"}`} />
                  <span className="text-[8px] font-black uppercase text-[#001166]/50 tracking-wider">Check-In</span>
                </div>
                <span className={`text-[11px] block mt-0.5 ${focusedField === "checkIn" ? "text-indigo-950 font-extrabold" : "text-slate-600 font-bold"}`}>
                  {checkInDate ? checkInDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : "Select check-in"}
                </span>
              </button>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFocusedField("checkOut");
                }}
                className={`py-2 px-2.5 rounded-lg text-left transition-all cursor-pointer ${
                  focusedField === "checkOut"
                    ? "bg-white shadow-sm border border-[#001166]/10"
                    : "bg-transparent border border-transparent hover:bg-indigo-100/20"
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className={`w-1 h-1 rounded-full ${focusedField === "checkOut" ? "bg-indigo-650" : "bg-slate-400"}`} />
                  <span className="text-[8px] font-black uppercase text-[#001166]/50 tracking-wider">Check-Out</span>
                </div>
                <span className={`text-[11px] block mt-0.5 ${focusedField === "checkOut" ? "text-indigo-950 font-extrabold" : "text-slate-600 font-bold"}`}>
                  {checkOutDate ? checkOutDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : "Select check-out"}
                </span>
              </button>
            </div>
          )}

          {/* Month Controller Header - strictly mapped to Ubex CSS definitions */}
          <div className="ubex-dp-header">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="ubex-dp-nav"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="ubex-dp-month text-xs font-bold text-[#001166]">
              {monthNames[month]} {year}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="ubex-dp-nav"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day Names Grid - strictly mapped to Ubex CSS definitions */}
          <div className="ubex-dp-grid">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div
                key={d}
                className="ubex-dp-dow"
              >
                {d}
              </div>
            ))}
            {daysGrid}
          </div>

          {/* Flexibility Options - aligned with premium Comfortaa pills */}
          {!singleDateOnly && (
            <div className="border-t border-indigo-100/30 pt-3 mt-3 flex flex-wrap gap-1.5 justify-center">
              {flexibilityPills.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlexibility(p.id);
                  }}
                  className={`px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    flexibility === p.id
                      ? "bg-[#001166] text-white border-[#001166]"
                      : "bg-white border-indigo-100/40 text-indigo-950/70 hover:bg-indigo-50/50 hover:border-indigo-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Action Footer Button Group */}
          {!singleDateOnly ? (
            <div className="flex items-center justify-between border-t border-indigo-100/40 pt-3.5 mt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null, null, false);
                  setFocusedField("checkIn");
                }}
                className="text-[10px] font-extrabold text-indigo-950/40 hover:text-red-500 transition-colors uppercase tracking-wider underline cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(checkInDate, checkOutDate, true);
                  if (onClose) onClose();
                }}
                className="px-4.5 py-2.5 bg-[#001166] text-white rounded-xl text-[10px] uppercase tracking-wider font-extrabold hover:bg-[#001166]/90 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              >
                Apply Dates
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between border-t border-indigo-100/40 pt-2 mt-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null, null, false);
                }}
                className="text-[10px] font-extrabold text-indigo-950/40 hover:text-red-500 transition-colors uppercase tracking-wider underline cursor-pointer"
              >
                Clear Date
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-5 text-center border border-dashed border-indigo-100 rounded-2xl bg-indigo-50/20 px-3">
          <Calendar className="w-7 h-7 text-[#001166] opacity-75 mx-auto mb-2 animate-bounce" />
          <h4 className="font-bold text-indigo-950 text-xs">Spontaneous Flexible Stays</h4>
          <p className="text-[10px] text-indigo-950/60 max-w-xs mx-auto mt-1 leading-normal">
            Choose a relative timeline and let UbEx curate a luxurious premium boutique stay!
          </p>
          <div className="flex flex-col gap-1.5 justify-center mt-4">
            {["Any weekend", "Any week", "Any month"].map((fOp) => (
              <button
                key={fOp}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const now = new Date();
                  const inDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
                  const outDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10);
                  onChange(inDate, outDate, true);
                  if (onClose) onClose();
                }}
                className="px-3 py-2 bg-white border border-indigo-100/50 text-[#001166] text-[10px] font-bold rounded-xl hover:bg-indigo-50/50 hover:border-[#001166] transition-colors w-full cursor-pointer"
              >
                {fOp}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
