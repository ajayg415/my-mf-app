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

# 🗺️ Roadmap & Pending Tasks

We are actively working on v2.0. The following features are currently in development:

### 1. 🗄️ Robust Storage (IndexedDB)
* **Current:** Data is stored in `localStorage`, which has size limits (5MB) and is synchronous.
* **Plan:** Migrate to **IndexedDB** (using `idb` or `Dexie.js`) to handle larger datasets, improve performance, and ensure data persistence across browser sessions more reliably.

### 2. 🏗️ Architecture Revamp
* Refactor the current utility-heavy logic into **Custom React Hooks** (e.g., `useFundSearch`, `usePortfolioCalculations`) for better separation of concerns.
* Implement a cleaner Service Layer for API calls to decouple fetching logic from UI components.

### 3. 👆 Interactive Holdings View
* **Click-to-View:** Enable clicking on a Fund Card in the "Holdings" tab.
* **Details Screen:** Open a dedicated view showing:
  * Transaction History (SIPs/Lumpsums).
  * XIRR (Extended Internal Rate of Return) calculation.
  * Historical NAV Chart.

### 4. ⭐ Favorites & Watchlist
* Complete the "Favourites" tab logic.
* Allow users to "Star" funds they are tracking but haven't purchased yet.
* Show daily price movements for watchlisted funds.

### 5. ✏️ Edit Functionality
* Add an **"Edit Transaction"** feature to the fund card.
* Allow users to modify:
  * Purchase Date (crucial for accurate XIRR).
  * Units/NAV (in case of manual entry errors).
  * Folio Numbers.

### 6. 📊 Advanced Sorting & Filtering
* **Sort:** Add options to sort the Holdings list by *Current Value*, *Total Profit*, *Day Change*, or *Alphabetical Name*.
* **Filter:** Allow filtering funds by *Equity/Debt* category or specific *AMC* (Asset Management Company).

### 7. 📱 PWA & Smart Notifications
* **PWA Support:** Convert the app into a fully installable **Progressive Web App** (install on Home Screen).
* **Daily Alerts:** Enable local Push Notifications to trigger at 9:00 AM, alerting the user about the overall portfolio movement (Up/Down) based on the latest NAV data.

# 🤝 Contributing to MyMF Portfolio

First off, thanks for taking the time to contribute! We welcome contributions from the community to help make this local-first wealth tracker better for everyone.

## How Can I Contribute?

### 🐛 Reporting Bugs
This section guides you through submitting a bug report.
* **Use a clear and descriptive title** for the issue to identify the problem.
* **Describe the exact steps to reproduce the problem** in as much detail as possible.
* **Describe what you expected to happen**, and what actually happened.

### 🌟 Suggesting Enhancements
This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.
* **Use a clear and descriptive title** for the issue.
* **Provide a step-by-step description of the suggested enhancement** in as much detail as possible.
* **Explain why this enhancement would be useful** to most users.

### 💻 Pull Requests
The process is straightforward:

1.  **Fork** the repository on GitHub.
2.  **Clone** the project to your own machine.
3.  **Create a new branch** for your feature or fix.
    ```bash
    git checkout -b feature/AmazingFeature
    ```
4.  **Commit** your changes to your own branch.
    ```bash
    git commit -m 'Add some AmazingFeature'
    ```
5.  **Push** your work back up to your fork.
    ```bash
    git push origin feature/AmazingFeature
    ```
6.  **Submit a Pull Request** so that we can review your changes.

## 🎨 Coding Style
* Use **ES6+** syntax.
* Follow the existing component structure (`src/components`, `src/store`, `src/utils`).
* Ensure **DaisyUI** class names are used for styling where possible to maintain consistency.

## 🧪 Testing
* Please verify that the app builds without errors (`npm run build`) before submitting your PR.
* If you add new logic (like XIRR calculation), please add comments explaining the math.
