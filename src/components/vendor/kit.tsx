/**
 * Vendor UI Kit — Glassmorphism edition
 * ─────────────────────────────────────
 * Frosted, translucent surfaces floating over a soft gradient, with our brand
 * tokens (electric lime accent, ink text, Inter / Open Sans). Real backdrop
 * blur on web; a high-opacity translucent fallback on native (no expo-blur).
 *
 * Rules kept from design.md:
 *  • Colours come from the theme. Lime (#c3d809) stays an accent — CTAs, active
 *    states, highlighted data — never a big flat fill.
 *  • Inter to act on, Open Sans to read. Warm, soft elevation.
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, TextInput, ActivityIndicator, Animated, Switch,
  Platform, useWindowDimensions, ScrollView,
  type ViewStyle, type StyleProp, type KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useTheme, type ThemeColors } from '../../theme/ThemeContext';
import { useVendorDrawer } from '../../context/VendorDrawerContext';

const IS_WEB = Platform.OS === 'web';

// ── Type scale ────────────────────────────────────────────────────────────────
export const font = {
  displayL: 'Inter_700Bold',
  h1: 'Inter_700Bold',
  h2: 'Inter_700Bold',
  h3: 'Inter_600SemiBold',
  labelL: 'Inter_600SemiBold',
  labelM: 'Inter_600SemiBold',
  medium: 'Inter_500Medium',
  bold: 'Inter_700Bold',
  body: 'OpenSans_400Regular',
  bodyStrong: 'OpenSans_600SemiBold',
} as const;

// ── Responsive ──────────────────────────────────────────────────────────────
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isDesktop = IS_WEB && width >= 768;
  const isTablet = width >= 600 && width < 768;
  const isWide = IS_WEB && width >= 1024;
  return { width, height, isWeb: IS_WEB, isDesktop, isTablet, isWide };
}

// ── Elevation ─────────────────────────────────────────────────────────────────
// 'glow' is kept as a no-op so existing call sites stay valid — the lime CTA
// reads better flat, without a coloured halo.
type ShadowLevel = 'none' | 1 | 2 | 3 | 4 | 'glow';
export function shadow(level: ShadowLevel): ViewStyle {
  if (level === 'none' || level === 'glow') return {};
  const mobile = !IS_WEB;
  const map: Record<number, { o: number; r: number; y: number; e: number }> = {
    1: { o: 0.06, r: 8, y: 3, e: 1 },
    2: { o: 0.08, r: 20, y: 8, e: 3 },
    3: { o: 0.10, r: 28, y: 12, e: 6 },
    4: { o: 0.14, r: 40, y: 18, e: 10 },
  };
  const s = map[level as number];
  return { shadowColor: '#222022', shadowOffset: { width: 0, height: s.y }, shadowOpacity: mobile ? s.o * 0.85 : s.o, shadowRadius: s.r, elevation: s.e };
}

// ── Glass surface ─────────────────────────────────────────────────────────────
export function glass(colors: ThemeColors, opts: { radius?: number; strong?: boolean; blur?: number } = {}): ViewStyle {
  const { radius = 20 } = opts;
  const dark = colors.isDark;
  return {
    backgroundColor: dark ? '#2a2a2a' : '#ffffff',
    borderRadius: radius,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  };
}

// ── App background (soft gradient + glow blobs) ──────────────────────────────────
export function AppBackground() {
  const { colors } = useTheme();
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.isDark ? '#1a1a1a' : '#f4f7f6' }} pointerEvents="none" />
  );
}

// ── Content wrap ─────────────────────────────────────────────────────────────
export function ContentWrap({ children, maxWidth = 900, style, contentStyle }: { children: React.ReactNode; maxWidth?: number; style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ width: '100%', alignItems: 'center' }, style]}>
      <View style={[{ width: '100%', maxWidth }, contentStyle]}>{children}</View>
    </View>
  );
}

// ── Header (glass bar) ────────────────────────────────────────────────────────
export function Header({ title, subtitle, onBack, hideBackOnDesktop = true, right, leadingIcon }: {
  title: string; subtitle?: string; onBack?: () => void; hideBackOnDesktop?: boolean;
  right?: React.ReactNode; leadingIcon?: keyof typeof Ionicons.glyphMap;
}) {
  const { colors } = useTheme();
  const { isDesktop } = useResponsive();
  const drawer = useVendorDrawer();
  const showBack = !!onBack && !(hideBackOnDesktop && isDesktop);
  const iconBtn: ViewStyle = {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.isDark ? '#2a2a2a' : '#ffffff',
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        {/* Menu lives on the LEFT, and only when there's no back button to compete with. */}
        {!isDesktop && !showBack && (
          <Pressable
            onPress={() => drawer.toggle()} hitSlop={8}
            accessibilityRole="button" accessibilityLabel="Open menu"
            style={({ pressed }) => [iconBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="menu-outline" size={24} color={colors.ink} />
          </Pressable>
        )}
        {showBack && (
          <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back"
            style={({ pressed }) => [iconBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
        )}
        {leadingIcon && !showBack && (
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primaryGhost, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={leadingIcon} size={22} color={colors.primaryDim} />
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: colors.ink }}>{title}</Text>
          {!!subtitle && <Text numberOfLines={1} style={{ fontFamily: font.body, fontSize: 12.5, color: colors.inkMuted, marginTop: 1 }}>{subtitle}</Text>}
        </View>
      </View>
      {!!right && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 16 }}>{right}</View>
      )}
    </View>
  );
}

