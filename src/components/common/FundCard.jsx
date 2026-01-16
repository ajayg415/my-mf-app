import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const FundCard = ({ fund, onClick }) => {
  // 1. Safe parsing of numbers (handle strings/nulls)
  const invested = parseFloat(fund.costValue || 0);
  const current = parseFloat(fund.currentMktValue || 0);
  
  // 2. Calculate Returns
  const profitLoss = current - invested;
  const percentChange = invested > 0 ? (profitLoss / invested) * 100 : 0;
  const isProfit = profitLoss >= 0;

  // 3. Currency Formatter (Indian Rupee)
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0 // No decimals for cleaner look
    }).format(amount);
  };

  return (
    <div 
      className="card bg-base-100 shadow-sm border border-gray-200 active:scale-[0.98] transition-transform duration-100 cursor-pointer"
      onClick={onClick}
    >
      <div className="card-body p-4">
        
        {/* Header: Name and Badge */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight">
            {fund.name}
          </h3>
          {/* Optional: Show Category or Risk Tag if available */}
          <span className="badge badge-xs badge-ghost text-[10px] uppercase tracking-wider shrink-0 mt-1">
             Equity
          </span>
        </div>

        {/* Stats Grid */}
        <div className="flex justify-between items-end">
          
          {/* Left: Investment Details */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400">Invested</span>
            <span className="font-semibold text-gray-700">{formatMoney(invested)}</span>
          </div>

          <div className="flex flex-col gap-0.5 text-right">
             <span className="text-xs text-gray-400">Current</span>
             <span className="font-bold text-gray-900">{formatMoney(current)}</span>
          </div>

        </div>

        {/* Footer: Profit/Loss Indicator */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">Total Returns</span>
          
          <div className={`flex items-center gap-1 text-sm font-bold ${isProfit ? 'text-success' : 'text-error'}`}>
            {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>
              {isProfit ? "+" : ""}{formatMoney(profitLoss)} ({percentChange.toFixed(2)}%)
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FundCard;