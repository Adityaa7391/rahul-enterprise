import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Track from './pages/Track';
import ForgotPassword from './pages/forgotpass';
import ResetPassword from './pages/resetpass';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin login ka URL badal diya hai — Ab yahan se login hoga */}
          <Route path="/rahul-admin-portal" element={<Login />} />
          
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Admin Dashboard page */}
          <Route path="/admin" element={<Admin />} />
          
          {/* Public Pages (Jahan clients access karenge) */}
          <Route path="/track/:trackingId" element={<><Navbar /><Track /><Footer /></>} />
          <Route path="/track" element={<><Navbar /><Track /><Footer /></>} />
          <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;