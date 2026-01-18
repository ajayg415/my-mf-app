import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { hideToast } from "../store/mf/mfSlice";
import BottomNav from "./BottomNav";
import ReloadPrompt from "./ReloadPrompt";
import FundsSubHeader from "./FundsSubHeader.jsx";

const MainLayout = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const toast = useSelector((state) => state.mf.toast);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, dispatch]);

  const getPageTitle = (path) => {
    switch (path) {
      case "/":
        return "Dashboard";
      case "/holdings":
        return "My Holdings";
      case "/settings":
        return "Settings";
      case "/favourite":
        return "Watchlist";
      default:
        return "My Portfolio";
    }
  };

  const showFundsSubHeader = ["/holdings", "/favourite"].includes(
    location.pathname
  );

  return (
    // Parent: h-screen (Fixed height), flex-col, overflow-hidden
    <section className="w-full h-screen flex flex-col bg-base-200 overflow-hidden relative">
      {/* Header */}
      <div className="shrink-0 z-50 bg-base-100 shadow-sm h-12 flex items-center px-4 transition-all duration-200">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-primary capitalize">
            {getPageTitle(location.pathname)}
          </h1>
        </div>
      </div>
      {/* Funds Sub-Header */}
      {showFundsSubHeader && <FundsSubHeader />}

      {/* Main Content */}
      <div
        className="main-content flex-1 overflow-y-auto p-4 container mx-auto"
        style={{ maxHeight: "calc(100vh - 3rem - 64px)" }}
      >
        <Outlet />
      </div>

      {/* 2. PWA Update Prompt: Added here so it's visible on all screens */}
      <ReloadPrompt />

      {/* Bottom Nav */}
      <div className="shrink-0">
        <BottomNav />
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="toast toast-end" style={{ bottom: "75px" }}>
          <div className={`alert ${toast.toastClass}`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </section>
  );
};

export default MainLayout;
