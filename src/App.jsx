import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import CustomerHome from './pages/CustomerHome';
import AdminDashboard from './pages/AdminDashboard';
import Analytics from './pages/Analytics';
import KitchenDisplay from './pages/KitchenDisplay';
import Inventory from './pages/Inventory';
import SplashScreen from './components/SplashScreen';
import { InventoryService } from './services/inventoryService';

function AppContent() {
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Initialize inventory on app start
    InventoryService.initializeInventory();

    // Only show splash on home page
    if (location.pathname !== '/') {
      setLoading(false);
    }
  }, [location.pathname]);

  // Only show splash screen on home page
  const showSplash = loading && location.pathname === '/';

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setLoading(false)} />}
      <div style={{ display: showSplash ? 'none' : 'block' }}>
        <div className="container">
          <Routes>
            <Route path="/" element={<CustomerHome />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/inventory" element={<Inventory />} />
            <Route path="/kitchen" element={<KitchenDisplay />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <CartProvider>
      <Router>
        <AppContent />
      </Router>
    </CartProvider>
  );
}

export default App;
