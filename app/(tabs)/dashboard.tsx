import { useMemo } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/common/StatCard';
import { TicketListItem } from '@/components/common/TicketListItem';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { useTicketStore } from '@/stores/ticketStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConnectivity } from '@/hooks/useConnectivity';
import { formatCurrency } from '@/utils/currency';
import { palette } from '@/constants/colors';

const DashboardScreen = () => {
  const router = useRouter();
  const isOnline = useConnectivity();
  const tickets = useTicketStore((state) => state.tickets);
  const syncing = useTicketStore((state) => state.loading);
  const pricing = useSettingsStore((state) => state.pricingRules);

  const stats = useMemo(() => {
    const openTickets = tickets.filter((ticket) => ticket.status === 'OPEN');
    const revenueToday = tickets
      .filter((ticket) => ticket.status === 'PAID')
      .reduce((acc, ticket) => acc + ticket.amountPaid, 0);

    return {
      totalTickets: tickets.length,
      openTickets: openTickets.length,
      revenueToday,
      pricingRules: pricing.length
    };
  }, [tickets, pricing]);

  return (
    <Screen>
      <View style={styles.header}>
        {!isOnline ? <OfflineBanner /> : null}
        {syncing ? (
          <Text variant="small" style={styles.syncing}>
            Syncing ticket updates…
          </Text>
        ) : null}
        <Text variant="title">Operations overview</Text>
        <Text variant="body" style={styles.subheading}>
          Track ticket volume, revenue, and printer readiness at a glance.
        </Text>
        <View style={styles.actions}>
          <Button label="New Ticket" onPress={() => router.push('/create-ticket')} />
          <Button variant="secondary" label="Printer" onPress={() => router.push('/printer-settings')} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Tickets" value={String(stats.totalTickets)} />
        <StatCard label="Open" value={String(stats.openTickets)} />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Revenue" value={formatCurrency(stats.revenueToday)} />
        <StatCard label="Pricing Rules" value={String(stats.pricingRules)} />
      </View>

      <View style={styles.section}>
        <Text variant="subtitle">Recent tickets</Text>
        <FlatList
          data={tickets.slice(0, 5)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TicketListItem
              ticket={item}
              onPress={(ticketId) => router.push({ pathname: '/ticket-details', params: { id: ticketId } })}
            />
          )}
          ListEmptyComponent={
            <Text variant="body" style={{ color: palette.textSecondary }}>
              No tickets yet. Create your first ticket to see it here.
            </Text>
          }
          scrollEnabled={false}
          contentContainerStyle={{ gap: 12, paddingTop: 12 }}
        />
        <Text
          style={styles.link}
          accessibilityRole="link"
          onPress={() => router.push('/tickets')}
        >
          View all tickets →
        </Text>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 12
  },
  syncing: {
    color: palette.textSecondary
  },
  subheading: {
    color: palette.textSecondary
  },
  actions: {
    flexDirection: 'row',
    gap: 12
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12
  },
  section: {
    marginTop: 16
  },
  link: {
    color: palette.primary,
    marginTop: 12,
    fontWeight: '600'
  }
});

export default DashboardScreen;
