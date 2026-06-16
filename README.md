# Rahul Enterprise — Logistics & Cargo Platform

Full-stack web application with React frontend + Node.js/Express backend + MongoDB.

---

## 📁 Project Structure

```
rahul-enterprise/
├── backend/          # Node.js + Express + MongoDB API
│   ├── config/       # DB connection
│   ├── middleware/   # Auth middleware
│   ├── models/       # Mongoose models (User, Shipment, Quote, MISReport)
│   ├── routes/       # API routes
│   ├── server.js     # Main server file
│   ├── seed.js       # Database seeder
│   ├── .env          # Environment variables
│   └── package.json
└── frontend/         # React app
    ├── public/
    ├── src/
    │   ├── components/   # Navbar, Footer
    │   ├── context/      # Auth context
    │   ├── pages/        # Home, Login, Admin, Track
    │   └── utils/        # Axios API helper
    ├── .env
    └── package.json
```

---

## ⚙️ Prerequisites

- Node.js v18+ → https://nodejs.org
- MongoDB running locally → https://www.mongodb.com/try/download/community
- npm (comes with Node.js)

---

## 🚀 Quick Start

### Step 1 — Start MongoDB
Make sure MongoDB is running on `localhost:27017`.

**macOS (Homebrew):**
```bash
brew services start mongodb-community
```

**Windows:**
```
Start MongoDB from Services or run: mongod
```

**Linux:**
```bash
sudo systemctl start mongod
```

---

### Step 2 — Setup & Run Backend

```bash
cd backend
npm install
npm run seed        # Seeds DB with sample data + admin user
npm run dev         # Start backend in dev mode (nodemon)
```

Backend runs on: **http://localhost:5000**

---

### Step 3 — Setup & Run Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm start           # Start React dev server
```

Frontend runs on: **http://localhost:3000**

---

## 🔑 Demo Login Credentials

| Role   | Email                        | Password     |
|--------|------------------------------|--------------|
| Admin  | admin@rahulenterprise.in     | Admin@1234   |
| Client | client@geclient.com          | Client@1234  |

---

## 📦 Sample Tracking IDs

| Tracking ID    | Route              | Status              |
|----------------|--------------------|---------------------|
| RE-2026-0482   | Mumbai → Delhi     | Delivered           |
| RE-2026-0591   | Patna → Kolkata    | In Transit (GPS)    |
| RE-2026-0603   | Chennai → Hyderabad| Out for Delivery    |
| RE-2026-0608   | Patna → Delhi      | In Transit (GPS)    |

---

## 🌐 API Endpoints

### Public
- `GET  /api/health`                      — Health check
- `GET  /api/shipments/track/:trackingId` — Track shipment (public)
- `POST /api/quotes`                      — Submit quote request
- `POST /api/auth/register`               — Register
- `POST /api/auth/login`                  — Login

### Admin (Bearer token required)
- `GET  /api/shipments`                   — List all shipments
- `POST /api/shipments`                   — Create shipment
- `PUT  /api/shipments/:id/status`        — Update shipment status
- `GET  /api/shipments/stats/summary`     — Today's stats
- `GET  /api/quotes`                      — List all quote requests
- `PUT  /api/quotes/:id`                  — Update quote status
- `GET  /api/mis`                         — List MIS reports
- `GET  /api/mis/generate`                — Generate today's MIS report

---

## 🔧 Environment Variables

### backend/.env
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/rahul_enterprise
JWT_SECRET=rahul_enterprise_secret_key_2026
JWT_EXPIRE=30d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### frontend/.env
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🏗️ Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | React 18, React Router v6     |
| Backend   | Node.js, Express.js           |
| Database  | MongoDB, Mongoose             |
| Auth      | JWT (jsonwebtoken), bcryptjs  |
| HTTP      | Axios                         |
| Dev Tools | nodemon                       |

---

## 📋 Features

- ✅ Real-time shipment tracking (public)
- ✅ GPS tracking for all DV shipments
- ✅ Automated POD email simulation
- ✅ Daily MIS reports (generate on-demand)
- ✅ Quote/contact form with backend storage
- ✅ Admin dashboard (shipments, quotes, MIS)
- ✅ JWT authentication
- ✅ GE Standard: All 5 requirements covered

---

## 🐛 Troubleshooting

**MongoDB connection error:**
Make sure MongoDB is running. Check with: `mongosh` or `mongo`

**Port already in use:**
Kill process: `lsof -ti:5000 | xargs kill -9` (Mac/Linux)
Or change PORT in backend/.env

**CORS errors:**
Ensure `CLIENT_URL=http://localhost:3000` is set in backend/.env
