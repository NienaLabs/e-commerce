import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FilterModal = ({ visible, onClose }: FilterModalProps) => {
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedCondition, setSelectedCondition] = useState('New');
  const [selectedAvailability, setSelectedAvailability] = useState('In Stock');

  const conditions = ['New', 'Refurbished', 'Used'];
  const availabilities = ['In Stock', 'Pre-order', 'Out of Stock'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(34,32,34,0.45)' }}>
        <View style={{
          backgroundColor: '#ffffff',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          height: '80%',
          shadowColor: '#222022',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 10,
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingVertical: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#eceae6',
          }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: '#222022' }}>Refine Results</Text>
            <Pressable
              onPress={onClose}
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: '#f5f5f0',
                alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Ionicons name="close" size={24} color="#222022" />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 24 }} showsVerticalScrollIndicator={false}>
            {/* Price Range */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#222022', marginBottom: 16 }}>Price Range</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{
                  flex: 1, backgroundColor: '#f5f5f0', height: 52, borderRadius: 16,
                  alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eceae6'
                }}>
                  <Text style={{ fontFamily: 'OpenSans_600SemiBold', fontSize: 15, color: '#6b696b' }}>${priceRange[0]}</Text>
                </View>
                <Text style={{ marginHorizontal: 16, color: '#9e9c9e', fontSize: 20 }}>-</Text>
                <View style={{
                  flex: 1, backgroundColor: '#f5f5f0', height: 52, borderRadius: 16,
                  alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eceae6'
                }}>
                  <Text style={{ fontFamily: 'OpenSans_600SemiBold', fontSize: 15, color: '#6b696b' }}>${priceRange[1]}+</Text>
                </View>
              </View>
            </View>

            {/* Condition */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#222022', marginBottom: 16 }}>Condition</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {conditions.map(cond => (
                  <Pressable
                    key={cond}
                    onPress={() => setSelectedCondition(cond)}
                    style={{
                      backgroundColor: selectedCondition === cond ? '#c3d80920' : '#ffffff',
                      borderWidth: selectedCondition === cond ? 2 : 1,
                      borderColor: selectedCondition === cond ? '#c3d809' : '#eceae6',
                      paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
                    }}
                  >
                    <Text style={{
                      fontFamily: 'Inter_600SemiBold', fontSize: 14,
                      color: selectedCondition === cond ? '#222022' : '#6b696b'
                    }}>{cond}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Availability */}
            <View style={{ marginBottom: 40 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#222022', marginBottom: 16 }}>Availability</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {availabilities.map(avail => (
                  <Pressable
                    key={avail}
                    onPress={() => setSelectedAvailability(avail)}
                    style={{
                      backgroundColor: selectedAvailability === avail ? '#c3d80920' : '#ffffff',
                      borderWidth: selectedAvailability === avail ? 2 : 1,
                      borderColor: selectedAvailability === avail ? '#c3d809' : '#eceae6',
                      paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
                    }}
                  >
                    <Text style={{
                      fontFamily: 'Inter_600SemiBold', fontSize: 14,
                      color: selectedAvailability === avail ? '#222022' : '#6b696b'
                    }}>{avail}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={{
            paddingHorizontal: 24, paddingVertical: 20,
            borderTopWidth: 1, borderTopColor: '#eceae6',
            backgroundColor: '#ffffff',
            paddingBottom: 32, // Safe area
          }}>
            <Button title="Apply Filters (12)" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};
