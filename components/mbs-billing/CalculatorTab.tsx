"use client";

import { useState } from "react";
import { mbsItems } from "./data";
import CustomSelect from "@/components/admin/CustomSelect";

export default function CalculatorTab() {
  const [calcItemId, setCalcItemId] = useState("36");
  const [calcFeeCharged, setCalcFeeCharged] = useState("95.00");

  const calcItem = mbsItems.find((i) => i.id === calcItemId);
  const scheduleFee = calcItem?.scheduleFee || 0;
  const medicareRebate = calcItem?.medicareRebate || 0;
  const feeCharged = parseFloat(calcFeeCharged) || 0;
  const gapPayment = Math.max(0, feeCharged - medicareRebate);
  const clinicEarnings = feeCharged;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-2 font-sans">Fee Calculator</h2>
        <p className="text-sm text-slate-500">Calculate patient out-of-pocket costs and clinic earnings.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex">
          {/* Left - Inputs */}
          <div className="flex-1 p-6 border-r border-slate-100">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Item Number
                </label>
                <CustomSelect
                  value={calcItemId}
                  onChange={setCalcItemId}
                  options={mbsItems.map((item) => ({
                    value: item.id,
                    label: `Item ${item.id} — ${item.humanTitle}`,
                  }))}
                  className="w-full font-sans text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Fee Charged ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={calcFeeCharged}
                  onChange={(e) => setCalcFeeCharged(e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-sans"
                  placeholder="95.00"
                />
              </div>
            </div>
          </div>

          {/* Right - Receipt Output (Dark Mode) */}
          <div className="w-[300px] bg-slate-900 text-white p-6">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Billing Summary
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Schedule Fee</p>
                <p className="text-xl font-semibold">${scheduleFee.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Medicare Rebate (85%)</p>
                <p className="text-xl font-semibold">${medicareRebate.toFixed(2)}</p>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Patient Gap Payment</p>
                <p className="text-2xl font-mono font-bold text-teal-400">${gapPayment.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Clinic Earnings</p>
                <p className="text-xl font-semibold text-emerald-400">${clinicEarnings.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Bulk Bill Status</p>
                <p className="text-sm font-medium">
                  {calcItem?.bulkBillable ? (
                    <span className="text-emerald-400">Γ£ô Eligible for Bulk Billing</span>
                  ) : (
                    <span className="text-rose-400">Γ£ù Not Bulk Billable</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
