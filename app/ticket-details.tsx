import { useMemo } from 'react';
import { Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTicketStore } from '@/stores/ticketStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { formatCurrency } from '@/utils/currency';
import { formatDateTime, isoNow } from '@/utils/date';
import { calculateAmountDue } from '@/utils/pricing';
import { printingService } from '@/services/printingService';
import { palette } from '@/constants/colors';

const TicketDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id as string | undefined;

  const ticket = useTicketStore((state) => state.tickets.find((item) => item.id === id));
  const payTicket = useTicketStore((state) => state.payTicket);
  const voidTicket = useTicketStore((state) => state.voidTicket);

  const pricingRule = useSettingsStore((state) =>
    ticket ? state.pricingRules.find((rule) => rule.id === ticket.pricingRuleId) : undefined
  );

  const amountDue = useMemo(() => {
    if (!ticket) {
      return 0;
    }
    if (ticket.status === 'PAID') {
      return ticket.amountPaid;
    }
    if (pricingRule) {
      return calculateAmountDue(isoNow(), ticket.checkInAt, pricingRule);
    }
    return ticket.amountDue;
  }, [ticket, pricingRule]);

  if (!ticket) {
    return (
      <Screen>
        <Card>
          <Text variant="subtitle">Ticket not found</Text>
          <Text variant="body" style={{ color: palette.textSecondary, marginTop: 12 }}>
            We could not locate this ticket. It may have been removed or synced from another device.
          </Text>
          <Button label="Go back" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </Card>
      </Screen>
    );
  }

  const handlePayment = () => {
    if (ticket.status === 'PAID') {
      Alert.alert('Ticket already settled');
      return;
    }

    const paidAt = isoNow();
    payTicket({ ticketId: ticket.id, amount: amountDue, method: 'CASH', paidAt });
    Alert.alert('Payment captured', 'Ticket marked as paid.');
  };

  const handleVoid = () => {
    Alert.alert('Void ticket', 'Are you sure you want to void this ticket?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Void ticket',
        style: 'destructive',
        onPress: () => {
          voidTicket(ticket.id, 'Voided from ticket details');
          Alert.alert('Ticket voided');
        }
      }
    ]);
  };

  const handlePrint = async () => {
    try {
      await printingService.print(
        `Go2 Parking Receipt\nTicket: ${ticket.id}\nPlate: ${ticket.vehiclePlate}\nAmount: ${formatCurrency(
          ticket.amountPaid || amountDue
        )}\nStatus: ${ticket.status}\nThank you!`
      );
      Alert.alert('Print job sent');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to print receipt.';
      Alert.alert('Printer error', message);
    }
  };

  return (
    <Screen>
      <View style={{ gap: 16 }}>
        <Card style={{ gap: 8 }}>
          <Text variant="subtitle">Ticket #{ticket.id.slice(-6).toUpperCase()}</Text>
          <Text variant="body">Status: {ticket.status}</Text>
          <Text variant="body">Vehicle: {ticket.vehiclePlate}</Text>
          {ticket.bayNumber ? <Text variant="body">Bay: {ticket.bayNumber}</Text> : null}
          {ticket.driverName ? <Text variant="body">Driver: {ticket.driverName}</Text> : null}
          {pricingRule ? (
            <Text variant="body">Pricing rule: {pricingRule.name}</Text>
          ) : null}
          <Text variant="body">Opened: {formatDateTime(ticket.checkInAt)}</Text>
          {ticket.checkOutAt ? (
            <Text variant="body">Closed: {formatDateTime(ticket.checkOutAt)}</Text>
          ) : null}
          <Text variant="body">
            Amount due: {formatCurrency(ticket.amountPaid || amountDue)}
          </Text>
        </Card>

        <Card style={{ gap: 12 }}>
          <Text variant="subtitle">Actions</Text>
          <Button label="Print receipt" onPress={handlePrint} />
          {ticket.status !== 'PAID' ? (
            <Button label="Complete payment" onPress={handlePayment} />
          ) : null}
          {ticket.status !== 'VOID' && ticket.status !== 'PAID' ? (
            <Button variant="secondary" label="Void ticket" onPress={handleVoid} />
          ) : null}
        </Card>

        {ticket.notes ? (
          <Card>
            <Text variant="subtitle">Notes</Text>
            <Text variant="body" style={{ marginTop: 8 }}>
              {ticket.notes}
            </Text>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
};

export default TicketDetailsScreen;
