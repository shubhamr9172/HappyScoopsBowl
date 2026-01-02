import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
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
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <ProtectedRoute>
                  <Inventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen"
              element={
                <ProtectedRoute>
                  <KitchenDisplay />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
