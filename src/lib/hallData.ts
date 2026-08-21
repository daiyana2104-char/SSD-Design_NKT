import type { HallBooking, HallPayment } from '@/lib/mockData';

export type HallBookingRecord = HallBooking & {
  customerName: string;
  mobileNumber: string;
  eventName: string;
  hallName: string;
  hallPackage: string;
  hallPurpose: string;
  amount: number;
  paymentStatus: 'Pending' | 'Partially Paid' | 'Paid' | 'Refunded';
  bookingStatus: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' | 'Refunded';
};

export const hallBookings: HallBookingRecord[] = [
  {
    id: 'hb-202608001', bookingRef: 'HB202608001', customerId: 'c1', customerName: 'Arun Kumar', mobileNumber: '+65 8123 4567',
    eventName: 'Wedding Reception', eventDate: '2026-08-21', hallIds: ['h1'], hallName: 'Wedding Hall - Level 3', hallPackage: 'Wedding Package',
    hallPurpose: 'Marriage / Wedding', purpose: 'hp-1', startTime: '10:00', endTime: '14:00', amount: 3700, totalAmount: 3700,
    paidAmount: 3700, depositAmount: 500, paymentStatus: 'Paid', bookingStatus: 'Confirmed', status: 'Paid', guests: 250, mealsRequired: true, packageId: 'hp1', createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'hb-202608002', bookingRef: 'HB202608002', customerId: 'c2', customerName: 'Meena Raj', mobileNumber: '+65 8234 5678',
    eventName: 'Family Function', eventDate: '2026-08-24', hallIds: ['h2'], hallName: 'Function Hall - Level 2', hallPackage: 'Hall Rental',
    hallPurpose: 'Other Function', purpose: 'hp-2', startTime: '09:00', endTime: '12:00', amount: 360, totalAmount: 360,
    paidAmount: 180, depositAmount: 300, paymentStatus: 'Partially Paid', bookingStatus: 'Confirmed', status: 'Partially Paid', guests: 100, mealsRequired: false, createdAt: '2026-08-05T10:30:00.000Z',
  },
  {
    id: 'hb-202609001', bookingRef: 'HB202609001', customerId: 'c3', customerName: 'Suresh Iyer', mobileNumber: '+65 8345 6789',
    eventName: 'Community Meeting', eventDate: '2026-09-05', hallIds: ['h3'], hallName: 'Dining Hall - Level 1', hallPackage: 'Hall Rental',
    hallPurpose: 'Meeting', purpose: 'hp-3', startTime: '14:00', endTime: '17:00', amount: 300, totalAmount: 300,
    paidAmount: 0, depositAmount: 0, paymentStatus: 'Pending', bookingStatus: 'Pending', status: 'Booked', guests: 80, mealsRequired: false, createdAt: '2026-08-10T12:00:00.000Z',
  },
];

export const hallPayments: HallPayment[] = [
  { id: 'hpmt-202608001', bookingId: 'hb-202608001', amount: 3700, paymentMode: 'Online', paymentDate: '2026-08-01', reference: 'PAY202608001', collectedBy: 'Admin' },
  { id: 'hpmt-202608002', bookingId: 'hb-202608002', amount: 180, paymentMode: 'Card', paymentDate: '2026-08-05', reference: 'PAY202608002', collectedBy: 'Admin' },
];