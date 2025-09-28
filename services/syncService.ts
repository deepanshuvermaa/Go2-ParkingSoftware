import { Ticket } from '@/types';
import { logger } from '@/utils/logger';

const simulateNetworkDelay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const syncTickets = async (tickets: Ticket[]): Promise<string[]> => {
  if (!tickets.length) {
    return [];
  }

  try {
    await simulateNetworkDelay(250);
    logger.info('Tickets synced', { count: tickets.length });
    return tickets.map((ticket) => ticket.id);
  } catch (error) {
    logger.error('Ticket sync simulation failed', { error });
    throw error;
  }
};
