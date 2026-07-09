import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';
import {
  useFonts as useCormorant,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { useFonts as useGreatVibes, GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { Loader } from './src/components/Loader';
import { Toast } from './src/components/Toast';
import { useApp } from './src/store';
import { loadSession } from './src/lib/session';
import { useFirestoreSubscriptions } from './src/lib/data';
import { Router } from './src/Router';
import { colors } from './src/theme';

export default function App() {
  const [cormorantLoaded] = useCormorant({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
  });
  const [interLoaded] = useInter({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const [vibesLoaded] = useGreatVibes({ GreatVibes_400Regular });

  const [sessionChecked, setSessionChecked] = useState(false);
  const setUser = useApp(s => s.setUser);
  const setHydrated = useApp(s => s.setHydrated);
  const user = useApp(s => s.user);

  useFirestoreSubscriptions(!!user);

  useEffect(() => {
    (async () => {
      const u = await loadSession();
      if (u) setUser(u);
      setSessionChecked(true);
      setHydrated(true);
    })();
  }, []);

  const fontsReady = cormorantLoaded && interLoaded && vibesLoaded;
  if (!fontsReady || !sessionChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style="light" />
        <Loader fullscreen caption="LOADING" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <StatusBar style="light" />
          <Router />
          <Toast />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
