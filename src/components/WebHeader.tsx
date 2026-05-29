import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

export const WebHeader = () => {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  if (!isDesktop) return null;

  const handleNav = (path: string) => {
    router.navigate(path as any);
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/' || pathname === '/(tabs)';
    return pathname.includes(path);
  };

  const getNavStyle = (path: string) => {
    return isActive(path) ? "text-[#222022]" : "text-[#6b696b]";
  };

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 32,
      paddingVertical: 16,
      backgroundColor: '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: '#eceae6',
      zIndex: 50,
      shadowColor: '#222022',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    }}
    className="md:flex" // NativeWind class to only show on md+ screens
    >
      {/* Brand Logo */}
      <Pressable onPress={() => handleNav('/')} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="cube" size={32} color="#c3d809" />
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: '#222022', marginLeft: 8 }}>Electric</Text>
      </Pressable>

      {/* Navigation Links */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 32 }}>
        <Pressable onPress={() => handleNav('/')} style={{ paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: isActive('/') ? '#c3d809' : 'transparent' }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15 }} className={getNavStyle('/')}>Home</Text>
        </Pressable>
        <Pressable onPress={() => handleNav('/search')} style={{ paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: isActive('/search') ? '#c3d809' : 'transparent' }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15 }} className={getNavStyle('/search')}>Search</Text>
        </Pressable>
        <Pressable onPress={() => handleNav('/cart')} style={{ paddingBottom: 4, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: isActive('/cart') ? '#c3d809' : 'transparent' }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15 }} className={getNavStyle('/cart')}>Cart</Text>
          <View style={{ backgroundColor: '#c3d809', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#222022' }}>2</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => handleNav('/profile')} style={{ paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: isActive('/profile') ? '#c3d809' : 'transparent' }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15 }} className={getNavStyle('/profile')}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
};
