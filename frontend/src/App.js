import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import RegisterWithChoice from './pages/RegisterWithChoice';
import RegisterCreator from './pages/RegisterCreator';
import RegisterBrand from './pages/RegisterBrand';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import InfluencerWizard from './pages/InfluencerWizard';
import InfluencerDashboard from './pages/InfluencerDashboard';
import UGCWizard from './pages/UGCWizard';
import UGCDashboard from './pages/UGCDashboard';
import BrandDashboard from './pages/BrandDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SupportDashboard from './pages/SupportDashboard';
import InfluencerProfile from './pages/InfluencerProfile';
import ConnectSocial from './pages/ConnectSocial';
import BrowseUGCCreators from './pages/BrowseUGCCreators';
import UGCCreatorProfile from './pages/UGCCreatorProfile';
import ContentCreatorRoleSelect from './pages/ContentCreatorRoleSelect';
import Homepage from './pages/HomePage';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  return (
    <div className="App">
      <Navbar />
      <main className={isHome ? '' : 'main-content'}>
        <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<RegisterWithChoice />} />
          <Route path="/register-creator" element={<RegisterCreator />} />
          <Route path="/register-brand" element={<RegisterBrand />} />
          <Route 
            path="/choose-role" 
            element={
              <ProtectedRoute requireRole="content_creator">
                <ContentCreatorRoleSelect />
              </ProtectedRoute>
            } 
          />
              { /* RoleSelect removed: sub-role chosen at signup */ }
              <Route 
                path="/influencer/wizard" 
                element={
                  <ProtectedRoute requireRole="influencer">
                    <InfluencerWizard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/influencer/dashboard" 
                element={
                  <ProtectedRoute requireRole="influencer">
                    <InfluencerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/ugc/wizard" 
                element={
                  <ProtectedRoute requireRole="ugc_creator">
                    <UGCWizard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/ugc/dashboard" 
                element={
                  <ProtectedRoute requireRole="ugc_creator">
                    <UGCDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/brand/dashboard" 
                element={
                  <ProtectedRoute requireRole="brand">
                    <BrandDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute requireRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/support-dashboard" 
                element={
                  <ProtectedRoute requireRole="support">
                    <SupportDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/influencer/:id" 
                element={
                  <ProtectedRoute requireRole="brand">
                    <InfluencerProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/browse-ugc-creators" 
                element={
                  <ProtectedRoute requireRole="brand">
                    <BrowseUGCCreators />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/connect-social"
                element={
                  <ProtectedRoute>
                    <ConnectSocial />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/ugc-creator/:id" 
                element={
                  <ProtectedRoute requireRole="brand">
                    <UGCCreatorProfile />
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={<Homepage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
