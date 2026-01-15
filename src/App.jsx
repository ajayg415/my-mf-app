import React from 'react';
import { Routes, Route } from 'react-router';

import AppLayout from './components/AppLayout.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import Holdings from './components/holdings/Holdings.jsx';
import Favourite from './components/favourite/Favourite.jsx';
import Settings from './components/settings/Settings.jsx';

export default function App() {
	return (
		<Routes>
			<Route element={<AppLayout />}>
				<Route path="/" element={<Dashboard />} />
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/holdings" element={<Holdings />} />
				<Route path="/favourite" element={<Favourite />} />
				<Route path="/settings" element={<Settings />} />
			</Route>
		</Routes>
	);
}
