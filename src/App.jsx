import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import CustomerHome from './pages/CustomerHome';
import AdminDashboard from './pages/AdminDashboard';
import Analytics from './pages/Analytics';
import KitchenDisplay from './pages/KitchenDisplay';
import Inventory from './pages/Inventory';
import SplashScreen from './components/SplashScreen';
import { InventoryService } from './services/inventoryService';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize inventory on app start
    InventoryService.initializeInventory();
  }, []);

  return (
    <CartProvider>
      {loading && <SplashScreen onFinish={() => setLoading(false)} />}
      <div style={{ display: loading ? 'none' : 'block' }}>
        <Router>
          <div className="container">
            <Routes>
              <Route path="/" element={<CustomerHome />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/admin/inventory" element={<Inventory />} />
              <Route path="/kitchen" element={<KitchenDisplay />} />
            </Routes>
          </div>
        </Router>
      </div>
    </CartProvider>
  );
}

export default App;
