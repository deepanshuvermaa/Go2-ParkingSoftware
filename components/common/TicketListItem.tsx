import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Ticket } from '@/types';
import { formatDateTime } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';
import { palette } from '@/constants/colors';

interface TicketListItemProps {
  ticket: Ticket;
  onPress: (ticketId: string) => void;
}

export const TicketListItem = ({ ticket, onPress }: TicketListItemProps) => (
  <Pressable onPress={() => onPress(ticket.id)} style={({ pressed }) => [pressed && styles.pressed]}>
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text variant="subtitle">#{ticket.id.slice(-6).toUpperCase()}</Text>
        <Text variant="small" style={getStatusStyle(ticket.status)}>
          {ticket.status}
        </Text>
      </View>
      <Text style={styles.meta}>Plate: {ticket.vehiclePlate}</Text>
      <Text style={styles.meta}>Bay: {ticket.bayNumber ?? 'N/A'}</Text>
      <Text style={styles.meta}>Opened: {formatDateTime(ticket.createdAt)}</Text>
      <View style={styles.footer}>
        <Text variant="body" style={styles.amount}>
          {formatCurrency(ticket.amountPaid || ticket.amountDue)}
        </Text>
      </View>
    </Card>
  </Pressable>
);

const getStatusStyle = (status: Ticket['status']) => ({
  color: status === 'PAID' ? palette.success : status === 'VOID' ? palette.danger : palette.warning
});

const styles = StyleSheet.create({
  card: {
    marginBottom: 12
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  meta: {
    color: palette.textSecondary,
    marginBottom: 2
  },
  footer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  amount: {
    fontWeight: '600'
  },
  pressed: {
    opacity: 0.85
  }
});
