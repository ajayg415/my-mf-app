import { Plus } from "lucide-react";
import { useState } from "react";

import FundSelect from "./FundSelect";

const AddFund = () => {
  const [selectedFund, setSelectedFund] = useState(null);

  const openModal = () => {
    const modal = document.getElementById("add-fund-modal");
    modal.showModal();
  };

  const handleSave = () => {
    if (!selectedFund) return;

    // Save to LocalStorage logic here...
    console.log("Saving:", selectedFund);
    alert(`Saved ${selectedFund.name}`);
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
        <div className="modal-box">
          <h3 className="font-bold text-lg">Fund Selector!</h3>

          <div className="modal-body py-4">
            <div className="p-4">
              <h2 className="text-2xl font-bold mb-6">Add Holding</h2>

              {/* The Magic Dropdown */}
              <FundSelect onSelect={setSelectedFund} />

              {/* Show details only after selection */}
              {selectedFund && (
                <div className="mt-6 p-4 bg-base-200 rounded-xl">
                  <p className="text-sm opacity-70">Selected Fund:</p>
                  <p className="font-bold text-lg">{selectedFund.name}</p>
                  <p className="text-xs mt-1">ISIN: {selectedFund.isin}</p>

                  <button
                    onClick={handleSave}
                    className="btn btn-primary w-full mt-4"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default AddFund;
