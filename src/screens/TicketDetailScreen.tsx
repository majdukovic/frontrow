import { useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { theme } from '../theme';
import { testIds } from '../testIds';
import { Button } from '../components/Button';
import { QrCode } from '../components/QrCode';
import { useTicket, useCancelTicket, useTransferTicket } from '../hooks/useTickets';
import { useEvent } from '../hooks/useEvents';
import { showToast } from '../state/toasts';
import { formatPrice, formatEventDate } from '../utils/format';
import type { TicketsStackParamList } from '../navigation/types';
import type { TicketStatus } from '../api/types';

type Props = NativeStackScreenProps<TicketsStackParamList, 'TicketDetail'>;

export function TicketDetailScreen({ route }: Props) {
  const { id } = route.params;
  const nav = useNavigation();
  const { data: ticket, isLoading, error } = useTicket(id);
  const { data: event } = useEvent(ticket?.eventId ?? '');
  const cancel = useCancelTicket();
  const transfer = useTransferTicket();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);

  useLayoutEffect(() => {
    nav.setOptions({ title: 'Ticket' });
  }, [nav]);

  if (isLoading) {
    return (
      <View style={styles.center} testID={testIds.ticketDetail.screen}>
        <ActivityIndicator />
      </View>
    );
  }
  if (error || !ticket) {
    return (
      <View style={styles.center} testID={testIds.ticketDetail.screen}>
        <Text style={styles.error}>Failed to load ticket.</Text>
      </View>
    );
  }

  const isActive = ticket.status === 'active';

  const onConfirmCancel = async () => {
    setConfirmingCancel(false);
    try {
      await cancel.mutateAsync(ticket.id);
      showToast('Refund requested', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const onSubmitTransfer = async () => {
    setTransferError(null);
    try {
      await transfer.mutateAsync({ ticketId: ticket.id, recipientEmail: transferEmail });
      setTransferOpen(false);
      setTransferEmail('');
      showToast('Ticket transferred', 'success');
      nav.goBack();
    } catch (e) {
      setTransferError((e as Error).message);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID={testIds.ticketDetail.screen}
    >
      <Text style={styles.eventTitle}>{event?.title ?? 'Loading…'}</Text>
      {event ? (
        <Text style={styles.eventMeta}>
          {event.venue.name} · {formatEventDate(event.startsAt)}
        </Text>
      ) : null}

      <View style={styles.qrBlock}>
        <QrCode testID={testIds.ticketDetail.qrCode} payload={ticket.qrPayload} size={220} />
        <Text testID={testIds.ticketDetail.qrPayload} style={styles.payload} selectable>
          {ticket.qrPayload}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Status</Text>
        <StatusPill status={ticket.status} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Tier</Text>
        <Text style={styles.value}>{ticket.tier}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Quantity</Text>
        <Text style={styles.value}>{ticket.quantity}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Total</Text>
        <Text style={styles.value}>{formatPrice(ticket.totalCents, ticket.currency)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Purchased</Text>
        <Text style={styles.value}>{formatEventDate(ticket.purchasedAt)}</Text>
      </View>

      {isActive ? (
        <View style={styles.actions}>
          <Button
            testID={testIds.ticketDetail.transferButton}
            title="Transfer"
            variant="secondary"
            onPress={() => {
              setTransferError(null);
              setTransferOpen(true);
            }}
          />
          <Button
            testID={testIds.ticketDetail.cancelButton}
            title="Cancel ticket"
            variant="ghost"
            onPress={() => setConfirmingCancel(true)}
          />
        </View>
      ) : null}

      <Modal
        visible={confirmingCancel}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmingCancel(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} testID={testIds.ticketDetail.cancelConfirmDialog}>
            <Text style={styles.modalTitle}>Cancel ticket?</Text>
            <Text style={styles.modalBody}>
              You will be refunded once the cancellation is approved. This cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <Button
                testID={testIds.ticketDetail.cancelConfirmNo}
                title="Keep"
                variant="secondary"
                onPress={() => setConfirmingCancel(false)}
              />
              <Button
                testID={testIds.ticketDetail.cancelConfirmYes}
                title="Cancel ticket"
                onPress={onConfirmCancel}
                loading={cancel.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={transferOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTransferOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Transfer ticket</Text>
            <Text style={styles.modalBody}>
              Enter the recipient&apos;s FrontRow email. Try friend@frontrow.app on demo data.
            </Text>
            <TextInput
              testID={testIds.ticketDetail.transferEmailInput}
              accessibilityLabel="Recipient email"
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={transferEmail}
              onChangeText={setTransferEmail}
              style={styles.input}
            />
            {/* Render the error <Text> unconditionally so it lives in the
                view tree from mount. Inside an iOS RN <Modal>, conditional
                children added on a state update can fail to surface in
                the accessibility hierarchy that XCUITest/Maestro queries —
                an empty Text node updating its content avoids that. */}
            <Text
              testID={testIds.ticketDetail.transferError}
              style={[styles.error, !transferError && styles.errorHidden]}
              accessibilityElementsHidden={!transferError}
            >
              {transferError ?? ''}
            </Text>
            <View style={styles.modalActions}>
              <Button
                testID={testIds.ticketDetail.transferCancelButton}
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setTransferOpen(false);
                  setTransferEmail('');
                  setTransferError(null);
                }}
              />
              <Button
                testID={testIds.ticketDetail.transferSubmitButton}
                title="Send"
                onPress={onSubmitTransfer}
                loading={transfer.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function StatusPill({ status }: { status: TicketStatus }) {
  const palette: Record<TicketStatus, { bg: string; fg: string }> = {
    active: { bg: '#1f7a3a22', fg: theme.colors.success },
    used: { bg: '#88888822', fg: theme.colors.muted },
    cancelled: { bg: '#a3262622', fg: theme.colors.danger },
    refunded: { bg: '#a3262622', fg: theme.colors.danger },
    refund_pending: { bg: '#cc880022', fg: '#a36b00' },
  };
  const c = palette[status];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text testID={testIds.ticketDetail.statusPill} style={[styles.pillText, { color: c.fg }]}>
        {status.replace('_', ' ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: theme.spacing.xl },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  eventTitle: { fontSize: theme.typography.heading, fontWeight: '700', color: theme.colors.text },
  eventMeta: { fontSize: theme.typography.body, color: theme.colors.muted },
  qrBlock: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  payload: {
    fontSize: theme.typography.caption,
    color: theme.colors.muted,
    fontFamily: 'Courier',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  label: { fontSize: theme.typography.body, color: theme.colors.muted },
  value: { fontSize: theme.typography.body, color: theme.colors.text, fontWeight: '500' },
  actions: { gap: theme.spacing.sm, marginTop: theme.spacing.md },
  pill: {
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
  },
  pillText: { fontSize: theme.typography.caption, fontWeight: '600', textTransform: 'capitalize' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  modalTitle: { fontSize: theme.typography.title, fontWeight: '700', color: theme.colors.text },
  modalBody: { fontSize: theme.typography.body, color: theme.colors.muted },
  modalActions: { flexDirection: 'row', gap: theme.spacing.md, justifyContent: 'flex-end' },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  error: { color: theme.colors.danger, fontSize: theme.typography.body },
  errorHidden: { height: 0, opacity: 0 },
});
