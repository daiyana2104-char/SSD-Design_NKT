import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AdminProvider } from '@/lib/adminStore';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminLogin } from '@/pages/admin/AdminLogin';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { UserManagement } from '@/pages/admin/UserManagement';
import { RolePermissions } from '@/pages/admin/RolePermissions';
import { RoleManagement } from '@/pages/admin/RoleManagement';
import { CategoryManagement } from '@/pages/admin/CategoryManagement';
import { DeityManagement } from '@/pages/admin/DeityManagement';
import { GstManagement } from '@/pages/admin/GstManagement';
import { GLMasterPage } from '@/pages/admin/GLMaster';
import { GLGroupMasterPage } from '@/pages/admin/GLGroupMaster';
import { NakshathiraMaster } from '@/pages/admin/NakshathiraMaster';
import { ItemMaster } from '@/pages/admin/ItemMaster';
import { ServiceMaster } from '@/pages/admin/ServiceMaster';
import { PrintingGroupMaster } from '@/pages/admin/PrintingGroupMaster';
import { SubCategoryMaster } from '@/pages/admin/SubCategoryMaster';
import { EventMasterPage } from '@/pages/admin/EventMaster';
import { CustomerMaster, CustomerDetail } from '@/pages/admin/CustomerMaster';
import { PaymentModeMaster } from '@/pages/admin/PaymentModeMaster';
import { UnitMaster } from '@/pages/admin/UnitMaster';
import { PosTransactions, PortalBookings } from '@/pages/admin/Transactions';
import { InventoryAdjustment, AvailableStock, InventoryHistory, LowStockReport } from '@/pages/admin/Inventory';
import { Reprints } from '@/pages/admin/Reprints';
import { AdminBooking } from '@/pages/admin/AdminBooking';
import { MenuManagement, CmsPages } from '@/pages/admin/CMS';
import {
  PosSalesReport, ItemSalesReport, ServiceSalesReport, GstReport, PaymentReport,
} from '@/pages/admin/Reports';
import { HallCategoryMaster } from '@/pages/admin/hall/HallCategoryMaster';
import { HallMaster } from '@/pages/admin/hall/HallMaster';
import { HallBooking } from '@/pages/admin/hall/HallBooking';
import { HallPayments } from '@/pages/admin/hall/HallPayments';
import { HallAvailability } from '@/pages/admin/hall/HallAvailability';
import { HallReports } from '@/pages/admin/hall/HallReports';
import { HallCancellation } from '@/pages/admin/hall/HallCancellation';
import { HallPurposeMaster } from '@/pages/admin/hall/HallPurposeMaster';
import { HallPackageMaster } from '@/pages/admin/hall/HallPackageMaster';
import { HallHolidayMaster } from '@/pages/admin/hall/HallHolidayMaster';
import { AdditionalServiceMaster } from '@/pages/admin/hall/AdditionalServiceMaster';
import { HallAvailabilityCalendar } from '@/pages/admin/hall/HallAvailabilityCalendar';
import { MealPackageManagement } from '@/pages/admin/MealPackages';
import { MealCategoryMaster, MealItemMaster, MealBookingManagement, MealAvailabilityManagement, MealReports } from '@/pages/admin/MealManagement';
import { PosProvider } from '@/lib/posStore';
import { PosLogin } from '@/pages/pos/PosLogin';
import { PosLayout } from '@/pages/pos/PosLayout';
import { PosBilling } from '@/pages/pos/PosBilling';
import { PosTransactions as PosTxnHistory, PosTransactionDetail, PosReprint, PosProfile } from '@/pages/pos/PosScreens';
import { CustomerPortal } from '@/pages/portal/CustomerPortal';
import { Landing } from '@/pages/Landing';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/portal" element={<CustomerPortal />} />
      {/* POS routes */}
      <Route path="/pos" element={<PosProvider><Outlet /></PosProvider>}>
        <Route path="login" element={<PosLogin />} />
        <Route element={<PosLayout />}>
          <Route path="billing" element={<PosBilling />} />
          <Route path="transactions" element={<PosTxnHistory />} />
          <Route path="transactions/:transactionId" element={<PosTransactionDetail />} />
          <Route path="reprint" element={<PosReprint />} />
          <Route path="profile" element={<PosProfile />} />
        </Route>
      </Route>
      {/* Admin routes */}
      <Route path="/admin" element={<AdminProvider><Outlet /></AdminProvider>}>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="roles" element={<RoleManagement />} />
          <Route path="role-permissions" element={<RolePermissions />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="printing-groups" element={<PrintingGroupMaster />} />
          <Route path="deities" element={<DeityManagement />} />
          <Route path="gst" element={<GstManagement />} />
          <Route path="gl-master" element={<GLMasterPage />} />
          <Route path="gl-groups" element={<GLGroupMasterPage />} />
          <Route path="nakshathira" element={<NakshathiraMaster />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="sub-categories" element={<SubCategoryMaster />} />
          <Route path="items" element={<ItemMaster />} />
          <Route path="services" element={<ServiceMaster />} />
          <Route path="events" element={<EventMasterPage />} />
          <Route path="customers" element={<CustomerMaster />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="payment-modes" element={<PaymentModeMaster />} />
          <Route path="units" element={<UnitMaster />} />
          <Route path="meal-categories" element={<MealCategoryMaster />} />
          <Route path="meal-packages" element={<MealPackageManagement />} />
          <Route path="meal-items" element={<MealItemMaster />} />
          <Route path="meal-bookings" element={<MealBookingManagement />} />
          <Route path="meal-availability" element={<MealAvailabilityManagement />} />
          <Route path="meal-reports" element={<MealReports />} />
          <Route path="hall-categories" element={<HallCategoryMaster />} />
          <Route path="halls" element={<HallMaster />} />
          <Route path="hall-bookings" element={<HallBooking />} />
          <Route path="hall-payments" element={<HallPayments />} />
          <Route path="hall-availability" element={<HallAvailability />} />
          <Route path="hall-availability-calendar" element={<HallAvailabilityCalendar />} />
          <Route path="hall-holidays" element={<HallHolidayMaster />} />
          <Route path="hall-services" element={<AdditionalServiceMaster />} />
          <Route path="hall-cancellations" element={<HallCancellation />} />
          <Route path="hall-packages" element={<HallPackageMaster />} />
          <Route path="hall-purposes" element={<HallPurposeMaster />} />
          <Route path="hall-reports" element={<HallReports />} />
          <Route path="inventory-adjustment" element={<InventoryAdjustment />} />
          <Route path="available-stock" element={<AvailableStock />} />
          <Route path="bookings" element={<AdminBooking />} />
          <Route path="pos-transactions" element={<PosTransactions />} />
          <Route path="portal-bookings" element={<PortalBookings />} />
          <Route path="reprints" element={<Reprints />} />
          <Route path="inventory-history" element={<InventoryHistory />} />
          <Route path="low-stock" element={<LowStockReport />} />
          <Route path="menus" element={<MenuManagement />} />
          <Route path="cms-pages" element={<CmsPages />} />
          <Route path="reports/pos-sales" element={<PosSalesReport />} />
          <Route path="reports/item-sales" element={<ItemSalesReport />} />
          <Route path="reports/service-sales" element={<ServiceSalesReport />} />
          <Route path="reports/gst" element={<GstReport />} />
          <Route path="reports/payments" element={<PaymentReport />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
