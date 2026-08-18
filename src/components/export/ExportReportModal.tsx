import React, { useState } from 'react';
import { useTripStore } from '../../store/useTripStore';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useSettlementStore } from '../../store/useSettlementStore';
import { useUiStore } from '../../store/useUiStore';
import { analyticsEngine } from '../../core/analyticsEngine';
import { debtEngine } from '../../core/debtEngine';
import { splitEngine } from '../../core/splitEngine';
import { formatCurrency, formatDate, triggerHaptic } from '../../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Download, FileText, Share2, Copy, Check, Printer, Database } from 'lucide-react';

export const ExportReportModal: React.FC = () => {
  const { isExportModalOpen, setExportModalOpen } = useUiStore();
  const { activeTrip } = useTripStore();
  const { expenses } = useExpenseStore();
  const { settlements } = useSettlementStore();

  const [copied, setCopied] = useState(false);

  if (!activeTrip) return null;

  const summary = analyticsEngine.calculateTripSummary(expenses);
  const balances = debtEngine.calculateBalances(activeTrip.members, expenses, settlements);
  const transfers = debtEngine.simplifyDebts(balances);

  // Generate CSV File
  const handleDownloadCSV = () => {
    triggerHaptic('success');
    let csv = `Date,Title,Category,Amount,Currency,Paid By,Split Type,Notes\n`;
    expenses.forEach((e) => {
      const payerNames = e.paidBy
        .map((p) => {
          const m = activeTrip.members.find((mem) => mem.userId === p.userId);
          return `${m ? m.name : 'Unknown'}($${p.amount})`;
        })
        .join('; ');
      csv += `"${e.date}","${e.title.replace(/"/g, '""')}","${e.category}","${e.amount}","${e.currency}","${payerNames}","${e.splitType}","${(e.notes || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTrip.name.replace(/\s+/g, '_')}_expenses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate Text Summary for WhatsApp / iMessage
  const handleCopySummary = () => {
    triggerHaptic('light');
    let text = `✈️ ${activeTrip.name} — Expense Summary\n`;
    text += `📍 Destination: ${activeTrip.destination}\n`;
    text += `💰 Total Spent: ${formatCurrency(summary.totalSpent, activeTrip.baseCurrency)}\n\n`;

    text += `👥 Individual Breakdown:\n`;
    activeTrip.members.forEach((m) => {
      const spend = analyticsEngine.calculateIndividualSpending(m.userId, expenses, settlements);
      const bal = balances[m.userId] || 0;
      text += `• ${m.name}: Consumed ${formatCurrency(spend.summary.totalConsumed, activeTrip.baseCurrency)} | Paid ${formatCurrency(spend.summary.totalPaid, activeTrip.baseCurrency)} | ${bal >= 0 ? `+${formatCurrency(bal, activeTrip.baseCurrency)} owed` : `${formatCurrency(bal, activeTrip.baseCurrency)} debt`}\n`;
    });

    if (transfers.length > 0) {
      text += `\n🤝 Settlement Plan:\n`;
      transfers.forEach((t) => {
        const fromM = activeTrip.members.find((m) => m.userId === t.fromUserId);
        const toM = activeTrip.members.find((m) => m.userId === t.toUserId);
        text += `• ${fromM?.name} pays ${toM?.name} ${formatCurrency(t.amount, activeTrip.baseCurrency)}\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isExportModalOpen} onOpenChange={setExportModalOpen}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-ios-blue" />
            Trip Report & Export
          </DialogTitle>
          <DialogDescription className="text-xs">
            Export data for group chat sharing, Excel spreadsheets, or travel invoices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="ios"
              size="sm"
              onClick={handleCopySummary}
              className="h-10 text-xs font-bold"
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Summary Text'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              className="h-10 text-xs font-bold"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download CSV
            </Button>
          </div>

          {/* Report Preview Card */}
          <Card className="p-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs space-y-3 font-mono">
            <div className="text-center pb-2 border-b border-zinc-200 dark:border-zinc-800 font-sans">
              <h4 className="font-bold text-sm text-foreground">{activeTrip.name}</h4>
              <p className="text-[10px] text-muted-foreground">{activeTrip.destination} • Base: {activeTrip.baseCurrency}</p>
            </div>

            <div className="flex justify-between font-bold">
              <span>Total Expenses:</span>
              <span>{formatCurrency(summary.totalSpent, activeTrip.baseCurrency)}</span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span className="font-bold text-[11px] uppercase text-muted-foreground block font-sans">
                Per-Traveler Consumption:
              </span>
              {activeTrip.members.map((m) => {
                const spend = analyticsEngine.calculateIndividualSpending(m.userId, expenses, settlements);
                const bal = balances[m.userId] || 0;
                return (
                  <div key={m.userId} className="flex justify-between text-[11px] py-0.5 border-b border-zinc-100 dark:border-zinc-800/40 last:border-none">
                    <span>{m.name}:</span>
                    <span className="font-semibold">
                      Consumed {formatCurrency(spend.summary.totalConsumed, activeTrip.baseCurrency)} (Net: {bal >= 0 ? `+${bal.toFixed(2)}` : bal.toFixed(2)})
                    </span>
                  </div>
                );
              })}
            </div>

            {transfers.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span className="font-bold text-[11px] uppercase text-muted-foreground block font-sans">
                  Optimal Settlements:
                </span>
                {transfers.map((t, idx) => {
                  const fromM = activeTrip.members.find((m) => m.userId === t.fromUserId);
                  const toM = activeTrip.members.find((m) => m.userId === t.toUserId);
                  return (
                    <div key={idx} className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {fromM?.name} &rarr; {toM?.name}: {formatCurrency(t.amount, activeTrip.baseCurrency)}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
