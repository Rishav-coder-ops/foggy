// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MemoryNotification from './components/MemoryNotification';
import FloatingChatButton from './components/FloatingChatButton';
import MobileBottomNav from './components/MobileBottomNav';
import CompactChatModal from './components/CompactChatModal';
import CursorAtmosphere from './components/CursorAtmosphere';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import IndoorHacksPage from './pages/IndoorHacksPage';
import FamilyProfilesPage from './pages/FamilyProfilesPage';
import MemoryPage from './pages/MemoryPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen transition-colors duration-200 relative">
      {/* Interactive Cursor Atmosphere & Particulate Physics System */}
      <CursorAtmosphere />

      <Navbar />

      <main className="flex-1 relative z-20 pb-20 lg:pb-0">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/indoor-hacks"
            element={<IndoorHacksPage />}
          />
          <Route
            path="/family"
            element={
              <ProtectedRoute>
                <FamilyProfilesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/memory"
            element={
              <ProtectedRoute>
                <MemoryPage />
              </ProtectedRoute>
            }
          />
          <Route path="/about" element={<AboutPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <CompactChatModal />
      <MobileBottomNav />
      <FloatingChatButton />
      <MemoryNotification />
      <Footer />
    </div>
  );
}
