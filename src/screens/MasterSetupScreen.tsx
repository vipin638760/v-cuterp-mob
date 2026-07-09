import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { addDoc, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { colors, fonts, INR, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { Pill } from '../components/Pill';
import { Sheet } from '../components/Sheet';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { GhostButton } from '../components/GhostButton';
import { Icon } from '../components/Icon';
import { useApp } from '../store';
import { db } from '../lib/firebase';
import type { Branch, GlobalSettings } from '../lib/types';

const numFmt = (v: any): string => v === undefined || v === null ? '' : String(v);
const numIn = (s: string): string => s.replace(/[^0-9]/g, '');

export const MasterSetupScreen: React.FC = () => {
  const branches = useApp(s => s.branches);
  const settings = useApp(s => s.settings);
  const setToast = useApp(s => s.setToast);

  const [globalOpen, setGlobalOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [gs, setGs] = useState<GlobalSettings>(settings);
  const [b, setB] = useState<Partial<Branch>>({});

  const openGlobal = () => { setGs(settings); setGlobalOpen(true); };
  const saveGlobal = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), gs, { merge: true });
      setToast({ tone: 'green', text: 'Settings saved' });
      setGlobalOpen(false);
    } catch { setToast({ tone: 'red', text: 'Save failed' }); }
  };

  const openBranch = (br?: Branch) => {
    setEditingBranch(br || null);
    setB(br ? { ...br } : { type: 'mens' });
    setBranchOpen(true);
  };
  const saveBranch = async () => {
    if (!b.name?.trim()) { setToast({ tone: 'red', text: 'Name required' }); return; }
    try {
      const payload: any = {
        name: b.name.trim(),
        prefix: (b.prefix || '').trim().toUpperCase() || undefined,
        type: b.type || 'mens',
        shop_rent: Number(b.shop_rent) || 0,
        room_rent: Number(b.room_rent) || 0,
        shop_elec: Number(b.shop_elec) || 0,
        room_elec: Number(b.room_elec) || 0,
        wifi: Number(b.wifi) || 0,
        water: Number(b.water) || 0,
      };
      if (editingBranch) {
        await updateDoc(doc(db, 'branches', editingBranch.id), payload);
        setToast({ tone: 'green', text: 'Branch updated' });
      } else {
        await addDoc(collection(db, 'branches'), payload);
        setToast({ tone: 'green', text: 'Branch added' });
      }
      setBranchOpen(false);
    } catch { setToast({ tone: 'red', text: 'Save failed' }); }
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
        <Pressable onPress={openGlobal}>
          <ListCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 16 }}>Global Settings</Text>
              <Icon name="edit" size={16} color={colors.gold} />
            </View>
            {([
              ['GST %', `${settings.gst_pct ?? 0}%`],
              ['Mens Incentive', `${settings.mens_incentive ?? 0}%`],
              ['Unisex Incentive', `${settings.unisex_incentive ?? 0}%`],
              ['Mens Target', INR(settings.mens_target || 0)],
              ['Unisex Target', INR(settings.unisex_target || 0)],
              ['Mens Leaves', String(settings.mens_leaves ?? 2)],
              ['Unisex Leaves', String(settings.unisex_leaves ?? 3)],
            ] as const).map(([k, v], i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < 6 ? 1 : 0, borderColor: colors.line }}>
                <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.text2, fontSize: 12 }}>{k}</Text>
                <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 13 }}>{v}</Text>
              </View>
            ))}
          </ListCard>
        </Pressable>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>
            Branches · {branches.length}
          </Text>
          <Pressable onPress={() => openBranch()}>
            <Pill tone="gold" text="+ NEW BRANCH" />
          </Pressable>
        </View>
        {branches.map(br => (
          <Pressable key={br.id} onPress={() => openBranch(br)}>
            <ListCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{br.name}</Text>
                  <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>
                    Prefix: {br.prefix || '—'}
                  </Text>
                </View>
                <Pill tone="gold" text={(br.type || 'mens').toUpperCase()} />
                <Icon name="chevron-right" size={16} color={colors.text3} />
              </View>
            </ListCard>
          </Pressable>
        ))}
      </ScrollView>

      <Sheet open={globalOpen} onClose={() => setGlobalOpen(false)} title="Global Settings">
        <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={{ paddingHorizontal: space.xl, paddingVertical: 12, gap: 10 }}>
          <TextField label="GST %" keyboardType="number-pad" value={numFmt(gs.gst_pct)}
            onChangeText={v => setGs({ ...gs, gst_pct: Number(numIn(v)) || 0 })} />
          <TextField label="Mens Incentive %" keyboardType="number-pad" value={numFmt(gs.mens_incentive)}
            onChangeText={v => setGs({ ...gs, mens_incentive: Number(numIn(v)) || 0 })} />
          <TextField label="Unisex Incentive %" keyboardType="number-pad" value={numFmt(gs.unisex_incentive)}
            onChangeText={v => setGs({ ...gs, unisex_incentive: Number(numIn(v)) || 0 })} />
          <TextField label="Mens Target" keyboardType="number-pad" value={numFmt(gs.mens_target)}
            onChangeText={v => setGs({ ...gs, mens_target: Number(numIn(v)) || 0 })} />
          <TextField label="Unisex Target" keyboardType="number-pad" value={numFmt(gs.unisex_target)}
            onChangeText={v => setGs({ ...gs, unisex_target: Number(numIn(v)) || 0 })} />
          <TextField label="Mens Leaves / month" keyboardType="number-pad" value={numFmt(gs.mens_leaves)}
            onChangeText={v => setGs({ ...gs, mens_leaves: Number(numIn(v)) || 0 })} />
          <TextField label="Unisex Leaves / month" keyboardType="number-pad" value={numFmt(gs.unisex_leaves)}
            onChangeText={v => setGs({ ...gs, unisex_leaves: Number(numIn(v)) || 0 })} />
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: space.xl, paddingTop: 8 }}>
          <GhostButton label="Cancel" onPress={() => setGlobalOpen(false)} fullWidth style={{ flex: 1 } as any} />
          <PrimaryButton label="Save" icon="check" onPress={saveGlobal} fullWidth style={{ flex: 1 } as any} />
        </View>
      </Sheet>

      <Sheet open={branchOpen} onClose={() => setBranchOpen(false)} title={editingBranch ? 'Edit Branch' : 'New Branch'}>
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ paddingHorizontal: space.xl, paddingVertical: 12, gap: 10 }}>
          <TextField label="Name" value={b.name || ''} onChangeText={v => setB({ ...b, name: v })} />
          <TextField label="Prefix (3 letters)" value={b.prefix || ''} onChangeText={v => setB({ ...b, prefix: v })} autoCapitalize="characters" maxLength={5} />
          <View>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.text3, marginBottom: 6 }}>Type</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['mens', 'unisex'] as const).map(t => (
                <Pressable key={t} onPress={() => setB({ ...b, type: t })} style={{
                  flex: 1, paddingVertical: 10, alignItems: 'center',
                  borderRadius: 8, borderWidth: 1,
                  borderColor: b.type === t ? colors.gold : colors.line2,
                  backgroundColor: b.type === t ? 'rgba(212,165,116,0.18)' : colors.bg3,
                }}>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: b.type === t ? colors.gold : colors.text2 }}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <TextField label="Shop Rent" keyboardType="number-pad" value={numFmt(b.shop_rent)}
            onChangeText={v => setB({ ...b, shop_rent: Number(numIn(v)) || 0 })} />
          <TextField label="Room Rent" keyboardType="number-pad" value={numFmt(b.room_rent)}
            onChangeText={v => setB({ ...b, room_rent: Number(numIn(v)) || 0 })} />
          <TextField label="Shop Electricity" keyboardType="number-pad" value={numFmt(b.shop_elec)}
            onChangeText={v => setB({ ...b, shop_elec: Number(numIn(v)) || 0 })} />
          <TextField label="Room Electricity" keyboardType="number-pad" value={numFmt(b.room_elec)}
            onChangeText={v => setB({ ...b, room_elec: Number(numIn(v)) || 0 })} />
          <TextField label="WiFi" keyboardType="number-pad" value={numFmt(b.wifi)}
            onChangeText={v => setB({ ...b, wifi: Number(numIn(v)) || 0 })} />
          <TextField label="Water" keyboardType="number-pad" value={numFmt(b.water)}
            onChangeText={v => setB({ ...b, water: Number(numIn(v)) || 0 })} />
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: space.xl, paddingTop: 8 }}>
          <GhostButton label="Cancel" onPress={() => setBranchOpen(false)} fullWidth style={{ flex: 1 } as any} />
          <PrimaryButton label="Save" icon="check" onPress={saveBranch} fullWidth style={{ flex: 1 } as any} />
        </View>
      </Sheet>
    </>
  );
};
