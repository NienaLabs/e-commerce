import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

import { CATEGORY_SCHEMAS, DEFAULT_SCHEMA, CategoryFilterSchema, FilterOption, SORT_OPTIONS } from '../utils/filterSchemas';

// ─── Component ─────────────────────────────────────────────────────────────────

export interface FilterState {
  sort: string;
  sections: Record<string, string[]>;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  categoryId?: string | null;
  onApply?: (filters: FilterState) => void;
}

function FilterChip({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: selected ? colors.primary : colors.surfaceSoft,
        borderWidth: selected ? 0 : 1,
        borderColor: colors.surfaceMuted,
        opacity: pressed ? 0.82 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      {selected && (
        <Ionicons
          name="checkmark"
          size={12}
          color={colors.onPrimary}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: 13,
          color: selected
            ? colors.isDark
              ? '#18181a'
              : '#ffffff'
            : colors.inkMuted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SortRow({
  option,
  selected,
  onPress,
  colors,
}: {
  option: FilterOption;
  selected: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        marginBottom: 6,
        backgroundColor: selected ? colors.primaryGhost : 'transparent',
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.surfaceMuted,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {option.icon && (
        <Ionicons
          name={option.icon as any}
          size={18}
          color={selected ? colors.primary : colors.inkGhost}
          style={{ marginRight: 12 }}
        />
      )}
      <Text
        style={{
          flex: 1,
          fontFamily: selected ? 'Inter_600SemiBold' : 'OpenSans_400Regular',
          fontSize: 14,
          color: selected ? colors.ink : colors.inkMuted,
        }}
      >
        {option.label}
      </Text>
      {selected && (
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name="checkmark"
            size={12}
            color={colors.onPrimary}
          />
        </View>
      )}
    </Pressable>
  );
}

export const FilterModal = ({ visible, onClose, categoryId, onApply }: FilterModalProps) => {
  const { colors } = useTheme();

  const schema = (categoryId && CATEGORY_SCHEMAS[categoryId]) || DEFAULT_SCHEMA;

  const [sort, setSort] = useState('recommended');
  const [sectionFilters, setSectionFilters] = useState<Record<string, string[]>>({});
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showSort, setShowSort] = useState(false);

  // Reset filters when category changes
  useEffect(() => {
    setSectionFilters({});
    setSort('recommended');
    setExpandedSection(null);
  }, [categoryId]);

  const toggleChip = (sectionId: string, value: string, multiSelect: boolean) => {
    setSectionFilters(prev => {
      const current = prev[sectionId] ?? [];
      if (multiSelect) {
        if (current.includes(value)) {
          const next = current.filter(v => v !== value);
          return { ...prev, [sectionId]: next };
        }
        return { ...prev, [sectionId]: [...current, value] };
      } else {
        // Single select: deselect if same
        if (current[0] === value) return { ...prev, [sectionId]: [] };
        return { ...prev, [sectionId]: [value] };
      }
    });
  };

  const totalActive = Object.values(sectionFilters).reduce(
    (sum, arr) => sum + arr.length,
    0
  ) + (sort !== 'recommended' ? 1 : 0);

  const handleReset = () => {
    setSectionFilters({});
    setSort('recommended');
  };

  const handleApply = () => {
    onApply?.({ sort, sections: sectionFilters });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(34,32,34,0.6)' }}
        onPress={onClose}
      >
        <Pressable
          onPress={e => e.stopPropagation?.()}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: '90%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.18,
            shadowRadius: 32,
            elevation: 20,
          }}
        >
          {/* Drag handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.surfaceMuted,
              }}
            />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingTop: 8,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.surfaceMuted,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.primaryGhost,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons
                name={schema.icon as any}
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 20,
                  color: colors.ink,
                  letterSpacing: -0.3,
                }}
              >
                Filter {schema.categoryLabel}
              </Text>
              {totalActive > 0 && (
                <Text
                  style={{
                    fontFamily: 'OpenSans_400Regular',
                    fontSize: 12,
                    color: colors.primary,
                    marginTop: 1,
                  }}
                >
                  {totalActive} filter{totalActive !== 1 ? 's' : ''} active
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {totalActive > 0 && (
                <Pressable
                  onPress={handleReset}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10,
                    backgroundColor: colors.surfaceSoft,
                    borderWidth: 1,
                    borderColor: colors.surfaceMuted,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 12,
                      color: colors.inkMuted,
                    }}
                  >
                    Reset
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.surfaceSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={20} color={colors.ink} />
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Sort By ─────────────────────────────────────────── */}
            <Pressable
              onPress={() => setShowSort(s => !s)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: showSort ? 14 : 24,
                paddingVertical: 4,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{
                    fontFamily: 'Inter_700Bold',
                    fontSize: 15,
                    color: colors.ink,
                    marginRight: 8,
                  }}
                >
                  Sort By
                </Text>
                {sort !== 'recommended' && (
                  <View
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Inter_700Bold',
                        fontSize: 10,
                        color: colors.onPrimary,
                      }}
                    >
                      {SORT_OPTIONS.find((o: FilterOption) => o.value === sort)?.label ?? sort}
                    </Text>
                  </View>
                )}
              </View>
              <Ionicons
                name={showSort ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.inkGhost}
              />
            </Pressable>

            {showSort && (
              <View style={{ marginBottom: 28 }}>
                {SORT_OPTIONS.map((option: FilterOption) => (
                  <SortRow
                    key={option.value}
                    option={option}
                    selected={sort === option.value}
                    onPress={() => {
                      setSort(option.value);
                      setShowSort(false);
                    }}
                    colors={colors}
                  />
                ))}
              </View>
            )}

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: colors.surfaceMuted,
                marginBottom: 24,
              }}
            />

            {/* ── Category-Specific Filter Sections ──────────────── */}
            {schema.sections.map((section, idx) => {
              const selectedVals = sectionFilters[section.id] ?? [];
              const isExpanded =
                section.id === 'price' ||
                expandedSection === section.id ||
                selectedVals.length > 0;

              return (
                <View
                  key={section.id}
                  style={{ marginBottom: idx === schema.sections.length - 1 ? 8 : 28 }}
                >
                  {/* Section Header */}
                  <Pressable
                    onPress={() =>
                      setExpandedSection(s =>
                        s === section.id ? null : section.id
                      )
                    }
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: isExpanded ? 14 : 0,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        style={{
                          fontFamily: 'Inter_700Bold',
                          fontSize: 15,
                          color: colors.ink,
                          marginRight: 8,
                        }}
                      >
                        {section.label}
                      </Text>
                      {selectedVals.length > 0 && (
                        <View
                          style={{
                            backgroundColor: colors.primary,
                            borderRadius: 10,
                            minWidth: 20,
                            height: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 5,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: 'Inter_700Bold',
                              fontSize: 10,
                              color: colors.onPrimary,
                            }}
                          >
                            {selectedVals.length}
                          </Text>
                        </View>
                      )}
                    </View>
                    {section.id !== 'price' && (
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.inkGhost}
                      />
                    )}
                  </Pressable>

                  {/* Section Content */}
                  {isExpanded && (
                    <>
                      {section.type === 'price-presets' && (
                        <View
                          style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                          }}
                        >
                          {section.options.map(opt => (
                            <FilterChip
                              key={opt.value}
                              label={opt.label}
                              selected={selectedVals.includes(opt.value)}
                              onPress={() =>
                                toggleChip(section.id, opt.value, false)
                              }
                              colors={colors}
                            />
                          ))}
                        </View>
                      )}

                      {section.type === 'chips' && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                          {section.options.map(opt => (
                            <FilterChip
                              key={opt.value}
                              label={opt.label}
                              selected={selectedVals.includes(opt.value)}
                              onPress={() =>
                                toggleChip(
                                  section.id,
                                  opt.value,
                                  section.multiSelect ?? true
                                )
                              }
                              colors={colors}
                            />
                          ))}
                        </View>
                      )}

                      {section.multiSelect && section.id !== 'price' && (
                        <Text
                          style={{
                            fontFamily: 'OpenSans_400Regular',
                            fontSize: 11,
                            color: colors.inkGhost,
                            marginTop: 4,
                          }}
                        >
                          Select multiple
                        </Text>
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* ── Footer ─────────────────────────────────────────────── */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: Platform.OS === 'ios' ? 36 : 24,
              borderTopWidth: 1,
              borderTopColor: colors.surfaceMuted,
              backgroundColor: colors.surface,
              flexDirection: 'row',
              gap: 12,
            }}
          >
            {totalActive > 0 && (
              <Pressable
                onPress={handleReset}
                style={({ pressed }) => ({
                  flex: 0.38,
                  height: 52,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: colors.surfaceMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surfaceSoft,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 14,
                    color: colors.inkMuted,
                  }}
                >
                  Reset
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleApply}
              style={({ pressed }) => ({
                flex: 1,
                height: 52,
                borderRadius: 16,
                backgroundColor: pressed ? colors.primaryDim : colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 14,
                elevation: 8,
                transform: [{ scale: pressed ? 0.978 : 1 }],
              })}
            >
              <Text
                style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 15,
                  color: colors.onPrimary,
                  letterSpacing: 0.2,
                }}
              >
                {totalActive > 0
                  ? `Show Results  ·  ${totalActive} Filter${totalActive !== 1 ? 's' : ''}`
                  : 'Show All Results'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
