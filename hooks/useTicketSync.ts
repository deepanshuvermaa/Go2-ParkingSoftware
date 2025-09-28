import { useEffect, useState } from 'react';
import { useTicketStore } from '@/stores/ticketStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConnectivity } from '@/hooks/useConnectivity';
import { syncTickets } from '@/services/syncService';
import { logger } from '@/utils/logger';

export const useTicketSync = () => {
  const isOnline = useConnectivity();
  const autoSync = useSettingsStore((state) => state.autoSync);
  const pendingIds = useTicketStore((state) => state.pendingSync);
  const tickets = useTicketStore((state) => state.tickets);
  const markSynced = useTicketStore((state) => state.markSynced);
  const setLoading = useTicketStore((state) => state.setLoading);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isOnline || !autoSync || !pendingIds.length || syncing) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setSyncing(true);
        setLoading(true);
        const payload = tickets.filter((ticket) => pendingIds.includes(ticket.id));
        if (!payload.length) {
          return;
        }
        const synced = await syncTickets(payload);
        if (!cancelled && synced.length) {
          markSynced(synced);
        }
      } catch (error) {
        if (!cancelled) {
          logger.error('Ticket sync failed', { error });
        }
      } finally {
        if (!cancelled) {
          setSyncing(false);
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isOnline, autoSync, pendingIds, tickets, syncing, markSynced, setLoading]);

  return syncing;
};
