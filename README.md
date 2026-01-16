# 📈 MyMF Portfolio (Local-First Wealth Tracker)

A privacy-focused, local-first personal finance application to track Mutual Fund investments. Built with **React**, **Redux Toolkit**, and **DaisyUI**, this app runs entirely in the browser, storing data on your device without sending sensitive financial details to a cloud server.

## 🚀 Features

* **Local-First Architecture:** All portfolio data is stored locally (currently `localStorage`), ensuring total privacy.
* **Real-time NAV Updates:** Fetches the latest Mutual Fund prices via public APIs (MFAPI.in).
* **Smart Search:** Find funds by Name or ISIN using a fuzzy search algorithm backed by Firestore.
* **Interactive Dashboard:** * View Total Investment, Current Value, and Absolute Profit/Loss.
  * Visual indicators for Profit (Green) and Loss (Red).
* **Data Management:**
  * **Backup:** Export your portfolio to a `.json` file.
  * **Restore:** Import a backup file to restore your data on any device.
  * **Wipe:** One-click secure data wipe.
* **Responsive Design:** Fully responsive "App Shell" layout (Sticky Header & Bottom Dock) optimized for Mobile and Desktop.

## 🛠️ Tech Stack

* **Frontend:** React (Vite), React Router v6
* **State Management:** Redux Toolkit
* **Styling:** Tailwind CSS, DaisyUI (Components), Lucide React (Icons)
* **Data Source:** MFAPI.in (NAV Data), Firebase Firestore (Fund Meta-data & Search)
* **Storage:** LocalStorage (Migration to IndexedDB planned)

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone [https://github.com/yourusername/mymf-portfolio.git](https://github.com/yourusername/mymf-portfolio.git)
   cd mymf-portfolio
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment** Create a `.env` file in the root directory and add your Firebase config keys:
   ```bash
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
  ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
  ```
