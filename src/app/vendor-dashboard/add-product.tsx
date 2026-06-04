import React, { useState, useContext } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/Button';
import { AuthContext } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct, listCategories } from '../../api/products';

function Field({ label, placeholder, value, onChangeText, colors, multiline = false, keyboardType = 'default' }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 8 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkGhost}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: colors.surfaceSoft,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: multiline ? 14 : 0,
          height: multiline ? 110 : 52,
          fontFamily: 'OpenSans_400Regular',
          fontSize: 15,
          color: colors.ink,
          borderWidth: 1.5,
          borderColor: focused ? colors.ink : colors.surfaceMuted,
          textAlignVertical: multiline ? 'top' : 'center',
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
        }}
      />
    </View>
  );
}

export default function AddProductScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && Platform.OS === 'web';
  const { token } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ name: '', price: '', salePrice: '', stock: '', sku: '', description: '', category: '' });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  });

  const mutation = useMutation({
    mutationFn: () => createProduct(token!, {
      name: form.name,
      slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
      description: form.description,
      actual_price: parseFloat(form.price) || 0,
      discount_price: form.salePrice ? parseFloat(form.salePrice) : undefined,
      stock_quantity: parseInt(form.stock) || 0,
      is_active: true,
      category_id: selectedCategory,
    }),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
    },
    onError: (error: any) => {
      alert(`Failed to save product: ${error.message}`);
    }
  });

  if (saved) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="checkmark-circle" size={48} color={colors.primaryDim} />
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.ink, marginBottom: 10 }}>Product Saved!</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center', marginBottom: 36 }}>
            Your product has been saved and is now live.
          </Text>
          <View style={{ width: '100%', gap: 12 }}>
            <Button title="Add Another Product" onPress={() => { setForm({ name: '', price: '', salePrice: '', stock: '', sku: '', description: '', category: '' }); setSaved(false); }} />
            <Pressable onPress={() => router.replace('/vendor-dashboard/products' as any)} style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.inkSoft }}>Back to Products</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted }}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/vendor-dashboard/products' as any)} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>Add New Product</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, maxWidth: isDesktop ? 720 : undefined, alignSelf: 'center', width: '100%' }}>

        {/* Image Upload */}
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 12 }}>Product Images *</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <Pressable style={{ width: 100, height: 100, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add" size={32} color={colors.primaryDim} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.primaryDim, marginTop: 4 }}>Main</Text>
          </Pressable>
          {[1, 2, 3].map(i => (
            <Pressable key={i} style={{ width: 100, height: 100, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.surfaceMuted, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="image-outline" size={28} color={colors.inkGhost} />
            </Pressable>
          ))}
        </View>

        <Field label="Product Name *" placeholder="e.g. Wireless Noise-Cancelling Headphones" value={form.name} onChangeText={(v: string) => setForm(f => ({ ...f, name: v }))} colors={colors} />
        <Field label="Description *" placeholder="Describe your product in detail..." value={form.description} onChangeText={(v: string) => setForm(f => ({ ...f, description: v }))} colors={colors} multiline />

        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16, marginBottom: 4 }}>
          <View style={{ flex: 1 }}>
            <Field label="Price ($) *" placeholder="0.00" value={form.price} onChangeText={(v: string) => setForm(f => ({ ...f, price: v }))} colors={colors} keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Sale Price ($)" placeholder="Leave blank if no sale" value={form.salePrice} onChangeText={(v: string) => setForm(f => ({ ...f, salePrice: v }))} colors={colors} keyboardType="decimal-pad" />
          </View>
        </View>

        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16, marginBottom: 4 }}>
          <View style={{ flex: 1 }}>
            <Field label="Stock Quantity *" placeholder="e.g. 50" value={form.stock} onChangeText={(v: string) => setForm(f => ({ ...f, stock: v }))} colors={colors} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="SKU" placeholder="e.g. SW-HDPH-BLK-001" value={form.sku} onChangeText={(v: string) => setForm(f => ({ ...f, sku: v }))} colors={colors} />
          </View>
        </View>

        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 12 }}>Category *</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {categories.length === 0 ? (
            <Text style={{ fontFamily: 'OpenSans_400Regular', color: colors.inkMuted }}>No categories available in the database.</Text>
          ) : categories.map(cat => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: selectedCategory === cat.id ? colors.ink : colors.surfaceSoft, borderWidth: 1.5, borderColor: selectedCategory === cat.id ? colors.ink : colors.surfaceMuted }}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: selectedCategory === cat.id ? colors.surface : colors.inkSoft }}>{cat.name}</Text>
            </Pressable>
          ))}
        </View>

        <Button 
          title={mutation.isPending ? "Saving..." : "Save Product"} 
          onPress={() => {
            if (!form.name || !form.price || !form.stock) {
              alert('Please fill out all required fields.');
              return;
            }
            if (categories.length > 0 && !selectedCategory) {
              alert('Please select a category.');
              return;
            }
            mutation.mutate();
          }} 
          disabled={mutation.isPending}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
