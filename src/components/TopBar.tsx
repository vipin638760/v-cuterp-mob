import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { useApp, currentScreen, SCREEN_TITLES } from '../store';

export const TopBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const screen = useApp(currentScreen);
  const history = useApp(s => s.history);
  const pop = useApp(s => s.pop);
  const setDrawerOpen = useApp(s => s.setDrawerOpen);
  const setNotificationsOpen = useApp(s => s.setNotificationsOpen);
  const user = useApp(s => s.user);
  const leaves = useApp(s => s.leaves);
  const advances = useApp(s => s.advances);
  const tasks = useApp(s => s.tasks);

  const unread = useMemo(() => {
    if (!user) return 0;
    if (user.role === 'admin' || user.role === 'accountant') {
      return leaves.filter(l => l.status === 'pending').length +
             advances.filter(a => a.status === 'pending').length;
    }
    return tasks.filter(t => t.assignee_id === user.staff_id && t.status !== 'done' && !t.read_by_assignee).length;
  }, [user, leaves, advances, tasks]);

  const isRoot = history.length <= 1 && screen === 'dashboard';

  return (
    <View style={{
      paddingTop: insets.top,
      backgroundColor: colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    }}>
      <View style={{
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
      }}>
        {isRoot ? (
          <Pressable onPress={() => setDrawerOpen(true)} hitSlop={8} style={{ padding: 6 }}>
            <Icon name="menu" size={22} color={colors.text2} />
          </Pressable>
        ) : (
          <Pressable onPress={() => pop()} hitSlop={8} style={{ padding: 6 }}>
            <Icon name="arrow-left" size={22} color={colors.text2} />
          </Pressable>
        )}

        <View style={{ flex: 1 }}>
          {isRoot ? (
            <Text style={{ fontFamily: fonts.script, color: colors.gold, fontSize: 26, lineHeight: 30 }}>
              V-Cut
            </Text>
          ) : (
            <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 18 }}>
              {SCREEN_TITLES[screen]}
            </Text>
          )}
        </View>

        <Pressable onPress={() => setNotificationsOpen(true)} hitSlop={8} style={{ padding: 6 }}>
          <Icon name="bell" size={20} color={colors.text2} />
          {unread > 0 && (
            <View style={{
              position: 'absolute', top: 2, right: 2,
              minWidth: 16, height: 16, borderRadius: 8,
              backgroundColor: colors.gold,
              alignItems: 'center', justifyContent: 'center',
              paddingHorizontal: 4,
            }}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, color: colors.bg }}>
                {unread > 9 ? '9+' : String(unread)}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
};
