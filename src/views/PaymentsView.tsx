import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MilestoneInfo } from '../types';
import {
  Banknote,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Edit2,
  DollarSign,
  TrendingUp,
  FileText,
  Info,
} from 'lucide-react';
import { formatCurrency, formatMinutesDisplay } from '../lib/calculations';
import { PaymentModal } from '../components/PaymentModal';

export const PaymentsView: React.FC = () => {
  const {
    contract,
    progress,
    milestones,
    payments,
  } = useApp();

  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneInfo | null>(null);

  // Totals calculations
  const totalEarned = progress.earnedAmount;
  const totalPaid = useMemo(() => {
    return payments
      .filter((p) => p.payment_status === 'paid')
      .reduce((sum, p) => sum + (p.actual_amount_received ?? p.earned_amount), 0);
  }, [payments]);

  const pendingPayout = Math.max(0, totalEarned - totalPaid);

  return (
    <div id="payments-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Banknote className="w-6 h-6 text-emerald-400" />
            <span>Payment Tracking &amp; Earnings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Milestone-based compensation • Distinguishing Earned vs Paid Status
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earned */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Earned</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            {formatCurrency(totalEarned)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {progress.completedMilestonesCount} of 6 milestones unlocked
          </p>
        </div>

        {/* Total Received (Paid) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Received</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {formatCurrency(totalPaid)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Cleared &amp; deposited to your account
          </p>
        </div>

        {/* Pending Payout */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Pending Payout</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">
            {formatCurrency(pendingPayout)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Earned runtime awaiting client payment
          </p>
        </div>

        {/* Contract Remaining */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Contract Remaining</span>
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-300 font-mono">
            {formatCurrency(progress.moneyRemaining)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Remaining unearned contract value
          </p>
        </div>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>Earned vs Paid Principle:</strong> Completing 90 minutes of edited video runtime immediately marks the milestone as <strong>Earned</strong>. Once your client transfers the money, you can record the receipt date, actual amount, and transaction notes below.
        </p>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100">Milestone Payment Records</h2>
          <span className="text-xs text-slate-400">6 Contract Milestones</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Milestone</th>
                <th className="py-3.5 px-4 font-mono">Threshold</th>
                <th className="py-3.5 px-4 font-mono">Milestone Value</th>
                <th className="py-3.5 px-4">Earned Status</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Received Date</th>
                <th className="py-3.5 px-4 font-mono">Actual Received</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {milestones.map((m) => {
                const rec = m.paymentRecord;
                const isPaid = rec?.payment_status === 'paid';
                const isPending = m.isEarned && !isPaid;

                return (
                  <tr key={m.milestoneNumber} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-100">
                      Milestone #{m.milestoneNumber}
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-300">
                      {m.thresholdMinutes} min
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                      {formatCurrency(m.milestonePayment)}
                    </td>

                    <td className="py-4 px-4">
                      {m.isEarned ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Yes (Earned)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 px-2 py-0.5 rounded bg-slate-800 font-medium">
                          No ({formatMinutesDisplay(m.remainingMinutes)} needed)
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {!m.isEarned ? (
                        <span className="text-slate-400 text-[11px]">—</span>
                      ) : isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <AlertCircle className="w-3 h-3" /> Pending Payment
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-300 font-mono">
                      {isPaid && rec?.payment_date ? rec.payment_date : '—'}
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-200">
                      {isPaid && rec?.actual_amount_received ? (
                        <span className="font-bold text-emerald-400">
                          {formatCurrency(rec.actual_amount_received)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      {m.isEarned ? (
                        <button
                          onClick={() => setSelectedMilestone(m)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 className="w-3 h-3 text-emerald-400" />
                          <span>{isPaid ? 'Edit Receipt' : 'Record Payment'}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Update Modal */}
      <PaymentModal
        milestone={selectedMilestone}
        isOpen={Boolean(selectedMilestone)}
        onClose={() => setSelectedMilestone(null)}
      />
    </div>
  );
};
