import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { UsersListPage } from '@/pages/UsersPage';
import { MotorcyclesListPage } from '@/pages/MotorcyclesPage';
import { MotoboysListPage } from '@/pages/MotoboysPage';
import { PlacesListPage } from '@/pages/PlacesPage';
import { WorkTimePage } from '@/pages/WorkTimePage';
import { WorkTimePlacePage } from '@/pages/WorkTimePlacePage';
import { WorkTimeUserPage } from '@/pages/WorkTimeUserPage';
import { IntervalTimePage } from '@/pages/IntervalTimePage';
import { CustomersListPage } from '@/pages/CustomersPage';
import { AddressesListPage } from '@/pages/AddressesPage';
import { DeliveriesListPage } from '@/pages/DeliveriesPage';
import { VouchersListPage } from '@/pages/VouchersPage';
import { PayoutsListPage } from '@/pages/PayoutsPage';
import { SettlementsListPage } from '@/pages/SettlementsPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersListPage />} />
          <Route path="motoboys" element={<MotoboysListPage />} />
          <Route path="motorcycles" element={<MotorcyclesListPage />} />
          <Route path="places" element={<PlacesListPage />} />

          {/* Recurso "Work Time" subdividido exatamente como os controllers do backend */}
          <Route path="work-time" element={<WorkTimePage />} />
          <Route path="work-time-place" element={<WorkTimePlacePage />} />
          <Route path="work-time-user" element={<WorkTimeUserPage />} />
          <Route path="interval-time" element={<IntervalTimePage />} />

          <Route path="customers" element={<CustomersListPage />} />
          <Route path="addresses" element={<AddressesListPage />} />
          <Route path="deliveries" element={<DeliveriesListPage />} />
          <Route path="vouchers" element={<VouchersListPage />} />
          <Route path="payouts" element={<PayoutsListPage />} />
          <Route path="settlements" element={<SettlementsListPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
