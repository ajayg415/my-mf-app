import { useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  wipeUserData,
  setUserData,
  showToast,
} from "../../store/mf/mfSlice.js";
import { ChevronRight, User } from "lucide-react";

import { isValidData, formatFundData } from "../../utils/fundCompution.js";
import { fetchFundDetails } from "../../utils/api.js";

const Settings = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const { name } = useSelector((state) => state.mf.userData);
  // funds.map((f) => ({
  //   costValue: f.costValue,
  //   folio: f.folio,
  //   isFavorite: false,
  //   isin: f.isin,
  //   name: f.amcName,
  //   schemeName: f.amcName,
  //   units: f.closingBalance,
  //   schemeType: f.schemeType,
  //   schemeOption: f.schemeOption,
  //   sipAllow: f.sipAllow,
  // }));

  // 1. Backup Logic
  const handleBackup = () => {
    const data = localStorage.getItem("userData");
    if (!data) {
      alert("No data to backup!");
      return;
    }
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `my-mf-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Restore Logic
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (!json) {
          handleShowToast("Invalid backup file", "error");
          return;
        }
        if (!isValidData(json.funds)) {
          handleShowToast("Invalid data in backup file", "error");
          return;
        }

        const formattedData = await formatFundData(json.funds);
        await dispatch(setUserData({ name: json.name, funds: formattedData }));
        await handleShowToast("Data restored successfully!", "success");
        formattedData.forEach((fund) => {
          // Fetch latest NAV for each fund
          fetchFundDetails(fund.code);
        });
      } catch (error) {
        alert("Failed to restore: " + error.message);
      }
    };
    reader.readAsText(file);
  };

  // 3. Wipe Logic (New)
  const handleWipe = () => {
    document.getElementById("wipe_confirm").showModal();
  };

  const closeModal = () => {
    document.getElementById("wipe_confirm").close();
  };

  const confirmWipe = () => {
    dispatch(wipeUserData());
    closeModal();
    dispatch(
      showToast({
        message: "All user data wiped successfully!",
        type: "success",
      }),
    );
  };

  const handleShowToast = (message, type) => {
    dispatch(showToast({ message, type }));
  };

  return (
    <>
      <div className="settings-section">
        <div className="space-y-4">
          {/* 1. Profile Card */}
          <div className="text-white bg-gray-800 rounded-2xl p-4 flex items-center justify-between active:scale-95 transition-transform cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{name}</h3>
                <p className="text-gray-400 text-sm">Profile</p>
              </div>
            </div>
            <ChevronRight className="text-gray-500" />
          </div>

          {/* 2. Data Management Section */}
          <div className="bg-gray-800 rounded-2xl overflow-hidden">
            {/* Backup */}
            <button
              onClick={handleBackup}
              className="text-white w-full flex items-center justify-between p-4 border-b border-gray-700 active:bg-gray-750"
            >
              <div className="text-left">
                <h3 className="font-semibold text-base">Backup Data</h3>
                <p className="text-gray-400 text-xs mt-0.5">(Download JSON)</p>
              </div>
              <ChevronRight className="text-gray-500" />
            </button>

            {/* Restore */}
            <button
              onClick={() => fileInputRef.current.click()}
              className="text-white w-full flex items-center justify-between p-4 active:bg-gray-750"
            >
              <div className="text-left">
                <h3 className="font-semibold text-base">Restore Data</h3>
                <p className="text-gray-400 text-xs mt-0.5">(Upload JSON)</p>
              </div>
              <ChevronRight className="text-gray-500" />
            </button>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleFileChange}
            />
          </div>

          {/* Wipe Everything (Fixed Styling) */}
          <div className="bg-gray-800 rounded-2xl overflow-hidden">
            <button
              onClick={handleWipe}
              className="text-red-500 w-full flex items-center justify-start p-4 border-t border-gray-700 active:bg-gray-750 font-medium"
            >
              Wipe Everything
            </button>
          </div>
        </div>
      </div>

      <dialog id="wipe_confirm" className="modal">
        <div className="modal-box">
          <p className="py-4">
            Are you Sure to wipe the whole user data? You may consider taking a
            backup before proceeding.
          </p>
          <div className="modal-buttons flex justify-center gap-4">
            <button className="btn btn-soft btn-primary" onClick={confirmWipe}>
              Confirm
            </button>
            <button className="btn btn-soft btn-error" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default Settings;
