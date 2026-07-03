import React, { useState, useContext, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, useWindowDimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/Button';
import { AuthContext } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct, updateProduct, getProduct, listCategories, deleteProduct } from '../../api/products';
import { CATEGORY_SCHEMAS, DEFAULT_SCHEMA } from '../../utils/filterSchemas';

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
  const { id: queryId } = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(queryId) ? queryId[0] : queryId;
  const isEditMode = !!id;

  const [form, setForm] = useState({ name: '', price: '', salePrice: '', stock: '', sku: '', description: '', category: '' });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [customSpecs, setCustomSpecs] = useState<{ key: string; value: string }[]>([]);
  const [saved, setSaved] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  });

  const { data: existingProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: isEditMode && !!id,
  });

  useEffect(() => {
    if (existingProduct) {
      setForm({
        name: existingProduct.name || '',
        price: existingProduct.actual_price?.toString() || '',
        salePrice: existingProduct.discount_price?.toString() || '',
        stock: existingProduct.stock_quantity?.toString() || '',
        sku: '',
        description: existingProduct.description || '',
        category: existingProduct.category_id || '',
      });
      setSelectedCategory(existingProduct.category_id || '');
      const existingAttrs = existingProduct.attributes || {};
      // Separate any truly custom (non-schema) keys into customSpecs state
      setAttributes(existingAttrs);
      setCustomSpecs([]);
    }
  }, [existingProduct]);

  const mutation = useMutation({
    mutationFn: () => {
      if (isEditMode) {
        // In edit mode, DO NOT send a new slug — slugs are immutable after creation
        const payload: Record<string, any> = {
          name: form.name,
          description: form.description,
          actual_price: parseFloat(form.price) || 0,
          discount_price: form.salePrice ? parseFloat(form.salePrice) : null,
          stock_quantity: parseInt(form.stock) || 0,
          is_active: true,
          category_id: selectedCategory || null,
          attributes: { ...attributes, ...Object.fromEntries(customSpecs.filter(s => s.key.trim() && s.value.trim()).map(s => [s.key.trim().toLowerCase().replace(/\s+/g, '_'), s.value.trim()])) },
        };
        return updateProduct(token!, id!, payload);
      }
      // Create mode — generate a fresh slug from the name
      const payload = {
        name: form.name,
        slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
        description: form.description,
        actual_price: parseFloat(form.price) || 0,
        discount_price: form.salePrice ? parseFloat(form.salePrice) : undefined,
        stock_quantity: parseInt(form.stock) || 0,
        is_active: true,
        category_id: selectedCategory || null,
        attributes: { ...attributes, ...Object.fromEntries(customSpecs.filter(s => s.key.trim() && s.value.trim()).map(s => [s.key.trim().toLowerCase().replace(/\s+/g, '_'), s.value.trim()])) },
      };
      return createProduct(token!, payload);
    },
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      if (isEditMode) queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
    onError: (error: any) => {
      alert(`Failed to save product: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(token!, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      router.replace('/vendor-dashboard/products' as any);
    },
    onError: (error: any) => {
      alert(`Failed to delete product: ${error.message}`);
    }
  });

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this product?')) {
        deleteMutation.mutate();
      }
    } else {
      Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() }
      ]);
    }
  };

  if (isEditMode && isLoadingProduct) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft, justifyContent: 'center', alignItems: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (saved) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceSoft }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="checkmark-circle" size={48} color={colors.primaryDim} />
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.ink, marginBottom: 10 }}>Product Saved!</Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center', marginBottom: 36 }}>
            Your product has been {isEditMode ? 'updated' : 'saved and is now live'}.
          </Text>
          <View style={{ width: '100%', gap: 12 }}>
            {!isEditMode && <Button title="Add Another Product" onPress={() => { setForm({ name: '', price: '', salePrice: '', stock: '', sku: '', description: '', category: '' }); setSaved(false); }} />}
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
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.ink }}>{isEditMode ? 'Edit Product' : 'Add New Product'}</Text>
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

        {(() => {
          const catObj = categories.find(c => c.id === selectedCategory);
          const activeSchemaKey = catObj ? (() => {
            const s = catObj.slug.toLowerCase();
            if (s.includes('electronic')) return 'electronics';
            if (s.includes('fashion') || s.includes('cloth')) return 'fashion';
            if (s.includes('home') && !s.includes('appli')) return 'home';
            if (s.includes('accessor') && !s.includes('autom')) return 'beauty';
            if (s.includes('sport') && !s.includes('outdoor')) return 'sports';
            if (s.includes('food')) return 'food';
            if (s.includes('gam')) return 'gaming';
            if (s.includes('book')) return 'books';
            if (s.includes('wearable') || s.includes('smartwatch')) return 'wearables';
            if (s.includes('camera') || s.includes('photo')) return 'cameras';
            if (s.includes('appli')) return 'home_appliances';
            if (s.includes('health') || s.includes('beaut')) return 'health_beauty';
            if (s.includes('auto') || s.includes('car')) return 'automotive';
            if (s.includes('toy') || s.includes('hobb')) return 'toys';
            if (s.includes('comput') || s.includes('tablet') || s.includes('laptop')) return 'computers';
            if (s.includes('phone') || s.includes('mobile')) return 'phones';
            if (s.includes('outdoor')) return 'outdoor';
            if (s.includes('art') || s.includes('craft')) return 'art_crafts';
            if (s.includes('pet')) return 'pet_supplies';
            return 'default';
          })() : null;

          const activeSchema = activeSchemaKey ? CATEGORY_SCHEMAS[activeSchemaKey] || DEFAULT_SCHEMA : null;

          if (!activeSchema) return null;

          return (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink, marginBottom: 16 }}>Product Specifications</Text>
              {activeSchema.sections.filter(s => s.id !== 'price').map(section => (
                <View key={section.id} style={{ marginBottom: 20 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink, marginBottom: 10 }}>{section.label}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {section.options.map(opt => {
                      const isSelected = section.multiSelect
                        ? (attributes[section.id] || []).includes(opt.value)
                        : attributes[section.id] === opt.value;

                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => {
                            setAttributes(prev => {
                              if (section.multiSelect) {
                                const current = prev[section.id] || [];
                                if (current.includes(opt.value)) {
                                  return { ...prev, [section.id]: current.filter((v: any) => v !== opt.value) };
                                } else {
                                  return { ...prev, [section.id]: [...current, opt.value] };
                                }
                              } else {
                                return { ...prev, [section.id]: isSelected ? undefined : opt.value };
                              }
                            });
                          }}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 20,
                            backgroundColor: isSelected ? colors.primary : colors.surfaceSoft,
                            borderWidth: isSelected ? 0 : 1,
                            borderColor: colors.surfaceMuted,
                          }}
                        >
                          <Text style={{
                            fontFamily: 'Inter_600SemiBold',
                            fontSize: 13,
                            color: isSelected ? (colors.isDark ? '#18181a' : '#ffffff') : colors.inkSoft,
                          }}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          );
        })()}

        {/* ── Custom Specifications ── */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.ink }}>Custom Specifications</Text>
          </View>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 13, color: colors.inkMuted, marginBottom: 16 }}>
            Add any extra product details not covered above — e.g. "Bluetooth Version: 5.3" or "Battery Life: 30 hours".
          </Text>

          {customSpecs.map((spec, idx) => (
            <View key={idx} style={{ flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <TextInput
                value={spec.key}
                onChangeText={(v) => setCustomSpecs(prev => prev.map((s, i) => i === idx ? { ...s, key: v } : s))}
                placeholder="e.g. Battery Life"
                placeholderTextColor={colors.inkGhost}
                style={{
                  flex: 1, backgroundColor: colors.surfaceSoft, borderRadius: 12,
                  paddingHorizontal: 12, paddingVertical: 10,
                  fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.ink,
                  borderWidth: 1.5, borderColor: colors.surfaceMuted,
                  ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
                }}
              />
              <TextInput
                value={spec.value}
                onChangeText={(v) => setCustomSpecs(prev => prev.map((s, i) => i === idx ? { ...s, value: v } : s))}
                placeholder="e.g. 30 hours"
                placeholderTextColor={colors.inkGhost}
                style={{
                  flex: 1, backgroundColor: colors.surfaceSoft, borderRadius: 12,
                  paddingHorizontal: 12, paddingVertical: 10,
                  fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.ink,
                  borderWidth: 1.5, borderColor: colors.surfaceMuted,
                  ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
                }}
              />
              <Pressable
                onPress={() => setCustomSpecs(prev => prev.filter((_, i) => i !== idx))}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.errorGhost, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={18} color={colors.error} />
              </Pressable>
            </View>
          ))}

          <Pressable
            onPress={() => setCustomSpecs(prev => [...prev, { key: '', value: '' }])}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              paddingVertical: 12, borderRadius: 14,
              borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary,
              backgroundColor: colors.primaryGhost, gap: 8,
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primaryDim} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primaryDim }}>Add Custom Specification</Text>
          </Pressable>
        </View>
        <Button 
          title={mutation.isPending ? "Saving..." : (isEditMode ? "Update Product" : "Save Product")} 
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
          disabled={mutation.isPending || deleteMutation.isPending}
        />

        {isEditMode && (
          <Pressable 
            onPress={handleDelete}
            disabled={deleteMutation.isPending || mutation.isPending}
            style={{
              marginTop: 16, padding: 16, borderRadius: 14,
              borderWidth: 1.5, borderColor: colors.error, backgroundColor: colors.errorGhost,
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center'
            }}
          >
            <Ionicons name="trash" size={20} color={colors.error} style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.error }}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Product'}
            </Text>
          </Pressable>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
