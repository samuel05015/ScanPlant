import React, { useState, useEffect, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LoadingScreen from './pages/LoadingScreen';
import ScreenPasso from './pages/ScreenPasso';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import ForgotPasswordScreen from './pages/ForgotPasswordScreen';
import ResetPasswordScreen from './pages/ResetPasswordScreen';
import HomeScreen from './pages/HomeScreen';
import PhotoScreen from './pages/PhotoScreen';
import PlantGallery from './pages/PlantGallery';
import SearchScreen from './pages/SearchScreen';
import ChatListScreen from './pages/ChatListScreen';
import ChatScreen from './pages/ChatScreen';
import ProfileSettingsScreen from './pages/ProfileSettingsScreen';
import PlantDetailScreen from './pages/PlantDetailScreen';
import UserListScreen from './pages/UserListScreen';
import PlantAssistantChat from './pages/PlantAssistantChat';
import FavoritesScreen from './pages/FavoritesScreen';
import AppNavigation from './components/AppNavigation';
import { getToken } from './api';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="app-shell">
      <AppNavigation />
      <main className="app-content">{children}</main>
    </div>
  );
};

const ScrollToTop = () => {
  const { key } = useLocation();

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';

    const resetScrollPositions = () => {
      const scrollingElement = document.scrollingElement;
      if (scrollingElement) {
        scrollingElement.scrollTop = 0;
        scrollingElement.scrollLeft = 0;
      }

      document.querySelectorAll<HTMLElement>('*').forEach((element) => {
        const overflowY = window.getComputedStyle(element).overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') && element.scrollTop !== 0) {
          element.scrollTop = 0;
        }
      });
    };

    resetScrollPositions();
    const animationFrame = window.requestAnimationFrame(() => {
      resetScrollPositions();
      root.style.scrollBehavior = previousScrollBehavior;
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, [key]);

  return null;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 650);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <ScrollToTop />
      <div className="font-sans text-gray-900 min-h-screen">
        <Routes>
          <Route path="/instructions" element={<ScreenPasso />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <HomeScreen />
            </ProtectedRoute>
          } />
          
          <Route path="/photo" element={
            <ProtectedRoute>
              <PhotoScreen />
            </ProtectedRoute>
          } />
          
          <Route path="/gallery" element={
            <ProtectedRoute>
              <PlantGallery />
            </ProtectedRoute>
          } />
           <Route path="/plant/:id" element={
            <ProtectedRoute>
              <PlantDetailScreen />
            </ProtectedRoute>
          } />

          <Route path="/search" element={
            <ProtectedRoute>
              <SearchScreen />
            </ProtectedRoute>
          } />

          <Route path="/favorites" element={
            <ProtectedRoute>
              <FavoritesScreen />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfileSettingsScreen />
            </ProtectedRoute>
          } />
          
          <Route path="/chats" element={
            <ProtectedRoute>
              <ChatListScreen />
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute>
              <UserListScreen />
            </ProtectedRoute>
          } />
          
          <Route path="/chat/:chatId" element={
            <ProtectedRoute>
              <ChatScreen />
            </ProtectedRoute>
          } />
          
          <Route path="/plant-assistant" element={
            <ProtectedRoute>
              <PlantAssistantChat />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <InitialRedirect />
    </Router>
  );
}

// Componente para redirecionar na primeira vez
const InitialRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenInstructions = localStorage.getItem('@scanplant_seen_instructions');
    const token = getToken();
    
    if (!hasSeenInstructions && !token && window.location.pathname === '/') {
      navigate('/instructions');
    }
  }, [navigate]);

  return null;
};

export default App;
