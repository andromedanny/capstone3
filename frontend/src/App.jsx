// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import StoreSetup from './pages/StoreSetup';
import StoreTemplates from './pages/StoreTemplates';
import PrivateRoute from './components/PrivateRoute';
import DashboardLayout from './components/DashboardLayout';
import AddProduct from './pages/AddProduct';
import Payment from './pages/Payment';
import Shipping from './pages/Shipping';
import SiteBuilder from './pages/SiteBuilder';
import Settings from './pages/Settings'; 
import './App.css';

const DynamicStore = () => {
  const { templateId } = useParams();
  
  const storeComponents = {
    bladesmith: BladesmithStore,
    pottery: PotteryStore,
    balisong: BalisongStore,
    weavery: WeaveryStore,
    woodcarving: WoodCarvingStore
  };

  const StoreComponent = storeComponents[templateId];
  
  if (!StoreComponent) {
    return <div>Store template not found</div>;
  }

  return <StoreComponent />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/store-templates" element={<PrivateRoute><StoreTemplates /></PrivateRoute>} />
          <Route path="/store-setup/:templateId" element={<PrivateRoute><StoreSetup /></PrivateRoute>} />
          
          {/* Dashboard routes */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="addproducts" element={<AddProduct />} />
            <Route path="payment" element={<Payment />} />
            <Route path="shipping" element={<Shipping />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Site Builder route */}
          <Route path="/site-builder" element={<PrivateRoute><SiteBuilder /></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
