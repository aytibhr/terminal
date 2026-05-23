# 🎮 Terminal 8 - Premium Gaming Hub Administration Console

Terminal 8 is a state-of-the-art, high-performance, dark cyber-neon themed SaaS administration platform custom-designed for modern gaming lounges. It handles real-time station allotments, dynamic checkout pricing, snack/refreshment active order integrations, user membership credit ledgers, and lifetime gamer analytics.

---

## 🚀 Key Modules & Custom Features

### 1. Dynamic Command Center & Station Grid
* **Live Station Tiles**: Displays live countdown timers, station status (Active, Occupied, Maintenance), and active session time bounds (with smooth 15-minute low-time glowing alerts).
* **Calibration Setup Time Allotment**: Supports setting a custom, non-billed setup duration (e.g. 4 minutes) during walk-in or membership allotments, separate from charged playtime.
* **Console Support**: Standardized station categories including **PS5 Single**, **PS5 Multiplayer**, **Car Simulators** (priced at ₹250/hr), and **Billiards**.
* **Custom Station Coins Rates**: Displays active `coins/hr` rates on all console pages, and lets admins configure custom coin rates per hour (e.g. lounges vs controller setups) in the stations dashboard.
* **Quick Extend (+15 Mins)**: One-click visual confirm modal to instantly extend any occupied station session.

### 2. Consolidated Snack & Addon Inventory (`/addons`)
* **Addon Catalog**: Premium dark cyber-neon catalog management panel enabling complete CRUD operations (Create, Read, Update, Delete) on custom snacks, drinks, and ice creams.
* **Active Station Addon Drawer**: Glowing cyan drink button on active occupied cards, allowing operators to order new snacks with customized quantities or remove active item orders in real-time.
* **Unified Checkout Integration**: All active session addons are dynamically fetched, itemized, and consolidated into the final checkout bill.

### 3. Smart Checkout & Flexible Billing
* **Idempotency Checkout Guard**: Implemented database-level validation to prevent rapid double-clicks from generating duplicate checkout transactions.
* **Flexible Cash Override**: Allows operators to manually modify the final total cash collected at checkout, introducing custom reductions or goodwill discounts.
* **VIP Member Dynamic Splits**: Automatically separates VIP station play deductions (charged dynamically in **T8 Coins** based on station coin rates) from snack/drink addon balances (settled strictly in cash).

### 4. Interactive Leaderboard Panel (`/leaderboard`)
* **Cyberpunk Standings**: Highly detailed competitive gamer standings showcasing rank, gamer tag, game title, console platform, rank tiers, and visual XP score boards.

### 5. Detailed Transaction Ledgers & Reports (`/reports`)
* **Interactive Addition Modal**: Introduced a glowing cyber-neon **Add** button to log standalone snack/addon transactions, generic business incomes, or office expenses directly to the financial sheets.
* **Product Drawer Cart Checkout**: Embeds a search filter and increment/decrement shopping cart drawer forStandalone product sales, updating ledger records dynamically.
* **Dynamic Report Popups**: Embedded a premium view (`Eye` icon button) trigger next to all entries in the Financial Ledger.
* **Interactive Breakdown sheet**: Displays precise calibration setup duration vs charged playtime, complete itemized order summaries for addons, auto-calculated expected billing vs final cash received, and a distinct glowing reduction/discount override indicator.
* **Dynamic Revenue Dashboard**: Automatically tracks **TOTAL INCOME**, **TOTAL EXPENSES**, and **NET PROFIT** (color-highlighted green/pink depending on margin status) updated in real-time by active date range pickers.

### 6. Identified Gamers Analytics Directory (`/gamers`)
* **Data Integrity & Analytics Accuracy**: Employs strict, multi-layer validation (ignoring anonymous placeholders like 'Walk-In', 'GUEST', 'N/A', or phone numbers without digits) to prevent guest traffic or unauthenticated checkout sessions from corrupting authentic player stats.
* **Unique Gamer Profiles**: Joins and aggregates completed sessions using validated phone numbers directly from checkout transactions, ensuring perfect profile tracking with zero data spillover.
* **Lifetime Metrics Card**: Computes and displays:
  * **Total Sessions**: Total count of completed lounge visits.
  * **Playtime Hours**: Cumulative play duration (formatted to 1 decimal place).
  * **Favourite Station**: The console/playground used most frequently.
  * **Favourite Refreshment**: The snack or drink ordered with the highest cumulative quantity.
* **Live Search & Sorting**: Supports fast query lookups (by name or phone number) and sorting toggles (by total sessions, playtime hours, or alphabetical gamer names).

### 7. Responsive Navigation & Mobile Support
* **Mobile Hamburger Navigation Dropdown**: Embedded a floating glowing hamburger trigger inside the sticky header on mobile viewports (`md:hidden`), revealing all routes dynamically (*Dashboard*, *Stations*, *Reports*, *Memberships*, *Addons*, *Leaderboard*, *Gamers*) to guarantee 100% route accessibility.

---

## 🛠️ Technical Stack & Tooling

* **Frontend Framework**: [Next.js 15 (App Router)](https://nextjs.org/) utilizing dynamic rendering and React Server Components.
* **Style System**: Vanilla [Tailwind CSS](https://tailwindcss.com/) with a curated cyber-neon design palette, high-glares, custom monospaced layout panels, and premium micro-animations.
* **Database Engine**: Live [Supabase PostgreSQL](https://supabase.com/) hosting real-time tables.
* **ORM Layer**: [Drizzle ORM](https://orm.drizzle.team/) mapping types, relational schemas, and handling transactions/aggregations.
* **State & Data Fetching**: [SWR](https://swr.vercel.app/) and Server Actions for lightweight dynamic updates.

---

## 📦 Getting Started

### 1. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/aytibhr/terminal.git
cd terminal
npm install
```

### 2. Environment Variables
Configure your live database connection inside a `.env` file at the project root:
```env
POSTGRES_URL="your-supabase-connection-string"
AUTH_SECRET="your-next-auth-secret"
```

### 3. Seed Database
Seed the database with default parameters and station settings:
```bash
npm run db:push
npm run db:seed
```

### 4. Running Development Server
Launch the local development environment:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3050) in your web browser.

---

## 🚀 Production Deployment
Build the optimized production bundles:
```bash
npm run build
npm start
```
