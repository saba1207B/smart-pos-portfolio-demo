# 🧾 Smart POS & Billing System

<p align="center">
  <strong>Modern browser-based POS and billing portfolio demo built with React.</strong>
</p>

<p align="center">
  <a href="https://saba1207b.github.io/smart-pos-portfolio-demo/"><strong>🚀 LIVE DEMO</strong></a>
  &nbsp; • &nbsp;
  <a href="https://github.com/saba1207B/smart-pos-portfolio-demo"><strong>📂 SOURCE CODE</strong></a>
</p>

<p align="center">
  <a href="https://github.com/saba1207B/smart-pos-portfolio-demo/actions/workflows/deploy.yml"><img src="https://github.com/saba1207B/smart-pos-portfolio-demo/actions/workflows/deploy.yml/badge.svg" alt="GitHub Pages deployment"></a>
  <img src="https://img.shields.io/badge/React-19-blue" alt="React 19">
  <img src="https://img.shields.io/badge/Vite-8-purple" alt="Vite 8">
  <img src="https://img.shields.io/badge/Portfolio-Demo-orange" alt="Portfolio Demo">
</p>

> ⚠️ **PORTFOLIO DEMO — NO REAL TRANSACTIONS**
>
> This public version uses fictional data and is intended for portfolio demonstration only. It runs primarily in the browser and does not process real payments or connect to production business systems.

---

## 📌 What is this project?

**Smart POS & Billing System** is a retail Point-of-Sale web application created to demonstrate practical frontend engineering through a realistic billing workflow.

It includes product management, cart and billing logic, customer and staff management, barcode/camera scanning, receipt printing, transaction history, dashboard analytics, demo QR payments, and a separate customer-facing display.

The public repository intentionally excludes private production systems, databases, credentials, real customer information, and production payment integrations.

## 🚀 Live Demo

### 👉 [OPEN THE SMART POS LIVE DEMO](https://saba1207b.github.io/smart-pos-portfolio-demo/)

**Recommended:** open the demo on a **laptop or desktop PC** for the best layout and resolution.

---

## 👨‍💻 What I Built

This project demonstrates my ability to design and implement:

- React component-based application architecture
- POS and retail billing workflows
- Customer and staff management
- Product/catalog management
- Cart, discount, tax, and total calculations
- Customer-facing display functionality
- Two-tab operator/customer workflow
- Browser-based barcode and camera scanning
- QR-code generation
- Receipt preview and printing
- Transaction history and analytics
- Browser-side data persistence
- Responsive UI behavior
- Automated GitHub Pages deployment
- Application testing and static analysis

---

## 🖥️ Two-Tab POS Architecture

A key feature of this portfolio demo is the ability to use **two browser tabs/windows at the same time**:

| Interface | Purpose |
|---|---|
| 🧑‍💼 **Admin / Bill Counter** | Cashier/operator interface for products, cart, billing, checkout, management and POS operations |
| 🧑‍💻 **Customer Display** | Customer-facing view showing billing information, totals and demo payment QR information |

The application supports a dedicated customer-display mode using the `?customer-display` URL parameter. This allows the same web application to present a separate customer-facing interface while the normal application remains available for the bill counter.

### Suggested demonstration setup

```text
Laptop / PC — Browser Window 1
        │
        └── Admin / Bill Counter
                 │
                 │  POS workflow
                 ▼
        Customer-facing view
                 │
Laptop / PC — Browser Window 2
        └── Customer Display
```

> 💡 For a realistic demonstration, open the live application in two browser tabs/windows and use one as the bill counter and the other as the customer display.

---

## ✨ Key Features

### 🛒 POS Billing

- Product search and categories
- Add/remove products
- Quantity controls
- Multiple billing sessions
- Subtotal and total calculation
- Discount handling
- GST/tax calculation
- Customer selection
- Checkout workflow

### 📦 Catalog & Management

- Product catalog management
- Fixed and loose-product workflows
- Product editing and deletion
- Customer management
- Staff management
- Store settings

### 📷 Barcode & Camera Scanning

- Barcode input support
- Browser camera scanning
- Compatible-device support
- Scanner permission handling

### 🖥️ Customer Display

