'use client';

import { useState, useEffect } from 'react';
import { Modal } from './modal';
import { getTransactionDetails } from '@/app/(dashboard)/walk-in/actions';
import { 
  Clock, Monitor, CupSoda, IndianRupee, Coins, Calendar, Info, ShieldAlert, BadgePercent
} from 'lucide-react';

interface TransactionDetailsModalProps {
  open: boolean;
  onClose: () => void;
  txnId: number | null;
}

export function TransactionDetailsModal({ open, onClose, txnId }: TransactionDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && txnId) {
      setLoading(true);
      setError(null);
      getTransactionDetails(txnId)
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError(err.message || 'Failed to fetch transaction details.');
          setLoading(false);
        });
    } else {
      setData(null);
    }
  }, [open, txnId]);

  if (!open) return null;

  const formatPeriod = (start: any, end: any) => {
    if (!start || !end) return 'N/A';
    const s = new Date(start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const e = new Date(end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${s} - ${e}`;
  };

  const formatPlayedDuration = (mins: number | null | undefined) => {
    if (mins === null || mins === undefined) return '0 mins';
    if (mins < 60) return `${mins} mins`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hrs} hr ${remainingMins}m` : `${hrs} ${hrs === 1 ? 'hr' : 'hrs'}`;
  };

  // Helper variables for calculated pricing
  const txn = data?.transaction;
  const sess = data?.session;
  const station = data?.station;
  const addonsList = data?.addons || [];

  const isMember = txn?.amountCreditsUsed > 0 || (sess && sess.totalPrice === 0);
  const isGeneric = txn?.transactionType === 'Income' || txn?.transactionType === 'Expense';

  // Play cost: Walk-ins pay hourly rate. Members pay 0 cash (deducted in coins)
  const ratePerHour = station?.ratePerHour || 0;
  const playDurationMins = sess?.durationMinutes || 0;
  const calculatedPlayPrice = isMember 
    ? 0 
    : Math.round((playDurationMins / 60) * ratePerHour);

  const addonsTotal = addonsList.reduce((sum: number, item: any) => sum + (item.priceAtPurchase * item.quantity), 0);
  
  // Total calculated cash (excluding member coins)
  const systemCalculatedTotal = isGeneric ? (txn?.amountCash || 0) : (calculatedPlayPrice + addonsTotal);
  const receivedAmount = txn?.amountCash || 0;
  const difference = systemCalculatedTotal - receivedAmount;

  return (
    <Modal open={open} onClose={onClose} title={`TXN DETAILS · TXN-${txnId}`} borderColor="#ff00ea">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
          <div className="w-8 h-8 border-4 border-[#ff00ea]/30 border-t-[#ff00ea] rounded-full animate-spin" />
          <p className="font-pixel text-[10px] text-gray-500 tracking-wider">RETRIEVING DATA...</p>
        </div>
      ) : error ? (
        <div className="text-center py-6 space-y-2">
          <ShieldAlert className="w-12 h-12 text-[#ff00ea] mx-auto animate-pulse" />
          <p className="font-mono text-sm text-gray-400">{error}</p>
        </div>
      ) : data ? (
        <div className="space-y-5 font-mono text-sm text-gray-300">
          
          {/* User & Transaction Basic Header */}
          <div className="p-3 bg-[#0f1026] border border-gray-800 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-[10px] text-gray-500">{isGeneric ? 'TRANSACTION DETAILS' : 'GAMER / CUSTOMER'}</p>
              <p className="text-white font-bold text-base mt-0.5">
                {isGeneric ? (txn.comment || (txn.transactionType === 'Expense' ? 'Business Expense' : 'Other Income')) : (txn.customerName || 'Gamer')}
              </p>
              {!isGeneric && txn.userPhone && <p className="text-[#00f3ff] text-xs mt-0.5">{txn.userPhone}</p>}
              {isGeneric && txn.customerName && <p className="text-[#00f3ff] text-xs mt-0.5">By: {txn.customerName}</p>}
            </div>
            <span className={`text-[10px] px-2.5 py-0.5 rounded font-pixel uppercase ${
              isMember ? 'text-[#ffea00] bg-[#ffea00]/20' : 
              txn.transactionType === 'Expense' ? 'text-[#ff00ea] bg-[#ff00ea]/20 animate-pulse' :
              txn.transactionType === 'Income' ? 'text-[#00ff55] bg-[#00ff55]/20' :
              txn.transactionType === 'Snack' ? 'text-[#00ff55] bg-[#00ff55]/20' :
              'text-[#00ff55] bg-[#00ff55]/20'
            }`}>
              {isMember ? 'VIP Member' : txn.transactionType}
            </span>
          </div>

          {/* Standalone snack sale comment display */}
          {txn.transactionType === 'Snack' && !sess && txn.comment && (
            <div className="p-3 bg-[#0f1026]/40 border border-gray-850 rounded-lg">
              <p className="text-[10px] text-gray-500 uppercase">TRANSACTION COMMENT</p>
              <p className="text-white font-bold mt-1">{txn.comment}</p>
            </div>
          )}

          {/* Station Details */}
          {station && (
            <div className="p-3 bg-[#0f1026]/40 border border-gray-800 rounded-lg space-y-2">
              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5 text-[#00f3ff]" /> ALLOTTED STATION
              </p>
              <div className="flex justify-between items-center">
                <span className="text-white font-bold">{station.name}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-800 rounded text-gray-400 uppercase">{station.type}</span>
              </div>
              {!isMember && (
                <p className="text-[11px] text-gray-400">
                  Rate: <strong className="text-white">₹{ratePerHour}/hour</strong> · <span className="text-[#ffea00]">{station.coinsPerHour || 4} coins/hr</span>
                </p>
              )}
            </div>
          )}

          {/* Setup and Duration Timers */}
          {sess && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#0f1026]/30 border border-gray-800 rounded-lg space-y-1">
                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-500" /> SETUP TIME
                </p>
                <p className="text-white font-bold text-sm">{sess.setupMinutes || 0} mins</p>
                <p className="text-[9px] text-gray-600">Free calibration time</p>
              </div>
              <div className="p-3 bg-[#0f1026]/30 border border-gray-800 rounded-lg space-y-1">
                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#00f3ff]" /> PLAY TIME
                </p>
                <p className="text-[#00f3ff] font-bold text-sm">{formatPlayedDuration(sess.durationMinutes)}</p>
                <p className="text-[9px] text-gray-600">Charged duration</p>
              </div>
              <div className="col-span-2 text-[11px] text-gray-500 flex items-center gap-1.5 justify-center py-1 bg-[#0f1026]/20 border border-gray-800/30 rounded">
                <Calendar className="w-3.5 h-3.5" /> Period: <span className="text-gray-300 font-bold">{formatPeriod(sess.startTime, sess.endTime)}</span>
              </div>
            </div>
          )}

          {/* Addons breakdown list */}
          {(addonsList.length > 0 || txn.transactionType === 'Snack') && (
            <div className="p-3 bg-[#0f1026]/40 border border-gray-800 rounded-lg space-y-2.5">
              <p className="text-[10px] text-[#00f3ff] uppercase font-bold tracking-wider flex items-center gap-1">
                <CupSoda className="w-3.5 h-3.5" /> ADDONS breakdown
              </p>
              {addonsList.length === 0 ? (
                <p className="text-xs text-gray-600 italic py-1">No custom snacks, drinks, or items added.</p>
              ) : (
                <div className="space-y-1.5 divide-y divide-gray-800/50">
                  {addonsList.map((item: any) => (
                    <div key={item.id} className="pt-1.5 flex justify-between text-xs font-mono">
                      <span className="text-gray-300">
                        {item.name} <span className="text-gray-600">x{item.quantity}</span>
                      </span>
                      <span className="text-white">
                        ₹{item.priceAtPurchase} × {item.quantity} = <strong className="text-[#00ff55]">₹{item.priceAtPurchase * item.quantity}</strong>
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 flex justify-between text-xs font-bold">
                    <span className="text-gray-400">ADDONS TOTAL</span>
                    <span className="text-[#00ff55]">₹{addonsTotal}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Financial calculations */}
          <div className="p-4 bg-[#0a0a1a] border border-[#ff00ea]/30 rounded-lg space-y-3">
            <p className="text-xs text-[#ff00ea] font-bold uppercase tracking-wider">PAYMENT DETAILS & SETTLEMENT</p>
            
            {/* Membership Settlement info */}
            {isMember && sess && (
              <div className="bg-[#ffea00]/5 border border-[#ffea00]/20 rounded p-2.5 text-xs text-[#ffea00] space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Coins className="w-4 h-4 shrink-0" /> VIP COINS SETTLEMENT
                </p>
                <p className="text-gray-400 font-mono text-[11px]">
                  Play Session Allotment: <strong className="text-white">{txn.amountCreditsUsed || Math.ceil((playDurationMins / 60) * (station?.coinsPerHour || 4))} coins</strong> deducted from membership.
                </p>
                <p className="text-gray-400 font-mono text-[11px]">
                  Addons/Extras: Charged separately in cash as money.
                </p>
              </div>
            )}

            <div className="space-y-1.5 text-xs border-t border-gray-800 pt-3">
              {!isGeneric && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Play Allotment Cash:</span>
                    <span className="text-white">₹{calculatedPlayPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Addons Cash Total:</span>
                    <span className="text-white">₹{addonsTotal}</span>
                  </div>
                </>
              )}
              
              <div className="flex justify-between border-t border-gray-800/80 pt-2 text-sm">
                <span className="text-gray-400 flex items-center gap-1 font-bold">
                  <Info className="w-3.5 h-3.5 text-gray-500" /> {txn.transactionType === 'Expense' ? 'TOTAL EXPENSE:' : 'SYSTEM CALCULATED:'}
                </span>
                <span className="text-white font-bold">₹{systemCalculatedTotal}</span>
              </div>

              <div className="flex justify-between text-base border-t border-[#00ff55]/30 pt-2 font-pixel">
                <span className="text-[#00ff55] flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" /> {txn.transactionType === 'Expense' ? 'CASH PAID OUT:' : 'CASH RECEIVED:'}
                </span>
                <span className="text-[#00ff55] font-bold">₹{receivedAmount}</span>
              </div>

              {/* Display discounts or overrides */}
              {!isGeneric && difference !== 0 && (
                <div className="mt-2.5 p-2 bg-[#ff00ea]/5 border border-[#ff00ea]/30 rounded-md flex items-center justify-between text-xs">
                  <span className="text-[#ff00ea] font-bold flex items-center gap-1">
                    <BadgePercent className="w-4 h-4" /> {difference > 0 ? 'REDUCTION / DISCOUNT:' : 'ADDITIONAL CHARGE:'}
                  </span>
                  <span className="text-[#ff00ea] font-pixel font-bold">
                    {difference > 0 ? `-₹${difference}` : `+₹${Math.abs(difference)}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white font-pixel text-xs rounded transition-colors"
          >
            CLOSE REPORT
          </button>
        </div>
      ) : null}
    </Modal>
  );
}
