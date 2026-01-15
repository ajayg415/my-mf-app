import { NavLink } from "react-router";
import { LayoutDashboard, PieChart, UserStar, Settings } from "lucide-react";

const BottomNav = () => {
    return (
        <div className="dock">
            <NavLink
                to="/"
                className={({ isActive }) => isActive ? "dock-active dock-item" : "dock-item"}
            >
                <LayoutDashboard size={20} />
                <span className="dock-label">Home</span>
            </NavLink>

            <NavLink 
                to="/holdings"
                className={({ isActive }) => isActive ? "dock-active dock-item" : "dock-item"}
            >
                <PieChart size={20} />
                <span className="dock-label">Inbox</span>
            </NavLink>


            <NavLink 
                to="/favourite"
                className={({ isActive }) => isActive ? "dock-active dock-item" : "dock-item"}
            >
                <UserStar size={20} />
                <span className="dock-label">Favourite</span>
            </NavLink>


            <NavLink 
                className={({ isActive }) => isActive ? "dock-active dock-item" : "dock-item"}
                to="/settings"
            >
                <Settings size={20} />
                <span className="dock-label">Settings</span>
            </NavLink>
        </div>
        // fixed bottom-0 z-50 ensures it stays on top of content
    );
};

export default BottomNav;
