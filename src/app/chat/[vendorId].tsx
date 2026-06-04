import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, Pressable, TextInput, Platform, FlatList, ScrollView, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMessages, sendMessage, getRandomVendorReply, ChatMessage } from '../../api/localChat';
import { AuthContext } from '../../context/AuthContext';

const QUICK_REPLIES = ['Is this in stock?', 'Can I get a discount?', 'What are the dimensions?', 'Do you offer returns?'];

export default function ChatScreen() {
  const { colors } = useTheme();
  const { vendorId, vendorName } = useLocalSearchParams<{ vendorId: string; vendorName?: string }>();
  const { user } = useContext(AuthContext);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();
  const vId = Array.isArray(vendorId) ? vendorId[0] : (vendorId ?? 'unknown');
  const displayName = Array.isArray(vendorName) ? vendorName[0] : (vendorName ?? 'Vendor Store');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat', vId],
    queryFn: () => getMessages(vId),
  });

  const { mutate: doSend } = useMutation({
    mutationFn: (text: string) => sendMessage(vId, 'me', text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', vId] });
      // Simulate vendor reply after 1.5s
      setTimeout(async () => {
        await sendMessage(vId, 'vendor', getRandomVendorReply());
        queryClient.invalidateQueries({ queryKey: ['chat', vId] });
      }, 1500);
    },
  });

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput('');
    doSend(trimmed);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Ionicons name="storefront" size={20} color={colors.primaryDim} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>{displayName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 5 }} />
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: '#22c55e' }}>Online</Text>
          </View>
        </View>
        <Pressable onPress={() => router.push(`/vendor/${vId}` as any)} style={{ padding: 8 }}>
          <Ionicons name="storefront-outline" size={22} color={colors.ink} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Messages */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
            <Ionicons name="chatbubbles-outline" size={60} color={colors.surfaceMuted} style={{ marginBottom: 16 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.inkMuted, textAlign: 'center' }}>
              Start a conversation with {displayName}
            </Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkGhost, marginTop: 6, textAlign: 'center' }}>
              Ask about products, shipping, or anything else!
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            renderItem={({ item }: { item: ChatMessage }) => {
              const isMe = item.from === 'me';
              return (
                <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  <View style={{
                    maxWidth: '75%',
                    backgroundColor: isMe ? colors.ink : colors.surface,
                    borderRadius: 18,
                    borderBottomRightRadius: isMe ? 4 : 18,
                    borderBottomLeftRadius: isMe ? 18 : 4,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderWidth: isMe ? 0 : 1,
                    borderColor: colors.surfaceMuted,
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

        {/* Quick Replies */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
          {QUICK_REPLIES.map(qr => (
            <Pressable key={qr} onPress={() => handleSend(qr)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.surfaceMuted }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkSoft }}>{qr}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.surfaceMuted, gap: 10 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.inkGhost}
            style={{
              flex: 1, height: 44, backgroundColor: colors.surfaceSoft, borderRadius: 22, paddingHorizontal: 16,
              fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink,
              borderWidth: 1, borderColor: colors.surfaceMuted,
              ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
            }}
            onSubmitEditing={() => handleSend(input)}
            returnKeyType="send"
          />
          <Pressable
            onPress={() => handleSend(input)}
            style={({ pressed }) => ({
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: pressed ? colors.primaryDim : colors.ink,
              alignItems: 'center', justifyContent: 'center',
            })}>
            <Ionicons name="send" size={20} color={colors.surface} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
