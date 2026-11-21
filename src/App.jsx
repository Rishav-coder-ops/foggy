// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MemoryNotification from './components/MemoryNotification';
import FloatingChatButton from './components/FloatingChatButton';
import MobileBottomNav from './components/MobileBottomNav';
import CompactChatModal from './components/CompactChatModal';
import CursorAtmosphere from './components/CursorAtmosphere';
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingRoute from './components/OnboardingRoute';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import IndoorHacksPage from './pages/IndoorHacksPage';
import FamilyProfilesPage from './pages/FamilyProfilesPage';
import AboutPage from './pages/AboutPage';
import SettingsPage from './pages/SettingsPage';
import SupportPage from './pages/SupportPage';
import SearchAQIPage from './pages/SearchAQIPage';
import OnboardingProfilePage from './pages/onboarding/OnboardingProfilePage';
import OnboardingFamilyPage from './pages/onboarding/OnboardingFamilyPage';

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

          {/* Compulsory 2-Step Onboarding */}
          <Route path="/get-started" element={<Navigate to="/get-started/profile" replace />} />
          <Route
            path="/get-started/profile"
            element={
              <OnboardingRoute step="profile">
                <OnboardingProfilePage />
              </OnboardingRoute>
            }
          />
          <Route
            path="/get-started/family"
            element={
              <OnboardingRoute step="family">
                <OnboardingFamilyPage />
              </OnboardingRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/search" element={<SearchAQIPage />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route path="/indoor-hacks" element={<IndoorHacksPage />} />
          <Route
            path="/family"
            element={
              <ProtectedRoute>
                <FamilyProfilesPage />
              </ProtectedRoute>
            }
          />
          <Route path="/memory" element={<Navigate to="/settings" replace />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/support" element={<SupportPage />} />
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
