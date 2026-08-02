/**
 * Vendor → Commissions
 * ────────────────────
 * Vendors take payment from customers directly (outside the app), so nothing
 * is ever paid out to them. The money moves the other way: they owe us
 * commission on what they sold. This screen answers one question —
 * "how much do I owe the platform?" — for today, and in total.
 */

import React, { useContext, useMemo } from 'react';
import { View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { getVendorCommissions, type CommissionEntry } from '../../api/commissions';
import {
  Header, ScreenBody, Section, Card, StatGrid, StatCard, Divider, Badge,
  EmptyState, shadow, font,
} from '../../components/vendor/kit';

const money = (n: number) =>
  `GH₵ ${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const shortDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const STATUS_META: Record<CommissionEntry['status'], { label: string; tone: 'warning' | 'error' | 'success'; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { label: 'Accruing', tone: 'warning', icon: 'hourglass-outline' },
  billed: { label: 'Due now', tone: 'error', icon: 'alert-circle-outline' },
  paid: { label: 'Settled', tone: 'success', icon: 'checkmark-circle-outline' },
};

export default function VendorCommissionsScreen() {
  const { colors } = useTheme();
  const { token } = useContext(AuthContext);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['vendor-commissions'],
    queryFn: () => getVendorCommissions(token!),
    enabled: !!token,
    // Today's figure moves as orders get delivered, so don't serve it stale.
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const owed = data?.outstanding ?? 0;
  const isOverdue = !!data?.is_overdue;

  const heroTone = useMemo(() => {
    if (isOverdue) return colors.error;
    if (owed > 0) return colors.warning;
    return colors.primary;
  }, [isOverdue, owed, colors]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }} edges={['top']}>
        <Header title="Commissions" subtitle="What you owe the platform" onBack={() => router.push('/vendor-dashboard' as any)} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }} edges={['top']}>
      <Header title="Commissions" subtitle="What you owe the platform" onBack={() => router.push('/vendor-dashboard' as any)} />

      <ScreenBody
        maxWidth={720}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* ── Today's commission — the headline number ── */}
        <View style={[{ backgroundColor: colors.heroSurface, borderRadius: 24, padding: 24 }, shadow(3)]}>
          <Text style={{ fontFamily: font.bold, fontSize: 11, letterSpacing: 1, color: colors.onHeroMuted, textTransform: 'uppercase' }}>
            Commission on today&apos;s sales
          </Text>
          <Text style={{ fontFamily: font.bold, fontSize: 42, color: colors.primary, letterSpacing: -1, marginTop: 6 }}>
            {money(data?.today.commission_due ?? 0)}
          </Text>
          <Text style={{ fontFamily: font.body, fontSize: 13, color: colors.onHeroMuted, marginTop: 4 }}>
            {data?.commission_rate ?? 0}% of {money(data?.today.gross_sales ?? 0)} across{' '}
            {data?.today.orders ?? 0} delivered order{(data?.today.orders ?? 0) === 1 ? '' : 's'} today.
          </Text>

          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 18 }} />

          <Text style={{ fontFamily: font.bold, fontSize: 11, letterSpacing: 1, color: colors.onHeroMuted, textTransform: 'uppercase' }}>
            Total outstanding
          </Text>
          <Text style={{ fontFamily: font.bold, fontSize: 26, color: heroTone, letterSpacing: -0.5, marginTop: 4 }}>
            {money(owed)}
          </Text>
          <Text style={{ fontFamily: font.body, fontSize: 12.5, color: colors.onHeroMuted, marginTop: 4 }}>
            {isOverdue
              ? `Overdue by ${data?.days_overdue} day${data?.days_overdue === 1 ? '' : 's'} — please settle right away.`
              : (data?.billed_total ?? 0) > 0
                ? `Invoiced — due by ${shortDate(data?.due_date ?? null)}.`
                : owed > 0
                  ? 'Not invoiced yet. You’ll be billed for this once the period closes.'
                  : (data?.today.commission_due ?? 0) > 0
                    ? 'Today’s commission joins this balance when the day closes.'
                    : 'Nothing outstanding. You’re all settled up.'}
          </Text>
        </View>

        {/* ── Overdue banner ── */}
        {isOverdue && (
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: colors.errorGhost, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.error }}>
            <Ionicons name="warning-outline" size={20} color={colors.error} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: font.labelL, fontSize: 14, color: colors.error }}>Payment overdue</Text>
              <Text style={{ fontFamily: font.body, fontSize: 12.5, color: colors.inkSoft, marginTop: 3, lineHeight: 19 }}>
                {money(data?.billed_total ?? 0)} was due on {shortDate(data?.due_date ?? null)}. The
                admin team has been notified. Settle it to keep your store active.
              </Text>
            </View>
          </View>
        )}

        {/* ── Breakdown ── */}
        <StatGrid min={150}>
          <StatCard
            icon="today-outline"
            label="Today's sales"
            value={money(data?.today.gross_sales ?? 0)}
            hint={`${data?.today.orders ?? 0} delivered order${(data?.today.orders ?? 0) === 1 ? '' : 's'}`}
          />
          <StatCard
            icon="calendar-outline"
            label="This month's commission"
            value={money(data?.this_month.commission_due ?? 0)}
            tone="info"
            hint={`On ${money(data?.this_month.gross_sales ?? 0)} of sales`}
          />
          <StatCard
            icon="receipt-outline"
            label="Commission rate"
            value={`${data?.commission_rate ?? 0}%`}
            tone="warning"
            hint={data?.rate_is_custom ? 'A rate agreed for your store' : 'The standard platform rate'}
          />
          <StatCard
            icon="checkmark-done-outline"
            label="Settled to date"
            value={money(data?.paid_total ?? 0)}
            tone="success"
            hint="Payments we've confirmed"
          />
        </StatGrid>

        {/* ── How payment works ── */}
        <Section title="How to pay" caption="Commission is settled outside the app.">
          <Card>
            <View style={{ gap: 14 }}>
              <PayStep
                index={1}
                title="Sell and deliver"
                body="You collect payment from the customer directly. We don't hold your money."
              />
              <Divider />
              <PayStep
                index={2}
                title="We total the day"
                body={`Each night we add up your delivered orders and charge ${data?.commission_rate ?? 0}% commission.`}
              />
              <Divider />
              <PayStep
                index={3}
                title="You settle the invoice"
                body={`Pay the outstanding amount to the platform account within ${data?.payment_due_days ?? 3} day${(data?.payment_due_days ?? 3) === 1 ? '' : 's'} of being invoiced. Late payments could result in suspension of your account.`}
              />
            </View>
          </Card>
        </Section>

        {/* ── Ledger ── */}
        <Section title="Commission history" caption="Every charge we've raised against your sales.">
          <Card padded={false}>
            {!data?.entries.length ? (
              <EmptyState
                icon="receipt-outline"
                title="No commission yet"
                body="Once your first order is delivered, the commission on it shows up here."
              />
            ) : (
              data.entries.map((e, i) => {
                const meta = STATUS_META[e.status] ?? STATUS_META.pending;
                const isCredit = e.entry_type === 'credit';
                return (
                  <View key={e.id}>
                    {i > 0 && <Divider />}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
                      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: isCredit ? colors.successGhost : colors.warningGhost, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons
                          name={isCredit ? 'return-down-back-outline' : meta.icon}
                          size={20}
                          color={isCredit ? colors.success : colors.warning}
                        />
                      </View>
                      <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
                        <Text style={{ fontFamily: font.labelL, fontSize: 14.5, color: colors.ink }}>
                          {e.order_id ? `Order #${e.order_id.slice(0, 8)}` : shortDate(e.period_date)}
                        </Text>
                        <Text style={{ fontFamily: font.body, fontSize: 12.5, color: colors.inkMuted }}>
                          {e.order_id ? `${shortDate(e.period_date)} · ` : ''}
                          {e.commission_rate}% of {money(e.gross_amount)}
                          {e.status === 'paid' && e.payment_reference ? ` · Ref ${e.payment_reference}` : ''}
                        </Text>
                        <Badge label={isCredit ? 'Refund credit' : meta.label} tone={isCredit ? 'success' : meta.tone} />
                      </View>
                      {/* Credits are stored negative — show one minus sign, not two. */}
                      <Text style={{ fontFamily: font.bold, fontSize: 15, color: isCredit ? colors.success : colors.ink }}>
                        {isCredit ? '−' : ''}{money(Math.abs(e.commission_amount))}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </Card>
        </Section>
      </ScreenBody>
    </SafeAreaView>
  );
}

function PayStep({ index, title, body }: { index: number; title: string; body: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
        <Text style={{ fontFamily: font.bold, fontSize: 12, color: colors.primaryDim }}>{index}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: font.labelL, fontSize: 14, color: colors.ink }}>{title}</Text>
        <Text style={{ fontFamily: font.body, fontSize: 12.5, color: colors.inkMuted, marginTop: 3, lineHeight: 19 }}>{body}</Text>
      </View>
    </View>
  );
}
