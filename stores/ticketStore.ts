import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ticket, TicketDraft, TicketPayment } from '@/types';
import { isoNow } from '@/utils/date';
import { uuid } from '@/utils/uuid';
import { logger } from '@/utils/logger';

interface TicketState {
  tickets: Ticket[];
  pendingSync: string[];
  loading: boolean;
  createTicket: (input: TicketDraft, userId: string, initialAmountDue?: number) => Ticket;
  payTicket: (payment: TicketPayment) => void;
  voidTicket: (ticketId: string, reason?: string) => void;
  markSynced: (ticketIds: string[]) => void;
  hydrate: (tickets: Ticket[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set, _get) => ({
      tickets: [],
      pendingSync: [],
      loading: false,

      setLoading: (loading) => set({ loading }),

      hydrate: (tickets) => set({ tickets }),

      createTicket: (input, userId, initialAmountDue = 0) => {
        const timestamp = isoNow();
        const ticket: Ticket = {
          id: uuid(),
          locationId: input.locationId,
          bayNumber: input.bayNumber,
          vehiclePlate: input.vehiclePlate,
          vehicleMake: input.vehicleMake,
          vehicleColor: input.vehicleColor,
          driverName: input.driverName,
          notes: input.notes,
          pricingRuleId: input.pricingRuleId,
          status: 'OPEN',
          createdAt: timestamp,
          updatedAt: timestamp,
          checkInAt: input.checkInAt,
          amountDue: initialAmountDue,
          amountPaid: 0,
          discount: 0,
          createdBy: userId,
          synced: false
        };

        set((state) => ({
          tickets: [ticket, ...state.tickets],
          pendingSync: [...state.pendingSync, ticket.id]
        }));

        logger.info('Ticket created', { ticketId: ticket.id });
        return ticket;
      },

      payTicket: (payment) => {
        set((state) => {
          const updatedTickets = state.tickets.map((ticket) => {
            if (ticket.id === payment.ticketId) {
              return {
                ...ticket,
                status: 'PAID',
                amountDue: payment.amount,
                amountPaid: payment.amount,
                updatedAt: isoNow(),
                checkOutAt: payment.paidAt,
                synced: false
              };
            }
            return ticket;
          });

          return {
            tickets: updatedTickets,
            pendingSync: Array.from(new Set([...state.pendingSync, payment.ticketId]))
          };
        });
      },

      voidTicket: (ticketId, reason) => {
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  status: 'VOID',
                  notes: reason ? `${ticket.notes ?? ''}\nVOID: ${reason}`.trim() : ticket.notes,
                  updatedAt: isoNow(),
                  synced: false
                }
              : ticket
          ),
          pendingSync: Array.from(new Set([...state.pendingSync, ticketId]))
        }));
        logger.warn('Ticket voided', { ticketId });
      },

      markSynced: (ticketIds) => {
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticketIds.includes(ticket.id)
              ? { ...ticket, synced: true }
              : ticket
          ),
          pendingSync: state.pendingSync.filter((id) => !ticketIds.includes(id))
        }));
      }
    }),
    {
      name: 'go2-ticket-store',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
