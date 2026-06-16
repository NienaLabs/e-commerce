import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, ActivityIndicator,
  Modal, Platform, useWindowDimensions, KeyboardAvoidingView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useTheme } from '../../theme/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import {
  getMyTickets, createTicket, replyToTicket,
  type SupportTicket,
} from '../../api/tickets';

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, colors }: { status: string; colors: any }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    open:    { bg: colors.errorGhost,   fg: colors.error,   label: 'Open' },
    pending: { bg: colors.warningGhost, fg: colors.warning, label: 'Pending' },
    closed:  { bg: colors.successGhost, fg: colors.success,  label: 'Closed' },
  };
  const s = map[status] ?? map['open'];
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: s.fg, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {s.label}
      </Text>
    </View>
  );
}

// ─── Priority pill ─────────────────────────────────────────────────────────────

function PriorityPill({ priority, colors }: { priority: string; colors: any }) {
  const map: Record<string, { bg: string; fg: string }> = {
    high:   { bg: colors.errorGhost,   fg: colors.error },
    medium: { bg: colors.warningGhost, fg: colors.warning },
    low:    { bg: colors.infoGhost,    fg: colors.info },
  };
  const s = map[priority] ?? map['medium'];
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: s.fg, textTransform: 'capitalize' }}>
        {priority}
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SupportScreen() {
  const { colors } = useTheme();
  const { token, user } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const scrollRef = useRef<ScrollView>(null);

  // ── Fetch tickets ──────────────────────────────────────────────────────────

  const {
    data: tickets = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => getMyTickets(token!),
    enabled: !!token,
    refetchInterval: 15000, // poll every 15 s
    staleTime: 10000,
  });

  // Sync selected ticket when data refreshes (to get new messages)
  useEffect(() => {
    if (selected) {
      const fresh = tickets.find(t => t.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  }, [tickets]);

  // Refetch when screen gains focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (selected) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [selected?.messages?.length]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const replyMutation = useMutation({
    mutationFn: (text: string) => replyToTicket(token!, selected!.id, text),
    onSuccess: (updated) => {
      setSelected(updated);
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: () => createTicket(token!, { subject: newSubject.trim(), message: newMessage.trim(), priority: newPriority }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      setSelected(created);
      setShowNewModal(false);
      setNewSubject('');
      setNewMessage('');
      setNewPriority('medium');
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  const handleReply = () => {
    if (!replyText.trim() || !selected) return;
    replyMutation.mutate(replyText);
  };

  const handleCreate = () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    createMutation.mutate();
  };

  // ── Ticket list panel ─────────────────────────────────────────────────────

  const TicketList = () => (
    <View style={{
      width: isDesktop ? 300 : '100%',
      flex: isDesktop ? undefined : selected ? 0 : 1,
      display: isDesktop ? 'flex' : (selected ? 'none' : 'flex'),
      backgroundColor: colors.surface,
      borderRightWidth: isDesktop ? 1 : 0,
      borderRightColor: colors.surfaceMuted,
      borderRadius: isDesktop ? 0 : 20,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted,
        backgroundColor: colors.surfaceSoft,
      }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>My Tickets</Text>
        <Pressable
          onPress={() => setShowNewModal(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.ink, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}
        >
          <Ionicons name="add" size={16} color={colors.surface} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.surface }}>New</Text>
        </Pressable>
      </View>

      {/* List */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : tickets.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 }}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.inkGhost} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.inkMuted, marginTop: 12, textAlign: 'center' }}>
              No tickets yet.{'\n'}Tap "New" to get help.
            </Text>
          </View>
        ) : (
          tickets.map(ticket => {
            const active = selected?.id === ticket.id;
            return (
              <Pressable
                key={ticket.id}
                onPress={() => setSelected(ticket)}
                style={({ pressed }) => ({
                  padding: 16,
                  borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted,
                  backgroundColor: active ? colors.primaryGhost : pressed ? colors.surfaceSoft : colors.surface,
                  borderLeftWidth: active ? 3 : 0,
                  borderLeftColor: colors.primary,
                })}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <StatusBadge status={ticket.status} colors={colors} />
                  <PriorityPill priority={ticket.priority} colors={colors} />
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink, marginBottom: 3 }} numberOfLines={1}>
                  {ticket.subject}
                </Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkMuted }}>
                  {new Date(ticket.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' · '}
                  {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );

  // ── Chat panel ────────────────────────────────────────────────────────────

  const ChatPanel = () => {
    if (!selected) {
      if (isDesktop) {
        return (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Ionicons name="chatbubbles-outline" size={56} color={colors.inkGhost} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.inkMuted }}>
              Select a ticket to view
            </Text>
          </View>
        );
      }
      return null;
    }

    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceSoft }}>
        {/* Chat header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          paddingHorizontal: 16, paddingVertical: 14,
          backgroundColor: colors.surface,
          borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted,
        }}>
          {!isDesktop && (
            <Pressable onPress={() => setSelected(null)} style={{ marginRight: 4 }}>
              <Ionicons name="arrow-back" size={22} color={colors.ink} />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }} numberOfLines={1}>
              {selected.subject}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <StatusBadge status={selected.status} colors={colors} />
              <PriorityPill priority={selected.priority} colors={colors} />
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 8, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {selected.messages.length === 0 ? (
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, textAlign: 'center', marginTop: 24 }}>
              No messages yet.
            </Text>
          ) : (
            selected.messages.map(msg => {
              const isMe = msg.sender_id === user?.id;
              return (
                <View key={msg.id} style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {/* Sender label */}
                  <Text style={{
                    fontFamily: 'Inter_600SemiBold', fontSize: 10, color: colors.inkGhost,
                    marginBottom: 4, marginHorizontal: 4,
                  }}>
                    {isMe ? 'You' : 'Support'}
                  </Text>
                  <View style={{
                    maxWidth: '78%',
                    backgroundColor: isMe ? colors.ink : colors.surface,
                    borderRadius: 18,
                    borderBottomRightRadius: isMe ? 4 : 18,
                    borderBottomLeftRadius: isMe ? 18 : 4,
                    paddingHorizontal: 16, paddingVertical: 10,
                    borderWidth: isMe ? 0 : 1,
                    borderColor: colors.surfaceMuted,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06,
                    shadowRadius: 4,
                    elevation: 1,
                  }}>
                    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: isMe ? colors.surface : colors.ink, lineHeight: 20 }}>
                      {msg.text}
                    </Text>
                    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 10, color: isMe ? colors.surfaceDeep : colors.inkGhost, marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Reply bar */}
        {selected.status !== 'closed' ? (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{
              flexDirection: 'row', alignItems: 'flex-end', gap: 10,
              paddingHorizontal: 14, paddingVertical: 12,
              borderTopWidth: 1, borderTopColor: colors.surfaceMuted,
              backgroundColor: colors.surface,
            }}>
              <TextInput
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Type a message…"
                placeholderTextColor={colors.inkGhost}
                multiline
                style={{
                  flex: 1,
                  minHeight: 44, maxHeight: 120,
                  backgroundColor: colors.surfaceSoft,
                  borderWidth: 1, borderColor: colors.surfaceMuted,
                  borderRadius: 22,
                  paddingHorizontal: 18, paddingVertical: 10,
                  fontFamily: 'OpenSans_400Regular', fontSize: 14,
                  color: colors.ink,
                }}
              />
              <Pressable
                onPress={handleReply}
                disabled={!replyText.trim() || replyMutation.isPending}
                style={({ pressed }) => ({
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: replyText.trim() ? colors.ink : colors.surfaceMuted,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                {replyMutation.isPending
                  ? <ActivityIndicator size="small" color={colors.surface} />
                  : <Ionicons name="send" size={18} color={replyText.trim() ? colors.surface : colors.inkGhost} />
                }
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        ) : (
          <View style={{
            padding: 14, borderTopWidth: 1, borderTopColor: colors.surfaceMuted,
            backgroundColor: colors.successGhost, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
          }}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.success }}>
              This ticket has been resolved and closed.
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ── New Ticket Modal ──────────────────────────────────────────────────────

  const PRIORITIES: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
  const priorityColors: Record<string, string> = {
    high: colors.error,
    medium: colors.warning,
    low: colors.info,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      {/* Page header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14,
        backgroundColor: colors.surface,
        borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted,
      }}>
        <Ionicons name="headset" size={22} color={colors.primaryDim} style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Support</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted }}>
            Get help from our team
          </Text>
        </View>
        {!isDesktop && !selected && (
          <Pressable
            onPress={() => setShowNewModal(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.ink, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 }}
          >
            <Ionicons name="add" size={16} color={colors.surface} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.surface }}>New Ticket</Text>
          </Pressable>
        )}
      </View>

      {/* Body */}
      <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
        {TicketList()}
        {ChatPanel()}
      </View>

      {/* ── New Ticket Modal ── */}
      <Modal
        visible={showNewModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNewModal(false)}
      >
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28, borderTopRightRadius: 28,
              paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36,
            }}>
              {/* Modal header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink }}>
                    New Support Ticket
                  </Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>
                    Describe your issue and we'll get back to you.
                  </Text>
                </View>
                <Pressable onPress={() => setShowNewModal(false)}>
                  <Ionicons name="close-circle" size={28} color={colors.inkGhost} />
                </Pressable>
              </View>

              {/* Subject */}
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkMuted, marginBottom: 6 }}>
                Subject
              </Text>
              <TextInput
                value={newSubject}
                onChangeText={setNewSubject}
                placeholder="e.g. Payment not received"
                placeholderTextColor={colors.inkGhost}
                style={{
                  backgroundColor: colors.surfaceSoft,
                  borderWidth: 1, borderColor: colors.surfaceMuted,
                  borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
                  fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.ink,
                  marginBottom: 14,
                }}
              />

              {/* Priority */}
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkMuted, marginBottom: 8 }}>
                Priority
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {PRIORITIES.map(p => (
                  <Pressable
                    key={p}
                    onPress={() => setNewPriority(p)}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                      borderWidth: 2,
                      borderColor: newPriority === p ? priorityColors[p] : colors.surfaceMuted,
                      backgroundColor: newPriority === p ? `${priorityColors[p]}18` : colors.surfaceSoft,
                    }}
                  >
                    <Text style={{
                      fontFamily: 'Inter_700Bold', fontSize: 12,
                      color: newPriority === p ? priorityColors[p] : colors.inkMuted,
                      textTransform: 'capitalize',
                    }}>
                      {p}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Message */}
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkMuted, marginBottom: 6 }}>
                Description
              </Text>
              <TextInput
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Describe the issue in detail…"
                placeholderTextColor={colors.inkGhost}
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: colors.surfaceSoft,
                  borderWidth: 1, borderColor: colors.surfaceMuted,
                  borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
                  fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.ink,
                  minHeight: 100, textAlignVertical: 'top',
                  marginBottom: 20,
                }}
              />

              {/* Submit */}
              <Pressable
                onPress={handleCreate}
                disabled={!newSubject.trim() || !newMessage.trim() || createMutation.isPending}
                style={({ pressed }) => ({
                  backgroundColor: (!newSubject.trim() || !newMessage.trim()) ? colors.surfaceMuted : colors.ink,
                  borderRadius: 16, paddingVertical: 15,
                  alignItems: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.surface }}>
                    Submit Ticket
                  </Text>
                )}
              </Pressable>

              {createMutation.isError && (
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.error, textAlign: 'center', marginTop: 10 }}>
                  {(createMutation.error as Error)?.message ?? 'Failed to create ticket.'}
                </Text>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
