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
    <div className="funds-sub-header flex justify-between items-center bg-white  transition-colors py-1">
      {/* will be used below div for filters*/}
      <div className="flex items-center gap-2 px-2 text-gray-600">
        <span className="text-xs font-medium">
          {activeFundsCount} Funds
        </span>
        <span className="h-3 w-px bg-gray-300" aria-hidden="true" />
        <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${isPositiveChange ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
          {isPositiveChange ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          <span>{isPositiveChange ? "+" : ""}{formatMoney(totalDayChange)}</span>
        </div>
      </div>

      {/* Label and Icon - Clickable */}
      <button
        onClick={handleLabelClick}
        className="flex items-center gap-1 px-2 cursor-pointer"
      >
        <span className="text-xs font-medium text-gray-600">
          {LABEL_OPTIONS[currentLabelIndex].label}
        </span>
        <ArrowUpDown size={12} className="text-gray-600" />
      </button>
    </div>
  );
};

export default SubHeader;
