import React from 'react';
import { Pressable, Text, View, ScrollView } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors, fonts, INR, radius, space } from '../theme';
import { Sheet } from './Sheet';
import { PrimaryButton } from './PrimaryButton';
import { GhostButton } from './GhostButton';
import { useApp } from '../store';
import type { Branch, Customer, Invoice } from '../lib/types';

interface BillPrintModalProps {
  open: boolean;
  invoice: Invoice | null;
  branch: Branch | null;
  customer: Customer | null;
  onClose: () => void;
}

const buildHtml = (inv: Invoice, branch: Branch | null, customer: Customer | null, gstPct: number): string => {
  const subtotal = inv.items.reduce((s, it) => s + it.price * it.qty, 0);
  const gst = Math.round(subtotal * gstPct / 100);
  const itemsHtml = inv.items.map(it => `
    <tr>
      <td>${it.name}</td>
      <td style="text-align:center">${it.qty}</td>
      <td style="text-align:right">₹${(it.price * it.qty).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');
  const customerLabel = customer ? customer.name : (inv.walkin_no ? `Walk-in #${String(inv.walkin_no).padStart(3, '0')}` : 'Walk-in');
  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page { size: 80mm auto; margin: 4mm; }
        body { font-family: -apple-system, system-ui, sans-serif; color: #1a1510; padding: 0; margin: 0; }
        .brand { font-family: 'Great Vibes', cursive; font-size: 36px; text-align: center; color: #b8864a; margin: 0; }
        .tag { letter-spacing: 3px; font-size: 9px; text-align: center; color: #5a4e3d; text-transform: uppercase; margin-top: 2px; }
        .meta { margin-top: 8px; font-size: 11px; }
        .hr { border-top: 1px dashed #1a1510; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { padding: 4px 0; }
        th { font-weight: 700; border-bottom: 1px solid #1a1510; text-align: left; }
        .total-row td { font-weight: 700; font-size: 13px; border-top: 1px solid #1a1510; padding-top: 6px; }
        .footer { text-align: center; font-size: 10px; color: #5a4e3d; margin-top: 8px; }
      </style>
    </head>
    <body>
      <h1 class="brand">V-Cut</h1>
      <div class="tag">Luxe Salon</div>
      <div class="hr"></div>
      <div class="meta">
        <div><strong>${branch?.name || ''}</strong></div>
        <div>${inv.invoice_no || ''}</div>
        <div>${(inv.settled_at || '').slice(0, 19).replace('T', ' ')}</div>
        <div>Customer: ${customerLabel}</div>
        <div>Payment: ${(inv.payment_mode || 'cash').toUpperCase()}</div>
      </div>
      <div class="hr"></div>
      <table>
        <thead>
          <tr><th>Service</th><th style="text-align:center">Qty</th><th style="text-align:right">Amt</th></tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr><td colspan="2">Subtotal</td><td style="text-align:right">₹${subtotal.toLocaleString('en-IN')}</td></tr>
          ${gstPct > 0 ? `<tr><td colspan="2">GST ${gstPct}%</td><td style="text-align:right">₹${gst.toLocaleString('en-IN')}</td></tr>` : ''}
          <tr class="total-row"><td colspan="2">TOTAL</td><td style="text-align:right">₹${(inv.total).toLocaleString('en-IN')}</td></tr>
        </tfoot>
      </table>
      <div class="hr"></div>
      <div class="footer">Thank you · See you again</div>
    </body>
  </html>`;
};

export const BillPrintModal: React.FC<BillPrintModalProps> = ({ open, invoice, branch, customer, onClose }) => {
  const settings = useApp(s => s.settings);
  const setToast = useApp(s => s.setToast);

  if (!invoice) return <Sheet open={open} onClose={onClose} />;

  const onPrint = async () => {
    try {
      const html = buildHtml(invoice, branch, customer, settings.gst_pct || 0);
      await Print.printAsync({ html });
    } catch {
      setToast({ tone: 'red', text: 'Print failed' });
    }
  };

  const onShare = async () => {
    try {
      const html = buildHtml(invoice, branch, customer, settings.gst_pct || 0);
      const { uri } = await Print.printToFileAsync({ html });
      const ok = await Sharing.isAvailableAsync();
      if (ok) await Sharing.shareAsync(uri);
      else setToast({ tone: 'red', text: 'Share unavailable' });
    } catch {
      setToast({ tone: 'red', text: 'Share failed' });
    }
  };

  const customerLabel = customer ? customer.name : invoice.walkin_no ? `Walk-in #${String(invoice.walkin_no).padStart(3, '0')}` : 'Walk-in';

  return (
    <Sheet open={open} onClose={onClose} title="Receipt">
      <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={{ paddingHorizontal: space.xl, paddingVertical: space.md }}>
        <View style={{
          backgroundColor: colors.bg3, borderRadius: radius.lg, padding: 16,
          borderWidth: 1, borderColor: colors.line2,
        }}>
          <Text style={{ fontFamily: fonts.script, color: colors.gold, fontSize: 30, textAlign: 'center' }}>V-Cut</Text>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 2.4, textTransform: 'uppercase', color: colors.text3, textAlign: 'center', marginTop: 2 }}>
            Luxe Salon
          </Text>
          <View style={{ borderBottomWidth: 1, borderColor: colors.line2, borderStyle: 'dashed', marginVertical: 10 }} />
          <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{branch?.name}</Text>
          <Text style={{ fontFamily: fonts.sansMedium, color: colors.text2, fontSize: 12 }}>{invoice.invoice_no}</Text>
          <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11 }}>
            {(invoice.settled_at || '').slice(0, 19).replace('T', ' ')}
          </Text>
          <Text style={{ fontFamily: fonts.sansMedium, color: colors.text2, fontSize: 12, marginTop: 6 }}>Customer: {customerLabel}</Text>
          <Text style={{ fontFamily: fonts.sansMedium, color: colors.text2, fontSize: 12 }}>Payment: {(invoice.payment_mode || 'cash').toUpperCase()}</Text>
          <View style={{ borderBottomWidth: 1, borderColor: colors.line2, borderStyle: 'dashed', marginVertical: 10 }} />
          {invoice.items.map((it, i) => (
            <View key={i} style={{ flexDirection: 'row', paddingVertical: 4 }}>
              <Text style={{ flex: 1, fontFamily: fonts.sansMedium, color: colors.text, fontSize: 12 }}>{it.name}</Text>
              <Text style={{ width: 30, textAlign: 'center', fontFamily: fonts.sansMedium, color: colors.text2, fontSize: 12 }}>{it.qty}</Text>
              <Text style={{ width: 80, textAlign: 'right', fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 12 }}>{INR(it.price * it.qty)}</Text>
            </View>
          ))}
          <View style={{ borderBottomWidth: 1, borderColor: colors.line2, borderStyle: 'dashed', marginVertical: 10 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: fonts.sansBold, color: colors.gold, fontSize: 14, letterSpacing: 1.4, textTransform: 'uppercase' }}>Total</Text>
            <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 22 }}>{INR(invoice.total)}</Text>
          </View>
        </View>
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: space.xl, paddingTop: 12 }}>
        <GhostButton label="Share PDF" icon="send" onPress={onShare} fullWidth style={{ flex: 1 } as any} />
        <PrimaryButton label="Print" icon="printer" onPress={onPrint} fullWidth style={{ flex: 1 } as any} />
      </View>
    </Sheet>
  );
};
