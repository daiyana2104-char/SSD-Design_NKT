import { useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';

type MealModule = 'category' | 'item' | 'booking' | 'availability' | 'reports';

const moduleDetails: Record<MealModule, { title: string; description: string; columns: Column<{ id: string; name: string; status: string }>[]; rows: { id: string; name: string; status: string }[] }> = {
  category: {
    title: 'Meal Category Master', description: 'Manage categories for meal packages',
    columns: [{ key: 'name', header: 'Category Name' }, { key: 'status', header: 'Status' }],
    rows: [{ id: 'mc1', name: 'Breakfast', status: 'Active' }, { id: 'mc2', name: 'Lunch', status: 'Active' }],
  },
  item: {
    title: 'Meal Item Master', description: 'Manage individual meal items',
    columns: [{ key: 'name', header: 'Item Name' }, { key: 'status', header: 'Status' }],
    rows: [{ id: 'mi1', name: 'Idly', status: 'Active' }, { id: 'mi2', name: 'Rice', status: 'Active' }],
  },
  booking: {
    title: 'Meal Booking Management', description: 'Create and manage meal bookings',
    columns: [{ key: 'name', header: 'Booking Reference' }, { key: 'status', header: 'Status' }],
    rows: [{ id: 'mb1', name: 'MB202608001', status: 'Confirmed' }],
  },
  availability: {
    title: 'Meal Availability Management', description: 'View meal capacity and availability',
    columns: [{ key: 'name', header: 'Meal Package' }, { key: 'status', header: 'Status' }],
    rows: [{ id: 'ma1', name: 'Special Meal Set', status: 'Available' }],
  },
  reports: {
    title: 'Meal Reports', description: 'View meal booking, sales and availability reports',
    columns: [{ key: 'name', header: 'Report' }, { key: 'status', header: 'Status' }],
    rows: [{ id: 'mr1', name: 'Meal Booking Report', status: 'Available' }, { id: 'mr2', name: 'Meal Sales Report', status: 'Available' }, { id: 'mr3', name: 'Meal Availability Report', status: 'Available' }],
  },
};

export function MealManagementPage({ module }: { module: MealModule }) {
  const detail = moduleDetails[module];
  return <div><PageHeader title={detail.title} description={detail.description} /><div className="card"><DataTable columns={detail.columns} data={detail.rows} /></div></div>;
}

export function MealCategoryMaster() { return <MealManagementPage module="category" />; }
export function MealItemMaster() { return <MealManagementPage module="item" />; }
export function MealBookingManagement() { return <MealManagementPage module="booking" />; }
export function MealAvailabilityManagement() { return <MealManagementPage module="availability" />; }
export function MealReports() { return <MealManagementPage module="reports" />; }

export function MealModuleRedirect() {
  const location = useLocation();
  const module = location.pathname.includes('meal-categories') ? 'category' : location.pathname.includes('meal-items') ? 'item' : location.pathname.includes('meal-bookings') ? 'booking' : location.pathname.includes('meal-availability') ? 'availability' : 'reports';
  return <MealManagementPage module={module} />;
}
