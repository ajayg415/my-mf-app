import { createBrowserRouter } from "react-router";

import Dashboard from "./dashboard/Dashboard.jsx";
import Settings from "./settings/Settings.jsx";

export const router = createBrowserRouter([
    {
        path: '/',
        Component: Dashboard
    },
    {
        path: '/dashboard',
        Component: Dashboard
    },
    {
        path: '/settings',
        Component: Settings
    }
]);