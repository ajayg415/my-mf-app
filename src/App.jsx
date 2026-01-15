import { useEffect } from 'react';
import { Routes, Route } from 'react-router';
import { useDispatch } from "react-redux";

import AppLayout from './components/AppLayout.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import Holdings from './components/holdings/Holdings.jsx';
import Favourite from './components/favourite/Favourite.jsx';
import Settings from './components/settings/Settings.jsx';

import { setData } from './store/mf/mfSlice.js';

export default function App() {
	const dispatch = useDispatch();

	useEffect(() => {
		console.log('setting data from App.jsx');
		dispatch(setData('Ajay Gangisetti1'));
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
