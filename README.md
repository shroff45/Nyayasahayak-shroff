# ⚖️ NyayaSahayak Hybrid v2.0
> **Operationalizing the Bharatiya Nagarik Suraksha Sanhita (BNSS) & Bharatiya Sakshya Adhiniyam (BSA) through AI & Blockchain.**

![Version](https://img.shields.io/badge/Version-2.0.0_Hybrid-blue?style=for-the-badge)
![Compliance](https://img.shields.io/badge/Compliance-BNSS_173_|_BSA_63-success?style=for-the-badge)
![Tech](https://img.shields.io/badge/Stack-React_|_Leaflet_|_Crypto-indigo?style=for-the-badge)

## 📖 Overview
**NyayaSahayak** is an AI-first judicial case management system designed to solve the "Compliance Crisis" in the Indian legal system. Unlike traditional digitization tools, it enforces the strict timelines and evidence integrity standards mandated by India's new criminal laws (2023).

### 🚀 Key Features

| Feature | Persona | Legal Mandate | Implementation |
| :--- | :--- | :--- | :--- |
| **NyayaPath Timer** | 👤 Citizen | **BNSS Sec 173(2)** | Live countdown for 3-day e-FIR signature expiry. |
| **Evidence Locker** | 👮 Police | **BSA Sec 63** | SHA-256 Hashing + Blockchain Anchoring for admissibility. |
| **Patrol Map** | 👮 Police | **BNSS Sec 176(3)** | Geospatial tracking for mandatory forensic visits. |
| **Hash Verifier** | ⚖️ Judge | **Evidence Integrity** | Zero-Knowledge Proof to detect tampering vs. Ledger. |
| **Smart Board** | ⚖️ Judge | **BNSS Sec 193** | Auto-flagging investigations exceeding 60 days. |

## 🏗️ Architecture
The system relies on a **Trust Triangle**:
1.  **Ingest:** Police upload evidence → Hash generated immediately.
2.  **Anchor:** Hash pushed to **Akhand Ledger** (Mock Blockchain).
3.  **Verify:** Judge re-hashes file → Compares with Ledger.

```
src/
├── core/
│   ├── services/      # evidenceHasher.ts, akhandLedger.ts
│   └── auth/          # Authentication Context
├── personas/
│   ├── citizen/       # CitizenHome.tsx, CaseTrack.tsx
│   ├── police/        # EvidenceLocker.tsx, PatrolMap.tsx
│   └── judge/         # JudgeBoard.tsx, HashVerifier.tsx
└── App.tsx            # Main Routing
```

## 🛠️ Tech Stack
* **Frontend:** React 18, TypeScript, TailwindCSS
* **Maps:** Leaflet.js (CDN-based, no API key required)
* **Security:** `crypto-js` for Client-side SHA-256
* **State:** React Context API + LocalStorage (Persistence)

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/nyayasahayak-hybrid.git
cd nyayasahayak-hybrid

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open `http://localhost:5173` and select a persona:
* **Citizen Portal:** `/citizen/home`
* **Police Portal:** `/police/dashboard`
* **Judge Portal:** `/judge/board`

## 📜 License
This project is open-source under the MIT License. Designed for **OpenAI NextWave Hackathon 2024**.

---

**Built with ❤️ for Digital India**
