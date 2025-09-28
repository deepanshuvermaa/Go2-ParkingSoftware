import { useMemo, useState } from 'react';
import { FlatList, View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TicketListItem } from '@/components/common/TicketListItem';
import { EmptyState } from '@/components/common/EmptyState';
import { useTicketStore } from '@/stores/ticketStore';
import { palette } from '@/constants/colors';

const FILTERS = ['ALL', 'OPEN', 'PAID', 'VOID'] as const;

type Filter = (typeof FILTERS)[number];

const TicketsScreen = () => {
  const router = useRouter();
  const tickets = useTicketStore((state) => state.tickets);
  const [filter, setFilter] = useState<Filter>('ALL');

  const filteredTickets = useMemo(() => {
    if (filter === 'ALL') {
      return tickets;
    }
    return tickets.filter((ticket) => ticket.status === filter);
  }, [filter, tickets]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="title">Tickets</Text>
        <Text variant="body" style={styles.subtitle}>
          Review active and historical tickets, process payments, or void entries.
        </Text>
        <Button label="New Ticket" onPress={() => router.push('/create-ticket')} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((option) => (
          <Pressable
            key={option}
            onPress={() => setFilter(option)}
            style={[styles.chip, filter === option && styles.chipActive]}
          >
            <Text variant="small" style={filter === option ? styles.chipTextActive : styles.chipText}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TicketListItem
            ticket={item}
            onPress={(ticketId) => router.push({ pathname: '/ticket-details', params: { id: ticketId } })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={<EmptyState title="No tickets" description="Create a ticket to see it in this list." />}
        contentContainerStyle={{ paddingVertical: 12 }}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 12
  },
  subtitle: {
    color: palette.textSecondary
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
    flexWrap: 'wrap'
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border
  },
  chipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary
  },
  chipText: {
    color: palette.textSecondary
  },
  chipTextActive: {
    color: palette.textPrimary
  }
});

export default TicketsScreen;
