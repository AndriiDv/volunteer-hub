# Volunteer Hub — Frontend

Welcome to the **Volunteer Hub** frontend repository workspace!

This directory is reserved for the modern Single Page Application (SPA) built with **React**, **Vite**, and **Tailwind CSS**.

---

## 🚀 Quick Setup Instructions for Teammates

### 1. Initialize the React + Vite App
From the root of the project, initialize the Vite template inside this directory:
```bash
cd frontend
npm create vite@latest . -- --template react-ts
# or for JavaScript: npm create vite@latest . -- --template react
npm install
```

### 2. Install & Configure Tailwind CSS
Install Tailwind CSS and its peer dependencies:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0057B7", // Ukrainian Blue
          yellow: "#FFDD00", // Ukrainian Gold
          dark: "#0F172A",
          card: "#1E293B",
        }
      }
    },
  },
  plugins: [],
}
```

Add the Tailwind directives to `./src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. Recommended Additional Packages
```bash
npm install lucide-react axios clsx tailwind-merge react-router-dom
```

---

## 🔌 Connecting to the Backend API

All backend endpoints are prefixed with `/api`.
Refer to [`../API_CONTRACT.md`](../API_CONTRACT.md) for full endpoint specifications, request payloads, and response models.

### Vite Proxy Configuration (Local Development)
In `vite.config.ts`, configure the local dev server proxy so all `/api` requests are seamlessly forwarded to the FastAPI backend running on port 8000:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/docs': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/openapi.json': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

### API Client Setup (Axios Example)
Create `src/api/client.ts`:
```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT Bearer Token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🎨 UI Pages & Suggested Component Tree

1. **Navbar**: Brand logo, Navigation links (Needs, Leaderboard, My Jars), Auth controls (Login / Register / Profile).
2. **Landing Page (`/`)**:
   - Hero section with live counter of verified funds raised and military units supported.
   - Quick filters (`category`, `urgency`, `status`).
   - Cards showcasing open military needs with progress bars for linked friendly jars.
3. **Need Details Page (`/needs/:id`)**:
   - Military unit verified badge, equipment specifications, target amount vs raised amount.
   - List of linked friendly jars (Monobank / PrivatBank buttons).
   - "Claim a Slot / Open Friendly Jar" modal for authenticated volunteers.
4. **Volunteer Dashboard (`/dashboard`)**:
   - Active jars created by the logged-in volunteer.
   - Edit current raised amount and jar link.
   - Upload receipt proof screenshot modal (POST `/api/fundraisers/:id/proof`).
   - Volunteer points & leaderboard rank badge.
5. **Military / Admin Verification Dashboard (`/verify`)**:
   - Pending fundraisers awaiting receipt confirmation.
   - One-click verification (`POST /api/fundraisers/:id/verify`) that awards volunteer points and auto-completes target needs.
   - Admin military unit verification queue (`POST /api/admin/users/:id/verify`).
6. **Leaderboard (`/leaderboard`)**:
   - Hall of fame ranking top volunteers by total verified amount and points.
