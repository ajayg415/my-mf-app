import { useEffect } from 'react';
import { Routes, Route } from 'react-router';
import { useDispatch } from "react-redux";

import AppLayout from './components/AppLayout.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import Holdings from './components/holdings/Holdings.jsx';
import Favourite from './components/favourite/Favourite.jsx';
import Settings from './components/settings/Settings.jsx';

import { setUserData } from './store/mf/mfSlice.js';
import { fetchUserData } from './utils/storage.js';
import { getLatestNav } from './utils/api.js';

export default function App() {
	const dispatch = useDispatch();

	useEffect(() => {
		const userData = fetchUserData();
		if (userData) {
			dispatch(setUserData(userData));
			userData.funds.forEach(fund => {
				getLatestNav(fund.code);
			})
		}
	}, []);

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
