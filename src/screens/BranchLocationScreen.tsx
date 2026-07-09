import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { doc, updateDoc } from 'firebase/firestore';
import { colors, fonts, radius, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { ChipGroup } from '../components/ChipGroup';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { GhostButton } from '../components/GhostButton';
import { Pill } from '../components/Pill';
import { useApp } from '../store';
import { db } from '../lib/firebase';
import { parseLatLng, DEFAULT_GEOFENCE_M } from '../lib/geo';

export const BranchLocationScreen: React.FC = () => {
  const branches = useApp(s => s.branches);
  const setToast = useApp(s => s.setToast);

  const [bid, setBid] = useState<string>(branches[0]?.id || '');
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState(false);

  const branch: any = useMemo(() => branches.find(b => b.id === bid), [branches, bid]);
  const hasCoords = branch && Number.isFinite(branch.lat) && Number.isFinite(branch.lng);
  const rad = (branch?.geofence_radius as number) || DEFAULT_GEOFENCE_M;

  const save = async (lat: number, lng: number, source: string) => {
    setBusy(true);
    try {
      await updateDoc(doc(db, 'branches', bid), {
        lat, lng,
        geofence_radius: rad,
        location_source: source,
        location_updated_at: new Date().toISOString(),
      });
      setPaste('');
      setToast({ tone: 'green', text: `${branch?.name || 'Branch'} location saved` });
    } catch { setToast({ tone: 'red', text: 'Save failed' }); }
    finally { setBusy(false); }
  };

  const captureLive = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setToast({ tone: 'red', text: 'Location permission denied' }); return; }
      setBusy(true);
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await save(pos.coords.latitude, pos.coords.longitude, 'live');
    } catch { setToast({ tone: 'red', text: 'Could not get GPS' }); setBusy(false); }
  };

  const savePaste = async () => {
    const parsed = parseLatLng(paste);
    if (!parsed) { setToast({ tone: 'red', text: 'Could not read lat/lng from that' }); return; }
    await save(parsed.lat, parsed.lng, 'paste');
  };

  const setRadius = async (r: number) => {
    if (!hasCoords) { setToast({ tone: 'orange', text: 'Set a location first' }); return; }
    setBusy(true);
    try { await updateDoc(doc(db, 'branches', bid), { geofence_radius: r }); }
    catch {} finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 90 }}>
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: colors.text3 }}>
        Set each shop's GPS so staff can only mark present when physically at the shop.
      </Text>

      <ChipGroup items={branches.map(b => ({ id: b.id, label: b.name }))} active={bid} onChange={setBid} />

      <ListCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 16 }}>{branch?.name || '—'}</Text>
          <Pill tone={hasCoords ? 'green' : 'red'} text={hasCoords ? 'Location set' : 'Not set'} />
        </View>
        {hasCoords ? (
          <Text style={{ fontFamily: fonts.sansMedium, color: colors.text2, fontSize: 12, marginTop: 8 }}>
            {branch.lat.toFixed(6)}, {branch.lng.toFixed(6)}  ·  radius {rad} m
            {branch.location_source ? `  ·  ${branch.location_source}` : ''}
          </Text>
        ) : (
          <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 12, marginTop: 8 }}>
            No coordinates yet. Capture live at the shop, or paste a WhatsApp / Google Maps location.
          </Text>
        )}
      </ListCard>

      <ListCard>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>Option 1 · Capture live</Text>
        <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginBottom: 10 }}>Stand inside {branch?.name || 'the shop'} and tap to save your current GPS.</Text>
        <PrimaryButton label={busy ? 'Working…' : 'Capture Current GPS'} onPress={captureLive} disabled={busy} icon="phone" fullWidth />
      </ListCard>

      <ListCard>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>Option 2 · Paste from WhatsApp / Maps</Text>
        <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginBottom: 10 }}>
          In WhatsApp open the shared location → "Open in Maps" → Share → Copy link, then paste here. Or paste "lat, lng".
        </Text>
        <TextField placeholder="Maps link or 12.9716, 77.5946" value={paste} onChangeText={setPaste} autoCapitalize="none" autoCorrect={false} />
        <View style={{ marginTop: 10 }}>
          <GhostButton label={busy ? 'Working…' : 'Save Pasted Location'} onPress={savePaste} />
        </View>
      </ListCard>

      <ListCard>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>Check-in radius</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[75, 150, 300].map(r => (
            <View key={r} style={{ flex: 1 }}>
              <GhostButton label={`${r} m${rad === r ? ' ✓' : ''}`} onPress={() => setRadius(r)} />
            </View>
          ))}
        </View>
      </ListCard>

      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10, color: colors.text4 }}>
        Short links (maps.app.goo.gl) can't be read directly — open the link, then copy the full Google Maps URL or the coordinates.
      </Text>
    </ScrollView>
  );
};
