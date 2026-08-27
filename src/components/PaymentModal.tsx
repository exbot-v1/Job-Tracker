import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MilestoneInfo } from '../types';
import {
  X,
  CheckCircle2,
  Calendar,
  Banknote,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '../lib/calculations';

interface PaymentModalProps {
  milestone: MilestoneInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ milestone, isOpen, onClose }) => {
  const { updatePayment, contract } = useApp();

  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('paid');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [actualAmount, setActualAmount] = useState<number>(25000);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (milestone) {
      const rec = milestone.paymentRecord;
      setPaymentStatus(rec?.payment_status || 'paid');
      setPaymentDate(rec?.payment_date || new Date().toISOString().split('T')[0]);
      setActualAmount(rec?.actual_amount_received ?? contract.milestone_payment);
      setNotes(rec?.notes || '');
    }
  }, [milestone, contract]);

  if (!isOpen || !milestone) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updatePayment(milestone.milestoneNumber, {
        payment_status: paymentStatus,
        payment_date: paymentStatus === 'paid' ? paymentDate : null,
        actual_amount_received: paymentStatus === 'paid' ? actualAmount : null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="payment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="payment-modal-content"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Milestone #{milestone.milestoneNumber} Payment
              </h3>
              <p className="text-xs text-slate-400">
                Earned: {formatCurrency(milestone.milestonePayment)} ({milestone.thresholdMinutes} min threshold)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Payment Status Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Status</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentStatus === 'paid'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Mark as Paid</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('pending')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentStatus === 'pending'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Pending Clearance</span>
              </button>
            </div>
          </div>

          {paymentStatus === 'paid' && (
            <>
              {/* Payment Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Received Date</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Actual Amount Received */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Actual Amount Received (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={actualAmount}
                  onChange={(e) => setActualAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </>
          )}

          {/* Payment Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Bank transfer reference #BK83910, bKash / Nagad confirmation, invoice status..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-950/40 transition-transform active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Payment Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
