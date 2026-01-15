import { Plus } from "lucide-react";
import { useState } from "react";
import { X, Heart } from "lucide-react";
import { useDispatch } from "react-redux";

import FundSelect from "./FundSelect";
import { addOrUpdateFund } from "../../store/mf/mfSlice.js";

// eslint-disable-next-line no-unused-vars
const mockFundDetails = {
  id: "100033",
  category: "Unknown",
  code: "100033",
  name: "Aditya Birla Sun Life Large & Mid Cap Fund - Regular Growth",
  isin: "INF209K01165",
  keywords: [
    "aditya",
    "birla",
    "sun",
    "life",
    "large",
    "mid",
    "cap",
    "fund",
    "regular",
    "growth",
  ],
};

const AddFund = ({ fundDetails = {} }) => {
  const [fundCode, setFundCode] = useState(Boolean(fundDetails?.code));
  const [selectedFund, setSelectedFund] = useState({
    folio: "",
    key: new Date().getTime(),
    nav: "",
    units: "",
    isFavorite: false,
    // ...mockFundDetails,
    ...fundDetails,
  });
  const dispatch = useDispatch();

  const openModal = () => {
    const modal = document.getElementById("add-fund-modal");
    modal.showModal();
  };

  const closeModal = () => {
    const modal = document.getElementById("add-fund-modal");
    modal.close();
    setSelectedFund(null); // Reset selection on close
    setFundCode(null);
  };

  const handleContinue = () => {
    if (!selectedFund) return;
    console.log("Saving:", selectedFund);
    setFundCode(selectedFund.code);
  };

  const saveFund = () => {
    dispatch(addOrUpdateFund(selectedFund));
    closeModal();
  };

  return (
    <>
      <button
        className="btn btn-circle btn-primary fixed bottom-20 right-4 shadow-lg z-50"
        onClick={openModal}
      >
        <Plus size={24} color="white" />
      </button>

      <dialog id="add-fund-modal" className="modal">
        <div className="modal-box h-120">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg truncate w-3/4">
              {selectedFund?.name ?? "Add New fund..."}
            </h3>
            <button
              onClick={closeModal}
              className="btn btn-sm btn-circle btn-ghost"
            >
              <X size={20} />
            </button>
          </div>

          <div className="modal-body py-4">
            {fundCode && (
              <>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Folio Number</span>
                    <span className="label-text-alt text-gray-400">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12345678/90"
                    className="input input-bordered w-full input-sm"
                    value={selectedFund.folio}
                    onChange={(e) =>
                      setSelectedFund({
                        ...selectedFund,
                        folio: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex gap-3  mt-4">
                  <div className="form-control w-1/2">
                    <label className="label">
                      <span className="label-text">Invested Amount(₹)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="input input-bordered w-full input-sm"
                      value={selectedFund.costValue}
                      onChange={(e) =>
                        setSelectedFund({
                          ...selectedFund,
                          costValue: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-control w-1/2">
                    <label className="label">
                      <span className="label-text">Units</span>
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="input input-bordered w-full input-sm"
                      value={selectedFund.nav}
                      onChange={(e) =>
                        setSelectedFund({
                          ...selectedFund,
                          nav: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-control mt-4">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-secondary toggle-sm"
                      checked={selectedFund.isFavorite}
                      onChange={(e) =>
                        setSelectedFund({
                          ...selectedFund,
                          isFavorite: e.target.checked,
                        })
                      }
                    />
                    <span className="label-text font-medium flex items-center gap-2">
                      Add to Watchlist{" "}
                      <Heart
                        size={18}
                        className={
                          selectedFund.isFavorite
                            ? "fill-red-500 text-red-500"
                            : ""
                        }
                      />
                    </span>
                  </label>
                </div>

                <div className="modal-action">
                  <button className="btn" onClick={closeModal}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={saveFund}>
                    Save Transaction
                  </button>
                </div>
              </>
            )}

            {!fundCode && (
              <div className="p-4">
                <FundSelect onSelect={setSelectedFund} />
                {selectedFund.name &&
                  selectedFund.isin &&
                  selectedFund.code && (
                    <div className="mt-6 p-4 bg-base-200 rounded-xl">
                      <p className="text-sm opacity-70">Selected Fund:</p>
                      <p className="font-bold">{selectedFund.name}</p>
                      <p className="text-xs mt-1">ISIN: {selectedFund.isin}</p>
                      <p className="text-xs mt-1">
                        Fund Code: {selectedFund.code}
                      </p>

                      <button
                        onClick={handleContinue}
                        className="btn btn-primary w-full mt-4"
                      >
                        Continue
                      </button>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
};

export default AddFund;
