import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, radius, space } from '../theme';
import { Sheet } from './Sheet';
import { ListCard } from './ListCard';
import { TextField } from './TextField';
import { PrimaryButton } from './PrimaryButton';
import { GhostButton } from './GhostButton';
import { Pill } from './Pill';
import { Icon } from './Icon';
import { useApp } from '../store';
import { effectiveBranchOnDate } from '../lib/calculations';
import type { StaffBilling } from '../lib/types';

interface StaffBillingEditorProps {
  open: boolean;
  rows: StaffBilling[];
  branchId: string;
  branchType?: string;
  date: string;
  onSave: (rows: StaffBilling[]) => void;
  onClose: () => void;
}

const round = (v: any): number => Math.round(Number(v) || 0);

export const StaffBillingEditor: React.FC<StaffBillingEditorProps> = ({
  open, rows, branchId, branchType, date, onSave, onClose,
}) => {
  const staff = useApp(s => s.staff);
  const transfers = useApp(s => s.transfers);
  const settings = useApp(s => s.settings);
  const branches = useApp(s => s.branches);

  const incentivePct = (branchType || '').toLowerCase() === 'unisex'
    ? (settings.unisex_incentive ?? 0)
    : (settings.mens_incentive ?? 0);

  const eligibleStaff = useMemo(() => staff.filter(st => {
    if (st.exit_date && st.exit_date < date) return false;
    const eff = effectiveBranchOnDate(st, date, transfers);
    return !!eff;
  }), [staff, transfers, date]);

  const [draft, setDraft] = useState<StaffBilling[]>(rows);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => { setDraft(rows); }, [open, rows]);

  const updateRow = (idx: number, patch: Partial<StaffBilling>) => {
    setDraft(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const merged = { ...r, ...patch };
      if (patch.billing !== undefined) {
        merged.billing = round(patch.billing);
        merged.incentive = round(merged.billing * incentivePct / 100);
      }
      return merged;
    }));
  };

  const removeRow = (idx: number) => setDraft(prev => prev.filter((_, i) => i !== idx));

  const addRow = (staffId: string) => {
    const st = staff.find(s => s.id === staffId);
    if (!st) return;
    if (draft.some(r => r.staff_id === staffId)) {
      setPickerOpen(false);
      return;
    }
    const home = st.branch_id;
    const loan = home && home !== branchId;
    setDraft(prev => [...prev, {
      staff_id: staffId, billing: 0, incentive: 0, mat_incentive: 0, tips: 0,
      tip_in: 'online', tip_paid: 'cash',
      home_branch_id: home, loan_flag: !!loan,
    } as StaffBilling]);
    setPickerOpen(false);
  };

  const totals = useMemo(() => {
    return draft.reduce((acc, r) => {
      acc.billing += r.billing || 0;
      acc.incentive += (r.incentive || 0) + (r.mat_incentive || 0);
      acc.tips += r.tips || 0;
      return acc;
    }, { billing: 0, incentive: 0, tips: 0 });
  }, [draft]);

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Staff Billing">
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ paddingHorizontal: space.xl, paddingVertical: space.md, gap: space.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>
              {draft.length} rows · Inc {incentivePct}%
            </Text>
            <Pressable onPress={() => setPickerOpen(true)}>
              <Pill tone="gold" text="+ ADD STAFF" />
            </Pressable>
          </View>

          {draft.map((r, idx) => {
            const st = staff.find(s => s.id === r.staff_id);
            const home = branches.find(b => b.id === r.home_branch_id);
            return (
              <ListCard key={`${r.staff_id}-${idx}`}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>
                      {st?.name || r.staff_id}
                    </Text>
                    {r.loan_flag && <Pill tone="orange" text={`LOAN · ${home?.name || ''}`} style={{ marginTop: 4 }} />}
                  </View>
                  <Pressable onPress={() => removeRow(idx)} hitSlop={6} style={{ padding: 4 }}>
                    <Icon name="trash" size={16} color={colors.red} />
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <TextField label="Billing" keyboardType="number-pad"
                      value={String(r.billing || 0)}
                      onChangeText={s => updateRow(idx, { billing: Number(s.replace(/[^0-9]/g, '')) || 0 })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextField label="Tips" keyboardType="number-pad"
                      value={String(r.tips || 0)}
                      onChangeText={s => updateRow(idx, { tips: Number(s.replace(/[^0-9]/g, '')) || 0 })}
                    />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <View style={{ flex: 1 }}>
                    <TextField label="Mat Inc" keyboardType="number-pad"
                      value={String(r.mat_incentive || 0)}
                      onChangeText={s => updateRow(idx, { mat_incentive: Number(s.replace(/[^0-9]/g, '')) || 0 })}
                    />
                  </View>
                  <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>Incentive</Text>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 18, marginTop: 6 }}>{INR(r.incentive || 0)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                  {(['cash', 'online'] as const).map(m => (
                    <Pressable key={'in_' + m} onPress={() => updateRow(idx, { tip_in: m })} style={{
                      flex: 1, paddingVertical: 6, alignItems: 'center',
                      borderRadius: radius.sm, borderWidth: 1,
                      borderColor: r.tip_in === m ? colors.gold : colors.line2,
                      backgroundColor: r.tip_in === m ? 'rgba(212,165,116,0.18)' : colors.bg3,
                    }}>
                      <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: r.tip_in === m ? colors.gold : colors.text3 }}>
                        Tip in {m}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ListCard>
            );
          })}
          {draft.length === 0 && (
            <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, textAlign: 'center', paddingVertical: 24 }}>
              Tap + ADD STAFF to begin
            </Text>
          )}
        </ScrollView>

        <View style={{
          paddingHorizontal: space.xl, paddingTop: 12,
          borderTopWidth: 1, borderColor: colors.line,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
        }}>
          <View>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>Total Billing</Text>
            <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 22 }}>{INR(totals.billing)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>Total Inc</Text>
            <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 18 }}>{INR(totals.incentive)}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: space.xl, paddingTop: 4 }}>
          <GhostButton label="Cancel" onPress={onClose} fullWidth style={{ flex: 1 } as any} />
          <PrimaryButton label="Save" icon="check" onPress={() => { onSave(draft); onClose(); }} fullWidth style={{ flex: 1 } as any} />
        </View>
      </Sheet>

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Pick Staff">
        <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={{ paddingHorizontal: space.xl, paddingVertical: 12 }}>
          {eligibleStaff.map(st => {
            const eff = effectiveBranchOnDate(st, date, transfers);
            const loan = st.branch_id && eff !== st.branch_id;
            return (
              <Pressable key={st.id} onPress={() => addRow(st.id)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.line }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{st.name}</Text>
                    <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11 }}>{st.role || '—'}</Text>
                  </View>
                  {loan && <Pill tone="orange" text="LOAN" />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </Sheet>
    </>
  );
};
