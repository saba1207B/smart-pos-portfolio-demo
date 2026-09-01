# 🧾 Smart POS & Billing System — Portfolio Demo

<p align="center">
  <strong>A modern, browser-based Point-of-Sale (POS) and billing system built as a portfolio demonstration.</strong>
</p>

<p align="center">
  <a href="https://saba1207b.github.io/smart-pos-portfolio-demo/"><strong>🚀 OPEN LIVE DEMO</strong></a>
  &nbsp; • &nbsp;
  <a href="https://github.com/saba1207B/smart-pos-portfolio-demo"><strong>📂 VIEW SOURCE CODE</strong></a>
</p>

> ⚠️ **PORTFOLIO DEMO — NO REAL TRANSACTIONS**
>
> This public version is designed for demonstration and portfolio purposes. It uses fictional data, runs entirely in the browser, and does not connect to a production backend or process real payments.

---

## 📌 Project Overview

**Smart POS & Billing System** is a frontend-focused Point-of-Sale application created to demonstrate practical software development skills through a realistic retail billing workflow.

The demo provides a simulated POS environment where users can browse products, build a cart, calculate billing totals, view customer-facing information, generate demo receipts, and explore transaction and analytics features.

The public portfolio version has been intentionally separated from the full/private application so that the repository can demonstrate the user experience and frontend engineering without exposing private backend systems, production services, databases, credentials, or real business data.

## 🚀 Live Demo

### 👉 [OPEN THE SMART POS LIVE DEMO](https://saba1207b.github.io/smart-pos-portfolio-demo/)

The demo is hosted using **GitHub Pages** and deployed automatically through **GitHub Actions**.

**Best way to explore it:** open the live demo and use the demo credentials below to enter the POS application.

## 🔐 Demo Login Credentials

These credentials are **demo-only credentials** included for accessing the public portfolio demonstration.

| Role | Password |
|---|---|
| **Admin** | `1234` |
| **Cashier** | `0000` |

> ⚠️ These are intentionally simple credentials for the public demo. **Do not use them as real production credentials.** The public application does not contain real user accounts or sensitive authentication data.

---

## 🖥️ Dual-Tab POS Display

The web application is designed to demonstrate a **two-tab POS setup**:

- **Admin / Bill Counter tab** — used by the cashier or administrator to manage products, build bills, and operate the POS interface.
- **Customer Display tab** — presents the customer-facing billing information, cart contents, totals, and demo payment QR information.

The application can be opened in **two browser tabs at the same time**, allowing the bill-counter interface and customer-facing interface to be viewed separately during the demonstration.

> 💡 **Tip:** For the most realistic POS demonstration, open the live application in two browser tabs/windows and use them as the **Bill Counter** and **Customer Display** screens.

---

## ✨ Key Features

### 🛒 POS Billing

- Product browsing and search
- Product categories
- Add products to cart
- Increase/decrease quantities
- Remove products from the cart
- Automatic subtotal and total calculations
- Discount handling
- GST/tax calculation
- Demo transaction workflow

### 📷 Barcode & Camera Scanning

- Browser-based camera scanner support
- Designed for compatible desktop/mobile browsers
- Uses local browser/device capabilities in the public demo

> Scanner functionality depends on browser permissions and device capabilities.

### 🖥️ Customer Display

- Customer-facing billing information
- Live cart/total presentation
- Demo payment QR presentation
- Designed to demonstrate a two-display POS experience
- Can be used alongside the Admin/Bill Counter tab

### 💳 Demo Payment QR

The displayed QR code is **for demonstration purposes only**.

It does **not** process real payments and should not be used as a real payment destination.

### 🧾 Receipts & Printing

- Receipt preview
- Printable receipt layout
- Browser print support
- Reprint-style demonstration workflow

### 📊 Dashboard & Analytics

- Demo sales information
- Transaction history
- Summary statistics
- Product/sales insights using fictional data

### 💾 Local Browser Storage

The public demo operates without a backend and stores its demo state locally in the browser.

This allows the application to demonstrate persistence and realistic POS interactions without requiring a server or external database.

### 🔄 Reset Demo Data

The application provides a reset mechanism so visitors can restore the demo environment and explore it repeatedly.

---

## 📱 Responsive Design & Recommended Devices

The application uses a responsive web interface and can be opened on desktops, laptops, tablets, and Android/mobile browsers. However, the **best visual experience and layout resolution is on a laptop or desktop PC**.

Because the POS interface contains multiple panels, tables, controls, and billing information, the layout may appear differently on smaller tablet or Android screens. On some smaller displays, **vertical scrolling may be required to access controls or sections further down the page**.

This is an expected limitation of the public portfolio demo and does not represent the target desktop POS layout.

**Recommended experience:**

- 🖥️ **Desktop PC / Laptop:** Best layout, resolution, and overall experience
- 📱 **Tablet:** Supported, but some sections may require scrolling
- 📱 **Android / Mobile:** Accessible for demonstration, but the interface may require more frequent vertical scrolling because of the smaller screen size

