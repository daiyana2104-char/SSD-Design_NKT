import { PageHeader } from '@/components/ui/StatusBadge';

export function HallReports() {
  return (
    <div>
      <PageHeader title="Hall Reports" description="Generate reports for hall bookings, payments and refunds" />

      <div className="card p-4">
        <p className="text-brown-700">Report filters and export options will be available here.</p>
      </div>
    </div>
  );
}

export default HallReports;
