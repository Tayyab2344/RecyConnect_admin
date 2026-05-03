<div align="center">
  <h1>🛡️ RecyConnect Admin Portal</h1>
  <p><strong>The centralized command center for monitoring and managing the RecyConnect ecosystem.</strong></p>

  [![Next.js Version](https://img.shields.io/badge/Next.js-16+-black?logo=next.js)](https://nextjs.org/)
  [![React Version](https://img.shields.io/badge/React-19+-61DAFB?logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-ISC-green.svg)](#)
</div>

---

## 📖 Overview

The **RecyConnect Admin Portal** is a high-performance, web-based dashboard designed exclusively for system administrators. Built using the latest Next.js App Router paradigm, it provides a comprehensive bird's-eye view of the entire recycling marketplace, empowering admins to moderate content, manage users, and track platform metrics in real-time.

---

## ✨ Key Features

### 📊 Comprehensive Dashboard
- **System Metrics:** Real-time statistics on total users, active listings, and completed orders.
- **Financial Overviews:** Track overall transaction volumes and platform health.

### 👥 User Moderation
- **User Directory:** Search, filter, and view detailed profiles for Individuals, Warehouses, and Companies.
- **Access Control:** Suspend or ban malicious accounts to maintain platform integrity.
- **KYC Verification:** Review and approve enterprise and warehouse applications.

### 📦 Marketplace Management
- **Listing Moderation:** Monitor active material listings and flag inappropriate or fraudulent entries.
- **Order Tracking:** Oversee order lifecycles and payment statuses (Stripe & COD) across the platform to assist with dispute resolution.

### 📜 Activity Logging
- **Audit Trails:** Detailed logs of all significant actions taken within the platform by users and administrators.

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|------------|
| **Core Framework** | Next.js (App Router) |
| **UI Library** | React |
| **Language** | TypeScript |
| **Styling** | Vanilla CSS Modules (Flexbox/Grid layouts) |
| **Data Fetching** | Native Fetch API (Server/Client components) |
| **Authentication** | JWT via cookies (Communicates with Backend) |

---

## 🚀 Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- The **RecyConnect Backend** running locally or deployed.

### 1. Clone & Install
```bash
git clone <repository-url>
cd recyconnect-admin
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory to point to your backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
# Replace with your production backend URL for live environments
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the application. The page will hot-reload as you make edits.

---

## 🏗 Project Structure

```text
recyconnect-admin/
├── src/
│   ├── app/               # Next.js App Router (Pages, Layouts, API routes)
│   │   ├── (auth)/        # Login/Authentication screens
│   │   ├── dashboard/     # Main admin metric panels
│   │   ├── users/         # User moderation directory
│   │   ├── listings/      # Marketplace moderation
│   │   └── globals.css    # Global styling tokens
│   ├── components/        # Reusable UI elements (Buttons, Tables, Modals)
│   ├── lib/               # Utility functions, fetch wrappers
│   └── types/             # TypeScript interface definitions
├── public/                # Static assets (Images, SVGs)
├── next.config.mjs        # Next.js compiler configuration
└── package.json           # Project dependencies
```

---

## 📦 Deployment (Vercel)

The Admin Portal is fully optimized for edge delivery via **Vercel**.

1. Connect your GitHub repository to Vercel.
2. Select the `recyconnect-admin` folder as your Root Directory.
3. In the Environment Variables section, add:
   - `NEXT_PUBLIC_API_URL` (Pointing to your deployed RecyConnect Backend URL).
4. Deploy! Vercel will automatically detect Next.js and apply the correct build settings (`npm run build`).

---

<div align="center">
  <p>Maintaining a clean ecosystem. 🌱</p>
</div>
