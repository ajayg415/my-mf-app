import { useMemo, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { computeFundsSummary, computeHistoricalPortfolio } from "../../utils/fundCompution"; 
import { formatMoney, formatShortMoney } from "../../utils/utils.js";
import { TrendingUp, TrendingDown, Wallet, PieChart, RefreshCw, Activity } from "lucide-react";
import { fetchFundDetails } from "../../utils/api.js";
import { showToast } from "../../store/mf/mfSlice.js";
import { getCachedFund } from "../../services/db.js";

const Dashboard = () => {
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.mf.userData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Historical chart state
  const [historyData, setHistoryData] = useState([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [activePointIndex, setActivePointIndex] = useState(null);
  const svgRef = useRef(null);

  // Load aggregated history for all funds
  useEffect(() => {
    let ignore = false;
    const loadAllHistories = async () => {
      const activeFunds = (userData?.funds || []).filter((f) => f.code);
      if (!activeFunds.length) {
        setHistoryData([]);
        return;
      }
      setIsLoadingChart(true);
      try {
        const histories = {};
        for (const fund of activeFunds) {
          let fundHist = await getCachedFund(fund.code);
          if (!fundHist || !fundHist.data || !fundHist.data.length) {
            fundHist = await fetchFundDetails(fund.code, false);
          }
          if (fundHist && fundHist.data) {
            histories[fund.code] = fundHist.data;
          }
        }
        if (!ignore) {
          const aggregated = computeHistoricalPortfolio(activeFunds, histories);
          setHistoryData(aggregated);
        }
      } catch (err) {
        console.error("Error loading portfolio histories", err);
      } finally {
        if (!ignore) {
          setIsLoadingChart(false);
        }
      }
    };

    loadAllHistories();
    return () => {
      ignore = true;
    };
  }, [userData]);

  const summary = useMemo(() => {
    if (userData?.funds && userData.funds.length > 0) {
      return computeFundsSummary(userData.funds);
    }
    return {
      totalCostValue: 0,
      totalCurrentMktValue: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      totalDayChange: 0,
      totalWeekChange: 0,
      totalMonthChange: 0,
    };
  }, [userData]);

  const isProfit = summary.totalGainLoss >= 0;

  const handleRefresh = async () => {
    const fundsToRefresh = (userData?.funds || []).filter((fund) => fund.code);

    if (!fundsToRefresh.length) {
      dispatch(showToast({ message: "No funds available to refresh", type: "error" }));
      return;
    }

    setIsRefreshing(true);
    dispatch(showToast({ message: "Refreshing latest NAVs...", type: "success" }));

    try {
      for (const fund of fundsToRefresh) {
        await fetchFundDetails(fund.code, true);
      }
      dispatch(showToast({ message: "Portfolio refreshed successfully", type: "success" }));
    } catch (error) {
      console.error("Failed to refresh portfolio NAVs:", error);
      dispatch(showToast({ message: "Failed to refresh portfolio NAVs", type: "error" }));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Chart point generation
  const chartConfig = useMemo(() => {
    if (!historyData.length) return null;

    const values = historyData.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    // Y-axis padding (15% on top and bottom)
    const yMin = Math.max(0, minVal - range * 0.15);
    const yMax = maxVal + range * 0.15;
    const yRange = yMax - yMin;

    const width = 500;
    const height = 240;
    const paddingLeft = 45; // Reduced padding to expand graph width
    const paddingRight = 5;
    const paddingTop = 25;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const points = historyData.map((d, index) => {
      const x = paddingLeft + (historyData.length > 1 ? (index / (historyData.length - 1)) * chartWidth : 0);
      const y = paddingTop + chartHeight - ((d.value - yMin) / yRange) * chartHeight;
      return {
        ...d,
        x,
        y,
      };
    });

    return {
      points,
      yMin,
      yMax,
      yRange,
      chartWidth,
      chartHeight,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      width,
      height,
    };
  }, [historyData]);

  // Handle cursor hover/tracker logic
  const handleMouseMove = (e) => {
    if (!chartConfig || !chartConfig.points.length || !svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;

    // Convert screen coordinates to SVG viewBox coords
    const localX = (mouseX / svgRect.width) * chartConfig.width;

    let closestIndex = 0;
    let minDiff = Infinity;
    chartConfig.points.forEach((point, index) => {
      const diff = Math.abs(point.x - localX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });

    setActivePointIndex(closestIndex);
  };

  const handleMouseLeave = () => {
    setActivePointIndex(null);
  };

  const activePoint = useMemo(() => {
    if (!chartConfig || !chartConfig.points.length) return null;
    return chartConfig.points[activePointIndex ?? chartConfig.points.length - 1];
  }, [chartConfig, activePointIndex]);

  // Generate SVG Path for Line Chart
  const svgPaths = useMemo(() => {
    if (!chartConfig || !chartConfig.points.length) return { line: "", area: "" };

    const linePath = chartConfig.points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" ");

    const first = chartConfig.points[0];
    const last = chartConfig.points[chartConfig.points.length - 1];
    const bottomY = chartConfig.paddingTop + chartConfig.chartHeight;

    const areaPath = `
      ${linePath}
      L${last.x.toFixed(2)},${bottomY.toFixed(2)}
      L${first.x.toFixed(2)},${bottomY.toFixed(2)}
      Z
    `.trim();

    return { line: linePath, area: areaPath };
  }, [chartConfig]);

  // Generate ticks for Y axis
  const yTicks = useMemo(() => {
    if (!chartConfig) return [];
    const ticksCount = 4;
    const ticks = [];
    const step = chartConfig.yRange / (ticksCount - 1);
    for (let i = 0; i < ticksCount; i++) {
      const value = chartConfig.yMin + i * step;
      const y = chartConfig.paddingTop + chartConfig.chartHeight - (i / (ticksCount - 1)) * chartConfig.chartHeight;
      ticks.push({ value, y });
    }
    return ticks;
  }, [chartConfig]);

  // Generate ticks for X axis
  const xTicks = useMemo(() => {
    if (!chartConfig || !chartConfig.points.length) return [];
    const L = chartConfig.points.length;
    if (L <= 1) return [chartConfig.points[0]];
    
    // Return spread-out milestones
    const indices = [0, Math.floor(L * 0.33), Math.floor(L * 0.66), L - 1];
    return indices.map((idx) => chartConfig.points[idx]).filter(Boolean);
  }, [chartConfig]);

  return (
    <section className="dashboard-section w-full pb-6">
      
      {/* Portfolio Value Card */}
      <div className="card w-full bg-base-100 shadow-xl border border-base-200 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] cursor-default">
        <div className="card-body p-4">
          
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <PieChart size={20} />
              </div>
              <h2 className="card-title text-base text-gray-500 uppercase tracking-wide">
                Portfolio Value
              </h2>
            </div>

            <button
              type="button"
              className={`btn btn-ghost btn-sm p-2 min-h-0 h-8 w-8 rounded-full transition-all duration-300 ${isRefreshing ? "opacity-60 cursor-not-allowed grayscale" : "hover:bg-base-200"}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh portfolio"
            >
              <RefreshCw
                size={14}
                className={`transition-all duration-300 ${isRefreshing ? "animate-spin opacity-80" : "opacity-70"}`}
              />
            </button>
          </div>

          {/* Main Big Number */}
          <div className="banner">
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
          <div className="grid grid-cols-2 gap-4 ">
            
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
              
              {/* 1 Day Change */}
              <div className="flex items-center justify-end gap-1 mb-1">
                <span className="text-xs font-medium text-gray-500">1D:</span>
                <span className={`text-xs font-semibold ${summary.totalDayChange >= 0 ? "text-success" : "text-error"}`}>
                  {summary.totalDayChange >= 0 ? <TrendingUp size={10} className="inline" /> : <TrendingDown size={10} className="inline" />}
                  {summary.totalDayChange >= 0 ? "+" : ""}{formatMoney(summary.totalDayChange)}
                </span>
              </div>

              {/* 1 Week Change */}
              <div className="flex items-center justify-end gap-1">
                <span className="text-xs font-medium text-gray-500">1W:</span>
                <span className={`text-xs font-semibold ${summary.totalWeekChange >= 0 ? "text-success" : "text-error"}`}>
                  {summary.totalWeekChange >= 0 ? <TrendingUp size={10} className="inline" /> : <TrendingDown size={10} className="inline" />}
                  {summary.totalWeekChange >= 0 ? "+" : ""}{formatMoney(summary.totalWeekChange)}
                </span>
              </div>

              {/* 1 Month Change */}
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

      {/* Historical Performance Chart Card */}
      <div className="card w-full bg-base-100 shadow-xl border border-base-200 mt-2 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] cursor-default">
        <div className="card-body p-4">
          
          {/* Chart Header */}
          <div className="graph-header">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-base-content">
                  Portfolio Trend
                </h3>
                {activePoint &&
                  <p className="text-xs text-gray-400">
                    {activePoint.formattedDate} · {formatMoney(activePoint.value)}
                  </p>
                }
              </div>
            </div>
          </div>

          {/* Chart Body */}
          <div className="relative w-full flex items-center justify-center bg-base-50 rounded-xl overflow-hidden">
            {isLoadingChart ? (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <span className="loading loading-spinner loading-md text-primary"></span>
                <span className="text-xs font-semibold">Calculating portfolio trend...</span>
              </div>
            ) : !historyData.length ? (
              <div className="text-center p-4">
                <p className="text-sm font-semibold text-gray-400">No Historical Data Available</p>
                <p className="text-xs text-gray-500 mt-1">Add funds with correct codes to view performance trends.</p>
              </div>
            ) : chartConfig ? (
              <div className="relative w-full h-full">
                
                {/* SVG Drawing Canvas */}
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
                  className="w-full h-full overflow-visible select-none"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <defs>
                    {/* Line Gradient */}
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="oklch(var(--p))" />
                      <stop offset="100%" stopColor="oklch(var(--s))" />
                    </linearGradient>

                    {/* Area Fill Gradient */}
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(var(--p))" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="oklch(var(--p))" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines & Y-Axis Labels (Short format) */}
                  {yTicks.map((tick, i) => (
                    <g key={i} className="opacity-40 transition-opacity duration-200">
                      {/* Gridline */}
                      <line
                        x1={chartConfig.paddingLeft}
                        y1={tick.y}
                        x2={chartConfig.width - chartConfig.paddingRight}
                        y2={tick.y}
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        className="text-base-content/25"
                      />
                      {/* Short Label */}
                      <text
                        x={chartConfig.paddingLeft - 8}
                        y={tick.y + 4}
                        textAnchor="end"
                        className="text-[10px] font-bold fill-base-content/70"
                      >
                        {formatShortMoney(tick.value)}
                      </text>
                    </g>
                  ))}

                  {/* Vertical Guide Line on Hover */}
                  {activePointIndex !== null && activePoint && (
                    <line
                      x1={activePoint.x}
                      y1={chartConfig.paddingTop}
                      x2={activePoint.x}
                      y2={chartConfig.paddingTop + chartConfig.chartHeight}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="text-primary/50"
                    />
                  )}

                  {/* Filled Area */}
                  <path
                    d={svgPaths.area}
                    fill="url(#areaGrad)"
                    className="transition-all duration-500"
                  />
                  
                  {/* Trend Line */}
                  <path
                    d={svgPaths.line}
                    fill="none"
                    stroke="url(#lineGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-500"
                  />
                  
                  {/* Highlight dot on hovered/active element */}
                  {activePoint && (
                    <>
                      <circle
                        cx={activePoint.x}
                        cy={activePoint.y}
                        r="7"
                        fill="oklch(var(--p))"
                        fillOpacity="0.3"
                      />
                      <circle
                        cx={activePoint.x}
                        cy={activePoint.y}
                        r="4.5"
                        fill="oklch(var(--p))"
                        stroke="oklch(var(--b1))"
                        strokeWidth="1.5"
                      />
                    </>
                  )}

                  {/* X-Axis Ticks & Date Labels */}
                  {xTicks.map((tick, i) => (
                    <g key={i}>
                      {/* Tick Line */}
                      <line
                        x1={tick.x}
                        y1={chartConfig.paddingTop + chartConfig.chartHeight}
                        x2={tick.x}
                        y2={chartConfig.paddingTop + chartConfig.chartHeight + 4}
                        stroke="currentColor"
                        className="text-base-content/25"
                      />
                      {/* Date Text */}
                      <text
                        x={tick.x}
                        y={chartConfig.paddingTop + chartConfig.chartHeight + 16}
                        textAnchor="middle"
                        className="text-[9px] font-bold fill-base-content/60"
                      >
                        {tick.formattedDate}
                      </text>
                    </g>
                  ))}
                </svg>
                
              </div>
            ) : null}
          </div>

        </div>
      </div>

    </section>
  );
};

export default Dashboard;