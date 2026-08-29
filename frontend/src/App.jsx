import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AdminRoute, GuestRoute, ProtectedRoute } from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SendMoney from './pages/SendMoney';
import Transactions from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTransactions from './pages/admin/AdminTransactions';
import NotFound from './pages/NotFound';

function Shell({ children }) {
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', fontSize: '13px' },
          }}
        />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Shell>
                  <Dashboard />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/send"
            element={
              <ProtectedRoute>
                <Shell>
                  <SendMoney />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/transactions"
            element={
              <ProtectedRoute>
                <Shell>
                  <Transactions />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/transactions/:id"
            element={
              <ProtectedRoute>
                <Shell>
                  <TransactionDetail />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/analytics"
            element={
              <ProtectedRoute>
                <Shell>
                  <Analytics />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/notifications"
            element={
              <ProtectedRoute>
                <Shell>
                  <Notifications />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/profile"
            element={
              <ProtectedRoute>
                <Shell>
                  <Profile />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/groups"
            element={
              <ProtectedRoute>
                <Shell>
                  <Groups />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/groups/:id"
            element={
              <ProtectedRoute>
                <Shell>
                  <GroupDetail />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/admin"
            element={
              <AdminRoute>
                <Shell>
                  <AdminDashboard />
                </Shell>
              </AdminRoute>
            }
          />
          <Route
            path="/app/admin/users"
            element={
              <AdminRoute>
                <Shell>
                  <AdminUsers />
                </Shell>
              </AdminRoute>
            }
          />
          <Route
            path="/app/admin/transactions"
            element={
              <AdminRoute>
                <Shell>
                  <AdminTransactions />
                </Shell>
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
