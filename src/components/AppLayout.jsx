import { Outlet } from "react-router"; // Note: v7 imports from 'react-router'
import BottomNav from "./BottomNav";

const MainLayout = () => {
  return (
    <section className="w-full min-h-screen box-border">
      <Outlet />
      <BottomNav />
    </section>
  );
};

export default MainLayout;
