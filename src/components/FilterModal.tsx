import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { useTheme } from '../theme/ThemeContext';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FilterModal = ({ visible, onClose }: FilterModalProps) => {
  const { colors } = useTheme();
  const [priceRange, setPriceRange] = React.useState([0, 500]);
  const [selectedCondition, setSelectedCondition] = React.useState('New');
  const [selectedAvailability, setSelectedAvailability] = React.useState('In Stock');

  const conditions = ['New', 'Refurbished', 'Used'];
  const availabilities = ['In Stock', 'Pre-order', 'Out of Stock'];

  // Count how many non-default filters are active
  const activeFilterCount = [
    selectedCondition !== 'New' ? 1 : 0,
    selectedAvailability !== 'In Stock' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleReset = () => {
    setSelectedCondition('New');
    setSelectedAvailability('In Stock');
    setPriceRange([0, 500]);
  };

  const handleApply = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(34,32,34,0.55)' }}>
        <View style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          height: '80%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.2,
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
            borderBottomColor: colors.surfaceMuted,
          }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.ink }}>Refine Results</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {activeFilterCount > 0 && (
                <Pressable onPress={handleReset} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.surfaceSoft }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.inkSoft }}>Reset</Text>
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: colors.surfaceSoft,
                  alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Ionicons name="close" size={24} color={colors.ink} />
              </Pressable>
            </View>
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 24 }} showsVerticalScrollIndicator={false}>
            {/* Price Range */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 16 }}>Price Range</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{
                  flex: 1, backgroundColor: colors.surfaceSoft, height: 52, borderRadius: 16,
                  alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceMuted
                }}>
                  <Text style={{ fontFamily: 'OpenSans_600SemiBold', fontSize: 15, color: colors.inkMuted }}>${priceRange[0]}</Text>
                </View>
                <Text style={{ marginHorizontal: 16, color: colors.inkGhost, fontSize: 20 }}>-</Text>
                <View style={{
                  flex: 1, backgroundColor: colors.surfaceSoft, height: 52, borderRadius: 16,
                  alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceMuted
                }}>
                  <Text style={{ fontFamily: 'OpenSans_600SemiBold', fontSize: 15, color: colors.inkMuted }}>${priceRange[1]}+</Text>
                </View>
              </View>
            </View>

            {/* Condition */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 16 }}>Condition</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {conditions.map(cond => (
                  <Pressable
                    key={cond}
                    onPress={() => setSelectedCondition(cond)}
                    style={{
                      backgroundColor: selectedCondition === cond ? colors.primaryGhost : colors.surfaceSoft,
                      borderWidth: selectedCondition === cond ? 2 : 1,
                      borderColor: selectedCondition === cond ? colors.primary : colors.surfaceMuted,
                      paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
                    }}
                  >
                    <Text style={{
                      fontFamily: 'Inter_600SemiBold', fontSize: 14,
                      color: selectedCondition === cond ? colors.ink : colors.inkMuted
                    }}>{cond}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Availability */}
            <View style={{ marginBottom: 40 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink, marginBottom: 16 }}>Availability</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {availabilities.map(avail => (
                  <Pressable
                    key={avail}
                    onPress={() => setSelectedAvailability(avail)}
                    style={{
                      backgroundColor: selectedAvailability === avail ? colors.primaryGhost : colors.surfaceSoft,
                      borderWidth: selectedAvailability === avail ? 2 : 1,
                      borderColor: selectedAvailability === avail ? colors.primary : colors.surfaceMuted,
                      paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
                    }}
                  >
                    <Text style={{
                      fontFamily: 'Inter_600SemiBold', fontSize: 14,
                      color: selectedAvailability === avail ? colors.ink : colors.inkMuted
                    }}>{avail}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={{
            paddingHorizontal: 24, paddingVertical: 20,
            borderTopWidth: 1, borderTopColor: colors.surfaceMuted,
            backgroundColor: colors.surface,
            paddingBottom: 32,
          }}>
            <Button
              title={activeFilterCount > 0 ? `Apply Filters (${activeFilterCount})` : 'Apply Filters'}
              onPress={handleApply}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};