// ── Section ─────────────────────────────────────────────────────────────────
export function Section({ title, caption, overline, right, children, style }: {
  title?: string; caption?: string; overline?: string; right?: React.ReactNode; children: React.ReactNode; style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={[{ gap: 12 }, style]}>
      {(title || right || overline) && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            {!!overline && <Text style={{ fontFamily: font.bold, fontSize: 11, letterSpacing: 1, color: colors.inkMuted, textTransform: 'uppercase', marginBottom: 4 }}>{overline}</Text>}
            {!!title && <Text style={{ fontFamily: font.h2, fontSize: 17, color: colors.ink, letterSpacing: -0.2 }}>{title}</Text>}
            {!!caption && <Text style={{ fontFamily: font.body, fontSize: 13, color: colors.inkMuted, marginTop: 3, lineHeight: 19 }}>{caption}</Text>}
          </View>
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

// ── Card (glass) ───────────────────────────────────────────────────────────────
export function Card({ children, style, padded = true, onPress, elevated = true }: {
  children: React.ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean; onPress?: () => void; elevated?: boolean;
}) {
  const { colors } = useTheme();
  const base: ViewStyle = { ...glass(colors, { radius: 22 }), padding: padded ? 18 : 0, ...(elevated ? {} : shadow('none')) };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { transform: [{ scale: 0.995 }], opacity: 0.92 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

// ── Stat grid + stat card ──────────────────────────────────────────────────────
export function StatGrid({ children, min = 150 }: { children: React.ReactNode; min?: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
      {React.Children.map(children, (child) => (
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: min, minWidth: min }}>{child}</View>
      ))}
    </View>
  );
}

type Tone = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
function toneColor(colors: ThemeColors, tone: Tone) {
  switch (tone) {
    case 'success': return { fg: colors.success, bg: colors.successGhost };
    case 'warning': return { fg: colors.warning, bg: colors.warningGhost };
    case 'error': return { fg: colors.error, bg: colors.errorGhost };
    case 'info': return { fg: colors.info, bg: colors.infoGhost };
    case 'neutral': return { fg: colors.inkSoft, bg: colors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(34,32,34,0.05)' };
    default: return { fg: colors.primaryDim, bg: colors.primaryGhost };
  }
}

export function StatCard({ icon, label, value, hint, hintTone = 'neutral', tone = 'primary' }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string | number; hint?: string; hintTone?: Tone; tone?: Tone;
}) {
  const { colors } = useTheme();
  const t = toneColor(colors, tone);
  const h = toneColor(colors, hintTone);
  return (
    // height:'100%' makes every card in a row match the tallest one, so the row
    // grows to fit its content rather than the content being squeezed to fit.
    <View style={[glass(colors, { radius: 22 }), { padding: 18, height: '100%' }]}>
      <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Ionicons name={icon} size={22} color={t.fg} />
      </View>
      {/* No single-line clamp: a long money value like "GH₵ 12,345.67" must wrap
          rather than be cut off. adjustsFontSizeToFit is a no-op on web, so it
          was silently truncating there instead of shrinking. */}
      <Text style={{ fontFamily: font.bold, fontSize: 25, color: colors.ink, letterSpacing: -0.6, flexShrink: 1 }}>{value}</Text>
      <Text style={{ fontFamily: font.labelM, fontSize: 12.5, color: colors.inkMuted, marginTop: 3, lineHeight: 17 }}>{label}</Text>
      {!!hint && <Text style={{ fontFamily: font.body, fontSize: 11.5, color: hintTone === 'neutral' ? colors.inkGhost : h.fg, marginTop: 8, lineHeight: 16 }}>{hint}</Text>}
    </View>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useTheme();
  const t = toneColor(colors, tone);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.bg, borderRadius: 11, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' }}>
      {icon && <Ionicons name={icon} size={11} color={t.fg} />}
      <Text style={{ fontFamily: font.bold, fontSize: 10, letterSpacing: 0.5, color: t.fg, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

// ── Pill (solid coloured mini-badge, e.g. -11% / +6%) ────────────────────────────
export function DeltaPill({ value }: { value: number }) {
  const { colors } = useTheme();
  const up = value >= 0;
  return (
    <View style={{ backgroundColor: up ? colors.success : colors.error, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontFamily: font.bold, fontSize: 11, color: '#ffffff' }}>{up ? '+' : ''}{value}%</Text>
    </View>
  );
}

// ── Button ─────────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export function Btn({ title, onPress, variant = 'primary', icon, loading, disabled, fullWidth, small, style }: {
  title: string; onPress: () => void; variant?: BtnVariant; icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean; disabled?: boolean; fullWidth?: boolean; small?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const { isDesktop } = useResponsive();
  const isDisabled = disabled || loading;
  const height = small ? 42 : isDesktop ? 48 : 52;

  const palette = (pressed: boolean): { bg: string; border: string; fg: string; extra?: ViewStyle } => {
    if (isDisabled) return { bg: colors.surfaceMuted, border: 'transparent', fg: colors.inkGhost };
    switch (variant) {
      case 'primary': return { bg: pressed ? colors.primaryDim : colors.primary, border: 'transparent', fg: colors.onPrimary };
      case 'secondary': return { bg: colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)', border: pressed ? colors.primaryBorder : (colors.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.8)'), fg: colors.ink, extra: shadow(1) };
      case 'ghost': return { bg: 'transparent', border: 'transparent', fg: colors.inkSoft };
      case 'destructive': return { bg: colors.errorGhost, border: colors.error, fg: colors.error };
    }
  };

  return (
    <Pressable
      onPress={onPress} disabled={isDisabled} accessibilityRole="button"
      style={({ pressed }) => {
        const p = palette(pressed);
        return [{
          height, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          paddingHorizontal: 20, borderRadius: 14, backgroundColor: p.bg,
          borderWidth: variant === 'secondary' || variant === 'destructive' ? 1.5 : 0, borderColor: p.border,
          width: fullWidth ? '100%' : undefined,
          transform: [{ scale: pressed && variant === 'primary' ? 0.98 : 1 }],
          ...(variant === 'secondary' && IS_WEB ? ({ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any) : {}),
          ...(p.extra || {}),
        }, style];
      }}
    >
      {({ pressed }: any) => {
        const p = palette(pressed);
        return (
          <>
            {loading ? <ActivityIndicator size="small" color={p.fg} /> : icon ? <Ionicons name={icon} size={small ? 17 : 19} color={p.fg} /> : null}
            <Text style={{ fontFamily: font.labelL, fontSize: small ? 13.5 : 15, color: p.fg }}>{title}</Text>
          </>
        );
      }}
    </Pressable>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, body, cta, tone = 'neutral' }: {
  icon: keyof typeof Ionicons.glyphMap; title: string; body?: string;
  cta?: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap }; tone?: Tone;
}) {
  const { colors } = useTheme();
  const t = toneColor(colors, tone);
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 6 }}>
      <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Ionicons name={icon} size={38} color={tone === 'neutral' ? colors.inkGhost : t.fg} />
      </View>
      <Text style={{ fontFamily: font.h2, fontSize: 19, color: colors.ink, textAlign: 'center', letterSpacing: -0.2 }}>{title}</Text>
      {!!body && <Text style={{ fontFamily: font.body, fontSize: 13.5, color: colors.inkMuted, textAlign: 'center', lineHeight: 20, maxWidth: 340 }}>{body}</Text>}
      {cta && <View style={{ marginTop: 16 }}><Btn title={cta.label} onPress={cta.onPress} icon={cta.icon} /></View>}
    </View>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
export function Field({ label, hint, value, onChangeText, placeholder, multiline, keyboardType, editable = true, autoCapitalize, leadingIcon, error, style }: {
  label?: string; hint?: string; value: string; onChangeText?: (v: string) => void; placeholder?: string; multiline?: boolean;
  keyboardType?: KeyboardTypeOptions; editable?: boolean; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leadingIcon?: keyof typeof Ionicons.glyphMap; error?: string; style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? colors.error : focused ? colors.primary : (colors.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)');
  const bg = colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.65)';
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {!!label && <Text style={{ fontFamily: font.labelM, fontSize: 13.5, color: colors.ink, marginBottom: 8 }}>{label}</Text>}
      <View style={{
        flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center',
        backgroundColor: editable ? bg : (colors.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(34,32,34,0.04)'),
        borderRadius: 14, borderWidth: 1.5, borderColor, paddingHorizontal: 14,
        ...(focused && !error ? { shadowColor: '#c3d809', shadowOpacity: 0.28, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } } : {}),
      }}>
        {leadingIcon && <Ionicons name={leadingIcon} size={19} color={focused ? colors.ink : colors.inkMuted} style={{ marginRight: 10, marginTop: multiline ? 14 : 0 }} />}
        <TextInput
          value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.inkGhost}
          multiline={multiline} editable={editable} keyboardType={keyboardType} autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            flex: 1, minHeight: multiline ? 96 : 50, paddingVertical: multiline ? 14 : 0,
            fontFamily: font.body, fontSize: 15, color: editable ? colors.ink : colors.inkGhost,
            textAlignVertical: multiline ? 'top' : 'center', ...(IS_WEB ? ({ outlineStyle: 'none' } as any) : {}),
          }}
        />
      </View>
      {!!error && <Text style={{ fontFamily: font.body, fontSize: 11.5, color: colors.error, marginTop: 6 }}>{error}</Text>}
      {!error && !!hint && <Text style={{ fontFamily: font.body, fontSize: 11.5, color: colors.inkMuted, marginTop: 6, lineHeight: 16 }}>{hint}</Text>}
    </View>
  );
}

