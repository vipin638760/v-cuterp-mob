import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { DrawerSheet } from './DrawerSheet';
import { NotificationsSheet } from './NotificationsSheet';
import { useApp } from '../store';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const notifOpen = useApp(s => s.notificationsOpen);
  const setNotifOpen = useApp(s => s.setNotificationsOpen);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar />
      <View style={{ flex: 1 }}>{children}</View>
      <BottomNav />
      <DrawerSheet />
      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  );
};
