export type TicketStatus = 'OPEN' | 'PAID' | 'VOID' | 'REFUNDED';

export interface Ticket {
  id: string;
  locationId: string;
  bayNumber?: string;
  vehiclePlate: string;
  vehicleMake?: string;
  vehicleColor?: string;
  driverName?: string;
  notes?: string;
  pricingRuleId: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  checkInAt: string;
  checkOutAt?: string;
  amountDue: number;
  amountPaid: number;
  discount?: number;
  createdBy: string;
  synced: boolean;
  receiptNumber?: string;
}

export interface TicketDraft {
  locationId: string;
  bayNumber?: string;
  vehiclePlate: string;
  vehicleMake?: string;
  vehicleColor?: string;
  driverName?: string;
  notes?: string;
  checkInAt: string;
  pricingRuleId: string;
}

export interface TicketPayment {
  ticketId: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'MOBILE';
  paidAt: string;
  reference?: string;
}
