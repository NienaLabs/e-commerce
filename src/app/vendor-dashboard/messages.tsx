import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { getConversations, Conversation } from '../../api/chat';

const POLL_MS = 6000;

export default function VendorMessagesScreen() {
  const { colors } = useTheme();
  const { token } = useContext(AuthContext);
  const { subscribe } = useWebSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getConversations(token);
      setConversations(data);
    } catch {
      // keep existing list on transient errors
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!token) return;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [token, load]);

  // Refresh the inbox instantly when a chat message arrives over the socket.
  useEffect(() => {
    return subscribe((event: any) => {
      if (event.type === 'chat_message') load();
    });
  }, [subscribe, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: colors.ink }}>Messages</Text>
        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, marginTop: 2 }}>
          Conversations with customers who ordered from you
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Ionicons name="chatbubbles-outline" size={60} color={colors.surfaceMuted} style={{ marginBottom: 16 }} />
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.inkMuted, textAlign: 'center' }}>No messages yet</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkGhost, marginTop: 6, textAlign: 'center' }}>
            When a customer who has ordered from you sends a message, it will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.user_id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/chat/customer/${item.user_id}?name=${encodeURIComponent(item.name)}` as any)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14,
                backgroundColor: pressed ? colors.surfaceSoft : 'transparent',
              })}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center' }}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={{ width: 48, height: 48 }} resizeMode="cover" />
                ) : (
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.primaryDim }}>
                    {(item.name || '?').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text numberOfLines={1} style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink }}>{item.name}</Text>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkGhost, marginLeft: 8 }}>{item.time}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Text numberOfLines={1} style={{ flex: 1, fontFamily: item.unread > 0 ? 'Inter_600SemiBold' : 'OpenSans_400Regular', fontSize: 13, color: item.unread > 0 ? colors.ink : colors.inkMuted }}>
                    {item.last_message}
                  </Text>
                  {item.unread > 0 && (
                    <View style={{ minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.onPrimary }}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