// ── Chip ─────────────────────────────────────────────────────────────────────
export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ([{
        flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 15, borderRadius: 18,
      }, active
        ? { backgroundColor: colors.primary }
        : [glass(colors, { radius: 18 }), pressed && { opacity: 0.8 }]])}
    >
      {icon && <Ionicons name={icon} size={15} color={active ? colors.onPrimary : colors.inkSoft} />}
      <Text style={{ fontFamily: active ? font.labelL : font.medium, fontSize: 13, color: active ? colors.onPrimary : colors.inkSoft }}>{label}</Text>
    </Pressable>
  );
}

// ── List row ─────────────────────────────────────────────────────────────────
export function ListRow({ icon, title, subtitle, onPress, right, tone = 'neutral', last }: {
  icon?: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; onPress?: () => void; right?: React.ReactNode; tone?: Tone; last?: boolean;
}) {
  const { colors } = useTheme();
  const t = toneColor(colors, tone);
  const divider = colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(34,32,34,0.07)';
  const content = (pressed: boolean) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 16, borderBottomWidth: last ? 0 : 1, borderBottomColor: divider, backgroundColor: pressed ? (colors.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.4)') : 'transparent' }}>
      {icon && (
        <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={19} color={tone === 'neutral' ? colors.inkSoft : t.fg} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: font.labelL, fontSize: 15, color: colors.ink }} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={{ fontFamily: font.body, fontSize: 12.5, color: colors.inkMuted, marginTop: 2 }} numberOfLines={2}>{subtitle}</Text>}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.inkGhost} /> : null)}
    </View>
  );
  if (!onPress) return content(false);
  return <Pressable onPress={onPress}>{({ pressed }) => content(pressed)}</Pressable>;
}

