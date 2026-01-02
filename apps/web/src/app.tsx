import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { AuthProvider } from '@/contexts/auth-context';
import { AutomationsPage } from '@/pages/automations';
import { ContactDetailPage } from '@/pages/contact-detail';
import { ContactsPage } from '@/pages/contacts';
import { DashboardPage } from '@/pages/dashboard';
import { DealsPage } from '@/pages/deals';
import { LandingPage } from '@/pages/landing';
import { LoginPage } from '@/pages/login';
import { SettingsPage } from '@/pages/settings';

export function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="contacts/:id" element={<ContactDetailPage />} />
            <Route path="deals" element={<DealsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/automations" element={<AutomationsPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
