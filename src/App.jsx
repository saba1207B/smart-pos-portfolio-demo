import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Plus, Minus, Trash2, Printer, QrCode, Settings, CheckCircle2,
  Clock, RotateCcw, ShoppingBasket, X, Search, Edit3, Save,
  Users, Package, LogOut, User, UserPlus, ChevronDown,
  ChevronUp, Banknote, Smartphone, Shield, Barcode, Camera, BarChart3, Eye, Sun, Moon, MonitorUp
} from "lucide-react";
import CameraScanner from "./CameraScanner";
import { QRCodeSVG } from "qrcode.react";
import {
  createInitialState,
  updateCatalogItem, deleteCatalogItem,
  addCustomer as addCustomerAction, updateCustomer as updateCustomerAction, deleteCustomer as deleteCustomerAction,
  addStaff as addStaffAction, updateStaff as updateStaffAction, deleteStaff as deleteStaffAction,
  authenticateStaff
} from "./posLogic";
import { demoCatalog, demoLooseCatalog, demoCustomers, demoTransactions, demoStaff, demoSettings, resetDemoData } from "./demoData";
import "./App.css";

/* ── Constants ── */
const INR = (n) => `₹${n.toFixed(2)}`;
const SCANNER_THRESHOLD = 60;
const LS = { catalog: "pos_catalog", loose_catalog: "pos_loose_catalog", customers: "pos_customers", staff: "pos_staff", settings: "pos_settings", transactions: "pos_transactions" };

const makeSession = (billNo, staffId) => ({
  id: crypto.randomUUID(),
  billNo,
  items: [],
  taxRate: 0,
  discount: 0,
  discountType: "flat",
  paymentStatus: "pending",
  paymentMethod: "cash",
  billMode: "retail",
  customerId: null,
  staffId,
});

function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("pos_theme") || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pos_theme", theme);
    
    // Listen for theme changes from other windows
    const handleStorage = (e) => {
      if (e.key === "pos_theme" && e.newValue) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [theme]);

  if (window.location.search === "?customer-display") return <CustomerDisplay />;
  return <POSApp theme={theme} setTheme={setTheme} />;
}

