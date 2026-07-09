import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, getDocs } from 'firebase/firestore';
import { colors, fonts, radius } from '../theme';
import { Icon } from '../components/Icon';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Loader } from '../components/Loader';
import { useApp } from '../store';
import { saveSession, writeRemember, readRemember } from '../lib/session';
import { DEFAULTS_USERS } from '../lib/constants';
import { db } from '../lib/firebase';
import type { Role, User } from '../lib/types';

const ROLE_TABS: { id: Role; label: string }[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'accountant', label: 'Accountant' },
  { id: 'employee', label: 'Employee' },
];

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const setUser = useApp(s => s.setUser);
  const setToast = useApp(s => s.setToast);

  const [tab, setTab] = useState<Role>('admin');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>(DEFAULTS_USERS);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (!snap.empty) {
          const arr: User[] = [];
          snap.forEach(d => arr.push({ id: d.id, ...(d.data() as any) }));
          setUsers(arr.length ? arr : DEFAULTS_USERS);
        }
      } catch {}
    })();
    (async () => {
      const map = await readRemember();
      const last = map[tab];
      if (last) {
        const u = (users.find(x => x.id === last.uid));
        if (u) setName(u.name);
      }
    })();
  }, []);

  const submit = async () => {
    setLoading(true);
    const trimmed = name.trim();
    const u = users.find(x =>
      x.role === tab &&
      x.name.toLowerCase() === trimmed.toLowerCase() &&
      (x.password || '') === password
    );
    if (!u) {
      setLoading(false);
      setToast({ tone: 'red', text: 'Invalid credentials' });
      return;
    }
    await saveSession(u);
    await writeRemember(tab, u.id);
    setUser(u);
    setLoading(false);
    setToast({ tone: 'green', text: `Welcome, ${u.name.split(' ')[0]}` });
  };

  if (loading) return <Loader fullscreen caption="SIGNING IN" />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 28,
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 36 }}>
          <Text style={{ fontFamily: fonts.script, color: colors.gold, fontSize: 64, lineHeight: 72 }}>V-Cut</Text>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: colors.text3, marginTop: 4 }}>
            Luxe Salon ERP
          </Text>
        </View>

        <View style={{
          flexDirection: 'row',
          backgroundColor: colors.bg2,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.line,
          padding: 4,
          marginBottom: 24,
        }}>
          {ROLE_TABS.map(t => (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: radius.sm,
                backgroundColor: tab === t.id ? colors.gold : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontFamily: fonts.sansBold,
                fontSize: 10,
                letterSpacing: 1.6,
                textTransform: 'uppercase',
                color: tab === t.id ? colors.bg : colors.text2,
              }}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 16 }}>
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
            placeholder="Enter your name"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPwd}
            placeholder="Enter password"
            rightIcon={
              <Pressable onPress={() => setShowPwd(s => !s)} hitSlop={8} style={{ padding: 6 }}>
                <Icon name={showPwd ? 'eye-off' : 'eye'} size={16} color={colors.text3} />
              </Pressable>
            }
          />
          <PrimaryButton label="Sign In" onPress={submit} icon="arrow-up" fullWidth />
        </View>

        <Text style={{
          fontFamily: fonts.sansMedium,
          fontSize: 10,
          color: colors.text4,
          textAlign: 'center',
          marginTop: 32,
          letterSpacing: 1,
        }}>
          Authorized personnel only · v1.0
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
