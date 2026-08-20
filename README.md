# 🩸 PulseLink — Emergency Blood Response Platform



PulseLink is India's first real-time emergency blood dispatch system. Unlike existing blood bank directories, PulseLink acts like a **911 dispatch center for blood** — instantly coordinating donors, hospitals, and blood banks the moment an emergency is created.

🔗 **Live Demo:** [pluse-link.vercel.app](https://pluse-link.vercel.app)  
📦 **Backend:** [pluselink.onrender.com](https://pluselink.onrender.com)  


---

## 🚨 The Problem

- Every 2 seconds, someone in India needs blood
- 3 million units of blood shortage annually in India
- Families spend **2–3 hours** calling people manually
- Existing apps are just **static directories** — outdated, uncoordinated, slow
- People die while the coordination happens

---

## ✅ The Solution

PulseLink is not a blood bank management system.  
It is a **real-time emergency coordination platform**.

One request → instant geospatial donor matching → live alerts → real-time tracking → fulfilled in minutes.

---

## 🎬 Demo Scenario

A patient in Pune urgently needs **O- blood**.

1. Requester submits emergency form
2. Matching engine finds nearest compatible donors in milliseconds
3. Donors receive **live alerts** instantly via Socket.IO
4. Donor accepts → hospital dashboard updates in real time
5. Live map shows donor location and ETA
6. Request marked fulfilled — all parties notified

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Donor | aarav@demo.com | password123 |
| Requester | requester@demo.com | password123 |
| Hospital | hospital@demo.com | password123 |

---

## ✨ Features

- 🚨 **Emergency Blood Request** — create urgent requests with blood group, units, location, urgency level
- 🧠 **Smart Donor Matching** — geospatial scoring by proximity, availability, verification, and response history
- ⚡ **Real-Time Alerts** — Socket.IO powered instant donor notifications
- 🗺️ **Live Map** — Leaflet.js map with pulsing emergency markers and donor pins
- 🏥 **Blood Bank Inventory** — real-time stock tracking across nearby banks
- 📊 **Analytics Dashboard** — response times, fulfillment rates, blood group demand
- 🔔 **Browser Push Notifications** — alerts even when tab is in background
- 🏆 **Donor Leaderboard** — gamification with points and badges
- 🔄 **Auto-Escalation** — expands search radius automatically if no donor responds
- 📋 **Donation History** — full donor history with certificates
- 🩸 **Blood Compatibility Engine** — hardcoded compatibility rules for all 8 blood groups

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| Real-Time | Socket.IO |
| Maps | Leaflet.js + OpenStreetMap |
| Auth | JWT (httpOnly cookies) |
| Notifications | Browser Push API + Socket.IO |
| Hosting | Vercel (frontend) + Render (backend) |

---

## 🏗️ Architecture

```
Frontend (Vercel)          Backend (Render)          Database (Atlas)
─────────────────    HTTP/WebSocket    ──────────    ───────────────
Next.js 14          ←────────────────→  Express.js  ←──→  MongoDB
React Query                             Socket.IO          Users
Leaflet Maps                            JWT Auth           EmergencyRequests
Socket.IO Client                        Matching Engine    BloodBanks
```

---

## 🧬 Blood Compatibility Engine

| Recipient | Compatible Donors |
|-----------|------------------|
| O- | O- |
| O+ | O-, O+ |
| A- | O-, A- |
| A+ | O-, O+, A-, A+ |
| B- | O-, B- |
| B+ | O-, O+, B-, B+ |
| AB- | O-, A-, B-, AB- |
| AB+ | All groups (Universal Recipient) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or use in-memory for demo)

### Clone the repo
```bash
git clone https://github.com/sahilraut191685/PluseLink.git
cd PluseLink
```

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev
```

### Environment Variables

**Backend `.env`:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=http://localhost:3000
SEED_DB=true
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 📁 Project Structure

```
PluseLink/
├── backend/
│   ├── src/
│   │   ├── models/          # User, EmergencyRequest, BloodBank
│   │   ├── routes/          # auth, emergency, donor, banks, users
│   │   ├── services/        # matchingEngine, bloodCompatibility
│   │   ├── socket/          # Socket.IO event handlers
│   │   ├── middleware/      # auth, validate, errorHandler
│   │   ├── seed/            # Mock data seeder
│   │   └── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/             # Next.js App Router pages
    │   ├── components/      # BloodGroupBadge, LiveMap, DonorCard...
    │   ├── hooks/           # useSocket, useAuth
    │   └── lib/             # api, socket, auth helpers
    └── package.json
```

---

## 🗺️ Pages

| Page | Route | Role |
|------|-------|------|
| Landing | / | Public |
| Emergency Form | /emergency/new | Requester |
| Blood Banks Map | /banks/nearby | Public |
| Donor Dashboard | /donor/dashboard | Donor |
| Donor Alert | /donor/alert/[id] | Donor |
| Request Tracking | /request/track/[id] | Requester |
| Hospital Dashboard | /hospital/dashboard | Hospital |
| Inventory Management | /hospital/inventory | Hospital |
| Analytics | /admin/dashboard | Admin |
| Leaderboard | /leaderboard | Public |

---

## 📈 Impact

- ⏱️ Response time: **2–3 hours → under 2 minutes**
- 🌍 Works across any Indian city
- 📡 Zero manual calling required
- 🔄 Scalable to nationwide donor network

---

## 🔮 Future Scope

- Government hospital API integration
- Ambulance coordination system
- AI-based blood demand prediction
- Rare blood group rapid response network
- WhatsApp / SMS real notifications
- Mobile app (React Native)

---

## 👨‍💻 Built With

- [Next.js](https://nextjs.org)
- [Express.js](https://expressjs.com)
- [MongoDB Atlas](https://mongodb.com/atlas)
- [Socket.IO](https://socket.io)
- [Leaflet.js](https://leafletjs.com)
- [Tailwind CSS](https://tailwindcss.com)

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---


