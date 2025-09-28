import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/ui/Card';
import { useTicketStore } from '@/stores/ticketStore';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/currency';
import { palette } from '@/constants/colors';

const ReportsScreen = () => {
  const { hasRole } = useAuth();
  const allowed = hasRole('OWNER', 'MANAGER');
  const tickets = useTicketStore((state) => state.tickets);

  if (!allowed) {
    return (
      <Screen>
        <Card>
          <Text variant="subtitle">Restricted</Text>
          <Text variant="body" style={{ color: palette.textSecondary, marginTop: 8 }}>
            Reports are only available to owners and site managers.
          </Text>
        </Card>
      </Screen>
    );
  }

  const metrics = useMemo(() => {
    const paidTickets = tickets.filter((t) => t.status === 'PAID');
    const voidTickets = tickets.filter((t) => t.status === 'VOID');
    const revenue = paidTickets.reduce((sum, ticket) => sum + ticket.amountPaid, 0);
    const avgTicket = paidTickets.length ? revenue / paidTickets.length : 0;

    const byLocation = tickets.reduce<Record<string, number>>((acc, ticket) => {
      acc[ticket.locationId] = (acc[ticket.locationId] ?? 0) + 1;
      return acc;
    }, {});

    return {
      total: tickets.length,
      paid: paidTickets.length,
      voided: voidTickets.length,
      revenue,
      avgTicket,
      byLocation
    };
  }, [tickets]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="title">Reporting</Text>
        <Text variant="body" style={styles.subtitle}>
          Monitor ticket outcomes and revenue to keep locations accountable.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Tickets" value={String(metrics.total)} />
        <StatCard label="Paid" value={String(metrics.paid)} />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Voided" value={String(metrics.voided)} trend="Review void reasons" />
        <StatCard label="Revenue" value={formatCurrency(metrics.revenue)} />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Avg Ticket" value={formatCurrency(metrics.avgTicket)} />
      </View>

      <Card style={{ gap: 12 }}>
        <Text variant="subtitle">Load by location</Text>
        {Object.keys(metrics.byLocation).length === 0 ? (
          <Text variant="body" style={{ color: palette.textSecondary }}>
            No tickets recorded yet.
          </Text>
        ) : (
          Object.entries(metrics.byLocation).map(([location, count]) => (
            <View key={location} style={styles.row}>
              <Text variant="body">{location}</Text>
              <Text variant="body" style={{ fontWeight: '600' }}>
                {count}
              </Text>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 8
  },
  subtitle: {
    color: palette.textSecondary
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});

export default ReportsScreen;
