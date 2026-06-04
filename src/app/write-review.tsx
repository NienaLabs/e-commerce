import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { WebHeader } from '../components/WebHeader';
import { Button } from '../components/Button';
import { addLocalReview } from '../api/localReviews';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export default function WriteReviewScreen() {
  const { colors } = useTheme();
  const { productId, productName } = useLocalSearchParams();
  const { showToast } = useToast();
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast('Please select a star rating', 'warning');
      return;
    }
    if (!body.trim()) {
      showToast('Please write a review description', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await addLocalReview({
        productId: productId as string,
        userId: user?.id ?? 'guest',
        userName: user?.name ?? 'Verified Buyer',
        rating,
        title: title.trim(),
        body: body.trim(),
        isVerifiedPurchase: true, // We are routing here from Orders, so it's verified
      });
      
      showToast('Review submitted successfully!', 'success');
      
      // Invalidate the local reviews cache for this product
      queryClient.invalidateQueries({ queryKey: ['local-reviews', productId] });
      
      // Go back to the previous screen
      router.back();
    } catch (e) {
      showToast('Failed to submit review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <WebHeader />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.back()} style={{ padding: 8, marginRight: 8, marginLeft: -8 }}>
          <Ionicons name="close" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Write a Review</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, maxWidth: 600, alignSelf: 'center', width: '100%' }}>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ink, marginBottom: 8 }}>
          {productName ? `Reviewing: ${productName}` : 'Reviewing Product'}
        </Text>
        
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.surfaceMuted, marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 16, textAlign: 'center' }}>
            Tap a Star to Rate
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <Pressable key={star} onPress={() => setRating(star)}>
                <Ionicons name={star <= rating ? "star" : "star-outline"} size={40} color={colors.primary} />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 8 }}>Review Title (Optional)</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Sum up your experience"
            placeholderTextColor={colors.inkGhost}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12, paddingHorizontal: 16, height: 50,
              fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink,
              borderWidth: 1, borderColor: colors.surfaceMuted,
              ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
            }}
          />
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 8 }}>Review Description</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="What did you like or dislike? What should other shoppers know?"
            placeholderTextColor={colors.inkGhost}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, height: 120,
              fontFamily: 'OpenSans_400Regular', fontSize: 15, color: colors.ink,
              borderWidth: 1, borderColor: colors.surfaceMuted,
              ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
            }}
          />
        </View>

        <Button
          title={isSubmitting ? "Submitting..." : "Submit Review"}
          onPress={handleSubmit}
          disabled={isSubmitting || rating === 0 || !body.trim()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
