"use client";

import { useState } from "react";
import { Search, Clock, ChevronDown, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { complexityConfig, filterCategories, mbsItems, MBSItem } from "./data";

export default function ExploreTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<MBSItem | null>(mbsItems[0]);
  const [notesExpanded, setNotesExpanded] = useState(false);

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const filteredItems = mbsItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      query === "" ||
      item.id.includes(query) ||
      item.humanTitle.toLowerCase().includes(query) ||
      item.searchTags.some((tag) => tag.includes(query));
    const matchesFilter =
      activeFilters.length === 0 || activeFilters.includes(item.category);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex gap-6">
      {/* Left Sidebar (35%) */}
      <div className="w-[35%] flex-shrink-0">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by item, condition, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 text-sm bg-white border border-slate-200 rounded-xl pl-10 pr-4 shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-sans placeholder:text-slate-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {filterCategories.map((filter) => {
            const isActive = activeFilters.includes(filter);
            return (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Scrollable Item List */}
        <div className="h-[calc(100vh-300px)] overflow-y-auto space-y-1 pr-1">
          {filteredItems.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const complexity = complexityConfig[item.complexity];
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                  setNotesExpanded(false);
                }}
                className={`w-full text-left p-4 rounded-xl transition-colors font-sans ${
                  isSelected
                    ? "bg-white border-l-4 border-l-teal-600 shadow-md ring-1 ring-slate-100"
                    : "bg-transparent hover:bg-white/70"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-lg font-semibold ${isSelected ? "text-teal-600" : "text-slate-900"}`}>
                    Item {item.id}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    ${item.scheduleFee.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                  {item.humanTitle}
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3" />
                    {item.timeRange}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${complexity.bg} ${complexity.text} ${complexity.border}`}>
                    {complexity.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Panel (65%) - Dossier Card */}
      <div className="flex-1 min-w-0">
        {selectedItem ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8">
              {/* A. Premium Item Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-3xl font-bold text-teal-600 font-sans">
                    Item {selectedItem.id}
                  </h2>
                  <a
                    href="https://www.mbsonline.gov.au"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600"
                  >
                    MBS Online <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-4 font-sans">
                  {selectedItem.humanTitle}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                    <Clock className="w-4 h-4 text-slate-500" />
                    {selectedItem.timeRange}
                  </span>
                  <span className={`text-sm font-medium px-3 py-1.5 rounded-lg border ${complexityConfig[selectedItem.complexity].bg} ${complexityConfig[selectedItem.complexity].text} ${complexityConfig[selectedItem.complexity].border}`}>
                    {complexityConfig[selectedItem.complexity].label} Complexity
                  </span>
                </div>
              </div>

              {/* B. Plain English Meaning */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  What this item means
                </h4>
                <p className="text-slate-600 text-sm font-normal leading-relaxed">
                  {selectedItem.plainEnglish}
                </p>
              </div>

              {/* C. Common Uses */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-6">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  What this item is used for
                </h4>
                <ul className="space-y-2">
                  {selectedItem.commonUses.map((use, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
                      {use}
                    </li>
                  ))}
                </ul>
              </div>

              {/* D. Decision Support - Comparison Matrix */}
              {selectedItem.comparisonItem && (
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-6">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    When should you use this item?
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-teal-200">
                      <span className="text-xs font-semibold text-teal-600 uppercase">This Item ({selectedItem.id})</span>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <p><span className="font-medium">Duration:</span> {selectedItem.timeRange}</p>
                        <p><span className="font-medium">Complexity:</span> {complexityConfig[selectedItem.complexity].label}</p>
                        <p><span className="font-medium">Intent:</span> {selectedItem.plainEnglish.split('.')[0]}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Step-Up: Item {selectedItem.comparisonItem.id}</span>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <p><span className="font-medium">Duration:</span> {selectedItem.comparisonItem.duration}</p>
                        <p><span className="font-medium">Complexity:</span> {selectedItem.comparisonItem.complexity}</p>
                        <p><span className="font-medium">Intent:</span> {selectedItem.comparisonItem.intent}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* E. Critical Billing Restrictions */}
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-6">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-rose-900 mb-3">
                  <AlertTriangle className="w-4 h-4" />
                  Important Billing Restrictions
                </h4>
                <ul className="space-y-2">
                  {selectedItem.billingRestrictions.map((restriction, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-rose-800">
                      <span className="text-rose-400 mt-1">ΓÇó</span>
                      {restriction}
                    </li>
                  ))}
                </ul>
              </div>

              {/* F. Financial Breakdown Widget */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 mb-6">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Financial Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Schedule Fee</p>
                    <p className="text-xl font-semibold">${selectedItem.scheduleFee.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Medicare Rebate (85%)</p>
                    <p className="text-xl font-semibold">${selectedItem.medicareRebate.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Patient Gap (if bulk billed)</p>
                    <p className="text-xl font-mono font-bold text-teal-400">$0.00</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Bulk Bill Status</p>
                    <p className="text-lg font-semibold">
                      {selectedItem.bulkBillable ? (
                        <span className="text-emerald-400">Γ£ô Eligible</span>
                      ) : (
                        <span className="text-rose-400">Γ£ù Not Eligible</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* G. Educational Scenario */}
              {selectedItem.scenarios.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-6">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Clinical Case Study
                  </h4>
                  {selectedItem.scenarios.map((scenario, i) => (
                    <div key={i} className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-slate-400">Patient Presentation</span>
                        <p className="text-sm text-slate-700 mt-1">{scenario.presentation}</p>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <span className="text-xs font-medium text-slate-400">Time</span>
                          <p className="text-sm font-medium text-slate-900">{scenario.time}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-slate-400">Complexity</span>
                          <p className={`text-sm font-medium ${complexityConfig[scenario.complexity].text}`}>
                            {complexityConfig[scenario.complexity].label}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-slate-400">Correct Item</span>
                          <p className="text-sm font-bold text-teal-600">Item {scenario.correctItem}</p>
                        </div>
                      </div>
                      <div className="bg-teal-50 border border-teal-100 rounded-lg p-3">
                        <span className="text-xs font-semibold text-teal-700">Why this item?</span>
                        <p className="text-sm text-teal-800 mt-1">{scenario.reasoning}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* H. Official Medicare Notes Accordion */}
              <div>
                <button
                  onClick={() => setNotesExpanded(!notesExpanded)}
                  className="w-full flex items-center justify-between p-4 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-700">
                    View Official Medicare Notes
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${notesExpanded ? "rotate-180" : ""}`} />
                </button>
                {notesExpanded && (
                  <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <ul className="space-y-2">
                      {selectedItem.officialNotes.map((note, i) => (
                        <li key={i} className="flex gap-2 text-xs text-slate-500 leading-relaxed">
                          <span className="text-slate-300">ΓÇó</span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 h-96 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Select an item from the list</p>
          </div>
        )}
      </div>
    </div>
  );
}
