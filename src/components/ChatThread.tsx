import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Pressable, TextInput, Platform, FlatList, ScrollView,
  KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import type { ChatMessageDTO } from '../api/chat';

interface ChatThreadProps {
  title: string;
  subtitle?: string;
  avatarIcon?: keyof typeof Ionicons.glyphMap;
  messages: ChatMessageDTO[];
  loading: boolean;
  sending?: boolean;
  onSend: (text: string) => void;
  onBack: () => void;
  /** When set, the composer is hidden and this message is shown instead. */
  disabledReason?: string | null;
  quickReplies?: string[];
  emptyHint?: string;
  headerAction?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void };
}

export function ChatThread({
  title, subtitle, avatarIcon = 'storefront', messages, loading, sending,
  onSend, onBack, disabledReason, quickReplies = [], emptyHint, headerAction,
}: ChatThreadProps) {
  const { colors } = useTheme();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
      return () => clearTimeout(t);
    }
  }, [messages.length]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={onBack} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Ionicons name={avatarIcon} size={20} color={colors.primaryDim} />
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>{title}</Text>
          {!!subtitle && (
            <Text numberOfLines={1} style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted }}>{subtitle}</Text>
          )}
        </View>
        {headerAction && (
          <Pressable onPress={headerAction.onPress} style={{ padding: 8 }}>
            <Ionicons name={headerAction.icon} size={22} color={colors.ink} />
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
            <Ionicons name="chatbubbles-outline" size={60} color={colors.surfaceMuted} style={{ marginBottom: 16 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.inkMuted, textAlign: 'center' }}>
              {disabledReason ? 'Messaging locked' : `Start a conversation with ${title}`}
            </Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkGhost, marginTop: 6, textAlign: 'center' }}>
              {disabledReason || emptyHint || 'Ask about your order or anything else.'}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            renderItem={({ item }) => {
              const isMe = item.from === 'me';
              return (
                <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  <View style={{
                    maxWidth: '75%', backgroundColor: isMe ? colors.ink : colors.surface,
                    borderRadius: 18, borderBottomRightRadius: isMe ? 4 : 18, borderBottomLeftRadius: isMe ? 18 : 4,
                    paddingHorizontal: 16, paddingVertical: 10, borderWidth: isMe ? 0 : 1, borderColor: colors.surfaceMuted,
                  }}>
                    <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: isMe ? colors.surface : colors.ink, lineHeight: 21 }}>
                      {item.text}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkGhost, marginTop: 4, marginHorizontal: 4 }}>{item.time}</Text>
                </View>
              );
            }}
          />
        )}

        {disabledReason ? (
          <View style={{ paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.surfaceMuted, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.inkGhost} />
            <Text style={{ flex: 1, fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted }}>{disabledReason}</Text>
          </View>
        ) : (
          <>
            {quickReplies.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
                {quickReplies.map((qr) => (
                  <Pressable key={qr} onPress={() => submit(qr)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.surfaceMuted }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkSoft }}>{qr}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.surfaceMuted, gap: 10 }}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Type a message..."
                placeholderTextColor={colors.inkGhost}
                style={{
                  flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: colors.surfaceSoft, borderRadius: 22, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 12 : 8, paddingBottom: 8,
                  fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink,
                  borderWidth: 1, borderColor: colors.surfaceMuted,
                  ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
                }}
                onSubmitEditing={() => submit(input)}
                returnKeyType="send"
                multiline
              />
              <Pressable
                onPress={() => submit(input)}
                disabled={sending}
                style={({ pressed }) => ({
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: pressed ? colors.primaryDim : colors.ink,
                  alignItems: 'center', justifyContent: 'center', opacity: sending ? 0.6 : 1,
                })}>
                {sending ? <ActivityIndicator size="small" color={colors.surface} /> : <Ionicons name="send" size={20} color={colors.surface} />}
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
