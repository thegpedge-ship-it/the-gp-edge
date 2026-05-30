"use client";

import { useState } from "react";
import { BookOpen, Calculator, Layers } from "lucide-react";
import Header from "@/components/shared/Header";
import ExploreTab from "@/components/mbs-billing/ExploreTab";
import CaseStudiesTab from "@/components/mbs-billing/CaseStudiesTab";
import CalculatorTab from "@/components/mbs-billing/CalculatorTab";
import { TabType } from "@/components/mbs-billing/data";

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<TabType>("explore");

  const tabs = [
    { id: "explore" as TabType, label: "Explore Items", icon: Layers },
    { id: "scenarios" as TabType, label: "Case Studies", icon: BookOpen },
    { id: "calculator" as TabType, label: "Fee Calculator", icon: Calculator },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header variant="static" />

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
            <span className="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-md font-medium border border-teal-100">
              MBS Learning System
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-1 font-sans">
            MBS Decision & Billing Guide
          </h1>
          <p className="text-slate-500 text-sm font-sans">
            Learn to bill correctly with plain-English guidance and interactive scenarios.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* iOS-Style Segmented Tab Control */}
        <div className="inline-flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "explore" && <ExploreTab />}
        {activeTab === "scenarios" && <CaseStudiesTab />}
        {activeTab === "calculator" && <CalculatorTab />}
      </div>
    </div>
  );
}
