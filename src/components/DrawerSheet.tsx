import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, Text, View, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme';
import { Icon, IconName } from './Icon';
import { useApp, NAV_BY_ROLE, SCREEN_TITLES, Screen } from '../store';
import { clearSession } from '../lib/session';

const SCREEN_ICONS: Partial<Record<Screen, IconName>> = {
  dashboard: 'home',
  pulse: 'trending',
  'branch-detail': 'briefcase',
  'staff-detail': 'users',
  pos: 'shopping-bag',
  entry: 'edit',
  pl: 'pie',
  branches: 'briefcase',
  customers: 'users-2',
  staff: 'users',
  materials: 'package',
  'material-master': 'package',
  'cash-collection': 'cash',
  'op-expenses': 'file',
  'daily-expenses': 'file',
  incentive: 'star',
  'menu-config': 'list',
  taskpedia: 'check-circle',
  leaves: 'calendar',
  payroll: 'wallet',
  'master-setup': 'settings',
  'day-working': 'scissors',
  'my-target': 'trending',
  'my-payroll': 'wallet',
  'apply-leave': 'calendar',
};

export const DrawerSheet: React.FC = () => {
  const insets = useSafeAreaInsets();
  const open = useApp(s => s.drawerOpen);
  const setDrawerOpen = useApp(s => s.setDrawerOpen);
  const user = useApp(s => s.user);
  const setUser = useApp(s => s.setUser);
  const replace = useApp(s => s.replace);
  const push = useApp(s => s.push);
  const screenW = Dimensions.get('window').width;
  const drawerW = Math.min(320, screenW * 0.86);

  const tx = useRef(new Animated.Value(-drawerW)).current;
  const overlayOp = useRef(new Animated.Value(0)).current;
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; if (!open) return; }
    Animated.parallel([
      Animated.timing(tx, { toValue: open ? 0 : -drawerW, duration: 260, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }),
      Animated.timing(overlayOp, { toValue: open ? 1 : 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [open]);

  if (!user) return null;
  const items = NAV_BY_ROLE[user.role] || [];

  const onSelect = (s: Screen) => {
    if (s === 'dashboard') replace(s); else push(s);
    setDrawerOpen(false);
  };

  const onLogout = async () => {
    await clearSession();
    setUser(null);
    setDrawerOpen(false);
    replace('dashboard');
  };

  return (
    <View pointerEvents={open ? 'auto' : 'none'} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
      <Animated.View
        style={{
          position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          opacity: overlayOp,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={() => setDrawerOpen(false)} />
      </Animated.View>

      <Animated.View style={{
        position: 'absolute', top: 0, bottom: 0, left: 0,
        width: drawerW,
        backgroundColor: colors.bg2,
        borderRightWidth: 1,
        borderRightColor: colors.line,
        transform: [{ translateX: tx }],
        shadowColor: '#000', shadowOffset: { width: 24, height: 0 }, shadowOpacity: 0.6, shadowRadius: 80, elevation: 24,
      }}>
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <Text style={{ fontFamily: fonts.script, color: colors.gold, fontSize: 32, lineHeight: 38 }}>V-Cut</Text>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 2.4, textTransform: 'uppercase', color: colors.text3, marginTop: 4 }}>Luxe Salon ERP</Text>
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 16 }}>{user.name}</Text>
            <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.text2, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 2 }}>{user.role}</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 8 }}>
          {items.map(s => (
            <Pressable
              key={s}
              onPress={() => onSelect(s)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingHorizontal: 20,
                paddingVertical: 12,
                backgroundColor: pressed ? colors.bg3 : 'transparent',
              })}
            >
              <Icon name={SCREEN_ICONS[s] || 'list'} size={18} color={colors.text2} />
              <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.text, fontSize: 13, flex: 1 }}>
                {SCREEN_TITLES[s]}
              </Text>
              <Icon name="chevron-right" size={16} color={colors.text4} />
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          onPress={onLogout}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', gap: 14,
            paddingHorizontal: 20, paddingVertical: 16,
            paddingBottom: 16 + insets.bottom,
            borderTopWidth: 1, borderTopColor: colors.line,
            backgroundColor: pressed ? colors.bg3 : 'transparent',
          })}
        >
          <Icon name="logout" size={18} color={colors.red} />
          <Text style={{ fontFamily: fonts.sansBold, color: colors.red, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase' }}>
            Sign Out
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};
