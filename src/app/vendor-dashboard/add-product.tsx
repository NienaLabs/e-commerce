import React, { useState, useContext, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct, updateProduct, getProduct, listCategories, deleteProduct } from '../../api/products';
import { CATEGORY_SCHEMAS, DEFAULT_SCHEMA } from '../../utils/filterSchemas';
import { Header, Section, Card, Field, Btn, Chip, EmptyState, useResponsive, font } from '../../components/vendor/kit';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from '../../api/upload';
import { Image } from 'expo-image';

export default function AddProductScreen() {
  const { colors } = useTheme();
  const { isDesktop, width } = useResponsive();
  // Two side-by-side text fields plus a delete button need real estate that a
  // phone doesn't have — below this the custom-spec rows stack instead.
  const stackSpecFields = width < 620;
  const cardPadding = width < 400 ? 16 : 24;
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: listCategories });

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
      setAttributes(existingProduct.attributes || {});
      setCustomSpecs([]);
      setImages(existingProduct.images?.map((img: any) => img.image_url) || []);
    }
  }, [existingProduct]);

  const mutation = useMutation({
    mutationFn: () => {
      const specExtras = Object.fromEntries(
        customSpecs.filter(s => s.key.trim() && s.value.trim()).map(s => [s.key.trim().toLowerCase().replace(/\s+/g, '_'), s.value.trim()]),
      );
      if (isEditMode) {
        const payload: Record<string, any> = {
          name: form.name,
          description: form.description,
          actual_price: parseFloat(form.price) || 0,
          discount_price: form.salePrice ? parseFloat(form.salePrice) : null,
          stock_quantity: parseInt(form.stock) || 0,
          is_active: true,
          category_id: selectedCategory || null,
          attributes: { ...attributes, ...specExtras },
          images,
        };
        return updateProduct(token!, id!, payload);
      }
      const payload: Record<string, any> = {
        name: form.name,
        slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
        description: form.description,
        actual_price: parseFloat(form.price) || 0,
        discount_price: form.salePrice ? parseFloat(form.salePrice) : undefined,
        stock_quantity: parseInt(form.stock) || 0,
        is_active: true,
        category_id: selectedCategory || null,
        attributes: { ...attributes, ...specExtras },
        images,
      };
      return createProduct(token!, payload as any);
    },
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      if (isEditMode) queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
    onError: (error: any) => alert(`Failed to save product: ${error.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(token!, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      router.replace('/vendor-dashboard/products' as any);
    },
    onError: (error: any) => alert(`Failed to delete product: ${error.message}`),
  });

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this product? This cannot be undone.')) deleteMutation.mutate();
    } else {
      Alert.alert('Delete product', 'Delete this product? This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]);
    }
  };

  const handlePickImage = async () => {
    if (images.length >= 3) {
      alert('Maximum of 3 images allowed.');
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 3 - images.length,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        const newUrls = await Promise.all(
          // Product shots open full screen, so they keep the largest preset.
          result.assets.map(asset => uploadFile(asset.uri, token!, 'product'))
        );
        setImages(prev => [...prev, ...newUrls].slice(0, 3));
      }
    } catch (e: any) {
      alert(`Image upload failed: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Give your product a name.';
    if (!form.price.trim()) e.price = 'Enter a price.';
    if (!form.stock.trim()) e.stock = 'Enter how many you have in stock.';
    if (categories.length > 0 && !selectedCategory) e.category = 'Choose a category.';
    setErrors(e);
    if (Object.keys(e).length === 0) mutation.mutate();
  };

  if (isEditMode && isLoadingProduct) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6', justifyContent: 'center', alignItems: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontFamily: font.body, fontSize: 14, color: colors.inkMuted, marginTop: 12 }}>Loading product…</Text>
      </SafeAreaView>
    );
  }

  if (saved) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          {/* Success Icon */}
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="checkmark-circle" size={44} color={colors.primaryDim} />
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.ink, textAlign: 'center', letterSpacing: -0.5 }}>
            {isEditMode ? 'Product updated!' : 'Product listed!'}
          </Text>
          <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: colors.inkMuted, textAlign: 'center', marginTop: 8, marginBottom: 32, lineHeight: 22 }}>
            {isEditMode
              ? 'Your changes are live. Shoppers can see the updated product in your store right now.'
              : 'Your product has been saved and is now live in your store for customers to find and buy.'}
          </Text>
          <View style={{ width: '100%', maxWidth: 320, gap: 12 }}>
            {!isEditMode && (
              <Btn
                title="Add another product"
                icon="add"
                fullWidth
                onPress={() => {
                  setForm({ name: '', price: '', salePrice: '', stock: '', sku: '', description: '', category: '' });
                  setSelectedCategory('');
                  setAttributes({});
                  setCustomSpecs([]);
                  setImages([]);
                  setSaved(false);
                }}
              />
            )}
            <Btn title="Back to products" variant="secondary" fullWidth onPress={() => router.replace('/vendor-dashboard/products' as any)} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const catObj = categories.find(c => c.id === selectedCategory);
  const activeSchema = (() => {
    if (!catObj) return null;
    const s = catObj.slug.toLowerCase();
    const key =
      s.includes('electronic') ? 'electronics' :
      s.includes('fashion') || s.includes('cloth') ? 'fashion' :
      s.includes('home') && !s.includes('appli') ? 'home' :
      s.includes('accessor') && !s.includes('autom') ? 'beauty' :
      s.includes('sport') && !s.includes('outdoor') ? 'sports' :
      s.includes('food') ? 'food' :
      s.includes('gam') ? 'gaming' :
      s.includes('book') ? 'books' :
      s.includes('wearable') || s.includes('smartwatch') ? 'wearables' :
      s.includes('camera') || s.includes('photo') ? 'cameras' :
      s.includes('appli') ? 'home_appliances' :
      s.includes('health') || s.includes('beaut') ? 'health_beauty' :
      s.includes('auto') || s.includes('car') ? 'automotive' :
      s.includes('toy') || s.includes('hobb') ? 'toys' :
      s.includes('comput') || s.includes('tablet') || s.includes('laptop') ? 'computers' :
      s.includes('phone') || s.includes('mobile') ? 'phones' :
      s.includes('outdoor') ? 'outdoor' :
      s.includes('art') || s.includes('craft') ? 'art_crafts' :
      s.includes('pet') ? 'pet_supplies' : 'default';
    return CATEGORY_SCHEMAS[key] || DEFAULT_SCHEMA;
  })();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }} edges={['top']}>
      {/* Header */}
      <Header
        title={isEditMode ? 'Edit product' : 'New product'}
        subtitle={isEditMode ? 'Update the details customers see in your store' : 'Fill in the details below to list a new item for sale'}
        onBack={() => (router.canGoBack() ? router.back() : router.push('/vendor-dashboard/products' as any))}
        hideBackOnDesktop={false}
        right={
          isEditMode ? (
            <Pressable
              onPress={handleDelete}
              disabled={deleteMutation.isPending}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14,
                borderRadius: 12, backgroundColor: pressed ? '#fef2f2' : colors.isDark ? '#3a1a1a' : '#fff0f0',
                borderWidth: 1, borderColor: '#fecaca',
              })}
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#ef4444' }}>
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: cardPadding, paddingBottom: 80, maxWidth: 1200, alignSelf: 'center', width: '100%' }}>

        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 24, alignItems: 'flex-start' }}>

          {/* ── Left column (photos + category) ── */}
          <View style={{ width: isDesktop ? 280 : '100%', gap: 20, flexShrink: 0 }}>

            {/* Photo uploader */}
            <View style={{ backgroundColor: colors.isDark ? '#2a2a2a' : '#ffffff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink, marginBottom: 4 }}>Product photos</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginBottom: 16, lineHeight: 18 }}>
                Clear photos on a plain background sell best. The first image is your main listing photo. Maximum 3 images.
              </Text>
              
              <View style={{ gap: 12 }}>
                {images.map((imgUrl, idx) => (
                  <View key={idx} style={{ position: 'relative', width: '100%', aspectRatio: 1, borderRadius: 16, overflow: 'hidden' }}>
                    <Image source={{ uri: imgUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    <Pressable
                      onPress={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                      style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#fff" />
                    </Pressable>
                    {idx === 0 && (
                       <View style={{ position: 'absolute', bottom: 12, left: 12, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                         <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>Main photo</Text>
                       </View>
                    )}
                  </View>
                ))}

                {images.length < 3 && (
                  <Pressable
                    onPress={handlePickImage}
                    disabled={isUploading}
                    style={({ pressed }) => ({
                      width: '100%', aspectRatio: images.length === 0 ? 1 : 2.5, borderRadius: 16, borderWidth: 2,
                      borderStyle: 'dashed', borderColor: pressed ? colors.primaryDim : colors.primary,
                      backgroundColor: pressed ? 'rgba(16,185,129,0.08)' : colors.primaryGhost,
                      alignItems: 'center', justifyContent: 'center',
                      opacity: isUploading ? 0.7 : 1
                    })}
                  >
                    {isUploading ? (
                      <>
                        <ActivityIndicator size="small" color={colors.primaryDim} />
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primaryDim, marginTop: 8 }}>Uploading...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="camera-outline" size={32} color={colors.primaryDim} />
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.primaryDim, marginTop: 8 }}>
                          {images.length === 0 ? 'Main photo' : 'Add photo'}
                        </Text>
                        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 11, color: colors.inkMuted, marginTop: 2 }}>Tap to upload</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>
            </View>

            {/* Category picker */}
            <View style={{ backgroundColor: colors.isDark ? '#2a2a2a' : '#ffffff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink, marginBottom: 4 }}>Category</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginBottom: 16, lineHeight: 18 }}>
                Pick the category that fits best — it helps shoppers find your product through search and filters.
              </Text>
              {errors.category ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, padding: 10, borderRadius: 10, backgroundColor: colors.errorGhost }}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
                  <Text style={{ fontFamily: font.body, fontSize: 12, color: colors.error, flex: 1 }}>{errors.category}</Text>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {categories.length === 0 ? (
                  <Text style={{ fontFamily: font.body, color: colors.inkMuted }}>No categories available.</Text>
                ) : categories.map(cat => (
                  <Chip key={cat.id} label={cat.name} active={selectedCategory === cat.id} onPress={() => setSelectedCategory(cat.id)} />
                ))}
              </View>
            </View>
          </View>

          {/* ── Right column (all details) ── */}
          <View style={{ flex: 1, gap: 20, minWidth: 0 }}>

            {/* Product basics */}
            <View style={{ backgroundColor: colors.isDark ? '#2a2a2a' : '#ffffff', borderRadius: 20, padding: cardPadding, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink, marginBottom: 4 }}>Product details</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginBottom: 20, lineHeight: 18 }}>
                Enter the core information shoppers see when they view your listing.
              </Text>
              <Field
                label="Product name"
                placeholder="e.g. Wireless noise-cancelling headphones"
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                error={errors.name}
              />
              <Field
                label="Description"
                placeholder="Describe the product — what's included, materials, dimensions, and why customers will love it…"
                value={form.description}
                onChangeText={v => setForm(f => ({ ...f, description: v }))}
                multiline
                hint="A detailed description helps shoppers decide and improves your search ranking."
              />
            </View>

            {/* Pricing & stock */}
            <View style={{ backgroundColor: colors.isDark ? '#2a2a2a' : '#ffffff', borderRadius: 20, padding: cardPadding, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink, marginBottom: 4 }}>Pricing & inventory</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginBottom: 20, lineHeight: 18 }}>
                Set your price and how many units you have ready to sell. A sale price is optional.
              </Text>
              <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16 }}>
                <View style={{ flex: isDesktop ? 1 : undefined }}>
                  <Field label="Price (GH₵)" placeholder="0.00" value={form.price} onChangeText={v => setForm(f => ({ ...f, price: v }))} keyboardType="decimal-pad" error={errors.price} />
                </View>
                <View style={{ flex: isDesktop ? 1 : undefined }}>
                  <Field label="Sale price (GH₵)" placeholder="Optional" value={form.salePrice} onChangeText={v => setForm(f => ({ ...f, salePrice: v }))} keyboardType="decimal-pad" hint="Leave blank if not on sale." />
                </View>
              </View>
              <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16 }}>
                <View style={{ flex: isDesktop ? 1 : undefined }}>
                  <Field label="Stock quantity" placeholder="e.g. 50" value={form.stock} onChangeText={v => setForm(f => ({ ...f, stock: v }))} keyboardType="number-pad" error={errors.stock} />
                </View>
                <View style={{ flex: isDesktop ? 1 : undefined }}>
                  <Field label="SKU (optional)" placeholder="e.g. HDPH-BLK-001" value={form.sku} onChangeText={v => setForm(f => ({ ...f, sku: v }))} autoCapitalize="characters" hint="Your own internal product code." />
                </View>
              </View>
            </View>

            {/* Schema-driven specs */}
            {activeSchema && (
              <View style={{ backgroundColor: colors.isDark ? '#2a2a2a' : '#ffffff', borderRadius: 20, padding: cardPadding, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink, marginBottom: 4 }}>Specifications</Text>
                <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginBottom: 20, lineHeight: 18 }}>
                  Fill in what applies — these become filters customers can use when searching for products like yours.
                </Text>
                <View style={{ gap: 18 }}>
                  {activeSchema.sections.filter(s => s.id !== 'price').map(section => (
                    <View key={section.id} style={{ gap: 10 }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.ink }}>{section.label}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {section.options.map(opt => {
                          const isSelected = section.multiSelect
                            ? (attributes[section.id] || []).includes(opt.value)
                            : attributes[section.id] === opt.value;
                          return (
                            <Chip
                              key={opt.value}
                              label={opt.label}
                              active={isSelected}
                              onPress={() => setAttributes(prev => {
                                if (section.multiSelect) {
                                  const current = prev[section.id] || [];
                                  return current.includes(opt.value)
                                    ? { ...prev, [section.id]: current.filter((v: any) => v !== opt.value) }
                                    : { ...prev, [section.id]: [...current, opt.value] };
                                }
                                return { ...prev, [section.id]: isSelected ? undefined : opt.value };
                              })}
                            />
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Custom specifications */}
            <View style={{ backgroundColor: colors.isDark ? '#2a2a2a' : '#ffffff', borderRadius: 20, padding: cardPadding, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink, marginBottom: 4 }}>Custom specifications</Text>
              <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: colors.inkMuted, marginBottom: 20, lineHeight: 18 }}>
                Add any extra details not covered above — e.g. &quot;Battery life: 30 hours&quot; or &quot;Material: Aluminium&quot;.
              </Text>
              {customSpecs.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <Ionicons name="list-outline" size={28} color={colors.inkGhost} />
                  <Text style={{ fontFamily: font.body, fontSize: 13, color: colors.inkMuted, marginTop: 8 }}>No custom details yet.</Text>
                </View>
              )}
              <View style={{ gap: stackSpecFields ? 14 : 10 }}>
                {customSpecs.map((spec, idx) => {
                  const inputStyle = {
                    backgroundColor: colors.isDark ? '#1e1e1e' : '#f9fafb',
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    height: 48,
                    fontFamily: font.body,
                    fontSize: 14,
                    color: colors.ink,
                    borderWidth: 1.5,
                    borderColor: colors.isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
                    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
                  };

                  const labelInput = (
                    <TextInput
                      value={spec.key}
                      onChangeText={v => setCustomSpecs(prev => prev.map((s, i) => (i === idx ? { ...s, key: v } : s)))}
                      placeholder={stackSpecFields ? 'Label — e.g. Battery life' : 'Label (e.g. Battery life)'}
                      placeholderTextColor={colors.inkGhost}
                      style={[inputStyle, { flex: stackSpecFields ? undefined : 1, width: stackSpecFields ? '100%' : undefined }]}
                    />
                  );

                  const valueInput = (
                    <TextInput
                      value={spec.value}
                      onChangeText={v => setCustomSpecs(prev => prev.map((s, i) => (i === idx ? { ...s, value: v } : s)))}
                      placeholder={stackSpecFields ? 'Value — e.g. 30 hours' : 'Value (e.g. 30 hours)'}
                      placeholderTextColor={colors.inkGhost}
                      style={[inputStyle, { flex: stackSpecFields ? undefined : 1, width: stackSpecFields ? '100%' : undefined }]}
                    />
                  );

                  const removeButton = (
                    <Pressable
                      onPress={() => setCustomSpecs(prev => prev.filter((_, i) => i !== idx))}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove detail ${idx + 1}`}
                      style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.errorGhost, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      <Ionicons name="close" size={18} color={colors.error} />
                    </Pressable>
                  );

                  // Narrow screens: one field per line inside a grouped card, so
                  // both placeholders stay legible and the tap targets stay 44px.
                  if (stackSpecFields) {
                    return (
                      <View
                        key={idx}
                        style={{
                          gap: 10,
                          padding: 12,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: colors.isDark ? 'rgba(255,255,255,0.08)' : '#eceae6',
                          backgroundColor: colors.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(34,32,34,0.015)',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.5, color: colors.inkMuted, textTransform: 'uppercase' }}>
                            Detail {idx + 1}
                          </Text>
                          {removeButton}
                        </View>
                        {labelInput}
                        {valueInput}
                      </View>
                    );
                  }

                  return (
                    <View key={idx} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      {labelInput}
                      {valueInput}
                      {removeButton}
                    </View>
                  );
                })}
              </View>
              <Pressable
                onPress={() => setCustomSpecs(prev => [...prev, { key: '', value: '' }])}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  paddingVertical: 14, borderRadius: 12, marginTop: customSpecs.length > 0 ? 12 : 0,
                  borderWidth: 1.5, borderStyle: 'dashed',
                  borderColor: pressed ? colors.primaryDim : colors.primary,
                  backgroundColor: pressed ? 'rgba(16,185,129,0.08)' : colors.primaryGhost,
                })}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.primaryDim} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.primaryDim }}>Add a detail</Text>
              </Pressable>
            </View>

            {/* Save button */}
            <View style={{ backgroundColor: colors.isDark ? '#2a2a2a' : '#ffffff', borderRadius: 20, padding: cardPadding, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, gap: 12 }}>
              <Btn
                title={mutation.isPending ? 'Saving…' : isEditMode ? 'Update product' : 'Save & publish product'}
                icon={mutation.isPending ? undefined : isEditMode ? 'checkmark-circle-outline' : 'cloud-upload-outline'}
                loading={mutation.isPending}
                disabled={deleteMutation.isPending}
                onPress={handleSave}
                fullWidth
              />
              <Btn
                title="Cancel"
                variant="ghost"
                onPress={() => router.canGoBack() ? router.back() : router.push('/vendor-dashboard/products' as any)}
                fullWidth
              />
            </View>

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
