import React from "react";
import { Info, ArrowLeft } from "lucide-react";

interface AboutUsPageProps {
  setActiveTabInApp?: (tab: string) => void;
}

export default function AboutUsPage({ setActiveTabInApp }: AboutUsPageProps) {
  return (
    <div className="min-h-[60vh] bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 border-t border-slate-800">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/25">
          <Info className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-sans">About Us</h1>
          <p className="text-sm text-slate-400 leading-relaxed font-light font-sans">
            Welcome to UbEx. This page is currently under construction. Check back soon for our story, vision, and the amazing team driving the next generation of guest ecosystems and remote workations.
          </p>
        </div>
        <div>
          <button
            onClick={() => setActiveTabInApp?.("home")}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer font-sans"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
