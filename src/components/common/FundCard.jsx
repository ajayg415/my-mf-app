import React from "react";
import { TrendingUp, TrendingDown, Clock, Edit2 } from "lucide-react";

import { formatMoney } from "../../utils/utils.js";

const FundCard = ({ fund, onClick, onEdit, hasEdit = true }) => {
  // 1. Safe parsing & Defaults
  const invested = parseFloat(fund.costValue || 0);
  const current = parseFloat(fund.currentMktValue || 0);
  const totalPL = parseFloat(fund.gainLoss || 0);
  const totalPLPercent = parseFloat(fund.gainLossPercentage || 0);

  // New Metrics: Amounts + Percentages
  const oneDayChange = parseFloat(fund.dayChange || 0);
  const oneDayPercent = parseFloat(fund.dayChangePercentage || 0);

  const oneWeekChange = parseFloat(fund.weekChange || 0);
  const oneWeekPercent = parseFloat(fund.weekChangePercentage || 0);

  const oneMonthChange = parseFloat(fund.monthChange || 0);
  const oneMonthPercent = parseFloat(fund.monthChangePercentage || 0);

  const isProfit = totalPL >= 0;

  // Helper for text colors
  const getColorClass = (val) => (val >= 0 ? "text-success" : "text-error");

  return (
    <div
      className="card bg-base-100 shadow-sm border border-gray-200 active:scale-[0.98] transition-transform duration-100 cursor-pointer"
      onClick={onClick}
    >
      <div className="card-body p-4">
        {/* ROW 1: Header (Name & Category) */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight">
            {fund.name}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <span className="badge badge-xs badge-ghost text-[10px] uppercase tracking-wider mt-1">
              {fund.schemeType}
            </span>
            {hasEdit && (
              <button
                className="btn btn-ghost btn-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  // Add edit handler here
                }}
                title="Edit fund"
              >
                <Edit2 size={16} onClick={onEdit} />
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: Main Stats (Invested vs Current) */}
        <div className="flex justify-between items-end mb-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400">Invested</span>
            <span className="font-semibold text-gray-700">
              {formatMoney(invested)}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400">Units</span>
            <span className="font-semibold text-gray-700">{fund.units}</span>
          </div>

          <div className="flex flex-col gap-0.5 text-right">
            <span className="text-xs text-gray-400">Current Value</span>
            <span className="font-bold text-gray-900">
              {formatMoney(current)}
            </span>
          </div>
        </div>

        {/* ROW 3: Extra Metrics (1D & 1W) - Includes Amount & % */}
        <div className="flex flex-col gap-2 bg-base-200/50 rounded-lg p-2.5 mb-3">
          {/* 1 Day Row */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock size={12} className="opacity-70" />
              <span>1 Day</span>
            </div>
            <div
              className={`font-bold flex items-center gap-1 ${getColorClass(oneDayChange)}`}
            >
              <span>
                {oneDayChange > 0 ? "+" : ""}
                {formatMoney(oneDayChange)}
              </span>
              <span className="opacity-80 font-medium">
                ({Math.abs(oneDayPercent).toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* 1 Week Row (Optional Separator line could go here) */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock size={12} className="opacity-70" />
              <span>1 Week</span>
            </div>
            <div
              className={`font-bold flex items-center gap-1 ${getColorClass(oneWeekChange)}`}
            >
              <span>
                {oneWeekChange > 0 ? "+" : ""}
                {formatMoney(oneWeekChange)}
              </span>
              <span className="opacity-80 font-medium">
                ({Math.abs(oneWeekPercent).toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* 1 Month Row (Optional Separator line could go here) */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock size={12} className="opacity-70" />
              <span>1 Month</span>
            </div>
            <div
              className={`font-bold flex items-center gap-1 ${getColorClass(oneMonthChange)}`}
            >
              <span>
                {oneMonthChange > 0 ? "+" : ""}
                {formatMoney(oneMonthChange)}
              </span>
              <span className="opacity-80 font-medium">
                ({Math.abs(oneMonthPercent).toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* ROW 4: Total Profit/Loss Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">Total Returns</span>

          <div
            className={`flex items-center gap-1 text-sm font-bold ${isProfit ? "text-success" : "text-error"}`}
          >
            {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>
              {isProfit ? "+" : ""}
              {formatMoney(totalPL)} ({Math.abs(totalPLPercent).toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundCard;
