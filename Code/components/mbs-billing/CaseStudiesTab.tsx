"use client";

import { useState } from "react";
import { complexityConfig, mbsItems } from "./data";

export default function CaseStudiesTab() {
  const [scenarioExpanded, setScenariosExpanded] = useState<number[]>([]);

  const toggleScenario = (index: number) => {
    setScenariosExpanded((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-2 font-sans">Billing Case Studies</h2>
        <p className="text-sm text-slate-500">Step-by-step clinical scenarios to master MBS billing decisions.</p>
      </div>

      <div className="space-y-4">
        {mbsItems.flatMap((item, itemIndex) =>
          item.scenarios.map((scenario, scenarioIndex) => {
            const key = itemIndex * 10 + scenarioIndex;
            const isExpanded = scenarioExpanded.includes(key);
            const complexity = complexityConfig[scenario.complexity];
            return (
              <div key={key} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold tracking-wider text-teal-600 uppercase">
                      Case Study
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${complexity.bg} ${complexity.text} ${complexity.border}`}>
                      {complexity.label}
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className="text-xs font-medium text-slate-400 block mb-1">Patient Presentation</span>
                    <p className="text-sm text-slate-700 leading-relaxed">{scenario.presentation}</p>
                  </div>

                  <div className="flex gap-6 mb-4">
                    <div>
                      <span className="text-xs font-medium text-slate-400">Consultation Time</span>
                      <p className="text-sm font-semibold text-slate-900">{scenario.time}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-400">Clinical Complexity</span>
                      <p className={`text-sm font-semibold ${complexity.text}`}>{complexity.label}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleScenario(key)}
                    className="text-sm font-medium text-teal-600 hover:text-teal-700"
                  >
                    {isExpanded ? "Hide Answer" : "Reveal Answer"}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 bg-teal-50 border border-teal-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-teal-700">Correct Item:</span>
                        <span className="text-lg font-bold text-teal-600">Item {scenario.correctItem}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-teal-700">Billing Reasoning:</span>
                        <p className="text-sm text-teal-800 mt-1 leading-relaxed">{scenario.reasoning}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
