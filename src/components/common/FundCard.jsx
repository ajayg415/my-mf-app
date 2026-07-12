import React, { useEffect, useMemo, useState } from "react";
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
import { formatMoney } from "../../utils/utils.js";
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

    return sliced.map((entry, index) => {
      const value = parseFloat(entry.nav) || 0;
      const x = sliced.length === 1 ? 50 : (index / (sliced.length - 1)) * 100;
      const y = sliced.length === 1 ? 50 : 100 - ((value - min) / range) * 80 - 10;
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

  const chartPath = useMemo(() => {
    if (!chartSeries.length) return "";
    return chartSeries
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
      .join(" ");
  }, [chartSeries]);

  const activePoint = chartSeries[activePointIndex ?? chartSeries.length - 1] || null;
  const yTicks = useMemo(() => {
    if (!chartSeries.length) return [];

    const values = chartSeries.map((point) => point.value).filter((value) => Number.isFinite(value));
    if (!values.length) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const rawRange = max - min || Math.max(1, Math.abs(max) || 1);
    const safeRange = Math.max(rawRange, 0.01);
    const steps = 4;

    return Array.from({ length: steps + 1 }, (_, index) => {
      const ratio = index / steps;
      const value = max - safeRange * ratio;
      return {
        value,
        label: `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        y: 90 - ratio * 80,
      };
    });
  }, [chartSeries]);

  const xTicks = useMemo(() => {
    if (!chartSeries.length) return [];

    const saturdayPoints = chartSeries.filter((point) => {
      const rawDate = String(point.date || point.Date || "").trim();
      if (!rawDate) return false;
      const normalized = rawDate.includes("-") && rawDate.split("-")[0].length === 2 ? rawDate.split("-").reverse().join("-") : rawDate;
      const parsed = new Date(normalized);
      return !Number.isNaN(parsed.getTime()) && parsed.getDay() === 6;
    });

    const sourcePoints = saturdayPoints.length >= 4 ? saturdayPoints : chartSeries;
    const desiredCount = 4;

    if (!sourcePoints.length) return [];

    if (sourcePoints.length <= desiredCount) {
      return sourcePoints.map((point, index) => ({ ...point, xPos: 10 + (index / Math.max(1, sourcePoints.length - 1)) * 82 }));
    }

    return Array.from({ length: desiredCount }, (_, index) => {
      const ratio = index / (desiredCount - 1);
      const targetIndex = Math.round(ratio * (sourcePoints.length - 1));
      const point = sourcePoints[targetIndex];
      return { ...point, xPos: 10 + ratio * 82 };
    });
  }, [chartSeries]);

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
                XIRR
              </p>
              <p className={`text-xs font-semibold leading-tight ${getColorClass(xirrEstimate ?? 0)}`}>
                {xirrEstimate == null ? "—" : `${xirrEstimate >= 0 ? "+" : ""}${(xirrEstimate * 100).toFixed(2)}%`}
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
                    {activePoint ? `${activePoint.formattedDate} · ₹${parseFloat(activePoint.value || 0).toFixed(2)}` : `Current ₹${nav.toFixed(2)}`}
                  </span>
                </div>

                {isHistoryLoading ? (
                  <div className="flex h-20 items-center justify-center rounded-xl bg-gray-50 text-[11px] text-gray-400">
                    Loading chart...
                  </div>
                ) : chartPath ? (
                  <div className="space-y-1.5">
                    <div className="w-full overflow-hidden rounded-2xl bg-gray-50 p-2">
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-44 w-full sm:h-48" role="img" aria-label="NAV history chart">
                        <line x1="8" y1="90" x2="92" y2="90" stroke="#d1d5db" strokeWidth="0.6" />
                        <line x1="8" y1="10" x2="8" y2="90" stroke="#d1d5db" strokeWidth="0.6" />
                        {yTicks.map((tick, index) => (
                          <g key={`y-${index}`}>
                            <line x1="8" y1={tick.y} x2="92" y2={tick.y} stroke="#f3f4f6" strokeWidth="0.4" />
                            <text x="2" y={tick.y + 1} fontSize="3.2" textAnchor="end" fill="#6b7280">
                              {tick.label}
                            </text>
                          </g>
                        ))}
                        {xTicks.map((point, index) => (
                          <text key={`x-${index}`} x={point.xPos} y="98" fontSize="3.2" textAnchor="middle" fill="#6b7280">
                            {point.formattedDate}
                          </text>
                        ))}
                        <path d={chartPath} fill="none" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        {chartSeries.map((point, index) => (
                          <circle
                            key={`${point.date}-${index}`}
                            cx={point.x}
                            cy={point.y}
                            r="1.4"
                            fill={activePointIndex === index ? "#1d4ed8" : "#2563eb"}
                            stroke="#fff"
                            strokeWidth="0.4"
                            onMouseEnter={() => setActivePointIndex(index)}
                            onMouseLeave={() => setActivePointIndex(null)}
                            onTouchStart={() => setActivePointIndex(index)}
                            onTouchEnd={() => setActivePointIndex(null)}
                            onClick={() => setActivePointIndex(index)}
                          />
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