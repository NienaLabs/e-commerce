import React from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { router } from 'expo-router';

export default function Cart() {
  const cartItems = [
    { id: '1', name: 'Wireless Noise-Cancelling Headphones', price: 149.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600', quantity: 1, variant: 'Black' },
    { id: '3', name: 'Premium Organic Cotton T-Shirt', price: 19.99, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600', quantity: 2, variant: 'Large' },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 5.00;
  const total = subtotal + shipping;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f0' }} edges={['top']}>


      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {cartItems.length > 0 ? (
          <>
            <View style={{ paddingHorizontal: 24, paddingTop: 24, gap: 20 }}>
              {cartItems.map(item => (
                <View key={item.id} style={{
                  flexDirection: 'row',
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#eceae6',
                  shadowColor: '#222022',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.07,
                  shadowRadius: 10,
                  elevation: 2,
                }}>
                  <Image source={{ uri: item.image }} style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: '#f5f5f0' }} />
                  <View style={{ flex: 1, marginLeft: 16, justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#222022' }} numberOfLines={2}>{item.name}</Text>
                        <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 12, color: '#6b696b', marginTop: 4 }}>Variant: {item.variant}</Text>
                      </View>
                      <Pressable style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={18} color="#d93651" />
                      </Pressable>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#222022' }}>${item.price.toFixed(2)}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f0', borderRadius: 16, padding: 4 }}>
                        <Pressable style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                          <Ionicons name="remove" size={16} color="#3a383a" />
                        </Pressable>
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#222022', marginHorizontal: 12 }}>{item.quantity}</Text>
                        <Pressable style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                          <Ionicons name="add" size={16} color="#3a383a" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={{ paddingHorizontal: 24, marginTop: 32, marginBottom: 32 }}>
              <View style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#eceae6' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#222022', marginBottom: 16 }}>Order Summary</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: '#6b696b' }}>Subtotal</Text>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#222022' }}>${subtotal.toFixed(2)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 15, color: '#6b696b' }}>Shipping</Text>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#222022' }}>${shipping.toFixed(2)}</Text>
                </View>

                <View style={{ height: 1, backgroundColor: '#eceae6', marginBottom: 16 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#222022' }}>Total</Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: '#c3d809' }}>${total.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 }}>
            <Ionicons name="cart" size={100} color="#eceae6" style={{ marginBottom: 24 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 22, color: '#222022', marginBottom: 8 }}>
              Your cart is empty
            </Text>
            <Text style={{ fontFamily: 'OpenSans_400Regular', fontSize: 14, color: '#6b696b', textAlign: 'center', maxWidth: 240, marginBottom: 32 }}>
              Looks like you haven't added anything to your cart yet.
            </Text>
            <View style={{ width: 240 }}>
              <Button title="Start Shopping" onPress={() => router.push('/')} />
            </View>
          </View>
        )}
      </ScrollView>

      {cartItems.length > 0 && (
        <View style={{ padding: 24, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#eceae6' }}>
          <Button title="Proceed to Checkout" onPress={() => { }} />
        </View>
      )}
    </SafeAreaView>
  );
}
