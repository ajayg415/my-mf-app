import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ArrowUpDown, FunnelPlus } from "lucide-react";
import { sortFunds } from "../store/mf/mfSlice";

const SubHeader = () => {
  const dispatch = useDispatch();
  const { funds } = useSelector((state) => state.mf.userData);

  // Array of label options to cycle through
  const LABEL_OPTIONS = [
    { label: "Fund Name", key: "schemeName" },
    { label: "Units", key: "units" },
    { label: "Investments", key: "costValue" },
    { label: "Portfolio Value", key: "currentMktValue" },
    { label: "Total Gain/Loss", key: "gainLoss" },
    { label: "1D Change", key: "dayChange" },
    { label: "1D Change Percentage", key: "dayChangePercentage" },
    { label: "1W Change", key: "weekChange" },
    { label: "1W Change Percentage", key: "weekChangePercentage" },
    { label: "1M Change", key: "monthChange" },
    { label: "1M Change Percentage", key: "monthChangePercentage" },
  ];

  const [currentLabelIndex, setCurrentLabelIndex] = useState(0);

  const handleLabelClick = () => {
    const newIndex = (currentLabelIndex + 1) % LABEL_OPTIONS.length;
    setCurrentLabelIndex(newIndex);
    // Dispatch sort action with the new label's key
    dispatch(sortFunds({ fieldKey: LABEL_OPTIONS[newIndex].key }));
  };

  return (
    <div className="funds-sub-header flex justify-between items-center bg-white  transition-colors py-1">
      {/* will be used below div for filters*/}
      <div className="flex items-centerfunds-count px-2 text-gray-600">
        <span className="text-xs font-medium">
          {funds.length} Funds
        </span>
        <span className="px-2">
            <FunnelPlus size={16} />
        </span>
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
