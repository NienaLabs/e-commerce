import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Platform, Linking, ActivityIndicator, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAssistantStatus,
  createLinkCode,
  unlinkWhatsApp,
  LinkCode,
} from '../../../api/assistant';
import { Header, ScreenBody, Section, Card, Btn, Badge, Skeleton, font } from '../../../components/vendor/kit';

/**
 * Connect WhatsApp.
 *
 * Linking starts here rather than in the chat, and that direction is the whole
 * security model: the vendor is already signed in, so the code they send only
 * has to prove the phone is theirs.
 *
 * The screen also has to explain, without sounding broken, that the assistant
 * may simply not be switched on for them yet — that is a deliberate rollout
 * choice, not a fault.
 */
export default function AssistantSettingsScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [issued, setIssued] = useState<LinkCode | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const { data: status, isLoading } = useQuery({
    queryKey: ['assistant-status'],
    queryFn: () => getAssistantStatus(token!),
    enabled: !!token,
    // While a code is on screen we poll, so the card flips to Connected the
    // moment the vendor's message lands rather than waiting for a manual
    // refresh they have no reason to think of.
    refetchInterval: issued ? 3000 : false,
  });

  // Countdown for the visible code. Codes expire in ten minutes; showing the
  // remaining time stops a vendor puzzling over one that quietly went stale.
  useEffect(() => {
    if (!issued) return;
    const tick = () => {
      const ms = new Date(issued.expires_at).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.floor(ms / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [issued]);

  // Once linked, the code has done its job.
  useEffect(() => {
    if (status?.linked && issued) {
      setIssued(null);
      showToast('WhatsApp connected', 'success');
    }
  }, [status?.linked]);

  const codeMutation = useMutation({
    mutationFn: () => createLinkCode(token!),
    onSuccess: (data) => setIssued(data),
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const unlinkMutation = useMutation({
    mutationFn: () => unlinkWhatsApp(token!),
    onSuccess: () => {
      setIssued(null);
      queryClient.invalidateQueries({ queryKey: ['assistant-status'] });
      showToast('WhatsApp disconnected', 'success');
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const confirmUnlink = () => {
    const run = () => unlinkMutation.mutate();
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm('Disconnect WhatsApp? You can reconnect at any time.')) run();
      return;
    }
    Alert.alert('Disconnect WhatsApp?', 'You can reconnect at any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: run },
    ]);
  };

  const openWhatsApp = async () => {
    if (!issued?.wa_link) return;
    try {
      await Linking.openURL(issued.wa_link);
    } catch {
      showToast('Could not open WhatsApp — copy the code instead', 'error');
    }
  };

  // No expo-clipboard in this project, and React Native dropped Clipboard from
  // core — so: the web Clipboard API on web, the share sheet on native (which
  // also lets the vendor send the code straight into WhatsApp).
  const copyCode = async () => {
    if (!issued) return;
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(issued.code);
        showToast('Code copied', 'success');
      } catch {
        showToast('Select the code to copy it', 'info');
      }
      return;
    }
    try {
      await Share.share({ message: issued.code });
    } catch {
      /* dismissed — nothing to report */
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="AI Assistant" subtitle="Connect WhatsApp" onBack={() => router.push("/vendor-dashboard/store-settings" as any)} />
        <ScreenBody>
          <Card style={{ gap: 12 }}>
            <Skeleton width="60%" height={18} />
            <Skeleton width="90%" height={12} />
            <Skeleton width="40%" height={40} />
          </Card>
        </ScreenBody>
      </>
    );
  }

  // Not switched on for this store yet. Deliberately framed as "not yet"
  // rather than an error — nothing is broken and there is nothing to fix.
  if (!status?.access_allowed) {
    const notYetAvailable =
      status?.access_reason === 'platform_disabled' ||
      status?.access_reason === 'vendor_not_enrolled';

    return (
      <>
        <Header title="AI Assistant" subtitle="Coming to your store" onBack={() => router.push("/vendor-dashboard/store-settings" as any)} />
        <ScreenBody>
          <Card style={{ gap: 16, alignItems: 'center', paddingVertical: 32 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: colors.surfaceSoft,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="sparkles-outline" size={30} color={colors.inkMuted} />
            </View>
            <Text style={{ fontFamily: font.labelL, fontSize: 17, color: colors.ink, textAlign: 'center' }}>
              {notYetAvailable ? 'Not switched on yet' : 'Unavailable'}
            </Text>
            <Text style={{
              fontFamily: font.body, fontSize: 14, color: colors.inkMuted,
              textAlign: 'center', lineHeight: 21, maxWidth: 380,
            }}>
              {status?.access_reason === 'suspended'
                ? 'Your account is suspended, so the assistant is unavailable. Please contact support.'
                : 'We’re rolling the assistant out to stores gradually. When it’s ready for yours, you’ll be able to connect WhatsApp here and ask about your sales, stock and orders.'}
            </Text>
          </Card>
        </ScreenBody>
      </>
    );
  }

  // Connected.
  if (status.linked) {
    return (
      <>
        <Header title="AI Assistant" subtitle="WhatsApp connected" onBack={() => router.push("/vendor-dashboard/store-settings" as any)} />
        <ScreenBody>
          <Section title="Connected number">
            <Card style={{ gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{
                  width: 46, height: 46, borderRadius: 23,
                  backgroundColor: colors.successGhost,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="logo-whatsapp" size={24} color={colors.success} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: font.labelL, fontSize: 16, color: colors.ink }}>
                    {status.masked_number}
                  </Text>
                  <Text style={{ fontFamily: font.body, fontSize: 12.5, color: colors.inkMuted, marginTop: 2 }}>
                    {status.linked_at
                      ? `Connected ${new Date(status.linked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'Connected'}
                  </Text>
                </View>
                <Badge label="Active" tone="success" />
              </View>

              <Text style={{ fontFamily: font.body, fontSize: 13.5, color: colors.inkSoft, lineHeight: 20 }}>
                Message this number on WhatsApp to ask about your sales, stock, orders
                and commission. You can send a photo or a voice note to add a product.
                Nothing in your store changes until you approve it.
              </Text>

              <Btn
                title="Disconnect"
                variant="ghost"
                icon="unlink-outline"
                loading={unlinkMutation.isPending}
                onPress={confirmUnlink}
              />
            </Card>
          </Section>

          <Section title="Keeping your store safe">
            <Card>
              <Text style={{ fontFamily: font.body, fontSize: 13, color: colors.inkMuted, lineHeight: 20 }}>
                Only this number can reach your store. If you lose your phone or change
                number, disconnect here straight away and connect the new one.
              </Text>
            </Card>
          </Section>
        </ScreenBody>
      </>
    );
  }

  // Not linked yet.
  const expired = issued !== null && secondsLeft <= 0;
  const mmss = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return (
    <>
      <Header title="AI Assistant" subtitle="Connect WhatsApp" onBack={() => router.push("/vendor-dashboard/store-settings" as any)} />
      <ScreenBody>
        <Section title="Run your store from WhatsApp" caption="Ask about sales, stock and orders — and add products by photo or voice note.">
          <Card style={{ gap: 18 }}>
            {!issued && (
              <>
                <Text style={{ fontFamily: font.body, fontSize: 13.5, color: colors.inkSoft, lineHeight: 21 }}>
                  We&apos;ll give you a short code. Send it to us on WhatsApp from the
                  phone you want to use, and that number becomes the one connected to
                  your store.
                </Text>
                <Btn
                  title="Connect WhatsApp"
                  icon="logo-whatsapp"
                  loading={codeMutation.isPending}
                  onPress={() => codeMutation.mutate()}
                />
              </>
            )}

            {issued && (
              <>
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontFamily: font.body, fontSize: 12.5, color: colors.inkMuted }}>
                    Your code
                  </Text>
                  <Pressable onPress={copyCode} style={{
                    paddingVertical: 14, paddingHorizontal: 22,
                    borderRadius: 14,
                    backgroundColor: colors.surfaceSoft,
                    borderWidth: 1, borderColor: colors.surfaceMuted,
                    opacity: expired ? 0.45 : 1,
                  }}>
                    <Text style={{
                      fontFamily: font.labelL, fontSize: 24, color: colors.ink,
                      letterSpacing: 2, textAlign: 'center',
                    }}>
                      {issued.code}
                    </Text>
                  </Pressable>
                  <Text style={{ fontFamily: font.body, fontSize: 12, color: expired ? colors.error : colors.inkMuted }}>
                    {expired
                      ? 'This code has expired'
                      : `Expires in ${mmss} · tap to ${Platform.OS === 'web' ? 'copy' : 'share'}`}
                  </Text>
                </View>

                {expired ? (
                  <Btn
                    title="Get a new code"
                    icon="refresh-outline"
                    loading={codeMutation.isPending}
                    onPress={() => codeMutation.mutate()}
                  />
                ) : (
                  <>
                    {issued.wa_link ? (
                      <Btn title="Open WhatsApp and send it" icon="logo-whatsapp" onPress={openWhatsApp} />
                    ) : (
                      <Text style={{ fontFamily: font.body, fontSize: 13, color: colors.inkSoft, lineHeight: 20, textAlign: 'center' }}>
                        Send this code to{' '}
                        <Text style={{ fontFamily: font.labelL, color: colors.ink }}>
                          {issued.business_number ?? 'our WhatsApp number'}
                        </Text>
                      </Text>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                      <ActivityIndicator size="small" color={colors.inkMuted} />
                      <Text style={{ fontFamily: font.body, fontSize: 12.5, color: colors.inkMuted }}>
                        Waiting for your message…
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}
          </Card>
        </Section>

        <Section title="What happens next">
          <Card style={{ gap: 14 }}>
            {[
              { icon: 'lock-closed-outline' as const, text: 'Only the number you connect can reach your store. Nobody else can see your figures.' },
              { icon: 'checkmark-circle-outline' as const, text: 'The assistant suggests changes — prices, stock, replies — but nothing happens until you approve it.' },
              { icon: 'chatbubble-ellipses-outline' as const, text: 'Messaging us is free. We’ll only message you first when something genuinely needs you.' },
            ].map((row, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <Ionicons name={row.icon} size={18} color={colors.inkMuted} style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, fontFamily: font.body, fontSize: 13, color: colors.inkMuted, lineHeight: 20 }}>
                  {row.text}
                </Text>
              </View>
            ))}
          </Card>
        </Section>
      </ScreenBody>
    </>
  );
}