function POSApp({ theme, setTheme }) {
  const defaults = createInitialState();

  const focusNext = (e, nextId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById(nextId)?.focus();
    }
  };

  const handleAdImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setAdImage(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };


  /* ── Auth ── */
  const savedSettings = lsGet(LS.settings, null);
  const [storeName, setStoreName] = useState(savedSettings?.name || "Sri Lakshmi Grocery Stores");
  const [storeAddress, setStoreAddress] = useState(savedSettings?.address || "123 Main Bazaar");
  const [storePhone, setStorePhone] = useState(savedSettings?.phone || "9876543210");
  const [upiId, setUpiId] = useState(savedSettings?.upi || "");
  const [adImage, setAdImage] = useState(savedSettings?.adImage || "");

  const [loggedInStaff, setLoggedInStaff] = useState(null);
  const [loginStaffId, setLoginStaffId] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");

  /* ── Data ── */
  const [catalog, setCatalog] = useState(() => lsGet(LS.catalog, demoCatalog));
  const [looseCatalog, setLooseCatalog] = useState(() => lsGet(LS.loose_catalog, demoLooseCatalog));
  const [customers, setCustomers] = useState(() => lsGet(LS.customers, demoCustomers));
  const [staff, setStaff] = useState(() => lsGet(LS.staff, demoStaff));
  const [transactions, setTransactions] = useState(() => lsGet(LS.transactions, demoTransactions));

  /* ── Transaction History Filters ── */
  const [txnSearchQuery, setTxnSearchQuery] = useState("");
  const [txnStartDate, setTxnStartDate] = useState("");
  const [txnEndDate, setTxnEndDate] = useState("");
  const [viewingReceiptTxn, setViewingReceiptTxn] = useState(null);
  const [printingHistoricalTxn, setPrintingHistoricalTxn] = useState(null);
  const [dbLoaded, setDbLoaded] = useState(false);

  /* ── Panels ── */
  const [showSettings, setShowSettings] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogTab, setCatalogTab] = useState("fixed");
  const [showCustomers, setShowCustomers] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  /* ── Sessions ── */
  const [sessions, setSessions] = useState([makeSession(1, null)]);
  const [activeId, setActiveId] = useState(sessions[0].id);
  const nextBillNo = useRef(2);

  /* ── Add item form ── */
  const [addMode, setAddMode] = useState("catalog");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [wholesale, setWholesale] = useState("");
  const [qty, setQty] = useState("1");
  const nameRef = useRef(null);

  /* ── Barcode Scanner ── */
  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(0);
  const scannerTimer = useRef(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  /* ── New Product Modal ── */
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [addConfirm, setAddConfirm] = useState(null);
  const [pendingBarcode, setPendingBarcode] = useState("");
  const [pendingQty, setPendingQty] = useState(1);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductMrp, setNewProductMrp] = useState("");
  const [newProductWholesale, setNewProductWholesale] = useState("");
  const newPriceRef = useRef(null);

  /* ── Checkout Modal ── */
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutName, setCheckoutName] = useState("");

  useEffect(() => {
    if (showCheckout) {
      const selectedCustomer = customers.find((c) => c.id === sessions.find(s => s.id === activeId)?.customerId);
      if (selectedCustomer) {
        setCheckoutPhone(selectedCustomer.phone || "");
        setCheckoutName(selectedCustomer.name || "");
      } else {
        setCheckoutPhone("");
        setCheckoutName("");
      }
    }
  }, [showCheckout, activeId, sessions, customers]);

  /* ── Catalog editing ── */
  const [editingProductId, setEditingProductId] = useState(null);
  const [editProductName, setEditProductName] = useState("");
  const [editProductPrice, setEditProductPrice] = useState("");
  const [editProductMrp, setEditProductMrp] = useState("");
  const [editProductWholesale, setEditProductWholesale] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatBarcode, setNewCatBarcode] = useState("");
  const [newCatPrice, setNewCatPrice] = useState("");
  const [newCatMrp, setNewCatMrp] = useState("");
  const [newCatWholesale, setNewCatWholesale] = useState("");

  /* ── Customer editing ── */
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editCustName, setEditCustName] = useState("");
  const [editCustPhone, setEditCustPhone] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerHistory, setShowCustomerHistory] = useState(null);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");

  /* ── Customer selector ── */
  const [custSelectorSearch, setCustSelectorSearch] = useState("");
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  /* ── Staff editing ── */
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPin, setNewStaffPin] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("cashier");

  /* ── Delete confirmation ── */
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  /* ── Live clock ── */
  const [currentTime, setCurrentTime] = useState(new Date());

  /* ═══ Effects ═══ */

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Initial load from LocalStorage only (Demo Mode)
  useEffect(() => {
    setDbLoaded(true);
  }, []);

  // Persist data (local only)
  useEffect(() => {
    lsSet(LS.catalog, catalog);
    lsSet(LS.loose_catalog, looseCatalog);
    lsSet(LS.customers, customers);
    lsSet(LS.staff, staff);
    lsSet(LS.transactions, transactions);
    lsSet(LS.settings, { name: storeName, address: storeAddress, phone: storePhone, upi: upiId, adImage });
  }, [catalog, looseCatalog, customers, staff, transactions, storeName, storeAddress, storePhone, upiId, adImage, dbLoaded]);

  /* ── Barcode Scanner (HIGH PRIORITY) ── */
  const handleBarcodeScan = useCallback((barcode, qty = 1) => {
    setScannerActive(true);
    setTimeout(() => setScannerActive(false), 1200);

    const product = catalog.find((p) => p.barcode === barcode);
    if (product) {
      addItemToBill(product.name, product.price, qty, false, product.barcode);
    } else {
      setPendingBarcode(barcode);
      setPendingQty(qty);
      setNewProductName("");
      setNewProductPrice("");
      setShowNewProductModal(true);
    }
  }, [catalog, activeId, sessions]);

  // Always listen for Remote Phone Scans in the background
  const handleBarcodeScanRef = useRef(handleBarcodeScan);
  useEffect(() => { handleBarcodeScanRef.current = handleBarcodeScan; }, [handleBarcodeScan]);

  // EventSource removed for Demo version

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!loggedInStaff) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const now = Date.now();

      if (e.key === "Enter" && barcodeBuffer.current.length > 3) {
        e.preventDefault();
        const bc = barcodeBuffer.current;
        barcodeBuffer.current = "";
        clearTimeout(scannerTimer.current);
        handleBarcodeScan(bc);
        return;
      }

      if (e.key.length === 1 && /[0-9a-zA-Z\-]/.test(e.key)) {
        if (now - lastKeyTime.current > SCANNER_THRESHOLD && barcodeBuffer.current.length > 0) {
          barcodeBuffer.current = "";
        }
        barcodeBuffer.current += e.key;
        lastKeyTime.current = now;

        clearTimeout(scannerTimer.current);
        scannerTimer.current = setTimeout(() => { barcodeBuffer.current = ""; }, 120);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loggedInStaff, handleBarcodeScan]);

  /* ═══ Computed ═══ */
  const active = sessions.find((s) => s.id === activeId) || sessions[0];
  const getActivePrice = (it) => active.billMode === "wholesale" ? (parseFloat(it.wholesale) || it.price) : it.price;
  const subtotal = useMemo(() => active.items.reduce((s, it) => s + getActivePrice(it) * it.qty, 0), [active.items, active.billMode]);
  const taxAmount = subtotal * (Number(active.taxRate) || 0) / 100;
  const discountAmount = active.discountType === "percent"
    ? subtotal * (Number(active.discount) || 0) / 100
    : Number(active.discount) || 0;
  const total = Math.max(0, subtotal + taxAmount - discountAmount);
  
  const totalSaved = useMemo(() => active.items.reduce((acc, it) => {
    const p = getActivePrice(it);
    return (it.mrp && it.mrp > p) ? acc + (it.mrp - p) * it.qty : acc;
  }, 0), [active.items, active.billMode]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      let matchesSearch = true;
      let matchesDate = true;
      if (txnSearchQuery) {
        const q = txnSearchQuery.toLowerCase();
        matchesSearch = (t.customerName?.toLowerCase().includes(q)) || 
                        (t.customerId?.toLowerCase().includes(q)) || 
                        (t.id?.toLowerCase().includes(q)) || 
                        (String(t.billNo).includes(q));
      }
      if (txnStartDate) {
        matchesDate = matchesDate && new Date(t.date) >= new Date(txnStartDate);
      }
      if (txnEndDate) {
        const end = new Date(txnEndDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(t.date) <= end;
      }
      return matchesSearch && matchesDate;
    });
  }, [transactions, txnSearchQuery, txnStartDate, txnEndDate]);

  const dateStr = currentTime.toLocaleDateString("en-IN");
  const timeStr = currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const isAdmin = loggedInStaff?.role === "admin";
  const selectedCustomer = customers.find((c) => c.id === active.customerId);

  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(storeName)}&am=${total}&cu=INR`;

  /* ── Customer Display Sync ── */
  const posDisplayChannel = useMemo(() => new BroadcastChannel('pos-sync'), []);

  const syncToCustomerDisplay = useCallback(() => {
    if (!active) return;
    const resolvedItems = active.items.map(it => {
      const p = active.billMode === "wholesale" ? (parseFloat(it.wholesale) || it.price) : it.price;
      return {
        name: it.name,
        qty: it.qty,
        resolvedPrice: INR(p),
        resolvedTotal: INR(p * it.qty)
      };
    });

    posDisplayChannel.postMessage({
      type: 'SYNC',
      payload: { 
        active, 
        storeName, 
        total: INR(total), 
        subtotal: INR(subtotal), 
        taxAmount: INR(taxAmount), 
        discountAmount: INR(discountAmount), 
        upiUri, 
        upiId, 
        resolvedItems, 
        adImage 
      }
    });
  }, [active, storeName, total, subtotal, taxAmount, discountAmount, upiUri, upiId, adImage, posDisplayChannel]);

  // Broadcast automatically whenever active state or totals change
  useEffect(() => {
    syncToCustomerDisplay();
  }, [syncToCustomerDisplay]);

  // Listen for the display window pinging for initial state
  useEffect(() => {
    const handleMsg = (e) => {
      if (e.data.type === 'PING') {
        syncToCustomerDisplay();
      }
    };
    posDisplayChannel.addEventListener('message', handleMsg);
    return () => posDisplayChannel.removeEventListener('message', handleMsg);
  }, [syncToCustomerDisplay, posDisplayChannel]);

  /* ═══ Session helpers ═══ */
  const updateActive = (patch) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === active.id ? { ...s, ...(typeof patch === "function" ? patch(s) : patch) } : s))
    );
  };

  const newBill = () => {
    const next = nextBillNo.current++;
    const s = makeSession(next, loggedInStaff.id);
    setSessions((prev) => [...prev, s]);
    setActiveId(s.id);
  };
  const closeBill = (idToRemove) => {
    const updated = sessions.filter(s => s.id !== idToRemove);
    if (updated.length === 0) {
      const next = nextBillNo.current++;
      const s = makeSession(next, loggedInStaff.id);
      setSessions([s]);
      setActiveId(s.id);
    } else {
      setSessions(updated);
      setActiveId(updated[updated.length - 1].id);
    }
  };

  const closeSession = (id) => {
    setSessions((prev) => {
      if (prev.length === 1) {
        const fresh = makeSession(nextBillNo.current, loggedInStaff?.id);
        nextBillNo.current += 1;
        setActiveId(fresh.id);
        return [fresh];
      }
      const remaining = prev.filter((s) => s.id !== id);
      if (id === activeId) setActiveId(remaining[0].id);
      return remaining;
    });
  };



  /* ═══ Cart helpers ═══ */
  const addItemToBill = (itemName, itemPrice, itemQty, isLoose, barcode = null, inputMrp = null, inputWholesale = null) => {
    const p = parseFloat(itemPrice);
    const q = parseFloat(itemQty) || 1;
    if (!itemName.trim() || isNaN(p) || p < 0) return;

    let cMrp = p, cWholesale = p;
    if (isLoose) {
      const match = looseCatalog.find(c => c.name.toLowerCase() === itemName.trim().toLowerCase());
      if (match) { cMrp = match.mrp || p; cWholesale = match.wholesale || p; }
    } else {
      const match = catalog.find(c => c.name.toLowerCase() === itemName.trim().toLowerCase() || (barcode && c.barcode === barcode));
      if (match) { cMrp = match.mrp || p; cWholesale = match.wholesale || p; }
    }
    if (inputMrp) cMrp = parseFloat(inputMrp) || p;
    if (inputWholesale) cWholesale = parseFloat(inputWholesale) || p;

    updateActive((s) => {
      if (!isLoose) {
        const existing = s.items.find((it) => it.name === itemName && !it.isLoose);
        if (existing) {
          return { items: s.items.map((it) => it.id === existing.id ? { ...it, qty: it.qty + q } : it) };
        }
      }
      return { items: [...s.items, { id: crypto.randomUUID(), name: itemName.trim(), price: p, mrp: cMrp, wholesale: cWholesale, qty: q, isLoose, barcode }] };
    });
  };

  const handleNameChange = (e, isLoose) => {
    const val = e.target.value;
    setName(val);
    if (isLoose) {
      const match = looseCatalog.find(c => c.name.toLowerCase() === val.trim().toLowerCase());
      if (match) { setPrice(match.price); setMrp(match.mrp || ""); setWholesale(match.wholesale || ""); }
    } else {
      const match = catalog.find(c => c.name.toLowerCase() === val.trim().toLowerCase());
      if (match) {
        setPrice(match.price); setMrp(match.mrp || ""); setWholesale(match.wholesale || "");
        if (match.barcode) setBarcodeInput(match.barcode);
      }
    }
  };

  const handleBarcodeInputChange = (e) => {
    const val = e.target.value;
    setBarcodeInput(val);
    const match = catalog.find(c => c.barcode === val.trim());
    if (match) {
      setName(match.name);
      setPrice(match.price);
      setMrp(match.mrp || "");
      setWholesale(match.wholesale || "");
    }
  };

  const addItem = () => {
    const m = parseFloat(mrp);
    const p = m;
    const w = wholesale ? parseFloat(wholesale) : null;
    if (!name.trim() || isNaN(m)) {
      alert("Please enter a valid Name and MRP.");
      return;
    }
    
    const existing = catalog.find(c => c.name.toLowerCase() === name.trim().toLowerCase() || (barcodeInput && c.barcode === barcodeInput));
    if (!existing) {
      setAddConfirm({ type: "fixed", name: name.trim(), price: p, mrp: m, wholesale: w, qty: parseFloat(qty) || 1, barcode: barcodeInput || null });
      return;
    }
    
    if (existing.mrp !== m || existing.wholesale !== w) {
       setCatalog(prev => prev.map(c => c.id === existing.id ? { ...c, mrp: m, wholesale: w, price: m } : c));
    }
    
    addItemToBill(name, p, qty, false, barcodeInput || null, m, w);
    setName(""); setPrice(""); setMrp(""); setWholesale(""); setQty("1"); setBarcodeInput("");
    document.getElementById("cat-add-name")?.focus();
  };

  const addLooseItem = () => {
    const m = parseFloat(mrp);
    const p = m;
    const w = wholesale ? parseFloat(wholesale) : null;
    if (!name.trim() || isNaN(m)) {
      alert("Please enter a valid Name and MRP.");
      return;
    }

    const existing = looseCatalog.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
    if (!existing) {
      setAddConfirm({ type: "loose", name: name.trim(), price: p, mrp: m, wholesale: w, qty: parseFloat(qty) || 1, barcode: null });
      return;
    }

    if (existing.mrp !== m || existing.wholesale !== w) {
       setLooseCatalog(prev => prev.map(c => c.id === existing.id ? { ...c, mrp: m, wholesale: w, price: m } : c));
    }

    addItemToBill(name, p, qty, true, null, m, w);
    setName(""); setPrice(""); setMrp(""); setWholesale(""); setQty("1");
    document.getElementById("loose-add-name")?.focus();
  };

  const confirmAutoAdd = (saveToDb) => {
    if (!addConfirm) return;
    const { type, name: n, price: p, mrp: m, wholesale: w, qty: q, barcode: b } = addConfirm;
    
    if (saveToDb) {
      if (type === "fixed") {
        const newId = Math.max(0, ...catalog.map((c) => c.id)) + 1;
        setCatalog(prev => [...prev, { id: newId, barcode: b || String(newId), name: n, price: p, mrp: m, wholesale: w }]);
      } else {
        const newId = Math.max(0, ...looseCatalog.map((c) => c.id)) + 1;
        setLooseCatalog(prev => [...prev, { id: newId, name: n, price: p, mrp: m, wholesale: w }]);
      }
    }
    
    addItemToBill(n, p, q, type === "loose", b, m, w);
    
    setName(""); setPrice(""); setMrp(""); setWholesale(""); setQty("1");
    if (type === "fixed") {
      setBarcodeInput("");
      document.getElementById("cat-add-name")?.focus();
    } else {
      document.getElementById("loose-add-name")?.focus();
    }
    setAddConfirm(null);
  };

  const updateQty = (id, delta) => {
    updateActive((s) => ({
      items: s.items.map((it) => (it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it)).filter((it) => it.qty > 0),
    }));
  };

  const removeItem = (id) => updateActive((s) => ({ items: s.items.filter((it) => it.id !== id) }));

  /* ═══ Manual barcode ═══ */
  const handleManualBarcode = () => {
    if (!barcodeInput.trim()) return;
    handleBarcodeScan(barcodeInput.trim());
    setBarcodeInput("");
  };

  /* ═══ New product modal ═══ */
  const handleNewProductSubmit = () => {
    const m = parseFloat(newProductMrp);
    const p = m;
    const w = newProductWholesale ? parseFloat(newProductWholesale) : null;
    if (!newProductName.trim() || isNaN(m)) return;
    const newId = Math.max(0, ...catalog.map((c) => c.id)) + 1;
    const product = { id: newId, barcode: pendingBarcode, name: newProductName.trim(), price: p, mrp: m, wholesale: w };
    setCatalog((prev) => [...prev, product]);
    addItemToBill(product.name, p, pendingQty, false, product.barcode, m, w);
    setShowNewProductModal(false);
  };

  /* ═══ Payment / Checkout ═══ */
  const handlePayment = () => {
    if (active.paymentStatus === "pending") {
      setShowCheckout(true);
      posDisplayChannel.postMessage({ type: 'CLEAR' });
    }
  };

  const finalizeCheckout = () => {
    let custId = active.customerId;
    const phoneTrim = checkoutPhone.trim();
    const nameTrim = checkoutName.trim();
    
    // Auto-create or link customer
    if (phoneTrim) {
      const existing = customers.find(c => c.phone === phoneTrim);
      if (existing) {
        custId = existing.id;
        // Option to update name here if we wanted
      } else {
        custId = `CUS-${Date.now()}`;
        const newCust = { id: custId, name: nameTrim || "Walk-in", phone: phoneTrim, purchases: 0, totalSpent: 0, lastVisit: new Date().toISOString() };
        setCustomers(prev => [...prev, newCust]);
      }
    }

    // Calculate total right here to save to transactions
    const subtotal = active.items.reduce((acc, it) => acc + getActivePrice(it) * it.qty, 0);
    const taxAmount = (subtotal * (Number(active.taxRate) || 0)) / 100;
    const discountAmount = active.discountType === "flat" ? (Number(active.discount) || 0) : (subtotal * (Number(active.discount) || 0)) / 100;
    const total = Math.max(0, subtotal + taxAmount - discountAmount);

    updateActive({ paymentStatus: "paid", customerId: custId });
    
    const txn = {
       id: `TXN-${Date.now()}`,
       date: new Date().toISOString(),
       billNo: active.billNo,
       total: total,
       paymentMethod: active.paymentMethod,
       status: "PAID",
       customerId: custId,
       customerName: nameTrim || customers.find(c => c.id === custId)?.name || "Walk-in Customer",
       items: active.items
    };
    setTransactions(prev => [txn, ...prev]);
    posDisplayChannel.postMessage({ type: 'CLEAR' });
    setShowCheckout(false);
    
    setTimeout(() => {
      window.print();
      closeBill(active.id);
    }, 400);
  };

  const cancelBill = () => {
    if (active.items.length === 0) {
      closeBill(active.id);
      return;
    }
    const subtotal = active.items.reduce((acc, it) => acc + getActivePrice(it) * it.qty, 0);
    const taxAmount = (subtotal * (Number(active.taxRate) || 0)) / 100;
    const discountAmount = active.discountType === "flat" ? (Number(active.discount) || 0) : (subtotal * (Number(active.discount) || 0)) / 100;
    const total = Math.max(0, subtotal + taxAmount - discountAmount);
    
    const txn = {
       id: `TXN-${Date.now()}`,
       date: new Date().toISOString(),
       billNo: active.billNo,
       total: total,
       paymentMethod: active.paymentMethod,
       status: "CANCELED",
       customerId: active.customerId || null,
       customerName: customers.find(c => c.id === active.customerId)?.name || "Walk-in Customer",
       items: active.items
    };
    setTransactions(prev => [txn, ...prev]);
    closeBill(active.id);
  };

  const handlePrint = () => window.print();

  /* ═══ Auth ═══ */
  const attemptLogin = () => {
    const member = staff.find((s) => s.id === loginStaffId);
    if (!member) { setLoginError("Please select a staff member"); return; }
    if (member.pin !== loginPin) { setLoginError("Incorrect PIN"); return; }
    setLoggedInStaff(member);
    setLoginError("");
    setLoginPin("");
    setSessions([makeSession(1, member.id)]);
    window.open('?customer-display', 'CustomerDisplayWindow', 'width=1024,height=768');
  };

  const logout = () => {
    setLoggedInStaff(null);
    setLoginStaffId("");
    setLoginPin("");
    setLoginError("");
    setShowSettings(false);
    setShowCatalog(false);
    setShowCustomers(false);
    setShowTransactions(false);
    setShowDashboard(false);
  };

  /* ═══ Catalog CRUD ═══ */
  const startEditProduct = (p) => { setEditingProductId(p.id); setEditProductName(p.name); setEditProductMrp(p.mrp ? String(p.mrp) : String(p.price)); setEditProductWholesale(p.wholesale ? String(p.wholesale) : ""); };
  const saveEditProduct = () => {
    const m = parseFloat(editProductMrp);
    const w = parseFloat(editProductWholesale) || null;
    if (isNaN(m)) return;
    const upd = { name: editProductName, price: m, mrp: m, wholesale: w };
    if (catalogTab === "fixed") {
      const st = { catalog }; const updated = updateCatalogItem(st, editingProductId, upd);
      setCatalog(updated.catalog);
    } else {
      setLooseCatalog(prev => prev.map(c => c.id === editingProductId ? { ...c, ...upd } : c));
    }
    setEditingProductId(null);
  };
  const handleAddCatalogProduct = () => {
    const m = parseFloat(newCatMrp);
    const w = parseFloat(newCatWholesale) || null;
    if (!newCatName.trim() || isNaN(m)) return;
    const upd = { name: newCatName.trim(), price: m, mrp: m, wholesale: w };
    if (catalogTab === "fixed") {
      const newId = Math.max(0, ...catalog.map((c) => c.id)) + 1;
      setCatalog((prev) => [...prev, { id: newId, barcode: newCatBarcode || String(newId), ...upd }]);
    } else {
      const newId = Math.max(0, ...looseCatalog.map((c) => c.id)) + 1;
      setLooseCatalog((prev) => [...prev, { id: newId, ...upd }]);
    }
    setNewCatName(""); setNewCatBarcode(""); setNewCatMrp(""); setNewCatWholesale("");
  };

  /* ═══ Customer CRUD ═══ */
  const handleAddCustomer = () => {
    if (!newCustName.trim() || !newCustPhone.trim()) return;
    const st = { customers }; const updated = addCustomerAction(st, { name: newCustName.trim(), phone: newCustPhone.trim() });
    setCustomers(updated.customers); setNewCustName(""); setNewCustPhone("");
  };
  const startEditCustomer = (c) => { setEditingCustomerId(c.id); setEditCustName(c.name); setEditCustPhone(c.phone); };
  const saveEditCustomer = () => {
    const st = { customers }; const updated = updateCustomerAction(st, editingCustomerId, { name: editCustName, phone: editCustPhone });
    setCustomers(updated.customers); setEditingCustomerId(null);
  };

  /* ═══ Staff CRUD ═══ */
  const handleAddStaff = () => {
    if (!newStaffName.trim() || newStaffPin.length < 4) return;
    const st = { staff }; const updated = addStaffAction(st, { name: newStaffName.trim(), pin: newStaffPin, role: newStaffRole });
    setStaff(updated.staff); setNewStaffName(""); setNewStaffPin(""); setNewStaffRole("cashier");
  };

  /* ═══ Delete confirm ═══ */
  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    if (type === "product") { const st = { catalog }; setCatalog(deleteCatalogItem(st, id).catalog); }
    if (type === "loose_product") { setLooseCatalog(prev => prev.filter(c => c.id !== id)); }
    if (type === "customer") { const st = { customers }; setCustomers(deleteCustomerAction(st, id).customers); }
    if (type === "staff") { const st = { staff }; setStaff(deleteStaffAction(st, id).staff); }
    setDeleteConfirm(null);
  };

  /* ═══ Customer selector ═══ */
  const filteredCustomersForSelector = customers.filter((c) => {
    const q = custSelectorSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.id.toLowerCase().includes(q);
  });

  const selectCustomerForBill = (cid) => {
    updateActive({ customerId: cid });
    setShowCustDropdown(false);
    setCustSelectorSearch("");
  };

  /* ═══ Orders for customer history ═══ */
  const getCustomerOrders = (custId) => {
    const allOrders = [];
    sessions.forEach((s) => {
      if (s.customerId === custId && s.paymentStatus === "paid" && s.items.length > 0) {
        allOrders.push({ billNo: s.billNo, total: s.items.reduce((sum, it) => sum + it.price * it.qty, 0), items: s.items });
      }
    });
    return allOrders;
  };

  /* ═══ Filtered lists ═══ */
  const filteredCatalog = catalog.filter((p) => {
    const q = catalogSearch.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.barcode?.includes(q);
  });
  const filteredLooseCatalog = looseCatalog.filter((p) => {
    const q = catalogSearch.toLowerCase();
    return !q || p.name.toLowerCase().includes(q);
  });
  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.id.toLowerCase().includes(q);
  });

  /* ═══ Dashboard Logic ═══ */
  const dashboardStats = useMemo(() => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth();
    const currDay = now.getDate();

    let total = 0, yearly = 0, monthly = 0, daily = 0;
    const uniqueYears = new Set(), uniqueMonths = new Set(), uniqueDays = new Set();

    transactions.forEach(t => {
      if (t.status === "PAID") {
        total += t.total;
        const d = new Date(t.date);
        uniqueYears.add(d.getFullYear());
        uniqueMonths.add(`${d.getFullYear()}-${d.getMonth()}`);
        uniqueDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);

        if (d.getFullYear() === currYear) {
          yearly += t.total;
          if (d.getMonth() === currMonth) {
            monthly += t.total;
            if (d.getDate() === currDay) {
              daily += t.total;
            }
          }
        }
      }
    });

    const avgYearly = uniqueYears.size > 0 ? total / uniqueYears.size : 0;
    const avgMonthly = uniqueMonths.size > 0 ? total / uniqueMonths.size : 0;
    const avgDaily = uniqueDays.size > 0 ? total / uniqueDays.size : 0;

    return { total, yearly, monthly, daily, avgYearly, avgMonthly, avgDaily };
  }, [transactions]);

  /* ══════════════════════════════════════
     RENDER — LOGIN SCREEN
     ══════════════════════════════════════ */
  if (!loggedInStaff) {
    return (
      <div className="login-screen">
        <button 
          className="header-nav-btn" 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--bg-glass)', borderRadius: '50%', padding: '10px' }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="login-card">
          <div className="login-brand">
            <ShoppingBasket size={44} />
            <h1>{storeName}</h1>
            <p>Point of Sale System</p>
          </div>
          <div className="login-field">
            <label>Staff Member</label>
            <select value={loginStaffId} onChange={(e) => { setLoginStaffId(e.target.value); setLoginError(""); }} onKeyDown={(e) => focusNext(e, 'login-pin')}>
              <option value="">Select staff…</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
              ))}
            </select>
          </div>
          <div className="login-field">
            <label>PIN</label>
            <input id="login-pin"
              type="password" maxLength={4} inputMode="numeric"
              placeholder="Enter 4-digit PIN" value={loginPin}
              onChange={(e) => { setLoginPin(e.target.value.replace(/\D/g, "")); setLoginError(""); }}
              onKeyDown={(e) => e.key === "Enter" && attemptLogin()}
            />
          </div>
          {loginError && <p className="login-error">{loginError}</p>}
          <button className="login-btn" onClick={attemptLogin} disabled={!loginStaffId || loginPin.length < 4}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════
     RENDER — MAIN APP
     ══════════════════════════════════════ */
  return (
    <>
    <div className="app-container">

      {/* ═══ DEMO BANNER ═══ */}
      <div style={{ backgroundColor: 'var(--accent-red)', color: 'white', textAlign: 'center', padding: '8px', fontWeight: 'bold', fontSize: '0.85rem', zIndex: 1000, position: 'relative' }}>
        ⚠️ PORTFOLIO DEMO — NO REAL TRANSACTIONS. All data is fictional.
        <button onClick={() => { resetDemoData(); window.location.reload(); }} style={{ marginLeft: '16px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
          Reset Demo Data
        </button>
      </div>

      {/* ═══ HEADER ═══ */}
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <ShoppingBasket size={24} />
            <div className="header-shop-info">
              <h1>{storeName}</h1>
              <p>{storeAddress} · Ph: {storePhone}</p>
            </div>
          </div>
          <div className="header-right">
            <div className={`scanner-indicator ${scannerActive ? "active" : ""}`}>
              <Barcode size={14} /> Scanner Ready
            </div>
            <div className="header-clock">{dateStr} {timeStr}</div>
            <div className="header-staff">
              <User size={14} /> {loggedInStaff.name}
              <span className={`role-badge ${loggedInStaff.role}`}>{loggedInStaff.role}</span>
            </div>
            <button className="header-nav-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="header-nav-btn" onClick={() => window.open('?customer-display', 'CustomerDisplayWindow', 'width=1024,height=768')} title="Re-open External Display">
              <MonitorUp size={18} />
            </button>
            {isAdmin && <button className={`header-nav-btn ${showSettings ? "active" : ""}`} onClick={() => { setShowSettings(!showSettings); setShowCatalog(false); setShowCustomers(false); setShowTransactions(false); setShowDashboard(false); }} title="Settings"><Settings size={18} /></button>}
            {isAdmin && <button className={`header-nav-btn ${showCatalog ? "active" : ""}`} onClick={() => { setShowCatalog(!showCatalog); setShowSettings(false); setShowCustomers(false); setShowTransactions(false); setShowDashboard(false); }} title="Products"><Package size={18} /></button>}
            <button className={`header-nav-btn ${showCustomers ? "active" : ""}`} onClick={() => { setShowCustomers(!showCustomers); setShowSettings(false); setShowCatalog(false); setShowTransactions(false); setShowDashboard(false); }} title="Customers"><Users size={18} /></button>
            <button className={`header-nav-btn ${showTransactions ? "active" : ""}`} onClick={() => { setShowTransactions(!showTransactions); setShowSettings(false); setShowCatalog(false); setShowCustomers(false); setShowDashboard(false); }} title="History"><Clock size={18} /></button>
            {isAdmin && <button className={`header-nav-btn ${showDashboard ? "active" : ""}`} onClick={() => { setShowDashboard(!showDashboard); setShowSettings(false); setShowCatalog(false); setShowCustomers(false); setShowTransactions(false); }} title="Dashboard"><BarChart3 size={18} /></button>}
            <button className="header-nav-btn" onClick={logout} title="Logout"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      {/* ═══ SETTINGS PANEL ═══ */}
      {showSettings && isAdmin && (
        <div className="panel-section">
          <div className="panel">
            <div className="panel-body">
              <h2 className="card-title"><Settings size={14} className="icon" /> Store Settings</h2>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <div className="settings-grid">
                    <div className="settings-field">
                      <label>Store Name</label>
                      <input id="set-name" className="form-input" value={storeName} onChange={(e) => setStoreName(e.target.value)} onKeyDown={(e) => focusNext(e, 'set-addr')} />
                    </div>
                    <div className="settings-field">
                      <label>Address</label>
                      <input id="set-addr" className="form-input" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} onKeyDown={(e) => focusNext(e, 'set-phone')} />
                    </div>
                    <div className="settings-field">
                      <label>Phone</label>
                      <input id="set-phone" className="form-input" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} onKeyDown={(e) => focusNext(e, 'set-upi')} />
                    </div>
                    <div className="settings-field">
                      <label>UPI ID</label>
                      <input id="set-upi" className="form-input mono" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                    </div>
                    <div className="settings-field" style={{ gridColumn: '1 / -1' }}>
                      <label>Ad Image (Customer Display)</label>
                      {adImage ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
                          <img src={adImage} alt="Ad Preview" style={{ maxHeight: '150px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain', background: 'var(--bg-card)', padding: '5px', border: '1px solid var(--border-subtle)' }} />
                          <button className="btn-secondary" onClick={() => setAdImage('')}><Trash2 size={14}/> Remove Image</button>
                        </div>
                      ) : (
                        <div 
                          style={{ border: '2px dashed var(--border-focus)', borderRadius: '8px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-glass)', transition: 'var(--transition-fast)' }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => { e.preventDefault(); handleAdImageUpload(e.dataTransfer.files?.[0]); }}
                          onClick={() => document.getElementById('ad-upload-input').click()}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
                        >
                          <Camera size={24} style={{ color: 'var(--accent-purple)', marginBottom: '8px' }} />
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Click or Drag & Drop image here (will be resized and compressed)</p>
                          <input id="ad-upload-input" type="file" accept="image/*" onChange={(e) => handleAdImageUpload(e.target.files?.[0])} style={{ display: 'none' }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ width: '80mm', flexShrink: 0, padding: '10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>80mm Print Preview</h3>
                  <div style={{ border: '1px dashed var(--border-light)', padding: '4mm', fontFamily: "'JetBrains Mono', 'Consolas', monospace", fontSize: '11px', lineHeight: '1.45', background: '#fff', color: '#000' }}>
                    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                      <h2 style={{ fontSize: '16px', margin: '0 0 4px', fontWeight: 'bold' }}>{storeName || "Store Name"}</h2>
                      {storeAddress && <p style={{ margin: 0 }}>{storeAddress}</p>}
                      {storePhone && <p style={{ margin: 0 }}>Ph: {storePhone}</p>}
                    </div>
                    <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Item x1</span><span>₹100</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Item x2</span><span>₹250</span></div>
                    <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px' }}><span>TOTAL</span><span>₹350</span></div>
                    <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                      <QRCodeSVG value={`upi://pay?pa=dummy&pn=${encodeURIComponent(storeName || "Store Name")}`} size={80} style={{ display: 'inline-block', margin: '0 auto', maxWidth: '100%', height: 'auto' }} />
                      <p style={{ margin: '4px 0 0', fontSize: '10px', fontWeight: 'bold' }}>DEMO ONLY - NO REAL PAYMENT</p>
                      <p style={{ margin: '2px 0 0', fontSize: '9px' }}>{upiId || "UPI ID"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Management */}
              <div className="staff-section">
                <h3><Shield size={14} /> Staff Management</h3>
                <div className="panel-add-form">
                  <input id="staff-add-name" className="form-input" placeholder="Name" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} onKeyDown={(e) => focusNext(e, 'staff-add-pin')} />
                  <input id="staff-add-pin" className="form-input mono" placeholder="PIN (4 digits)" maxLength={4} value={newStaffPin} onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => focusNext(e, 'staff-add-role')} />
                  <select id="staff-add-role" className="role-select" value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleAddStaff(); }}>
                    <option value="cashier">Cashier</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button className="btn-add" onClick={handleAddStaff} title="Add Staff"><Plus size={16} /></button>
                </div>
                <table className="panel-table">
                  <thead><tr><th>ID</th><th>Name</th><th>Role</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
                  <tbody>
                    {staff.map((s) => (
                      <tr key={s.id}>
                        <td className="mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.id}</td>
                        <td>{s.name}</td>
                        <td><span className={`role-badge ${s.role}`}>{s.role}</span></td>
                        <td>
                          <div className="actions">
                            {staff.length > 1 && !(staff.filter((x) => x.role === "admin").length === 1 && s.role === "admin") && (
                              <button className="icon-btn delete" onClick={() => setDeleteConfirm({ type: "staff", id: s.id })} title="Delete"><Trash2 size={14} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CATALOG PANEL ═══ */}
      {showCatalog && isAdmin && (
        <div className="panel-section">
          <div className="panel">
            <div className="panel-body">
              <h2 className="card-title"><Package size={14} className="icon" /> Product Database</h2>
              <div className="add-item-tabs" style={{ marginBottom: "16px" }}>
                <button className={`add-item-tab ${catalogTab === "fixed" ? "active" : ""}`} onClick={() => setCatalogTab("fixed")}>📦 Fixed Products</button>
                <button className={`add-item-tab ${catalogTab === "loose" ? "active" : ""}`} onClick={() => setCatalogTab("loose")}>✏️ Loose Products</button>
              </div>
              <input className="form-input panel-search" placeholder={catalogTab === "fixed" ? "Search by name or barcode…" : "Search by name…"} value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} />
              <div className="panel-add-form">
                <input id="cat-manage-name" className="form-input" placeholder="Product name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} onKeyDown={(e) => focusNext(e, catalogTab === 'fixed' ? 'cat-manage-barcode' : 'cat-manage-mrp')} />
                {catalogTab === "fixed" && <input id="cat-manage-barcode" className="form-input mono" placeholder="Barcode" value={newCatBarcode} onChange={(e) => setNewCatBarcode(e.target.value)} onKeyDown={(e) => focusNext(e, 'cat-manage-mrp')} />}
                <input id="cat-manage-price" className="form-input mono" placeholder="PRICE" value={newCatMrp} readOnly disabled title="Computed from MRP" />
                <input id="cat-manage-mrp" className="form-input mono" placeholder="MRP" value={newCatMrp} onChange={(e) => setNewCatMrp(e.target.value)} inputMode="decimal" onKeyDown={(e) => focusNext(e, 'cat-manage-wholesale')} />
                <input id="cat-manage-wholesale" className="form-input mono" placeholder="Wholesale (Opt)" value={newCatWholesale} onChange={(e) => setNewCatWholesale(e.target.value)} inputMode="decimal" onKeyDown={(e) => { if (e.key === 'Enter') handleAddCatalogProduct(); }} />
                <button className="btn-add" onClick={handleAddCatalogProduct} title="Add Product"><Plus size={16} /></button>
              </div>
              <table className="panel-table">
                <thead><tr>{catalogTab === "fixed" && <th>Barcode</th>}<th>Name</th><th>Price</th><th>MRP</th><th>Wholesale</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
                <tbody>
                  {(catalogTab === "fixed" ? filteredCatalog : filteredLooseCatalog).map((p) => (
                    <tr key={p.id}>
                      {catalogTab === "fixed" && <td className="mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.barcode}</td>}
                      <td>{editingProductId === p.id
                        ? <input className="edit-inline-input" value={editProductName} onChange={(e) => setEditProductName(e.target.value)} autoFocus />
                        : p.name}</td>
                      <td className="mono">{editingProductId === p.id
                        ? <input className="edit-inline-input mono" value={editProductMrp} readOnly disabled style={{ width: 60, opacity: 0.7 }} />
                        : INR(p.price)}</td>
                      <td className="mono">{editingProductId === p.id
                        ? <input className="edit-inline-input mono" value={editProductMrp} onChange={(e) => setEditProductMrp(e.target.value)} style={{ width: 60 }} />
                        : (p.mrp ? INR(p.mrp) : '-')}</td>
                      <td className="mono">{editingProductId === p.id
                        ? <input className="edit-inline-input mono" value={editProductWholesale} onChange={(e) => setEditProductWholesale(e.target.value)} style={{ width: 60 }} />
                        : (p.wholesale ? INR(p.wholesale) : '-')}</td>
                      <td>
                        <div className="actions">
                          {editingProductId === p.id ? (
                            <>
                              <button className="icon-btn save" onClick={saveEditProduct} title="Save"><Save size={14} /></button>
                              <button className="icon-btn cancel" onClick={() => setEditingProductId(null)} title="Cancel"><X size={14} /></button>
                            </>
                          ) : (
                            <>
                              <button className="icon-btn edit" onClick={() => startEditProduct(p)} title="Edit"><Edit3 size={14} /></button>
                              <button className="icon-btn delete" onClick={() => setDeleteConfirm({ type: catalogTab === "fixed" ? "product" : "loose_product", id: p.id })} title="Delete"><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(catalogTab === "fixed" ? filteredCatalog : filteredLooseCatalog).length === 0 && <p className="cart-empty">No products found.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CUSTOMERS PANEL ═══ */}
      {showCustomers && (
        <div className="panel-section">
          <div className="panel">
            <div className="panel-body">
              <h2 className="card-title"><Users size={14} className="icon" /> Customers</h2>
              <input className="form-input panel-search" placeholder="Search by name, phone, or ID…" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
              <div className="panel-add-form">
                <input className="form-input" placeholder="Customer name" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} />
                <input className="form-input" placeholder="Phone number" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} />
                <button className="btn-add" onClick={handleAddCustomer} title="Add Customer"><UserPlus size={16} /></button>
              </div>
              <table className="panel-table">
                <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
                <tbody>
                  {filteredCustomers.map((c) => (
                    <tr key={c.id}>
                      <td className="mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.id}</td>
                      <td>{editingCustomerId === c.id
                        ? <input className="edit-inline-input" value={editCustName} onChange={(e) => setEditCustName(e.target.value)} autoFocus />
                        : c.name}</td>
                      <td>{editingCustomerId === c.id
                        ? <input className="edit-inline-input" value={editCustPhone} onChange={(e) => setEditCustPhone(e.target.value)} />
                        : c.phone}</td>
                      <td>
                        <div className="actions">
                          {editingCustomerId === c.id ? (
                            <>
                              <button className="icon-btn save" onClick={saveEditCustomer} title="Save"><Save size={14} /></button>
                              <button className="icon-btn cancel" onClick={() => setEditingCustomerId(null)} title="Cancel"><X size={14} /></button>
                            </>
                          ) : (
                            <>
                              <button className="icon-btn edit" onClick={() => startEditCustomer(c)} title="Edit"><Edit3 size={14} /></button>
                              <button className="icon-btn delete" onClick={() => setDeleteConfirm({ type: "customer", id: c.id })} title="Delete"><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCustomers.length === 0 && <p className="cart-empty">No customers found.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TRANSACTIONS PANEL ═══ */}
      {showTransactions && (
        <div className="panel-section">
          <div className="panel">
            <div className="panel-body">
              <h2 className="card-title"><Clock size={14} className="icon" /> Transaction History</h2>
              
              {/* Filters */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <input className="form-input" placeholder="Search name, ID, bill no..." value={txnSearchQuery} onChange={e => setTxnSearchQuery(e.target.value)} style={{ flex: 1, minWidth: '200px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>From:</label>
                  <input type="date" className="form-input" value={txnStartDate} onChange={e => setTxnStartDate(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>To:</label>
                  <input type="date" className="form-input" value={txnEndDate} onChange={e => setTxnEndDate(e.target.value)} />
                </div>
              </div>

              <table className="panel-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Customer</th>
                    <th>Payment</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(t => (
                    <tr key={t.id}>
                      <td className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.id}</td>
                      <td>{new Date(t.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td>
                        <span style={{ 
                          padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold',
                          background: t.status === 'PAID' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: t.status === 'PAID' ? 'var(--accent-emerald)' : 'var(--accent-red)'
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td>{t.customerName}</td>
                      <td style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{t.paymentMethod}</td>
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 'bold' }}>{INR(t.total)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => setViewingReceiptTxn(t)} title="View Receipt" style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer' }}>
                          <Eye size={16} />
                        </button>
                        <button onClick={() => { setPrintingHistoricalTxn(t); setTimeout(() => { window.print(); setPrintingHistoricalTxn(null); }, 100); }} title="Print Receipt" style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', marginLeft: '8px' }}>
                          <Printer size={16} />
                        </button>
                        {/* Removed Script */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTransactions.length === 0 && <p className="cart-empty">No transactions found.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ DASHBOARD PANEL ═══ */}
      {showDashboard && isAdmin && (
        <div className="panel-section">
          <div className="panel">
            <div className="panel-body">
              <h2 className="card-title"><BarChart3 size={14} className="icon" /> Income Dashboard</h2>
              <div className="dashboard-grid">
                <div className="metric-card total">
                  <span className="metric-label">Total Lifetime Income</span>
                  <span className="metric-value">{INR(dashboardStats.total)}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Yearly Income (This Year)</span>
                  <span className="metric-value">{INR(dashboardStats.yearly)}</span>
                  <span className="metric-sub">Avg/Yr: {INR(dashboardStats.avgYearly)}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Monthly Income (This Month)</span>
                  <span className="metric-value">{INR(dashboardStats.monthly)}</span>
                  <span className="metric-sub">Avg/Mo: {INR(dashboardStats.avgMonthly)}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Daily Income (Today)</span>
                  <span className="metric-value">{INR(dashboardStats.daily)}</span>
                  <span className="metric-sub">Avg/Day: {INR(dashboardStats.avgDaily)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SESSION TABS ═══ */}
      <div className="session-tabs-wrapper">
        <div className="session-tabs">
          {sessions.map((s) => {
            const sTotal = s.items.reduce((sum, it) => sum + it.price * it.qty, 0);
            const isActive = s.id === activeId;
            return (
              <button key={s.id} onClick={() => setActiveId(s.id)} className={`session-tab ${isActive ? "active" : ""}`}>
                <span>Bill #{String(s.billNo).padStart(4, "0")}</span>
                {sTotal > 0 && <span className="bill-total">{INR(sTotal)}</span>}
                {s.paymentStatus === "paid" && <CheckCircle2 size={13} className="paid-icon" />}
                <span className="close-btn" onClick={(e) => { e.stopPropagation(); closeSession(s.id); }}><X size={13} /></span>
              </button>
            );
          })}
          <button className="session-add-btn" onClick={newBill}><Plus size={14} /> New customer</button>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      {(!showSettings && !showCatalog && !showCustomers && !showTransactions && !showDashboard) && (
      <div className="main-content">
            {/* ── LEFT COLUMN ── */}
            <div>
              {/* Customer Selector */}
              <div className="glass-card customer-selector">
                <div className="customer-selector-inner">
                  <Users size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  {active.customerId && selectedCustomer ? (
                    <div className="customer-selected">
                      <span>{selectedCustomer.name}</span>
                      <span className="cust-id">{selectedCustomer.id}</span>
                      <span className="remove-btn" onClick={() => updateActive({ customerId: null })}><X size={14} /></span>
                    </div>
                  ) : (
                    <div style={{ flex: 1, position: "relative" }}>
                      <input
                        className="customer-search-input" placeholder="Search & assign customer…"
                        value={custSelectorSearch}
                        onChange={(e) => { setCustSelectorSearch(e.target.value); setShowCustDropdown(true); }}
                        onFocus={() => setShowCustDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCustDropdown(false), 200)}
                      />
                      {showCustDropdown && (
                        <div className="customer-dropdown">
                          {filteredCustomersForSelector.length > 0 ? filteredCustomersForSelector.map((c) => (
                            <div key={c.id} className="customer-dropdown-item" onMouseDown={() => selectCustomerForBill(c.id)}>
                              <span>{c.name} · {c.phone}</span>
                              <span className="cust-detail-id">{c.id}</span>
                            </div>
                          )) : <div className="customer-dropdown-empty">No customers found. Add via the Customers panel.</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

          {/* Add Item Card */}
          <div className="glass-card">
            <h2 className="card-title"><Plus size={14} className="icon" /> Add Item</h2>
            <div className="add-item-tabs">
              <button className={`add-item-tab ${addMode === "catalog" ? "active" : ""}`} onClick={() => setAddMode("catalog")}>📦 Catalog / Scan</button>
              <button className={`add-item-tab ${addMode === "loose" ? "active" : ""}`} onClick={() => setAddMode("loose")}>✏️ Loose Item</button>
            </div>

            {addMode === "catalog" ? (
              <div className="add-item-form catalog-mode">
                <div style={{ display: "flex", gap: "4px" }}>
                  <input id="cat-add-barcode" list="catalog-barcodes" className="form-input mono" style={{ flex: 1, minWidth: 0 }} placeholder="Barcode" value={barcodeInput}
                    onChange={handleBarcodeInputChange}
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); if (barcodeInput) handleManualBarcode(); else document.getElementById('cat-add-name')?.focus(); } }} />
                  <button className="btn-secondary" style={{ padding: "0 10px", flexShrink: 0 }} onClick={() => setShowCamera(true)} title="Scan with PC Camera">
                    <Camera size={18} />
                  </button>
                </div>
                <input id="cat-add-name" list="catalog-names" ref={nameRef} className="form-input" placeholder="Item name" value={name}
                  onChange={(e) => handleNameChange(e, false)}
                  onKeyDown={(e) => focusNext(e, 'cat-add-mrp')} />
                <input id="cat-add-price" className="form-input mono" placeholder="PRICE" value={active.billMode === 'wholesale' ? (wholesale || mrp) : mrp} readOnly disabled title="Computed Price" />
                <input id="cat-add-mrp" className="form-input mono" placeholder="MRP" value={mrp} inputMode="decimal"
                  onChange={(e) => setMrp(e.target.value)}
                  onKeyDown={(e) => focusNext(e, 'cat-add-wholesale')} />
                <input id="cat-add-wholesale" className="form-input mono" placeholder="Wholesale (Opt)" value={wholesale} inputMode="decimal"
                  onChange={(e) => setWholesale(e.target.value)}
                  onKeyDown={(e) => focusNext(e, 'cat-add-qty')} />
                <input id="cat-add-qty" className="form-input mono" placeholder="Qty" value={qty} inputMode="decimal"
                  onChange={(e) => setQty(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addItem()} />
                <button className="btn-add" onClick={addItem} title="Add Item"><Plus size={18} /></button>
                
                <datalist id="catalog-barcodes">
                  {catalog.map(c => <option key={c.id} value={c.barcode} />)}
                </datalist>
                <datalist id="catalog-names">
                  {catalog.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
            ) : (
              <div className="add-item-form loose-mode">
                <input id="loose-add-name" list="loose-names" className="form-input" placeholder="Item name (e.g. Loose Jaggery)" value={name}
                  onChange={(e) => handleNameChange(e, true)}
                  onKeyDown={(e) => focusNext(e, 'loose-add-mrp')} />
                <input id="loose-add-price" className="form-input mono" placeholder="PRICE" value={active.billMode === 'wholesale' ? (wholesale || mrp) : mrp} readOnly disabled title="Computed Price" />
                <input id="loose-add-mrp" className="form-input mono" placeholder="MRP" value={mrp} inputMode="decimal"
                  onChange={(e) => setMrp(e.target.value)}
                  onKeyDown={(e) => focusNext(e, 'loose-add-wholesale')} />
                <input id="loose-add-wholesale" className="form-input mono" placeholder="Wholesale (Opt)" value={wholesale} inputMode="decimal"
                  onChange={(e) => setWholesale(e.target.value)}
                  onKeyDown={(e) => focusNext(e, 'loose-add-qty')} />
                <input id="loose-add-qty" className="form-input mono" placeholder="Qty" value={qty} inputMode="decimal"
                  onChange={(e) => setQty(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLooseItem()} />
                <button className="btn-add" onClick={addLooseItem} title="Add Loose Item"><Plus size={18} /></button>
                
                <datalist id="loose-names">
                  {looseCatalog.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="glass-card">
            <div className="cart-list">
              {active.items.length === 0 ? (
                <p className="cart-empty">No items yet — scan a barcode or add products above.</p>
              ) : (
                active.items.map((it) => (
                  <div key={it.id} className="cart-item">
                    <div className="cart-item-info">
                      <p className="cart-item-name">
                        {it.name}
                        {it.isLoose && <span className="loose-badge">LOOSE</span>}
                      </p>
                      <p className="cart-item-price-each">
                        {INR(getActivePrice(it))} each {active.billMode === 'wholesale' && it.wholesale && <span style={{fontSize:'0.7rem', color:'var(--accent-emerald)'}}>(Wholesale)</span>}
                        {it.mrp && it.mrp > getActivePrice(it) && <span style={{textDecoration:'line-through', marginLeft:'4px', color:'var(--text-muted)'}}>{INR(it.mrp)}</span>}
                      </p>
                    </div>
                    <div className="cart-item-actions">
                      <div className="qty-control">
                        <button className="qty-btn minus" onClick={() => updateQty(it.id, -1)}><Minus size={14} /></button>
                        <span className="qty-value">{it.qty}</span>
                        <button className="qty-btn plus" onClick={() => updateQty(it.id, 1)}><Plus size={14} /></button>
                      </div>
                      <span className="cart-item-total">{INR(getActivePrice(it) * it.qty)}</span>
                      <button className="cart-item-delete" onClick={() => removeItem(it.id)}><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div>
          {/* Wholesale Mode Toggle */}
          <div className="settings-field" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(99, 102, 241, 0.05)', padding: '12px', borderRadius: '8px' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Wholesale Billing Mode</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Apply wholesale rates to this bill</p>
            </div>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
              <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={active.billMode === 'wholesale'} onChange={(e) => updateActive({ billMode: e.target.checked ? 'wholesale' : 'retail' })} />
              <span className="slider round" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: active.billMode === 'wholesale' ? 'var(--accent-purple)' : '#ccc', borderRadius: '24px', transition: '.4s' }}>
                <span style={{ position: 'absolute', height: '16px', width: '16px', left: active.billMode === 'wholesale' ? '20px' : '4px', bottom: '4px', backgroundColor: 'white', borderRadius: '50%', transition: '.4s' }}></span>
              </span>
            </label>
          </div>

          {/* Tax / Discount */}
          <div className="tax-discount-row" style={{ marginBottom: '16px' }}>
            <div className="field-group">
              <label className="field-label">Tax / GST %</label>
              <input className="form-input mono" value={active.taxRate} onChange={(e) => updateActive({ taxRate: e.target.value })} inputMode="decimal" />
            </div>
            <div className="field-group">
              <label className="field-label">
                Discount ({active.discountType === "flat" ? "₹" : "%"})
                <button className="toggle-link" onClick={() => updateActive({ discountType: active.discountType === "flat" ? "percent" : "flat" })}>
                  switch to {active.discountType === "flat" ? "%" : "₹"}
                </button>
              </label>
              <input className="form-input mono" value={active.discount} onChange={(e) => updateActive({ discount: e.target.value })} inputMode="decimal" />
            </div>
          </div>

          {/* Bill Summary */}
          <div className="summary-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="card-title" style={{ margin: 0 }}>Bill Summary · #{String(active.billNo).padStart(4, "0")}</h2>
              <button onClick={cancelBill} style={{ color: 'var(--accent-red)', background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
            </div>
            <div className="summary-row"><span>Subtotal</span><span className="mono">{INR(subtotal)}</span></div>
            {Number(active.taxRate) > 0 && <div className="summary-row tax"><span>Tax ({active.taxRate}%)</span><span className="mono">+{INR(taxAmount)}</span></div>}
            {discountAmount > 0 && <div className="summary-row discount"><span>Discount</span><span className="mono">-{INR(discountAmount)}</span></div>}
            <div className="summary-divider" />
            <div className="summary-grand-total">
              <span className="label">Grand Total</span>
              <span className="amount">{INR(total)}</span>
            </div>
            {selectedCustomer && <p className="summary-customer">Customer: {selectedCustomer.name} ({selectedCustomer.id})</p>}
            <p className="summary-staff">Billed by: {loggedInStaff.name} ({loggedInStaff.id})</p>
          </div>

          {/* Payment Method */}
          <div className="payment-method-group">
            <button className={`payment-method-btn cash ${active.paymentMethod === "cash" ? "active" : ""}`}
              onClick={() => updateActive({ paymentMethod: "cash" })}>
              <Banknote size={16} /> Cash
            </button>
            <button className={`payment-method-btn upi ${active.paymentMethod === "upi" ? "active" : ""}`}
              onClick={() => updateActive({ paymentMethod: "upi" })}>
              <Smartphone size={16} /> UPI
            </button>
          </div>

          {/* Payment Status */}
          <button className={`payment-status-btn ${active.paymentStatus}`} onClick={handlePayment}>
            {active.paymentStatus === "paid"
              ? <><CheckCircle2 size={16} /> Marked as Paid ({active.paymentMethod === "upi" ? "UPI" : "Cash"})</>
              : <><Clock size={16} /> Payment Pending — tap when received</>}
          </button>

          {/* QR Code (UPI only) */}
          {active.paymentMethod === "upi" && upiId && total > 0 && (
            <div className="qr-card">
              <h2 className="card-title"><QrCode size={14} className="icon" /> DEMO ONLY - NO REAL PAYMENT</h2>
              <div style={{ background: 'white', padding: '10px', borderRadius: '8px', display: 'inline-block' }}>
                <QRCodeSVG value={upiUri} size={200} bgColor="#ffffff" fgColor="#000000" />
              </div>
              <p className="upi-id">{upiId}</p>
              <p className="upi-hint">DEMO ONLY - NO REAL PAYMENT PROCESSED.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={handlePrint} disabled={active.items.length === 0 || active.paymentStatus !== 'paid'}>
              <Printer size={16} /> Print Receipt
            </button>
            <button className="btn-secondary" onClick={cancelBill}>
              <RotateCcw size={15} /> Clear
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ═══ ADD CONFIRM MODAL ═══ */}
      {addConfirm && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: "12px", color: "var(--text-primary)" }}>Unknown Item Detected</h3>
            <p style={{ marginBottom: "20px", color: "var(--text-secondary)" }}>
              "{addConfirm.name}" is not in the database. Add it for future autofill?
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => confirmAutoAdd(false)}>No, Just Bill</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => confirmAutoAdd(true)}>Yes, Save It</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ NEW PRODUCT MODAL ═══ */}
      {showNewProductModal && (
        <div className="modal-overlay" onClick={() => setShowNewProductModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-title">
              <span>New Product Detected</span>
              <button className="modal-close" onClick={() => setShowNewProductModal(false)}><X size={18} /></button>
            </div>
            <p className="modal-subtitle">
              Barcode <strong className="mono">{pendingBarcode}</strong> not found in catalog. Enter product details:
            </p>
            <div className="login-field">
              <label>Product Name</label>
              <input id="np-name" className="form-input" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="Enter product name" autoFocus
                onKeyDown={(e) => focusNext(e, 'np-mrp')} 
              />
            </div>
            <div className="login-field">
              <label>PRICE (₹)</label>
              <input 
                id="np-price"
                className="form-input mono" 
                value={active.billMode === 'wholesale' ? (newProductWholesale || newProductMrp) : newProductMrp} 
                readOnly disabled
                placeholder="0.00" 
              />
            </div>
            <div className="login-field">
              <label>MRP (₹)</label>
              <input 
                id="np-mrp"
                className="form-input mono" 
                value={newProductMrp} 
                onChange={(e) => setNewProductMrp(e.target.value)} 
                placeholder="0.00" 
                inputMode="decimal"
                onKeyDown={(e) => focusNext(e, 'np-wholesale')} 
              />
            </div>
            <div className="login-field">
              <label>Wholesale (Opt)</label>
              <input 
                id="np-wholesale"
                className="form-input mono" 
                value={newProductWholesale} 
                onChange={(e) => setNewProductWholesale(e.target.value)} 
                placeholder="0.00" 
                inputMode="decimal"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleNewProductSubmit();
                  }
                }} 
              />
            </div>
            
            {/* Digital Numpad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                <button key={num} className="btn-secondary" style={{ padding: '12px', fontSize: '1.2rem', fontWeight: 'bold' }} 
                  onClick={() => setNewProductMrp(prev => prev + num)}>{num}</button>
              ))}
              <button className="btn-secondary" style={{ padding: '12px', fontSize: '1.2rem', fontWeight: 'bold' }} 
                onClick={() => setNewProductMrp(prev => prev.includes('.') ? prev : prev + '.')}>.</button>
              <button className="btn-secondary" style={{ padding: '12px', fontSize: '1.2rem', fontWeight: 'bold' }} 
                onClick={() => setNewProductMrp(prev => prev + '0')}>0</button>
              <button className="btn-secondary" style={{ padding: '12px', fontSize: '1.2rem', fontWeight: 'bold', background: 'var(--bg-hover)' }} 
                onClick={() => setNewProductMrp(prev => prev.slice(0, -1))}>⌫</button>
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowNewProductModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleNewProductSubmit} disabled={!newProductName.trim() || !newProductMrp}>Save & Add to Bill</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRMATION MODAL ═══ */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title"><span>Confirm Delete</span></div>
            <p className="modal-subtitle">Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CHECKOUT MODAL ═══ */}
      {showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-title">
              <span>Complete Payment</span>
              <button className="modal-close" onClick={() => setShowCheckout(false)}><X size={18} /></button>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Amount Due</div>
              <div className="mono" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {INR(Math.max(0, active.items.reduce((acc, it) => acc + it.price * it.qty, 0) * (1 + Number(active.taxRate)/100) - (active.discountType === 'flat' ? Number(active.discount) : active.items.reduce((acc, it) => acc + it.price * it.qty, 0) * Number(active.discount)/100)))}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
                Via {active.paymentMethod === 'cash' ? 'Cash' : 'UPI'}
              </div>
            </div>

            <div className="login-field">
              <label>Customer Phone (Optional)</label>
              <input list="checkout-customers" id="checkout-phone" className="form-input mono" placeholder="10-digit phone" value={checkoutPhone} onChange={e => {
                setCheckoutPhone(e.target.value);
                const match = customers.find(c => c.phone === e.target.value);
                if (match) setCheckoutName(match.name);
              }} onKeyDown={(e) => focusNext(e, 'checkout-name')} />
              <datalist id="checkout-customers">
                {customers.map(c => <option key={c.id} value={c.phone}>{c.name}</option>)}
              </datalist>
            </div>
            <div className="login-field">
              <label>Customer Name</label>
              <input id="checkout-name" className="form-input" placeholder="Walk-in Customer" value={checkoutName} onChange={e => setCheckoutName(e.target.value)} 
                onKeyDown={(e) => { if (e.key === "Enter") finalizeCheckout(); }} />
            </div>

            <div className="modal-actions" style={{ marginTop: '32px' }}>
              <button className="btn-secondary" onClick={() => setShowCheckout(false)}>Back</button>
              <button className="btn-primary" onClick={finalizeCheckout}>Confirm & Print</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CAMERA SCANNER MODAL ═══ */}
      {showCamera && (
        <CameraScanner
          onScan={(code) => {
            setShowCamera(false);
            handleBarcodeScan(code);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* ═══ VIEW RECEIPT MODAL ═══ */}
      {viewingReceiptTxn && (
        <div className="modal-overlay" onClick={() => setViewingReceiptTxn(null)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="card-title" style={{ margin: 0 }}>Receipt Details</h2>
              <button className="btn-secondary" onClick={() => setViewingReceiptTxn(null)} style={{ padding: '4px' }}><X size={16} /></button>
            </div>
            
            <div className="receipt-container" style={{ margin: '0 auto', zoom: 0.9 }}>
              <div className="receipt-header">
                <h2>{storeName}</h2>
                <p>{storeAddress}</p>
                <p>Ph: {storePhone}</p>
              </div>
              <p className="receipt-divider">{"=".repeat(32)}</p>
              <div className="receipt-meta-row">
                <span>Date: {new Date(viewingReceiptTxn.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                <span>Bill: #{String(viewingReceiptTxn.billNo).padStart(4, "0")}</span>
              </div>
              <p className="receipt-meta">Txn ID: {viewingReceiptTxn.id}</p>
              <p className="receipt-meta">Customer: {viewingReceiptTxn.customerName}</p>
              <p className="receipt-meta">ID: {viewingReceiptTxn.customerId}</p>
              <p className="receipt-divider">{"─".repeat(32)}</p>
              
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '8px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px dashed #000' }}>
                    <th style={{ paddingBottom: '4px' }}>Item</th>
                    <th style={{ textAlign: 'center', paddingBottom: '4px' }}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingReceiptTxn.items.map((it) => (
                    <tr key={it.id}>
                      <td style={{ paddingTop: '4px', verticalAlign: 'top', wordBreak: 'break-word', paddingRight: '8px' }}>
                        {it.name}
                      </td>
                      <td style={{ textAlign: 'center', paddingTop: '4px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        x{it.qty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="receipt-divider">{"─".repeat(32)}</p>
              <div className="receipt-grand-total"><span>GRAND TOTAL</span><span>{INR(viewingReceiptTxn.total)}</span></div>
              <p className="receipt-divider">{"─".repeat(32)}</p>
              <p className="receipt-payment">{viewingReceiptTxn.status === "PAID" ? `✓ PAID via ${viewingReceiptTxn.paymentMethod === "upi" ? "UPI" : "Cash"}` : "PENDING"}</p>
              <p className="receipt-footer">Thank you — visit again!</p>
            </div>
            
            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => setViewingReceiptTxn(null)}>Close</button>
            </div>
          </div>
        </div>
      )}


      </div>
      {/* ═══ PRINT RECEIPT (hidden) ═══ */}
      <div id="receipt">
        {printingHistoricalTxn ? (
          <>
            <div className="receipt-header">
              <p className="receipt-shop-name">{storeName}</p>
              <p className="receipt-shop-detail">{storeAddress}</p>
              <p className="receipt-shop-detail">Ph: {storePhone}</p>
            </div>
            <p className="receipt-divider">{"─".repeat(32)}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <p className="receipt-meta">{new Date(printingHistoricalTxn.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
              <p className="receipt-meta" style={{ fontWeight: 'bold' }}>REPRINT</p>
            </div>
            <p className="receipt-meta">Bill #{String(printingHistoricalTxn.billNo).padStart(4, "0")}</p>
            <p className="receipt-divider">{"─".repeat(32)}</p>
            <p className="receipt-meta">Txn ID: {printingHistoricalTxn.id}</p>
            <p className="receipt-meta">Customer: {printingHistoricalTxn.customerName}</p>
            <p className="receipt-divider">{"─".repeat(32)}</p>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '8px' }}>
              <thead>
                <tr style={{ borderBottom: '1px dashed #000' }}>
                  <th style={{ paddingBottom: '4px' }}>Item</th>
                  <th style={{ textAlign: 'center', paddingBottom: '4px' }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {printingHistoricalTxn.items.map((it) => (
                  <tr key={it.id}>
                    <td style={{ paddingTop: '4px', verticalAlign: 'top', wordBreak: 'break-word', paddingRight: '8px' }}>
                      {it.name}
                    </td>
                    <td style={{ textAlign: 'center', paddingTop: '4px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                      x{it.qty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="receipt-divider">{"─".repeat(32)}</p>
            <div className="receipt-grand-total"><span>GRAND TOTAL</span><span>{INR(printingHistoricalTxn.total)}</span></div>
            <p className="receipt-divider">{"─".repeat(32)}</p>
            <p className="receipt-payment">{printingHistoricalTxn.status === "PAID" ? `✓ PAID via ${printingHistoricalTxn.paymentMethod === "upi" ? "UPI" : "Cash"}` : "PENDING"}</p>
            <p className="receipt-footer">Thank you — visit again!</p>
          </>
        ) : (
          <>
            <div className="receipt-header">
              <p className="receipt-shop-name">{storeName}</p>
              <p className="receipt-shop-detail">{storeAddress}</p>
              <p className="receipt-shop-detail">Ph: {storePhone}</p>
            </div>
            <p className="receipt-divider">{"─".repeat(32)}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <p className="receipt-meta">{dateStr} {timeStr}</p>
              <p className="receipt-meta" style={{ fontWeight: 'bold' }}>RATE: {active.billMode === 'wholesale' ? 'WHOLESALE' : 'FIXED'}</p>
            </div>
            <p className="receipt-meta">Bill #{String(active.billNo).padStart(4, "0")}</p>
            <p className="receipt-meta">Billed by: {loggedInStaff.name} ({loggedInStaff.id})</p>
            <p className="receipt-divider">{"─".repeat(32)}</p>
            {selectedCustomer && (
              <>
                <p className="receipt-meta">Customer: {selectedCustomer.name}</p>
                <p className="receipt-meta">Ph: {selectedCustomer.phone}</p>
                <p className="receipt-meta">ID: {selectedCustomer.id}</p>
                <p className="receipt-divider">{"─".repeat(32)}</p>
              </>
            )}
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '8px' }}>
              <thead>
                <tr style={{ borderBottom: '1px dashed #000' }}>
                  <th style={{ paddingBottom: '4px' }}>Item</th>
                  <th style={{ paddingBottom: '4px' }}>MRP</th>
                  {active.billMode === 'wholesale' && <th style={{ paddingBottom: '4px' }}>Wholesale</th>}
                  <th style={{ textAlign: 'right', paddingBottom: '4px' }}>PRICE</th>
                </tr>
              </thead>
              <tbody>
                {active.items.map((it) => (
                  <tr key={it.id}>
                    <td style={{ paddingTop: '4px', verticalAlign: 'top', wordBreak: 'break-word', paddingRight: '8px' }}>
                      <div>{it.name} (x{it.qty})</div>
                      {it.barcode && <div style={{ color: '#666' }}>ID: {it.barcode}</div>}
                    </td>
                    <td style={{ paddingTop: '4px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{it.mrp ? INR(it.mrp) : '-'}</td>
                    {active.billMode === 'wholesale' && (
                      <td style={{ paddingTop: '4px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        {it.wholesale ? INR(it.wholesale) : (it.mrp ? INR(it.mrp) : '-')}
                      </td>
                    )}
                    <td style={{ textAlign: 'right', paddingTop: '4px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{INR(getActivePrice(it) * it.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="receipt-divider">{"─".repeat(32)}</p>
            <div className="receipt-row"><span>Subtotal</span><span>{INR(subtotal)}</span></div>
            {Number(active.taxRate) > 0 && <div className="receipt-row"><span>Tax ({active.taxRate}%)</span><span>+{INR(taxAmount)}</span></div>}
            {discountAmount > 0 && <div className="receipt-row"><span>Discount</span><span>-{INR(discountAmount)}</span></div>}
            <p className="receipt-divider">{"─".repeat(32)}</p>
            <div className="receipt-grand-total"><span>GRAND TOTAL</span><span>{INR(total)}</span></div>
            {totalSaved > 0 && (
              <div className="receipt-row" style={{ marginTop: '4px', fontWeight: 'bold' }}>
                <span>Total Saved</span>
                <span>{INR(totalSaved)}</span>
              </div>
            )}
            <p className="receipt-divider">{"─".repeat(32)}</p>
            <p className="receipt-payment">{active.paymentStatus === "paid" ? `✓ PAID via ${active.paymentMethod === "upi" ? "UPI" : "Cash"}` : "PAYMENT PENDING"}</p>
            <p className="receipt-divider">{"─".repeat(32)}</p>
            <p className="receipt-footer">Thank you — visit again!</p>
          </>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════
   CUSTOMER DISPLAY COMPONENT
   ══════════════════════════════════════════════ */
function CustomerDisplay() {
  const [data, setData] = useState(null);
  const [time, setTime] = useState(new Date());
  const [config, setConfig] = useState({ storeName: "Our Store", adImage: "" });
  const [idleState, setIdleState] = useState('welcome');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (idleState === 'thank_you') {
      const timer = setTimeout(() => setIdleState('welcome'), 5000);
      return () => clearTimeout(timer);
    }
  }, [idleState]);

  useEffect(() => {
    const channel = new BroadcastChannel('pos-sync');
    channel.onmessage = (e) => {
      if (e.data.type === 'SYNC') {
        setData(e.data.payload);
        setConfig({ storeName: e.data.payload.storeName, adImage: e.data.payload.adImage });
        if (e.data.payload.active && (e.data.payload.active.paymentStatus === 'paid' || e.data.payload.active.items.length === 0)) {
           // Do not override 'thank_you' state if it's already running, but ensure it's at least welcome
           setIdleState(prev => prev === 'thank_you' ? 'thank_you' : 'welcome');
        } else {
           setIdleState('welcome');
        }
      } else if (e.data.type === 'CLEAR') {
        setData(null);
        setIdleState('thank_you');
      }
    };
    channel.postMessage({ type: 'PING' });
    return () => channel.close();
  }, []);

  const idleView = idleState === 'thank_you' ? (
    <div className="cd-idle">
      <h1 style={{fontSize: '5rem'}}>Thank you!</h1>
      <h2 style={{fontSize: '3rem'}}>Please visit again!</h2>
    </div>
  ) : (
    <div className="cd-idle">
      <h1>Welcome to {config.storeName}</h1>
      <h2>{time.toLocaleDateString()} {time.toLocaleTimeString()}</h2>
      {config.adImage && <img src={config.adImage} alt="Advertisement" className="cd-ad" />}
    </div>
  );

  const isIdle = !data || !data.active || data.active.paymentStatus === 'paid' || data.active.items.length === 0;

  if (isIdle) {
    return <div className="customer-display-container">{idleView}</div>;
  }

  const { active, storeName, total, upiUri, upiId, subtotal, taxAmount, discountAmount, resolvedItems } = data;

  return (
    <div className="customer-display-container active-cast">
      <div className="cd-left">
        <h2 className="cd-store-name">{storeName}</h2>
        <h3 className="cd-bill-no">Bill #{String(active.billNo).padStart(4, "0")}</h3>
        <table className="cd-table">
          <thead>
            <tr>
              <th style={{textAlign: 'left'}}>Item</th>
              <th style={{textAlign: 'center'}}>Qty</th>
              <th style={{textAlign: 'right'}}>Price</th>
              <th style={{textAlign: 'right'}}>Total</th>
            </tr>
          </thead>
          <tbody>
            {resolvedItems.map((it, i) => (
              <tr key={i}>
                <td style={{textAlign: 'left'}}>{it.name}</td>
                <td style={{textAlign: 'center'}}>{it.qty}</td>
                <td style={{textAlign: 'right'}}>{it.resolvedPrice}</td>
                <td style={{textAlign: 'right', fontWeight: 'bold'}}>{it.resolvedTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="cd-totals">
          <div className="cd-totals-row"><span>Subtotal:</span> <span>{subtotal}</span></div>
          <div className="cd-totals-row"><span>Tax:</span> <span>{taxAmount}</span></div>
          {active.discountType && <div className="cd-totals-row"><span>Discount:</span> <span>-{discountAmount}</span></div>}
          <div className="cd-totals-grand"><span>Grand Total:</span> <span>{total}</span></div>
        </div>
      </div>
      <div className="cd-right">
        {active.paymentMethod === 'upi' && upiUri ? (
          <div className="cd-qr">
            <h2>DEMO ONLY - NO REAL PAYMENT<br/><span className="cd-qr-total">{total}</span></h2>
            <div className="cd-qr-img" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'white' }}>
               <QRCodeSVG value={upiUri} size={380} bgColor="#ffffff" fgColor="#000000" />
            </div>
            <p className="cd-qr-upi">{upiId}</p>
          </div>
        ) : (
          <div className="cd-payment-info">
            <h2>Total Due<br/><span className="cd-qr-total">{total}</span></h2>
            <p>Payment Method: {active.paymentMethod.toUpperCase()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
