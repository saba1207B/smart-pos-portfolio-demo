export const demoCatalog = [
  { id: 1, barcode: "1001", name: "Organic Apples (1kg)", price: 120, mrp: 150, wholesale: 100 },
  { id: 2, barcode: "1002", name: "Whole Wheat Bread", price: 40, mrp: 50, wholesale: 35 },
  { id: 3, barcode: "1003", name: "Almond Milk 1L", price: 250, mrp: 300, wholesale: 220 },
  { id: 4, barcode: "1004", name: "Farm Fresh Eggs (Dozen)", price: 80, mrp: 90, wholesale: 70 },
  { id: 5, barcode: "1005", name: "Avocado (Single)", price: 60, mrp: 80, wholesale: 50 },
  { id: 6, barcode: "1006", name: "Premium Coffee Beans 500g", price: 450, mrp: 550, wholesale: 400 },
];

export const demoLooseCatalog = [
  { id: 1, name: "Potatoes", price: 30, mrp: 40, wholesale: 25 },
  { id: 2, name: "Onions", price: 25, mrp: 35, wholesale: 20 },
];

export const demoCustomers = [
  { id: "CUS-1", name: "Rahul Sharma", phone: "9876543211", purchases: 1, totalSpent: 120, lastVisit: new Date().toISOString() },
  { id: "CUS-2", name: "Priya Singh", phone: "9876543212", purchases: 3, totalSpent: 550, lastVisit: new Date().toISOString() }
];

export const demoTransactions = [
  {
    id: "TXN-1701010101",
    date: new Date(Date.now() - 86400000).toISOString(), // yesterday
    billNo: 1,
    total: 120,
    paymentMethod: "cash",
    status: "PAID",
    customerId: "CUS-1",
    customerName: "Rahul Sharma",
    items: [{ id: "A", name: "Organic Apples (1kg)", price: 120, qty: 1, isLoose: false }]
  },
  {
    id: "TXN-1701010102",
    date: new Date().toISOString(), // today
    billNo: 2,
    total: 250,
    paymentMethod: "upi",
    status: "PAID",
    customerId: null,
    customerName: "Walk-in Customer",
    items: [{ id: "B", name: "Almond Milk 1L", price: 250, qty: 1, isLoose: false }]
  }
];

export const demoStaff = [
  { id: "admin", name: "Admin", pin: "1234", role: "admin" },
  { id: "cashier", name: "Cashier", pin: "0000", role: "cashier" }
];

export const demoSettings = {
  name: "Smart POS Demo Store",
  address: "123 Tech Park, Bangalore",
  phone: "1800-DEMO-POS",
  upi: "demo@upi"
};

export const resetDemoData = () => {
  localStorage.setItem("pos_catalog", JSON.stringify(demoCatalog));
  localStorage.setItem("pos_loose_catalog", JSON.stringify(demoLooseCatalog));
  localStorage.setItem("pos_customers", JSON.stringify(demoCustomers));
  localStorage.setItem("pos_transactions", JSON.stringify(demoTransactions));
  localStorage.setItem("pos_staff", JSON.stringify(demoStaff));
  localStorage.setItem("pos_settings", JSON.stringify(demoSettings));
};
