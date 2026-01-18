import { useMemo } from "react"; // 1. Import useMemo
import { useSelector } from "react-redux";
import { computeFundsSummary } from "../../utils/fundCompution"; 
import { formatMoney } from "../../utils/utils.js";
import { TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react";

const Dashboard = () => {
  const userData = useSelector((state) => state.mf.userData);

  // 2. FIX: Use useMemo instead of useState + useEffect
  // This calculates the summary instantly whenever userData changes, without triggering a re-render.
  const summary = useMemo(() => {
    if (userData?.funds && userData.funds.length > 0) {
      return computeFundsSummary(userData.funds);
    }
    // Return default/zero values if no data exists
    return {
      totalCostValue: 0,
      totalCurrentMktValue: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      totalDayChange: 0,
      totalWeekChange: 0,
      totalMonthChange: 0,
    };
  }, [userData]); // Dependency: Only re-run if userData changes

  const isProfit = summary.totalGainLoss >= 0;

  return (
    <section className="dashboard-section w-full">
      
      {/* THE HOVERABLE CARD */}
      <div className="card w-full bg-base-100 shadow-xl border border-base-200 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] cursor-default">
        <div className="card-body p-6">
          
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <PieChart size={20} />
            </div>
            <h2 className="card-title text-base text-gray-500 uppercase tracking-wide">
              Portfolio Value
            </h2>
          </div>

          {/* Main Big Number */}
          <div className="mb-6">
            <h1 className="text-4xl font-extrabold text-base-content">
              {formatMoney(summary.totalCurrentMktValue)}
            </h1>
            <div className={`flex items-center gap-1 mt-1 text-sm font-bold ${isProfit ? "text-success" : "text-error"}`}>
              {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>
                {isProfit ? "+" : ""}
                {formatMoney(summary.totalGainLoss)} ({summary.totalGainLossPercentage.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="divider my-0"></div>

          {/* Secondary Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            
            {/* Invested Amount */}
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Wallet size={12} /> Invested
              </span>
              <span className="text-lg font-semibold text-base-content">
                {formatMoney(summary.totalCostValue)}
              </span>
            </div>

            {/* Total Change with Sub-values */}
            <div className="flex flex-col text-right">
              <span className="text-xs text-gray-400 mb-1">Period Changes</span>
              
              {/* 1 Day Change - Sub-value */}
              <div className="flex items-center justify-end gap-1 mb-1">
                <span className="text-xs font-medium text-gray-500">1D:</span>
                <span className={`text-xs font-semibold ${summary.totalDayChange >= 0 ? "text-success" : "text-error"}`}>
                  {summary.totalDayChange >= 0 ? <TrendingUp size={10} className="inline" /> : <TrendingDown size={10} className="inline" />}
                  {summary.totalDayChange >= 0 ? "+" : ""}{formatMoney(summary.totalDayChange)}
                </span>
              </div>

              {/* 1 Week Change - Sub-value */}
              <div className="flex items-center justify-end gap-1">
                <span className="text-xs font-medium text-gray-500">1W:</span>
                <span className={`text-xs font-semibold ${summary.totalWeekChange >= 0 ? "text-success" : "text-error"}`}>
                  {summary.totalWeekChange >= 0 ? <TrendingUp size={10} className="inline" /> : <TrendingDown size={10} className="inline" />}
                  {summary.totalWeekChange >= 0 ? "+" : ""}{formatMoney(summary.totalWeekChange)}
                </span>
              </div>

              {/* 1 Month Change - Sub-value */}
              <div className="flex items-center justify-end gap-1">
                <span className="text-xs font-medium text-gray-500">1M:</span>
                <span className={`text-xs font-semibold ${summary.totalMonthChange >= 0 ? "text-success" : "text-error"}`}>
                  {summary.totalMonthChange >= 0 ? <TrendingUp size={10} className="inline" /> : <TrendingDown size={10} className="inline" />}
                  {summary.totalMonthChange >= 0 ? "+" : ""}{formatMoney(summary.totalMonthChange)}
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>

    </section>
  );
};

export default Dashboard;