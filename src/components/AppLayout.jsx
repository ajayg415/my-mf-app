import { Outlet } from "react-router"; // Note: v7 imports from 'react-router'
import BottomNav from "./BottomNav";

const MainLayout = () => {
  return (
    // 'pb-16' adds padding at bottom so content doesn't hide behind the fixed footer
    <div className="min-h-screen bg-base-100 pb-16">
      
      {/* <Outlet /> is a placeholder where child routes (Dashboard, Holdings, etc.) render */}
      <Outlet />

      {/* The Footer stays outside the Outlet, so it persists */}
      <BottomNav />
      
    </div>
  );
};

export default MainLayout;