- Customer-facing bill information
- Cart and total presentation
- Demo payment QR
- Separate customer-display mode
- Designed for two-screen/two-tab POS demonstrations

### 🧾 Receipts & Printing

- Receipt preview
- Printable receipt layout
- Browser printing
- Historical receipt viewing/reprinting workflow

### 📊 Dashboard & Analytics

- Sales summaries
- Transaction history
- Search and date filters
- Product/sales insights
- Demo statistics

### 💾 Browser Persistence

The portfolio version uses **LocalStorage** for demo persistence. This allows visitors to interact with the application without a production backend or external database.

### 🌙 UI Features

- Light/dark theme support
- Responsive interface
- Browser-based interactions
- Multiple POS sessions

---

## 🧠 Technical Highlights

The source code demonstrates several practical frontend techniques:

- **React 19** for component architecture and state-driven UI
- **Vite** for development and production builds
- **LocalStorage** for browser-side persistence
- **React hooks** including `useState`, `useEffect`, `useMemo`, `useRef`, and `useCallback`
- **Browser Storage Events** for cross-window state such as theme changes
- **Camera APIs** through `html5-qrcode`
- **QR generation** through `qrcode.react`
- **PeerJS** dependency for browser peer communication capability
- **Vitest** for automated tests
- **Oxlint** for static code analysis
- **GitHub Actions** for automated deployment
- **GitHub Pages** for public hosting

---

## 🧩 Project Challenges & Solutions

### Challenge 1 — Separate bill-counter and customer interfaces

**Solution:** The application provides a dedicated customer-display mode while retaining the normal POS interface, allowing the same web application to support separate operator and customer-facing browser windows.

### Challenge 2 — Persistence without a production backend

**Solution:** Demo catalog, customers, staff, settings and transaction state are persisted in browser storage so visitors can explore the workflow without a server-side database.

### Challenge 3 — Barcode input and camera scanning

**Solution:** The application supports barcode input as well as browser-based camera scanning on compatible devices.

### Challenge 4 — Receipt and POS workflow demonstration

**Solution:** Billing calculations, checkout, receipt preview, printing and transaction history are represented as an integrated browser-based workflow.

### Challenge 5 — Public portfolio deployment

**Solution:** The project is built with Vite and deployed automatically to GitHub Pages using GitHub Actions.

---

## 📸 Application Preview

The repository is intended to showcase the **actual running application** through the live demo above.

For the strongest visual presentation, the recommended portfolio screenshots are:

1. **Admin / Bill Counter interface**
2. **Customer Display interface**
3. **Billing / Checkout screen**
4. **Dashboard / Analytics screen**
5. **Two-window customer + bill-counter setup**

> 📌 **Portfolio note:** Actual application screenshots should be added to the repository's `docs/images/` folder when available. They should show the real application UI rather than generated mockups.

---

## 🔐 Demo Login Credentials

These are intentionally public **demo-only** credentials:

| Role | Password |
|---|---|
| **Admin** | `1234` |
| **Cashier** | `0000` |

> ⚠️ These credentials are not production credentials and should never be reused for a real system.

---

## 📱 Responsive Design & Recommended Devices

The application can be opened on desktops, laptops, tablets and Android/mobile browsers, but the **best experience is on a laptop or desktop PC**.

The POS interface contains multiple panels, tables, controls and billing information. On smaller tablet and Android/mobile screens, the layout can differ and **vertical scrolling may be required more frequently**.

| Device | Experience |
|---|---|
| 🖥️ Desktop PC | ⭐⭐⭐⭐⭐ Recommended |
| 💻 Laptop | ⭐⭐⭐⭐⭐ Recommended |
| 📱 Tablet | ⭐⭐⭐⭐ Supported; some scrolling may be required |
| 📱 Android / Mobile | ⭐⭐⭐ Accessible for demonstration; more vertical scrolling may be required |

This is a limitation of the public portfolio layout and does not represent the intended desktop POS environment.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **React 19** | Frontend UI and component architecture |
| **Vite 8** | Build and development tooling |
| **JavaScript** | Application logic |
| **CSS** | Interface styling and responsive behavior |
| **LocalStorage** | Demo persistence |
| **html5-qrcode** | Camera/barcode scanning |
| **qrcode.react** | QR-code rendering |
| **PeerJS** | Browser peer communication capability |
| **Vitest** | Testing |
| **Oxlint** | Static analysis |
| **GitHub Actions** | CI/CD deployment |
| **GitHub Pages** | Public hosting |