For evaluating the complete POS interface, the **laptop/desktop version is recommended**.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **React** | Frontend UI and component architecture |
| **Vite** | Development server and production build tooling |
| **JavaScript** | Application logic and interactions |
| **CSS** | Responsive interface and visual styling |
| **LocalStorage** | Browser-side demo persistence |
| **Vitest** | Logic testing |
| **GitHub Actions** | Automated deployment |
| **GitHub Pages** | Public hosting |

---

## 🏗️ Architecture

The public portfolio demo is intentionally **frontend-only**.

```text
┌────────────────────────────────────┐
│          React POS Interface       │
├────────────────────────────────────┤
│ Admin / Bill Counter Tab           │
│ Customer Display Tab               │
│ Product Search / Cart / POS        │
│ Customer Display / Receipt         │
│ Dashboard / Analytics              │
│ Camera Scanner                     │
├────────────────────────────────────┤
│          Browser Storage           │
│           LocalStorage             │
└────────────────────────────────────┘
                 │
                 ▼
          GitHub Pages Hosting
```

There is no production backend, production database, payment gateway, or real customer information in this public demonstration.

---

## 🔒 Security & Privacy

The portfolio demo has been prepared specifically for public repository hosting.

It contains:

- No API keys
- No private production passwords or credentials
- No private tokens
- No production database connections
- No production payment credentials
- No real customer records
- No real transaction records
- No private backend source code

The simple Admin/Cashier passwords listed above are **public demo credentials**, not private secrets.

All demonstration data is fictional.

---

## 🌐 Browser & Device Support

The demo is designed to work across modern browsers, including desktop and mobile browsers.

For the best experience, use an up-to-date version of **Chrome, Edge, Firefox, or another modern Chromium-based browser**, preferably on a laptop or desktop PC.

Camera scanning requires a compatible device/browser and permission to access the camera.

On smaller tablet and Android screens, some interface sections may require vertical scrolling because the application is optimized primarily for the larger desktop/laptop POS layout.

---

## 💻 Run Locally

### Prerequisites

- Node.js 20 or a compatible modern Node.js release
- npm
- Git (optional if you download the source directly)

### Installation

```bash
npm ci
```

### Start the development server

```bash
npm run dev
```

Then open the local URL shown by Vite in your browser.

### Production build

```bash
npm run build
```

The generated production files are placed in the `dist/` directory.

### Run tests

```bash
npm test
```

---

## 🌐 Deployment

This project is configured for **GitHub Pages** deployment through GitHub Actions.

The workflow is located at:

```text
.github/workflows/deploy.yml
```

The deployment process is:

```text
Push to main
     ↓
GitHub Actions
     ↓
npm ci
     ↓
npm run build
     ↓
Upload dist/
     ↓
GitHub Pages
```

The `dist/` build output is generated during deployment and is intentionally not committed to the repository.

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
├── vite.config.js
├── vitest.config.js
├── README.md
├── LICENSE.md
├── DEMO-TERMS.md
├── COPYRIGHT-NOTICE.md
└── THIRD-PARTY-NOTICES.md
```

---

## ⚠️ Demo Limitations

This public version is a portfolio demonstration rather than a production POS deployment.

The following are intentionally excluded from the public demo:

- Production backend services
- Production databases
- Real payment processing
- Real customer accounts
- Real business transaction data
- Private server-side application code
- Production credentials and integrations

Some capabilities may therefore behave differently from the full/private application.

The public interface is primarily optimized for **laptop and desktop screens**. Tablet and Android/mobile displays may require additional vertical scrolling due to their smaller screen dimensions.

---

## 🔮 Potential Future Enhancements

Possible future development areas include:

- Secure backend/API integration
- Role-based staff authentication
- Cloud database synchronization
- Inventory and stock management
- Advanced reporting
- Real payment-provider integration in a controlled production environment
- Multi-terminal synchronization
- Hardware/peripheral integration
- Improved offline synchronization
- Further responsive-layout optimization for smaller screens

These are future development concepts and are **not claims that the public demo currently provides these capabilities**.

---

## 📜 Licensing & Usage

This repository is a **proprietary portfolio demonstration**. It is not an open-source project and is not intended for commercial redistribution or unauthorized reuse.

Please read the repository documents before using or redistributing any part of the project:

- [`LICENSE.md`](LICENSE.md)
- [`DEMO-TERMS.md`](DEMO-TERMS.md)
- [`COPYRIGHT-NOTICE.md`](COPYRIGHT-NOTICE.md)
- [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)

---

## 👨‍💻 Portfolio Project

This project demonstrates practical experience with:

- Frontend application architecture
- React component development
- POS/billing workflow design
- Two-tab customer and bill-counter interface design
- State and browser-storage management
- Form and calculation logic
- Responsive UI development
- Camera/browser API integration
- Testing application logic
- Git and GitHub workflows
- Automated static deployment

### ⭐ Explore the project

**[🚀 OPEN LIVE DEMO](https://saba1207b.github.io/smart-pos-portfolio-demo/)**

**[📂 VIEW SOURCE CODE](https://github.com/saba1207B/smart-pos-portfolio-demo)**

---

**Smart POS & Billing System — Public Portfolio Demo**  
**© 2026 Sabareesh. All rights reserved.**