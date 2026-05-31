import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, useWindowDimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

type Message = { id: string; from: 'me' | 'vendor'; text: string; time: string; };

const QUICK_REPLIES = ['Is this in stock?', 'Can I get a discount?', 'What are the dimensions?', 'Do you offer returns?'];

const INITIAL_MESSAGES: Message[] = [
  { id: '1', from: 'vendor', text: 'Hello! Welcome to SoundWave Audio. How can I help you today?', time: '10:32 AM' },
  { id: '2', from: 'me', text: 'Hi, I was wondering if the headphones come in white?', time: '10:33 AM' },
  { id: '3', from: 'vendor', text: 'Great question! Yes, we have the headphones available in Black, Silver, and White. Would you like to place an order?', time: '10:34 AM' },
];

export default function ChatScreen() {
  const { colors } = useTheme();
  const { vendorId } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const newMsg: Message = { id: Date.now().toString(), from: 'me', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    // Simulate vendor reply
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), from: 'vendor', text: "Thanks for your message! I'll get back to you shortly.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1500);
  };

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
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink }}>SoundWave Audio</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 5 }} />
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: '#22c55e' }}>Online</Text>
          </View>
        </View>
        <Pressable onPress={() => router.push(`/vendor/${vendorId ?? 'v1'}` as any)} style={{ padding: 8 }}>
          <Ionicons name="storefront-outline" size={22} color={colors.ink} />
        </Pressable>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => {
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

      {/* Quick Replies */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
        {QUICK_REPLIES.map(qr => (
          <Pressable key={qr} onPress={() => sendMessage(qr)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.surfaceMuted }}>
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
          onSubmitEditing={() => sendMessage(input)}
          returnKeyType="send"
        />
        <Pressable
          onPress={() => sendMessage(input)}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="send" size={20} color={colors.surface} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
