import { useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router";
import { ArrowUpDown, TrendingDown, TrendingUp } from "lucide-react";
import { sortFunds } from "../store/mf/mfSlice";
import { formatMoney } from "../utils/utils";

const SubHeader = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { count: activeFundsCount } = useSelector((state) => state.mf.activeData);
  const funds = useSelector((state) => state.mf.userData?.funds || []);

  // Array of label options to cycle through
  const LABEL_OPTIONS = [
    { label: "Fund Name", key: "schemeName" },
    { label: "Units", key: "units" },
    { label: "Investments", key: "costValue" },
    { label: "Portfolio Value", key: "currentMktValue" },
    { label: "Total Gain/Loss", key: "gainLoss" },
    { label: "1D Change", key: "dayChange" },
    { label: "XIRR", key: "xirr" },
    // { label: "1D Change Percentage", key: "dayChangePercentage" },
    // { label: "1W Change", key: "weekChange" },
    // { label: "1W Change Percentage", key: "weekChangePercentage" },
    // { label: "1M Change", key: "monthChange" },
    // { label: "1M Change Percentage", key: "monthChangePercentage" },
  ];

  const [currentLabelIndex, setCurrentLabelIndex] = useState(0);

  const visibleFunds = useMemo(() => {
    switch (location.pathname) {
      case "/holdings":
        return funds.filter((fund) => parseFloat(fund.costValue));
      case "/sips":
        return funds.filter((fund) => fund.isSip === true);
      case "/favourite":
        return funds.filter((fund) => fund.isFavorite);
      default:
        return funds;
    }
  }, [funds, location.pathname]);

  const totalDiff = useMemo(() => {
    return visibleFunds.reduce((sum, fund) => sum + (parseFloat(fund.gainLoss) || 0), 0);
  }, [visibleFunds]);

  const totalDayChange = useMemo(() => {
    return visibleFunds.reduce((sum, fund) => sum + (parseFloat(fund.dayChange) || 0), 0);
  }, [visibleFunds]);

  const isPositiveChange = totalDayChange >= 0;

  const handleLabelClick = () => {
    const newIndex = (currentLabelIndex + 1) % LABEL_OPTIONS.length;
    setCurrentLabelIndex(newIndex);
    // Dispatch sort action with the new label's key
    dispatch(sortFunds({ fieldKey: LABEL_OPTIONS[newIndex].key }));
  };

  return (
    <div className="funds-sub-header flex justify-between items-center bg-white border-b border-base-200 transition-colors py-1.5 px-2">
      {/* Left side stats container */}
      <div className="flex items-center gap-1.5 sm:gap-3 text-gray-600 min-w-0">
        <span className="text-[11px] sm:text-xs font-semibold whitespace-nowrap shrink-0">
          {activeFundsCount} Funds
        </span>

        <span className="h-3 w-px bg-gray-300 shrink-0" aria-hidden="true" />

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">1D</span>
          <div className={`flex items-center gap-0.5 sm:gap-1 rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold shrink-0 ${isPositiveChange ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
            {isPositiveChange ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            <span className="whitespace-nowrap">{isPositiveChange ? "+" : ""}{formatMoney(totalDayChange)}</span>
          </div>
        </div>

        <span className="h-3 w-px bg-gray-300 shrink-0" aria-hidden="true" />

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Total</span>
          <div className={`flex items-center gap-0.5 sm:gap-1 rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold shrink-0 ${totalDiff > 0 ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
            {totalDiff > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            <span className="whitespace-nowrap">{totalDiff > 0 ? "+" : ""}{formatMoney(totalDiff)}</span>
          </div>
        </div>
      </div>

      {/* Right side Sort button - Clickable */}
      <button
        onClick={handleLabelClick}
        className="flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded hover:bg-base-100 transition-colors cursor-pointer shrink-0 ml-2"
      >
        <span className="text-[11px] sm:text-xs font-medium text-gray-600 whitespace-nowrap">
          {LABEL_OPTIONS[currentLabelIndex].label}
        </span>
        <ArrowUpDown size={11} className="text-gray-600 shrink-0" />
      </button>
    </div>
  );
};

export default SubHeader;