---

## 🏗️ Architecture Overview

```text
                    ┌──────────────────────────┐
                    │       React POS App       │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
              ▼                                     ▼
   ┌─────────────────────┐              ┌─────────────────────┐
   │ Admin / Bill Counter │              │ Customer Display    │
   │ Browser Tab/Window   │              │ Browser Tab/Window  │
   └──────────┬──────────┘              └──────────┬──────────┘
              │                                     │
              └──────────────────┬──────────────────┘
                                 ▼
                    ┌──────────────────────────┐
                    │ Browser-side Demo State  │
                    │       LocalStorage       │
                    └────────────┬─────────────┘
                                 ▼
                    ┌──────────────────────────┐
                    │      GitHub Pages        │
                    └──────────────────────────┘
```

There is no production backend, production database, real payment gateway, or real customer information in this public demonstration.

---

## 🧪 Quality Checks

The project includes testing and static-analysis tooling.

Run locally:

```bash
npm test
npm run lint
npm run build
```

The project is also configured for automated GitHub Pages deployment through GitHub Actions.

---

## 💻 Run Locally

### Prerequisites

- Node.js 20 or a compatible modern Node.js release
- npm
- Git (optional)

### Installation

```bash
npm ci
```

### Development

```bash
npm run dev
```

Then open the local URL provided by the development server.

### Production build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

---

## 🌐 Deployment

The project is deployed to GitHub Pages through the workflow:

```text
.github/workflows/deploy.yml
```

Deployment flow:

```text
Push to main
     ↓
GitHub Actions
     ↓
Install dependencies
     ↓
Build with Vite
     ↓
Deploy production output
     ↓
GitHub Pages
```

---

## 🔒 Security & Privacy

This repository is prepared for public portfolio hosting.

It contains no:

- Production API keys
- Private tokens
- Production database credentials
- Real payment credentials
- Real customer records
- Real transaction records
- Private production backend code

All demonstration information is fictional.

---

## ⚠️ Demo Limitations

This is a **portfolio demonstration**, not a production POS deployment.

Intentionally excluded from the public version:

- Production backend services
- Production databases
- Real payment processing
- Real customer accounts
- Real business transaction data
- Private server-side systems
- Production credentials and integrations

The desktop/laptop interface is the primary target. Smaller tablet and Android/mobile screens may require additional vertical scrolling.

---

## 🔮 Future Enhancements

Potential future development areas include:

- Secure backend/API integration
- Cloud database synchronization
- Advanced inventory management
- Advanced reporting
- Multi-terminal synchronization
- POS hardware/peripheral integration
- Improved offline synchronization
- Further responsive optimization for smaller displays

These are future concepts and are not claims that the public demo currently provides these capabilities.

---

## 📂 Repository Structure

```text
smart-pos-portfolio-demo/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── public/
├── src/
│   ├── App.jsx
│   ├── CameraScanner.jsx
│   ├── demoData.js
│   ├── posLogic.js
│   └── ...
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── vitest.config.js
├── README.md
├── LICENSE.md
├── DEMO-TERMS.md
├── COPYRIGHT-NOTICE.md
└── THIRD-PARTY-NOTICES.md
```

---

## 📜 Licensing & Usage

This repository is a **proprietary portfolio demonstration** and is not intended for commercial redistribution or unauthorized reuse.

Please review:

- [`LICENSE.md`](LICENSE.md)
- [`DEMO-TERMS.md`](DEMO-TERMS.md)
- [`COPYRIGHT-NOTICE.md`](COPYRIGHT-NOTICE.md)
- [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)

---

## ⭐ Portfolio Links

**🚀 [OPEN LIVE DEMO](https://saba1207b.github.io/smart-pos-portfolio-demo/)**

**📂 [VIEW SOURCE CODE](https://github.com/saba1207B/smart-pos-portfolio-demo)**

---

**Smart POS & Billing System — Public Portfolio Demo**  
**© 2026 Sabareesh. All rights reserved.**