import { act } from 'react-test-renderer';
import { useTicketStore } from '@/stores/ticketStore';
import { isoNow } from '@/utils/date';

const resetStore = () => {
  useTicketStore.setState({ tickets: [], pendingSync: [], loading: false });
};

describe('ticket store', () => {
  beforeEach(() => {
    resetStore();
  });

  it('creates a ticket and queues for sync', () => {
    act(() => {
      useTicketStore.getState().createTicket(
        {
          pricingRuleId: 'rule-1',
          vehiclePlate: 'ABC123',
          bayNumber: '12',
          locationId: 'lot-01',
          checkInAt: isoNow()
        },
        'user-1',
        5
      );
    });

    const state = useTicketStore.getState();
    expect(state.tickets).toHaveLength(1);
    expect(state.pendingSync).toContain(state.tickets[0].id);
    expect(state.tickets[0].amountDue).toBe(5);
  });

  it('marks tickets as paid', () => {
    const ticket = useTicketStore.getState().createTicket(
      {
        pricingRuleId: 'rule-1',
        vehiclePlate: 'XYZ789',
        locationId: 'lot-02',
        checkInAt: isoNow()
      },
      'user-2',
      4
    );

    act(() => {
      useTicketStore.getState().payTicket({
        ticketId: ticket.id,
        amount: 7,
        method: 'CASH',
        paidAt: isoNow()
      });
    });

    const updated = useTicketStore.getState().tickets.find((item) => item.id === ticket.id);
    expect(updated?.status).toBe('PAID');
    expect(updated?.amountPaid).toBe(7);
  });
});
