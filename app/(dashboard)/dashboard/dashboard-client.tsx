'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SuccessModal } from '@/components/ui/success-modal';
import { WA_TEMPLATES } from '@/lib/utils/whatsapp';
import { Monitor, Zap, CheckCircle2, Settings2, Plus, Clock, IndianRupee, Users, User, Coins, AlertTriangle, X, CupSoda, Trash2, Eye } from 'lucide-react';
import { allotSession, checkoutSession, add15Mins } from '../walk-in/actions';
import { getSessionAddons, addAddonToSession, removeAddonFromSession } from '../addons/actions';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { Modal } from '@/components/ui/modal';
import { TransactionDetailsModal } from '@/components/ui/transaction-details-modal';

/* ─── confirm modal ─── */
function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'CONFIRM', confirmColor = '#ff00ea' }: any) {
  return (
    <Modal open={open} onClose={onClose} title={title} borderColor={confirmColor}>
      <p className="text-gray-300 font-mono text-sm mb-6">{message}</p>
      <div className="flex gap-3">
        <Button onClick={onClose} variant="outline" className="flex-1 border-gray-700 text-gray-400">CANCEL</Button>
        <Button onClick={onConfirm} className="flex-1 text-white font-pixel text-xs" style={{ backgroundColor: confirmColor, border: 'none' }}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

/* ─── 15-min alert modal ─── */
function AlertModal({ open, stationName, onClose }: { open: boolean; stationName: string; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-[#0a0a1a] border-2 border-[#ffea00] rounded-xl w-full max-w-sm text-center p-8 shadow-[0_0_60px_rgba(255,234,0,0.3)] animate-bounce-once">
        <AlertTriangle className="w-16 h-16 text-[#ffea00] mx-auto mb-4 animate-pulse" />
        <h2 className="font-orbitron text-2xl text-[#ffea00] mb-2">TIME ALERT</h2>
        <p className="text-white font-mono mb-1">{stationName}</p>
        <p className="text-gray-400 font-mono text-sm mb-6">15 minutes remaining!</p>
        <Button onClick={onClose} className="w-full bg-[#ffea00] text-black font-pixel text-sm">ACKNOWLEDGED</Button>
      </div>
    </div>
  );
}

function getRemainingTime(endTime: Date, now: Date) {
  const diff = endTime.getTime() - now.getTime();
  if (diff <= 0) return { minutes: 0, seconds: 0, isExpired: true, isWarning: false, totalMs: 0 };
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { minutes, seconds, isExpired: false, isWarning: minutes < 15 && minutes >= 0, totalMs: diff };
}

export function DashboardClient({ stations, members, plans, recentTxns, todaysRevenue, vipCount, totalStations, user, addons = [] }: any) {
  const [now, setNow] = useState<Date | null>(null);
  const { addNotification } = useNotifications();
  const alertedStations = useRef<Set<number>>(new Set());

  // Success Modal (WhatsApp)
  const [successData, setSuccessData] = useState<{ open: boolean; title: string; message: string; waPhone?: string; waMessage?: string }>({ open: false, title: '', message: '' });
  
  // Allot modal state
  const [allotModal, setAllotModal] = useState<{ open: boolean; station: any }>({ open: false, station: null });
  const [allotType, setAllotType] = useState<'walkin' | 'member'>('walkin');
  const [allotTime, setAllotTime] = useState(60);
  const [setupTime, setSetupTime] = useState(4);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [allotLoading, setAllotLoading] = useState(false);

  // Checkout modal state
  const [checkoutModal, setCheckoutModal] = useState<{ open: boolean; station: any }>({ open: false, station: null });
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [customAmountCash, setCustomAmountCash] = useState<number>(0);

  // Active Station Addons modal state
  const [stationAddonsModal, setStationAddonsModal] = useState<{ open: boolean; station: any }>({ open: false, station: null });
  const [currentSessionAddons, setCurrentSessionAddons] = useState<any[]>([]);
  const [selectedAddonId, setSelectedAddonId] = useState<string>('');
  const [addonQuantity, setAddonQuantity] = useState(1);
  const [addonsLoading, setAddonsLoading] = useState(false);

  // +15 confirm modal
  const [extend15Modal, setExtend15Modal] = useState<{ open: boolean; station: any }>({ open: false, station: null });

  // Transaction details modal state
  const [selectedTxnId, setSelectedTxnId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleViewDetails = (id: number) => {
    setSelectedTxnId(id);
    setIsDetailsOpen(true);
  };

  // Timer
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Web Audio API beep — no file needed
  const playAlertSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      for (let i = 0; i < 3; i++) {
        const offset = i * 1.4;
        playBeep(880, offset + 0, 0.3);
        playBeep(660, offset + 0.35, 0.3);
        playBeep(880, offset + 0.7, 0.3);
        playBeep(440, offset + 1.05, 0.3);
      }
    } catch (_) {}
  }, []);

  const filteredMembers = members.filter((m: any) =>
    memberSearch && (m.phone.includes(memberSearch) || m.name.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const estimatedCoins = Math.ceil(allotTime / 15);
  const coinShortfall = selectedMember && estimatedCoins > selectedMember.coinsBalance;

  // Addon loading helper
  const loadSessionAddons = async (sessionId: number) => {
    try {
      const list = await getSessionAddons(sessionId);
      setCurrentSessionAddons(list);
      return list;
    } catch (e) {
      console.error('Error loading session addons:', e);
      return [];
    }
  };

  const openStationAddonsModal = async (station: any) => {
    setStationAddonsModal({ open: true, station });
    setSelectedAddonId('');
    setAddonQuantity(1);
    if (station?.session) {
      setAddonsLoading(true);
      await loadSessionAddons(station.session.id);
      setAddonsLoading(false);
    }
  };

  const handleAddAddon = async () => {
    if (!stationAddonsModal.station?.session || !selectedAddonId) return;
    setAddonsLoading(true);
    try {
      await addAddonToSession(stationAddonsModal.station.session.id, parseInt(selectedAddonId), addonQuantity);
      await loadSessionAddons(stationAddonsModal.station.session.id);
      addNotification({ type: 'success', title: 'Addon Added', message: 'Product added to station session.' });
      setAddonQuantity(1);
      setSelectedAddonId('');
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Error', message: e.message });
    }
    setAddonsLoading(false);
  };

  const handleRemoveAddon = async (sessionAddonId: number) => {
    setAddonsLoading(true);
    try {
      await removeAddonFromSession(sessionAddonId);
      if (stationAddonsModal.station?.session) {
        await loadSessionAddons(stationAddonsModal.station.session.id);
      } else if (checkoutModal.station?.session) {
        await loadSessionAddons(checkoutModal.station.session.id);
      }
      addNotification({ type: 'info', title: 'Addon Removed', message: 'Product removed from session.' });
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Error', message: e.message });
    }
    setAddonsLoading(false);
  };

  const openCheckoutModal = async (station: any) => {
    setCheckoutModal({ open: true, station });
    setCheckoutName('');
    setCheckoutPhone('');
    if (station?.session) {
      setAddonsLoading(true);
      const list = await loadSessionAddons(station.session.id);
      setAddonsLoading(false);

      const s = station.session;
      const isMember = s.totalPrice === 0;
      const addonsTotal = list.reduce((sum: number, item: any) => sum + (item.priceAtPurchase * item.quantity), 0);
      const calculatedCash = isMember 
        ? addonsTotal 
        : Math.round((s.durationMinutes / 60) * station.ratePerHour) + addonsTotal;
      setCustomAmountCash(calculatedCash);
    }
  };

  const handleAllot = async () => {
    if (!allotModal.station) return;
    if (allotType === 'member' && !selectedMember) { addNotification({ type: 'error', title: 'No Member', message: 'Please select a VIP member.' }); return; }
    if (coinShortfall) return;
    setAllotLoading(true);
    try {
      await allotSession({ 
        stationId: allotModal.station.id, 
        durationMinutes: allotTime, // actual played time stored in db
        setupMinutes: setupTime, // setup minutes added to endTime only
        type: allotType, 
        userPhone: selectedMember?.phone 
      });
      setAllotModal({ open: false, station: null });
      setAllotTime(60); setSetupTime(4); setAllotType('walkin'); setMemberSearch(''); setSelectedMember(null);
    } catch (e: any) { addNotification({ type: 'error', title: 'Error', message: e.message }); }
    setAllotLoading(false);
  };

  const totalAddonsPrice = currentSessionAddons.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);

  const handleCheckout = async () => {
    if (!checkoutModal.station?.session) return;
    const s = checkoutModal.station.session;
    const isMember = s.totalPrice === 0;
    const finalCoins = isMember ? Math.ceil(s.durationMinutes / 15) : 0;
    // Use the operator's custom overridden cash amount
    const finalCash = customAmountCash;

    setCheckoutLoading(true);
    try {
      const res = await checkoutSession({ 
        stationId: checkoutModal.station.id, 
        sessionId: s.id, 
        customerName: checkoutName, 
        customerPhone: isMember ? (s.userPhone || '') : checkoutPhone, 
        type: isMember ? 'member' : 'walkin', 
        finalAmountCash: finalCash, 
        finalCoinsUsed: finalCoins 
      });

      if (res && res.success === false) {
        addNotification({ type: 'warning', title: 'Checkout Complete', message: 'This session has already been checked out.' });
        setCheckoutModal({ open: false, station: null });
        setCheckoutLoading(false);
        return;
      }
      
      const phone = isMember ? (s.userPhone || '') : checkoutPhone;
      const memberData = isMember ? members.find((m: any) => m.phone === phone) : null;
      const nameToUse = checkoutName || memberData?.name || s.customerName || 'Gamer';

      const waMessage = isMember 
        ? WA_TEMPLATES.BILL_MEMBER({ name: nameToUse, hours: s.durationMinutes, spent: finalCoins, balance: (memberData?.coinsBalance || 0) - finalCoins, date: new Date().toLocaleDateString() })
        : WA_TEMPLATES.BILL_WALKIN({ name: nameToUse, hours: s.durationMinutes, amount: finalCash, date: new Date().toLocaleDateString() });

      setCheckoutModal({ open: false, station: null }); 
      setCheckoutName(''); 
      setCheckoutPhone('');
      setSuccessData({
        open: true,
        title: 'PAYMENT RECEIVED',
        message: `Checkout complete for ${checkoutModal.station.name}. Total Paid: ₹${finalCash}`,
        waPhone: phone,
        waMessage: waMessage
      });
      addNotification({ type: 'success', title: 'Checkout Done', message: `${checkoutModal.station.name} is now free.` });
    } catch (e: any) { addNotification({ type: 'error', title: 'Error', message: e.message }); }
    setCheckoutLoading(false);
  };

  const handleExtend15 = async () => {
    const st = extend15Modal.station;
    if (!st?.session) return;
    await add15Mins(st.id, st.session.id);
    setExtend15Modal({ open: false, station: null });
    addNotification({ type: 'info', title: '+15 Mins Added', message: `${st.name} extended by 15 minutes.` });
  };

  if (!now) return null;

  return (
    <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* ─── KPIs ─── */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-orbitron font-bold text-white tracking-wider">COMMAND CENTER</h1>
          <p className="text-gray-400 mt-1 font-mono text-xs">Live operations — {now.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'OCCUPIED', value: `${stations.filter((s: any) => s.status === 'Occupied').length}/${totalStations}`, color: '#00f3ff', icon: Monitor },
          { label: "TODAY'S CASH", value: `₹${todaysRevenue}`, color: '#00ff55', icon: IndianRupee },
          { label: 'VIP MEMBERS', value: vipCount, color: '#ffea00', icon: Users },
          { label: 'TOTAL TXNS', value: recentTxns.length, color: '#ff00ea', icon: Zap },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#0f1026] rounded-xl p-4 border" style={{ borderColor: `${kpi.color}40` }}>
            <div className="flex justify-between items-start mb-3">
              <p className="font-mono text-xs" style={{ color: kpi.color }}>{kpi.label}</p>
              <kpi.icon className="w-4 h-4 opacity-60" style={{ color: kpi.color }} />
            </div>
            <div className="text-3xl font-pixel text-white">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* ─── Station Grid ─── */}
      <h2 className="font-orbitron text-white text-lg mb-4">STATION FLOOR</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        {stations.map((station: any) => {
          const td = station.session?.endTime ? getRemainingTime(new Date(station.session.endTime), now) : null;
          let border = 'border-gray-800';
          if (station.status === 'Active') border = 'border-[#00ff55]/40';
          else if (station.status === 'Occupied') border = td?.isExpired ? 'border-[#ff00ea] animate-pulse' : td?.isWarning ? 'border-[#ffea00]' : 'border-[#00f3ff]/60';
          else border = 'border-gray-700';

          return (
            <div key={station.id} className={`bg-[#0a0a1a] rounded-xl p-5 border-2 flex flex-col ${border} transition-all`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-orbitron text-white text-base font-bold leading-tight">{station.name}</h3>
                <div className="flex items-center gap-2">
                  {station.status === 'Occupied' && (
                    <button 
                      onClick={() => openStationAddonsModal(station)}
                      title="Manage Addons" 
                      className="p-1.5 rounded-md bg-[#00f3ff]/10 hover:bg-[#00f3ff]/30 text-[#00f3ff] hover:scale-110 transition-all border border-[#00f3ff]/20 flex items-center justify-center shrink-0"
                    >
                      <CupSoda className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold ${
                    station.status === 'Active' ? 'text-[#00ff55] bg-[#00ff55]/20' :
                    station.status === 'Occupied' ? 'text-[#00f3ff] bg-[#00f3ff]/20' : 'text-gray-400 bg-gray-800'
                  }`}>{station.status}</span>
                </div>
              </div>

              <div className="flex-grow flex items-center justify-center py-4">
                {station.status === 'Occupied' && td ? (
                  <div className="text-center">
                    <div className={`text-3xl md:text-4xl font-pixel tracking-widest ${td.isExpired ? 'text-[#ff00ea]' : td.isWarning ? 'text-[#ffea00]' : 'text-white'}`}>
                      {String(td.minutes).padStart(2,'0')}:{String(td.seconds).padStart(2,'0')}
                    </div>
                    <p className="font-mono text-xs text-gray-500 mt-1">{td.isExpired ? 'SESSION EXPIRED' : 'REMAINING'}</p>
                  </div>
                ) : station.status === 'Maintenance' ? (
                  <div className="text-gray-600 flex flex-col items-center"><Settings2 className="w-10 h-10 mb-2 opacity-40" /><span className="font-mono text-xs">MAINTENANCE</span></div>
                ) : (
                  <div className="text-[#00ff55]/60 flex flex-col items-center"><Zap className="w-10 h-10 mb-2" /><span className="font-mono text-xs">READY</span></div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-800/50 flex gap-2">
                {station.status === 'Active' && (
                  <Button onClick={() => { setAllotModal({ open: true, station }); setAllotTime(60); setSetupTime(4); setAllotType('walkin'); setMemberSearch(''); setSelectedMember(null); }} className="w-full bg-[#00ff55] hover:bg-[#00cc44] text-black font-pixel text-xs py-4">
                    <Plus className="w-3 h-3 mr-1" /> ALLOT
                  </Button>
                )}
                {station.status === 'Occupied' && station.session && (
                  <>
                    <Button onClick={() => setExtend15Modal({ open: true, station })} variant="outline" className="flex-1 border-gray-700 text-gray-300 font-mono text-xs py-4">
                      <Clock className="w-3 h-3 mr-1" /> +15
                    </Button>
                    <Button onClick={() => openCheckoutModal(station)} className="flex-1 bg-[#ff00ea] hover:bg-[#cc00bb] text-white font-mono text-xs py-4 border-none">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> CHECKOUT
                    </Button>
                  </>
                )}
                {station.status === 'Maintenance' && (
                  <Button variant="outline" className="w-full border-gray-800 text-gray-600 text-xs" disabled>UNAVAILABLE</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Recent Activity ─── */}
      <SuccessModal 
        open={successData.open} 
        onClose={() => setSuccessData({ ...successData, open: false })}
        title={successData.title}
        message={successData.message}
        waPhone={successData.waPhone}
        waMessage={successData.waMessage}
      />
      <div className="bg-[#0a0a1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-orbitron text-white text-base flex items-center"><Zap className="w-4 h-4 mr-2 text-[#00f3ff]" />RECENT ACTIVITY</h3>
        </div>
        <div className="divide-y divide-gray-800/50">
          {recentTxns.length === 0 ? (
            <p className="p-6 text-center text-gray-600 font-mono text-sm">No transactions yet.</p>
          ) : recentTxns.map((t: any) => (
            <div key={t.id} className="flex justify-between items-center px-5 py-3 hover:bg-[#0f1026] transition-colors">
              <div>
                <p className="font-mono text-sm text-white font-bold">TXN-{t.id} · {t.transactionType}</p>
                <p className="font-mono text-xs text-gray-400 mt-0.5">
                  {t.userName ? (
                    <span className="text-[#ffea00] font-bold">{t.userName} ({t.userPhone})</span>
                  ) : t.customerName ? (
                    <span className="text-gray-300 font-bold">{t.customerName} ({t.userPhone || 'Walk-In'})</span>
                  ) : (
                    <span className="text-gray-300">{t.userPhone || 'Walk-In'}</span>
                  )} · {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {t.transactionType === 'Session' && t.sessionDuration !== undefined && (
                  <p className="font-mono text-[10px] text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                    <Clock className="w-3 h-3 text-[#00f3ff]" />
                    <span>Played: <strong className="text-[#00f3ff]">{t.sessionDuration} mins</strong></span>
                    {t.sessionStartTime && t.sessionEndTime && (
                      <>
                        <span className="text-gray-700">|</span>
                        <span>{new Date(t.sessionStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(t.sessionEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </>
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  {t.amountCash > 0 && <p className="text-[#00ff55] font-mono text-sm font-bold">+₹{t.amountCash}</p>}
                  {t.amountCreditsUsed > 0 && <p className="text-[#ffea00] font-mono text-xs">-{t.amountCreditsUsed} coins</p>}
                </div>
                <button 
                  onClick={() => handleViewDetails(t.id)}
                  className="p-1.5 rounded bg-[#ff00ea]/10 hover:bg-[#ff00ea]/30 text-[#ff00ea] transition-all hover:scale-110 border border-[#ff00ea]/20 flex items-center justify-center"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── +15 Confirm ─── */}
      <ConfirmModal
        open={extend15Modal.open}
        onClose={() => setExtend15Modal({ open: false, station: null })}
        onConfirm={handleExtend15}
        title="+15 MINUTES"
        message={`Add 15 minutes to ${extend15Modal.station?.name}?`}
        confirmLabel="EXTEND SESSION"
        confirmColor="#00f3ff"
      />

      {/* ─── Allot Modal ─── */}
      <Modal open={allotModal.open} onClose={() => setAllotModal({ open: false, station: null })} title={`ALLOT · ${allotModal.station?.name || ''}`} borderColor="#00ff55">
        <div className="space-y-4 font-mono">
          <div className="flex bg-[#0f1026] rounded border border-gray-700 p-1">
            {(['walkin', 'member'] as const).map(t => (
              <button key={t} onClick={() => { setAllotType(t); setSelectedMember(null); setMemberSearch(''); }}
                className={`flex-1 py-2 text-xs rounded transition-colors ${allotType === t ? (t === 'walkin' ? 'bg-[#00ff55] text-black font-bold' : 'bg-[#ffea00] text-black font-bold') : 'text-gray-400'}`}>
                {t === 'walkin' ? <><User className="w-3 h-3 inline mr-1" />WALK-IN</> : <><Coins className="w-3 h-3 inline mr-1" />MEMBERSHIP</>}
              </button>
            ))}
          </div>

          {allotType === 'member' && (
            <div>
              <label className="block text-[#ffea00] text-xs mb-1">SEARCH MEMBER</label>
              <Input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="bg-[#0f1026] border-gray-700 text-white" placeholder="Phone or name..." />
              {memberSearch && filteredMembers.length > 0 && (
                <div className="mt-1 border border-gray-700 rounded overflow-hidden">
                  {filteredMembers.map((m: any) => (
                    <button key={m.id} onClick={() => { setSelectedMember(m); setMemberSearch(m.name); }}
                      className="w-full text-left px-3 py-2 bg-[#0f1026] hover:bg-[#1a1b3a] text-white text-xs flex justify-between transition-colors">
                      <span>{m.name} · {m.phone}</span>
                      <span className="text-[#ffea00]">{m.coinsBalance} coins</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedMember && (
                <div className="mt-2 p-3 bg-[#1a1b3a] border border-[#ffea00]/40 rounded">
                  <p className="text-white text-xs font-bold">{selectedMember.name}</p>
                  <p className="text-[#ffea00] text-xs">Balance: <strong>{selectedMember.coinsBalance} coins</strong></p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#00ff55] text-xs mb-1">PLAY TIME (mins)</label>
              <Input type="number" value={allotTime} onChange={e => setAllotTime(parseInt(e.target.value) || 0)} className="bg-[#0f1026] border-gray-700 text-white" />
            </div>
            <div>
              <label className="block text-[#00f3ff] text-xs mb-1">SETUP TIME (mins)</label>
              <Input type="number" value={setupTime} onChange={e => setSetupTime(parseInt(e.target.value) || 0)} className="bg-[#0f1026] border-gray-700 text-white" />
            </div>
          </div>

          <div className={`p-3 rounded border ${coinShortfall ? 'border-[#ff00ea] bg-[#ff00ea]/10' : 'border-gray-700 bg-[#0f1026]'}`}>
            {allotType === 'member' ? (
              <>
                <p className="text-gray-400 text-xs mb-1">ESTIMATED DEDUCTION</p>
                <p className="text-2xl font-pixel text-[#ffea00]">{estimatedCoins} COINS</p>
                {coinShortfall && <p className="text-[#ff00ea] text-xs mt-1 font-bold">⚠ Insufficient coins! Member only has {selectedMember.coinsBalance}.</p>}
              </>
            ) : (
              <>
                <p className="text-gray-400 text-xs mb-1">ESTIMATED BILL</p>
                <p className="text-2xl font-pixel text-[#00ff55]">₹{Math.round((allotTime / 60) * (allotModal.station?.ratePerHour || 0))}</p>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setAllotModal({ open: false, station: null })} variant="outline" className="flex-1 border-gray-700 text-gray-400">CANCEL</Button>
            <Button onClick={handleAllot} disabled={allotLoading || !!coinShortfall} className="flex-1 bg-[#00ff55] hover:bg-[#00cc44] text-black font-pixel text-xs border-none">
              {allotLoading ? 'ALLOTTING...' : 'CONFIRM'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Checkout Modal ─── */}
      <Modal open={checkoutModal.open} onClose={() => setCheckoutModal({ open: false, station: null })} title="CHECKOUT" borderColor="#ff00ea">
        {checkoutModal.station?.session && (
          <div className="space-y-4 font-mono">
            <p className="text-gray-400 text-xs">{checkoutModal.station.name}</p>
            {checkoutModal.station.session.totalPrice > 0 && (
              <>
                <div>
                  <label className="block text-[#ff00ea] text-xs mb-1">CUSTOMER NAME</label>
                  <Input value={checkoutName} onChange={e => setCheckoutName(e.target.value)} className="bg-[#0f1026] border-gray-700 text-white" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-[#ff00ea] text-xs mb-1">PHONE</label>
                  <Input value={checkoutPhone} onChange={e => setCheckoutPhone(e.target.value)} className="bg-[#0f1026] border-gray-700 text-white" placeholder="10-digit number" />
                </div>
              </>
            )}

            {/* List ordered session addons */}
            {currentSessionAddons.length > 0 && (
              <div className="p-3 bg-[#0f1026] border border-[#00f3ff]/30 rounded space-y-2">
                <p className="text-[10px] text-[#00f3ff] uppercase font-bold tracking-wider flex items-center gap-1">
                  <CupSoda className="w-3.5 h-3.5" /> ADDONS ORDERED
                </p>
                <div className="divide-y divide-gray-800/50 max-h-36 overflow-y-auto pr-1">
                  {currentSessionAddons.map((item) => (
                    <div key={item.id} className="py-1.5 flex justify-between text-xs font-mono">
                      <span className="text-gray-300">{item.name} <span className="text-gray-600">x{item.quantity}</span></span>
                      <span className="text-[#00ff55]">₹{item.priceAtPurchase * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-gray-800/80 flex justify-between text-xs font-mono font-bold">
                  <span className="text-gray-400">ADDONS TOTAL</span>
                  <span className="text-[#00ff55]">₹{totalAddonsPrice}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#0f1026] border border-gray-700 rounded">
                <p className="text-gray-400 text-xs mb-1">PLAY TIME</p>
                <p className="text-xl font-pixel text-white">{checkoutModal.station.session.durationMinutes}m</p>
              </div>
              <div className="p-3 bg-[#0f1026] border border-[#ff00ea]/40 rounded">
                <p className="text-[#ff00ea] text-xs mb-1">FINAL BILL</p>
                {checkoutModal.station.session.totalPrice === 0 ? (
                  <div className="space-y-2">
                    <p className="text-xl font-pixel text-[#ffea00]">{Math.ceil(checkoutModal.station.session.durationMinutes / 15)} COINS</p>
                    <div className="mt-2 border-t border-gray-800 pt-2">
                      <label className="block text-gray-400 text-[10px] mb-1 font-mono">ADDONS CASH BILL</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-2 text-[#00ff55] font-pixel text-xs">₹</span>
                        <Input
                          type="number"
                          value={customAmountCash}
                          onChange={(e) => setCustomAmountCash(Math.max(0, parseInt(e.target.value) || 0))}
                          className="bg-[#0a0a1a] border-[#00ff55]/30 focus:border-[#00ff55] text-[#00ff55] font-pixel text-xs pl-5 pr-1 py-0.5 h-7 w-full shadow-[0_0_10px_rgba(0,255,85,0.1)] focus:shadow-[0_0_20px_rgba(0,255,85,0.25)] transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative mt-1 flex items-center">
                    <span className="absolute left-2.5 text-[#00ff55] font-pixel text-lg">₹</span>
                    <Input
                      type="number"
                      value={customAmountCash}
                      onChange={(e) => setCustomAmountCash(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-[#0a0a1a] border-[#00ff55]/50 focus:border-[#00ff55] text-[#00ff55] font-pixel text-lg pl-7 pr-2.5 py-1.5 w-full shadow-[0_0_15px_rgba(0,255,85,0.15)] focus:shadow-[0_0_25px_rgba(0,255,85,0.3)] transition-all"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setCheckoutModal({ open: false, station: null })} variant="outline" className="flex-1 border-gray-700 text-gray-400" disabled={checkoutLoading}>CANCEL</Button>
              <Button onClick={handleCheckout} className="flex-1 bg-[#ff00ea] hover:bg-[#cc00bb] text-white font-pixel text-xs border-none" disabled={checkoutLoading}>
                {checkoutLoading ? 'PROCESSING...' : 'PAYMENT RECEIVED'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Station Addons Modal ─── */}
      <Modal 
        open={stationAddonsModal.open} 
        onClose={() => setStationAddonsModal({ open: false, station: null })} 
        title={`ADDONS · ${stationAddonsModal.station?.name || ''}`} 
        borderColor="#00f3ff"
      >
        <div className="space-y-4 font-mono">
          <p className="text-gray-500 text-xs">Manage active snack & drink orders for this session.</p>

          {/* Add new addon section */}
          <div className="p-3 bg-[#0f1026] border border-gray-700 rounded space-y-3">
            <p className="text-[#00f3ff] text-xs font-bold uppercase">ORDER NEW ADDON</p>
            <div className="flex gap-2">
              <select 
                value={selectedAddonId} 
                onChange={e => setSelectedAddonId(e.target.value)}
                className="flex-1 bg-[#0a0a1a] border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00f3ff]"
              >
                <option value="">Select addon...</option>
                {addons.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name} (₹{a.price})</option>
                ))}
              </select>
              <div className="flex gap-2 shrink-0">
                <Input 
                  type="number" 
                  min="1"
                  value={addonQuantity} 
                  onChange={e => setAddonQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 bg-[#0a0a1a] border-gray-700 text-white text-xs h-auto py-1" 
                />
                <Button 
                  onClick={handleAddAddon}
                  disabled={addonsLoading || !selectedAddonId}
                  className="bg-[#00f3ff] hover:bg-[#00ccdd] text-black font-pixel text-[10px] px-3 shrink-0 h-auto py-1.5 border-none"
                >
                  ADD
                </Button>
              </div>
            </div>
          </div>

          {/* List of currently ordered addons */}
          <div className="space-y-2">
            <p className="text-gray-400 text-xs font-bold uppercase">CURRENT ORDERED ITEMS</p>
            {addonsLoading ? (
              <p className="text-xs text-gray-500 animate-pulse text-center py-4">Loading addons...</p>
            ) : currentSessionAddons.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-4 bg-[#0f1026]/30 border border-gray-800 rounded">No addons added to this session.</p>
            ) : (
              <div className="border border-gray-800 rounded divide-y divide-gray-800 overflow-hidden max-h-48 overflow-y-auto">
                {currentSessionAddons.map(item => (
                  <div key={item.id} className="p-3 bg-[#0a0a1a] flex justify-between items-center text-xs">
                    <div>
                      <p className="text-white font-bold">{item.name}</p>
                      <p className="text-gray-500 font-mono text-[10px]">
                        Qty: {item.quantity} · Price: ₹{item.priceAtPurchase} each
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#00ff55] font-bold">₹{item.priceAtPurchase * item.quantity}</span>
                      <button 
                        onClick={() => handleRemoveAddon(item.id)}
                        disabled={addonsLoading}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {currentSessionAddons.length > 0 && (
            <div className="flex justify-between items-center p-3 bg-[#0f1026] border border-gray-850 rounded">
              <span className="text-gray-400 text-xs font-bold">TOTAL ADDONS BILL</span>
              <span className="text-[#00ff55] font-pixel text-sm">₹{totalAddonsPrice}</span>
            </div>
          )}

          <Button 
            onClick={() => setStationAddonsModal({ open: false, station: null })} 
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-pixel text-xs py-3.5 border-none"
          >
            CLOSE
          </Button>
        </div>
      </Modal>
      <TransactionDetailsModal 
        open={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        txnId={selectedTxnId} 
      />
    </main>
  );
}
