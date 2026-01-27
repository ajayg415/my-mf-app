import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Edit2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatMoney } from "../../utils/utils.js";

const FundCard = ({ fund, onClick, onEdit, hasEdit = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  // 1. Safe parsing & Defaults
  const invested = parseFloat(fund.costValue || 0);
  const current = parseFloat(fund.currentMktValue || 0);
  const totalPL = parseFloat(fund.gainLoss || 0);
  const totalPLPercent = parseFloat(fund.gainLossPercentage || 0);

  // Metrics for Expanded View
  const metrics = [
    {
      label: "1 Day",
      val: parseFloat(fund.dayChange || 0),
      pct: parseFloat(fund.dayChangePercentage || 0),
    },
    {
      label: "1 Week",
      val: parseFloat(fund.weekChange || 0),
      pct: parseFloat(fund.weekChangePercentage || 0),
    },
    {
      label: "1 Month",
      val: parseFloat(fund.monthChange || 0),
      pct: parseFloat(fund.monthChangePercentage || 0),
    },
  ];

  const isProfit = totalPL >= 0;
  const getColorClass = (val) => (val >= 0 ? "text-success" : "text-error");
  const getBgClass = (val) => (val >= 0 ? "bg-success/10" : "bg-error/10");

  return (
    <div className="card bg-base-100 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
      <div className="card-body p-0">
        {/* --- MAIN CARD CONTENT (Always Visible) --- */}
        <div className="p-4 cursor-pointer pb-1" onClick={() => setIsOpen(!isOpen)}>
          
          {/* ROW 1: Identity (Name + Edit on Top, Label Below) */}
          <div className="flex flex-col mb-4">
            {/* Top Line: Name & Edit Icon */}
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-bold text-gray-800 leading-tight text-sm md:text-base line-clamp-1 break-words capitalize">
                {fund.name}
              </h3>

              {hasEdit && (
                <button
                  className="btn btn-ghost btn-xs h-auto min-h-0 p-1 text-gray-400 hover:text-primary shrink-0 -mt-1 -mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit && onEdit(e);
                  }}
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>

            {/* Second Line: Label */}
            <div className="mt-1">
              <span className="badge badge-xs badge-ghost text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                {fund.schemeType || "Growth"}
              </span>
            </div>
          </div>

          {/* ROW 2: The Big Three (Current, Invested, Total Returns) */}
          <div className="grid grid-cols-3 gap-2 items-center">
            {/* 1. Invested (left) */}
            <div className="text-left">
              <p className="text-[11px] text-gray-400 tracking-wide mb-0.5">
                Invested
              </p>
              <p className="text-gray-600 text-sm leading-none">
                {formatMoney(invested)}
              </p>
            </div>

            {/* 2. Current Value (center) */}
            <div className="text-center">
              <p className="text-[11px] text-gray-400 tracking-wide mb-0.5">
                Current
              </p>
              <p className="text-gray-900 text-sm leading-none">
                {formatMoney(current)}
              </p>
            </div>


            {/* 3. Total Returns (Right) - FIXED: Single Line */}
            <div className="text-right">
              <p className="text-[11px] text-gray-400 tracking-wide mb-0.5">
                Returns
              </p>

              {/* Flex container: items-baseline aligns text bottoms, whitespace-nowrap prevents breaking */}
              <div
                className={`flex items-baseline justify-end gap-1 whitespace-nowrap leading-none ${getColorClass(totalPL)}`}
              >
                <span className="text-sm">
                  {isProfit ? "+" : ""}
                  {formatMoney(totalPL)}
                </span>
                <span className="font-medium text-xs opacity-80">
                  ({Math.abs(totalPLPercent).toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- EXPANDABLE SECTION (Detailed Metrics) --- */}
        <div
          className={`overflow-hidden transition-[max-height] duration-300 ease-in-out border-t border-dashed border-gray-100 bg-gray-50/50 ${isOpen ? "max-h-60" : "max-h-0"}`}
        >
          <div className="p-3 grid gap-2 text-sm">
            {/* Units Info */}
            <div className="flex justify-between items-center py-1 px-2">
              <span className="text-xs font-medium text-gray-500">
                Units Held
              </span>
              <span className="text-xs font-mono font-bold text-gray-700">
                {fund.units}
              </span>
            </div>

            {/* Metrics Loop (1D, 1W, 1M) */}
            {metrics.map((m, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center py-1.5 px-2 rounded-md hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock size={12} className="opacity-60" />
                  <span className="text-xs font-medium">{m.label} Return</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${getColorClass(m.val)}`}>
                    {m.val > 0 ? "+" : ""}
                    {formatMoney(m.val)}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getBgClass(m.val)} ${getColorClass(m.val)}`}
                  >
                    {Math.abs(m.pct).toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expand/Collapse Handle */}
        <div
          className="flex justify-center pb-1 cursor-pointer hover:bg-gray-100/50"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <ChevronUp size={14} className="text-gray-300" />
          ) : (
            <ChevronDown size={14} className="text-gray-300" />
          )}
        </div>
      </div>
    </div>
  );
};

export default FundCard;