import { Outlet, useLocation } from "react-router";
import BottomNav from "./BottomNav";

const MainLayout = () => {
  const location = useLocation();

  const getPageTitle = (path) => {
    switch (path) {
      case "/": return "Dashboard";
      case "/holdings": return "My Holdings";
      case "/settings": return "Settings";
      case "/favourite": return "Watchlist";
      default: return "My Portfolio";
    }
  };

  return (
    // 1. Parent: h-screen (Fixed height), flex-col, overflow-hidden (Stops browser scroll)
    <section className="w-full h-screen flex flex-col bg-base-200 overflow-hidden">
      
      {/* 2. Header: 'shrink-0' ensures it never collapses. removed 'fixed' */}
      <div className="shrink-0 z-50 bg-base-100 shadow-sm h-12 flex items-center px-4 transition-all duration-200">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-primary capitalize">
            {getPageTitle(location.pathname)}
          </h1>
        </div>
      </div>

      {/* 3. Content: 'flex-1' fills remaining space. 'overflow-y-auto' adds internal scrollbar */}
      {/* Removed pt-20/pb-24 because items stack naturally now */}
      <div className="flex-1 overflow-y-auto p-4 container mx-auto">
        <Outlet />
      </div>

      {/* 4. Bottom Nav: 'shrink-0' keeps it fixed at the bottom of the flex column */}
      <div className="shrink-0">
        <BottomNav />
      </div>
      
    </section>
  );
};

export default MainLayout;