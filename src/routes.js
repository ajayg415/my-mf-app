import { createBrowserRouter } from "react-router";

import Dashboard from "./dashboard/Dashboard.jsx";
import Settings from "./settings/Settings.jsx";
import Sips from "./sips/Sips.jsx";

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
        path: '/sips',
        Component: Sips
    },
    {
        path: '/settings',
        Component: Settings
    }
]);