// ── Toggle row ─────────────────────────────────────────────────────────────────
export function ToggleRow({ icon, title, description, value, onValueChange, last }: {
  icon?: keyof typeof Ionicons.glyphMap; title: string; description?: string; value: boolean; onValueChange: (v: boolean) => void; last?: boolean;
}) {
  const { colors } = useTheme();
  const divider = colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(34,32,34,0.07)';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: last ? 0 : 1, borderBottomColor: divider }}>
      {icon && (
        <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(34,32,34,0.05)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={17} color={colors.inkSoft} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: font.labelL, fontSize: 14.5, color: colors.ink }}>{title}</Text>
        {!!description && <Text style={{ fontFamily: font.body, fontSize: 12.5, color: colors.inkMuted, marginTop: 2, lineHeight: 17 }}>{description}</Text>}
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.surfaceMuted, true: colors.primary }} thumbColor={Platform.OS === 'ios' ? '#ffffff' : value ? '#ffffff' : '#f4f3f4'} ios_backgroundColor={colors.surfaceMuted} />
    </View>
  );
}

// ── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(34,32,34,0.07)' }, style]} />;
}

// ── Skeleton ────────────────────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = 16, radius = 8, style }: { width?: number | string; height?: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: !IS_WEB }),
      Animated.timing(anim, { toValue: 0.5, duration: 700, useNativeDriver: !IS_WEB }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return <Animated.View style={[{ width: width as any, height, borderRadius: radius, backgroundColor: colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(34,32,34,0.06)', opacity: anim }, style]} />;
}

// ── Circular gauge (react-native-svg) ────────────────────────────────────────────
export function Gauge({ progress, size = 160, strokeWidth = 14, centerLabel, sublabel }: {
  progress: number; size?: number; strokeWidth?: number; centerLabel?: string; sublabel?: string;
}) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const arc = 0.75; // 270° gauge
  const track = colors.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(34,32,34,0.08)';
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primaryDim} />
            <Stop offset="1" stopColor={colors.primary} />
          </SvgGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={r} stroke={track} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${arc * C} ${C}`} strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`} />
        <Circle cx={cx} cy={cy} r={r} stroke="url(#gaugeGrad)" strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${clamped * arc * C} ${C}`} strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`} />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        {!!centerLabel && <Text style={{ fontFamily: font.bold, fontSize: size * 0.2, color: colors.ink, letterSpacing: -1 }}>{centerLabel}</Text>}
        {!!sublabel && <Text style={{ fontFamily: font.body, fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>{sublabel}</Text>}
      </View>
    </View>
  );
}

// ── Screen scaffold ─────────────────────────────────────────────────────────
export function ScreenBody({ children, contentStyle, maxWidth = 1200, refreshControl }: {
  children: React.ReactNode; contentStyle?: StyleProp<ViewStyle>; maxWidth?: number; refreshControl?: React.ReactElement;
}) {
  const { isDesktop } = useResponsive();
  return (
    <ScrollView
      style={{ flex: 1 }} showsVerticalScrollIndicator={false} refreshControl={refreshControl as any}
      contentContainerStyle={[{ padding: 24, paddingBottom: isDesktop ? 60 : 110, alignSelf: 'center', width: '100%', maxWidth }, contentStyle]}
    >
      <View style={{ width: '100%', gap: 24 }}>{children}</View>
    </ScrollView>
  );
}
