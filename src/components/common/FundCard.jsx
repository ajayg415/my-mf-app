import React, { useEffect, useMemo, useState, useRef } from "react";
import { useSelector } from "react-redux";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Edit2,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatMoney, formatShortMoney } from "../../utils/utils.js";
import { MF_NAV_URL, fetchFundDetails } from "../../utils/api.js";
import { getCachedFund } from "../../services/db";

const parseInvestmentDate = (fundData) => {
  const candidates = [
    fundData?.investedOn,
    fundData?.purchaseDate,
    fundData?.addedOn,
    fundData?.createdAt,
    fundData?.startDate,
    fundData?.investmentDate,
    fundData?.date,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const fallback = new Date();
  fallback.setFullYear(fallback.getFullYear() - 1);
  return fallback;
};

const calculateXirrEstimate = ({ initialInvestment, finalValue, startDate, endDate = new Date() }) => {
  const investment = parseFloat(initialInvestment) || 0;
  const terminalValue = parseFloat(finalValue) || 0;

  if (investment <= 0 || terminalValue < 0) return null;
  if (terminalValue === 0) return -1.0;

  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const totalDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
  const years = totalDays / 365.25;

  return Math.pow(terminalValue / investment, 1 / years) - 1;
};


const getDerivedCurrentValue = (fundData) => {
  const storedValue = parseFloat(fundData?.currentMktValue || 0);
  const unitsValue = parseFloat(fundData?.units || 0) * parseFloat(fundData?.nav || 0);
  const gainValue = parseFloat(fundData?.costValue || 0) * (1 + (parseFloat(fundData?.gainLossPercentage || 0) / 100));

  if (Number.isFinite(storedValue) && storedValue > 0) return storedValue;
  if (Number.isFinite(unitsValue) && unitsValue > 0) return unitsValue;
  if (Number.isFinite(gainValue) && gainValue > 0) return gainValue;
  return 0;
};

const FundCard = ({ fund, funds = [], index = 0, onClick, onEdit, hasEdit = true }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(index);
  const [touchStartX, setTouchStartX] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [selectedRange, setSelectedRange] = useState("1M");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [activePointIndex, setActivePointIndex] = useState(null);
  const svgRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!chartConfig || !chartSeries.length || !svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;

    // Convert screen coordinates to SVG viewBox coords
    const localX = (mouseX / svgRect.width) * chartConfig.width;

    let closestIndex = 0;
    let minDiff = Infinity;
    chartSeries.forEach((point, index) => {
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

  const handleChartTouchMove = (e) => {
    if (!chartConfig || !chartSeries.length || !svgRef.current) return;
    
    if (e.cancelable) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = touch.clientX - svgRect.left;

    // Convert screen coordinates to SVG viewBox coords
    const localX = (mouseX / svgRect.width) * chartConfig.width;

    let closestIndex = 0;
    let minDiff = Infinity;
    chartSeries.forEach((point, index) => {
      const diff = Math.abs(point.x - localX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });

    setActivePointIndex(closestIndex);
  };

  const handleChartTouchStart = (e) => {
    handleChartTouchMove(e);
  };

  const handleChartTouchEnd = () => {
    setActivePointIndex(null);
  };

  // 1. Safe parsing & Defaults
  const fundList = funds.length > 0 ? funds : [fund];
  const currentFund = fundList[activeIndex] || fund;
  const invested = parseFloat(currentFund.costValue || 0);
  const current = getDerivedCurrentValue(currentFund);
  const totalPL = parseFloat(currentFund.gainLoss || 0);
  const totalPLPercent = parseFloat(currentFund.gainLossPercentage || 0);
  const code = currentFund.code;
  const nav = parseFloat(currentFund.nav || 0);

  // Metrics for Expanded View
  const metrics = [
    {
      label: "1 Day",
      val: parseFloat(currentFund.dayChange || 0),
      pct: parseFloat(currentFund.dayChangePercentage || 0),
    },
    {
      label: "1 Week",
      val: parseFloat(currentFund.weekChange || 0),
      pct: parseFloat(currentFund.weekChangePercentage || 0),
    },
    {
      label: "1 Month",
      val: parseFloat(currentFund.monthChange || 0),
      pct: parseFloat(currentFund.monthChangePercentage || 0),
    },
  ];

  const isProfit = totalPL >= 0;
  const getColorClass = (val) => (val >= 0 ? "text-success" : "text-error");
  const getBgClass = (val) => (val >= 0 ? "bg-success/10" : "bg-error/10");

  const rangeOptions = [{ label: "1M", days: 30 }];

  useEffect(() => {
    if (!isModalOpen || !currentFund?.code) return;

    let ignore = false;

    const loadHistory = async () => {
      setIsHistoryLoading(true);
      try {
        const cachedHistory = await getCachedFund(currentFund.code);
        if (!ignore && cachedHistory?.data?.length) {
          setHistoryData(cachedHistory.data);
        } else if (!ignore) {
          const freshHistory = await fetchFundDetails(currentFund.code, false);
          if (!ignore && freshHistory?.data?.length) {
            setHistoryData(freshHistory.data);
          }
        }
      } catch (error) {
        console.error("Failed to load fund history", error);
      } finally {
        if (!ignore) {
          setIsHistoryLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      ignore = true;
    };
  }, [currentFund?.code, isModalOpen]);

  const chartSeries = useMemo(() => {
    if (!historyData.length) return [];

    // Sort oldest first
    const orderedData = [...historyData].reverse();

    const selectedDays = rangeOptions.find((option) => option.label === selectedRange)?.days || 30;
    const maxPoints = selectedDays > 90 ? 120 : 60;
    const startIndex = Math.max(0, orderedData.length - Math.min(selectedDays, orderedData.length));
    let sliced = orderedData.slice(startIndex);

    if (sliced.length > maxPoints) {
      const step = Math.ceil(sliced.length / maxPoints);
      sliced = sliced.filter((_, index) => index % step === 0 || index === sliced.length - 1);
    }

    const values = sliced.map((entry) => parseFloat(entry.nav) || 0).filter((value) => value > 0);
    if (!values.length) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const width = 500;
    const height = 240;
    const paddingLeft = 45;
    const paddingRight = 5;
    const paddingTop = 25;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Y-axis padding (15% on top and bottom)
    const yMin = Math.max(0, min - range * 0.15);
    const yMax = max + range * 0.15;
    const yRange = yMax - yMin || 1;

    return sliced.map((entry, index) => {
      const value = parseFloat(entry.nav) || 0;
      const x = paddingLeft + (sliced.length > 1 ? (index / (sliced.length - 1)) * chartWidth : 0);
      const y = paddingTop + chartHeight - ((value - yMin) / yRange) * chartHeight;
      const dateValue = entry.date || entry.Date || "";
      const formattedDate = (() => {
        const rawDate = String(dateValue).trim();
        if (!rawDate) return "N/A";
        const normalized = rawDate.includes("-") && rawDate.split("-")[0].length === 2 ? rawDate.split("-").reverse().join("-") : rawDate;
        const parsed = new Date(normalized);
        if (Number.isNaN(parsed.getTime())) return rawDate;
        return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      })();

      return { ...entry, value, x, y, formattedDate };
    });
  }, [historyData, rangeOptions, selectedRange]);

  const chartConfig = useMemo(() => {
    if (!chartSeries.length) return null;
    
    const width = 500;
    const height = 240;
    const paddingLeft = 45;
    const paddingRight = 5;
    const paddingTop = 25;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const values = chartSeries.map((p) => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    const yMin = Math.max(0, minVal - range * 0.15);
    const yMax = maxVal + range * 0.15;
    const yRange = yMax - yMin || 1;

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      chartWidth,
      chartHeight,
      yMin,
      yMax,
      yRange,
    };
  }, [chartSeries]);

  const svgPaths = useMemo(() => {
    if (!chartSeries.length || !chartConfig) return { line: "", area: "" };

    const linePath = chartSeries
      .map((p, index) => `${index === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" ");

    const first = chartSeries[0];
    const last = chartSeries[chartSeries.length - 1];
    const bottomY = chartConfig.paddingTop + chartConfig.chartHeight;

    const areaPath = `
      ${linePath}
      L${last.x.toFixed(2)},${bottomY.toFixed(2)}
      L${first.x.toFixed(2)},${bottomY.toFixed(2)}
      Z
    `.trim();

    return { line: linePath, area: areaPath };
  }, [chartSeries, chartConfig]);

  const activePoint = chartSeries[activePointIndex ?? chartSeries.length - 1] || null;

  const yTicks = useMemo(() => {
    if (!chartSeries.length || !chartConfig) return [];
    const ticksCount = 4;
    const ticks = [];
    const step = chartConfig.yRange / (ticksCount - 1);
    for (let i = 0; i < ticksCount; i++) {
      const value = chartConfig.yMin + i * step;
      const y = chartConfig.paddingTop + chartConfig.chartHeight - (i / (ticksCount - 1)) * chartConfig.chartHeight;
      ticks.push({ value, y });
    }
    return ticks;
  }, [chartSeries, chartConfig]);

  const xTicks = useMemo(() => {
    if (!chartSeries.length || !chartConfig) return [];
    const L = chartSeries.length;
    if (L <= 1) return [chartSeries[0]];
    const indices = [0, Math.floor(L * 0.33), Math.floor(L * 0.66), L - 1];
    return indices.map((idx) => chartSeries[idx]).filter(Boolean);
  }, [chartSeries, chartConfig]);

  const sortBy = useSelector((state) => state.mf.sortBy);
  const investmentDate = useMemo(() => parseInvestmentDate(currentFund), [currentFund]);
  const xirrEstimate = useMemo(() => {
    return calculateXirrEstimate({
      initialInvestment: invested,
      finalValue: current,
      startDate: investmentDate,
      endDate: new Date(),
    });
  }, [current, invested, investmentDate]);

  const getSortValue = () => {
    if (!sortBy || !["units", "dayChange", "xirr"].includes(sortBy)) return null;

    if (sortBy === "xirr") {
      return xirrEstimate == null ? "—" : `${xirrEstimate >= 0 ? "+" : ""}${(xirrEstimate * 100).toFixed(2)}%`;
    }

    const value = currentFund[sortBy];
    if (value == null || value === "") return null;

    if (sortBy === "dayChange") {
      const numericValue = parseFloat(value || 0);
      return `${numericValue >= 0 ? "+" : ""}${formatMoney(numericValue)}`;
    }

    if (sortBy === "units") {
      return parseFloat(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
    }

    return null;
  };

  const sortValue = getSortValue();

  const handleCardClick = () => {
    setActiveIndex(index);
    setIsModalOpen(true);
    onClick?.();
  };

  const handlePrevFund = () => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextFund = () => {
    setActiveIndex((prev) => Math.min(fundList.length - 1, prev + 1));
  };

  const handleTouchStart = (event) => {
    setTouchStartX(event.touches[0].clientX);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (delta > 50) {
      handlePrevFund();
    } else if (delta < -50) {
      handleNextFund();
    }
    setTouchStartX(null);
  };

  useEffect(() => {
    setActivePointIndex(chartSeries.length - 1);
  }, [chartSeries.length, selectedRange, currentFund?.code]);

  return (
    <>
      <div className="card bg-base-100 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
        <div className="card-body p-0">
          {/* --- MAIN CARD CONTENT (Always Visible) --- */}
          <div
            className="p-4 cursor-pointer pb-1"
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick();
              }
            }}
          >
          
          {/* ROW 1: Identity */}
          <div className="flex flex-col mb-4">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-bold text-gray-800 leading-tight text-sm md:text-base line-clamp-1 break-words capitalize">
                {currentFund.name}
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

            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="badge badge-xs badge-ghost text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                {currentFund.schemeType || "Growth"}
              </span>
              {sortValue && (
                <span className={`text-sm font-semibold tracking-wide whitespace-nowrap ${sortBy === "dayChange" || sortBy === "xirr" ? getColorClass(xirrEstimate ?? parseFloat(currentFund.dayChange || 0)) : "text-primary"}`}>
                  {sortValue}
                </span>
              )}
            </div>
          </div>

          {/* ROW 2: Summary Metrics */}
          <div className="grid grid-cols-2 gap-2 items-start">
            <div className="min-w-0 rounded-lg bg-gray-50/70 p-2">
              <p className="text-[12px] text-gray-400 tracking-wide mb-0.5">
                Invested
              </p>
              <p className="text-gray-700 text-xs leading-tight">
                {formatMoney(invested)}
              </p>
            </div>

            <div className="min-w-0 rounded-lg bg-gray-50/70 p-2">
              <p className="text-[12px] text-gray-400 tracking-wide mb-0.5">
                Current
              </p>
              <p className="text-gray-900 text-xs leading-tight">
                {formatMoney(current)}
              </p>
            </div>

            <div className="min-w-0 rounded-lg bg-gray-50/70 p-2">
              <p className="text-[12px] text-gray-400 tracking-wide mb-0.5">
                Returns
              </p>
              <div className={`flex flex-wrap items-baseline justify-start gap-1 text-xs leading-tight ${getColorClass(totalPL)}`}>
                <span>
                  {isProfit ? "+" : ""}
                  {formatMoney(totalPL)}
                </span>
                <span className="font-medium opacity-80">
                  ({Math.abs(totalPLPercent).toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="min-w-0 rounded-lg bg-gray-50/70 p-2">
              <p className="text-[12px] text-gray-400 tracking-wide mb-0.5">
                1D Change
              </p>
              <p className={`text-xs font-semibold leading-tight ${getColorClass(currentFund.dayChange ?? 0)}`}>
                {currentFund.dayChange >= 0 ? "+" : ""}
                {formatMoney(currentFund.dayChange)}
              </p>
            </div>
          </div>
        </div>

          {/* <div className="flex justify-center pb-1 pt-2 text-[11px] text-gray-400">
            Tap for full details
          </div> */}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="w-full max-w-3xl rounded-2xl bg-base-100 shadow-2xl border border-base-200 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Fund Details</p>
                <h3 className="truncate text-sm font-semibold text-gray-800">{currentFund.name}</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm h-8 w-8 rounded-full p-0"
                  onClick={handlePrevFund}
                  disabled={activeIndex === 0}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm h-8 w-8 rounded-full p-0"
                  onClick={handleNextFund}
                  disabled={activeIndex === fundList.length - 1}
                >
                  <ChevronRight size={16} />
                </button>
                <div className="rounded-full bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-500">
                  {activeIndex + 1}/{fundList.length}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs h-8 w-8 rounded-full p-0"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3 p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-base-200/60 p-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Invested</p>
                  <p className="mt-1 font-semibold text-gray-800">{formatMoney(invested)}</p>
                </div>
                <div className="rounded-xl bg-base-200/60 p-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Current Value</p>
                  <p className="mt-1 font-semibold text-gray-800">{formatMoney(current)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gray-500">Total Return</span>
                  <span className={`text-sm font-semibold ${getColorClass(totalPL)}`}>
                    {isProfit ? "+" : ""}{formatMoney(totalPL)} ({Math.abs(totalPLPercent).toFixed(2)}%)
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  {metrics.map((metric, idx) => (
                    <div key={idx} className="rounded-lg bg-gray-50 p-1.5">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">{metric.label}</p>
                      <p className={`mt-1 text-[11px] font-semibold ${getColorClass(metric.val)}`}>
                        {metric.val > 0 ? "+" : ""}{formatMoney(metric.val)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-50 px-2 py-1.5 text-[11px]">
                  <span className="font-medium text-gray-500">Est. XIRR</span>
                  <span className={`font-semibold ${getColorClass(xirrEstimate ?? 0)}`}>
                    {xirrEstimate == null ? "—" : `${xirrEstimate >= 0 ? "+" : ""}${(xirrEstimate * 100).toFixed(2)}%`}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-gray-600">
                  <span className="font-medium text-gray-500">1M NAV history</span>
                  <span className="font-semibold text-gray-800">
                    {activePointIndex !== null && activePoint
                      ? `${activePoint.formattedDate} · ₹${parseFloat(activePoint.value || 0).toFixed(2)}`
                      : `Current ₹${nav.toFixed(2)}`}
                  </span>
                </div>

                {isHistoryLoading ? (
                  <div className="flex h-20 items-center justify-center rounded-xl bg-gray-50 text-[11px] text-gray-400">
                    Loading chart...
                  </div>
                ) : chartConfig && chartSeries.length > 0 ? (
                  <div className="space-y-1.5">
                    <div className="w-full overflow-hidden rounded-xl bg-base-50 p-2">
                      <svg
                        ref={svgRef}
                        viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
                        className="w-full h-44 sm:h-48 overflow-visible select-none touch-none"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        onTouchStart={handleChartTouchStart}
                        onTouchMove={handleChartTouchMove}
                        onTouchEnd={handleChartTouchEnd}
                        role="img"
                        aria-label="NAV history chart"
                      >
                        <defs>
                          {/* Line Gradient */}
                          <linearGradient id="fundLineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="oklch(var(--p))" />
                            <stop offset="100%" stopColor="oklch(var(--s))" />
                          </linearGradient>

                          {/* Area Fill Gradient */}
                          <linearGradient id="fundAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="oklch(var(--p))" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="oklch(var(--p))" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Gridlines & Y-Axis Labels */}
                        {yTicks.map((tick, i) => (
                          <g key={i} className="opacity-40 transition-opacity duration-200">
                            <line
                              x1={chartConfig.paddingLeft}
                              y1={tick.y}
                              x2={chartConfig.width - chartConfig.paddingRight}
                              y2={tick.y}
                              stroke="currentColor"
                              strokeWidth="0.8"
                              strokeDasharray="3 3"
                              className="text-base-content/25"
                            />
                            <text
                              x={chartConfig.paddingLeft - 8}
                              y={tick.y + 3}
                              textAnchor="end"
                              className="text-[9px] font-bold fill-base-content/70"
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
                            strokeWidth="1.2"
                            strokeDasharray="4 4"
                            className="text-primary/50"
                          />
                        )}

                        {/* Filled Area */}
                        <path
                          d={svgPaths.area}
                          fill="url(#fundAreaGrad)"
                        />

                        {/* Trend Line */}
                        <path
                          d={svgPaths.line}
                          fill="none"
                          stroke="url(#fundLineGrad)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Highlight dot on hovered/active element */}
                        {activePointIndex !== null && activePoint && (
                          <>
                            <circle
                              cx={activePoint.x}
                              cy={activePoint.y}
                              r="5.5"
                              fill="oklch(var(--p))"
                              fillOpacity="0.3"
                            />
                            <circle
                              cx={activePoint.x}
                              cy={activePoint.y}
                              r="3.5"
                              fill="oklch(var(--p))"
                              stroke="oklch(var(--b1))"
                              strokeWidth="1.2"
                            />
                          </>
                        )}

                        {/* X-Axis Ticks & Date Labels */}
                        {xTicks.map((tick, i) => (
                          <g key={i}>
                            <line
                              x1={tick.x}
                              y1={chartConfig.paddingTop + chartConfig.chartHeight}
                              x2={tick.x}
                              y2={chartConfig.paddingTop + chartConfig.chartHeight + 4}
                              stroke="currentColor"
                              className="text-base-content/25"
                            />
                            <text
                              x={tick.x}
                              y={chartConfig.paddingTop + chartConfig.chartHeight + 14}
                              textAnchor="middle"
                              className="text-[8px] font-bold fill-base-content/60"
                            >
                              {tick.formattedDate}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-24 items-center justify-center rounded-xl bg-gray-50 text-[11px] text-gray-400">
                    No history available yet
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-2.5 space-y-1">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-xs font-medium text-gray-500">Scheme Code</span>
                  <a
                    href={`${MF_NAV_URL}/${code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    {code}
                    <ExternalLink size={12} />
                  </a>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-xs font-medium text-gray-500">Current NAV</span>
                  <span className="text-xs font-semibold text-gray-700">₹{nav.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-xs font-medium text-gray-500">Units Held</span>
                  <span className="text-xs font-semibold text-gray-700">{parseFloat(fund.units || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-xs font-medium text-gray-500">Folio</span>
                  <span className="text-xs font-semibold text-gray-700">{currentFund.folio || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-xs font-medium text-gray-500">ISIN</span>
                  <span className="text-xs font-semibold text-gray-700">{currentFund.isin || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-xs font-medium text-gray-500">Type</span>
                  <span className="text-xs font-semibold text-gray-700">{currentFund.schemeType || "Growth"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FundCard;