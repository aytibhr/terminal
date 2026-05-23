'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, IndianRupee, Gamepad2, ChevronLeft, ChevronRight, Clock, Crown, Eye, 
  ArrowUpRight, ArrowDownRight, Plus, X, Trash2, CupSoda, Tag, Wallet
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TransactionDetailsModal } from '@/components/ui/transaction-details-modal';
import { createCustomTransaction } from './actions';
import { useNotifications } from '@/lib/hooks/useNotifications';

/* ─── Custom Date Picker ─── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function DatePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selected = value ? new Date(value) : null;

  const pick = (day: number) => {
    const d = new Date(year, month, day);
    onChange(d.toISOString().split('T')[0]);
    setOpen(false);
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    return selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;
  };

  return (
    <div className="relative">
      <p className="text-[#ff00ea] font-mono text-[10px] mb-1 uppercase">{label}</p>
      <button
        onClick={() => setOpen(o => !o)}
        className="px-3 py-1.5 bg-[#0f1026] border border-gray-700 rounded text-[#ff00ea] font-mono text-sm hover:border-[#ff00ea] transition-colors w-32"
      >
        {value || 'Pick date'}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-12 left-0 z-50 bg-[#0a0a1a] border border-[#ff00ea]/50 rounded-xl p-4 shadow-[0_0_30px_rgba(255,0,234,0.15)] w-64">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:text-[#ff00ea] text-gray-400 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-orbitron text-white text-xs">{MONTHS[month]} {year}</span>
              <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:text-[#ff00ea] text-gray-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {['S','M','T','W','T','F','S'].map((d,i) => (
                <div key={i} className="text-center text-gray-600 font-mono text-[10px] py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => (
                <div key={i} className="text-center">
                  {day ? (
                    <button
                      onClick={() => pick(day)}
                      className={`w-8 h-8 rounded-full text-xs font-mono transition-colors ${
                        isSelected(day)
                           ? 'bg-[#ff00ea] text-white font-bold'
                           : 'text-gray-300 hover:bg-[#ff00ea]/20 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const formatPlayedDuration = (mins: number | null | undefined) => {
  if (mins === null || mins === undefined) return '-';
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hrs} hr ${remainingMins}m` : `${hrs} ${hrs === 1 ? 'hr' : 'hrs'}`;
};

const formatPeriod = (start: string | Date | null | undefined, end: string | Date | null | undefined) => {
  if (!start || !end) return '-';
  const s = new Date(start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const e = new Date(end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${s} - ${e}`;
};

export function ReportsClient({ transactions, addons = [] }: { transactions: any[]; addons: any[] }) {
  const { addNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxnId, setSelectedTxnId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Custom addition states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<'Income' | 'Expense'>('Income');
  const [incomeType, setIncomeType] = useState<'Addon' | 'Other'>('Addon');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<{ id: number; name: string; price: number; quantity: number }[]>([]);
  const [addonSearch, setAddonSearch] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const handleViewDetails = (id: number) => {
    setSelectedTxnId(id);
    setIsDetailsOpen(true);
  };

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const filtered = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate); end.setHours(23,59,59,999);
    return transactions.filter(t => {
      const d = new Date(t.timestamp);
      const inRange = d >= start && d <= end;
      const inSearch = (t.userPhone || '').includes(searchQuery) || 
                       (t.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (t.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (t.comment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                       String(t.id).includes(searchQuery);
      return inRange && inSearch;
    });
  }, [transactions, startDate, endDate, searchQuery]);

  // Income: All non-expense transactions
  const totalIncome = useMemo(() => {
    return filtered
      .filter(t => t.transactionType !== 'Expense')
      .reduce((sum, t) => sum + (t.amountCash || 0), 0);
  }, [filtered]);

  // Expenses: All expense transactions
  const totalExpenses = useMemo(() => {
    return filtered
      .filter(t => t.transactionType === 'Expense')
      .reduce((sum, t) => sum + (t.amountCash || 0), 0);
  }, [filtered]);

  const netProfit = totalIncome - totalExpenses;
  const totalSessions = filtered.filter(t => t.transactionType === 'Session').length;

  const revenueData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(t => {
      const d = new Date(t.timestamp);
      const key = `${d.getDate()}/${d.getMonth()+1}`;
      // Incomes add to cash flow, expenses deduct from cash flow
      const amount = t.transactionType === 'Expense' ? -(t.amountCash || 0) : (t.amountCash || 0);
      map.set(key, (map.get(key) || 0) + amount);
    });
    return Array.from(map.entries()).map(([date, revenue]) => ({ date, revenue }));
  }, [filtered]);

  const peakHoursData = useMemo(() => {
    const hoursMap = new Array(24).fill(0);
    filtered.forEach(t => {
      if (t.transactionType === 'Session') {
        const hour = new Date(t.timestamp).getHours();
        hoursMap[hour]++;
      }
    });
    return hoursMap.map((count, hour) => ({
      hour: `${hour}:00`,
      count
    }));
  }, [filtered]);

  // Filtered addons for search inside popup
  const filteredAddons = useMemo(() => {
    return addons.filter(addon => 
      addon.name.toLowerCase().includes(addonSearch.toLowerCase())
    );
  }, [addons, addonSearch]);

  const addonsTotal = selectedAddons.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleAddAddon = (addon: any) => {
    setSelectedAddons(prev => {
      const existing = prev.find(item => item.id === addon.id);
      if (existing) {
        return prev.map(item => item.id === addon.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: addon.id, name: addon.name, price: addon.price, quantity: 1 }];
    });
  };

  const handleRemoveAddon = (addonId: number) => {
    setSelectedAddons(prev => {
      const existing = prev.find(item => item.id === addonId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.id === addonId ? { ...item, quantity: item.quantity - 1 } : item);
      }
      return prev.filter(item => item.id !== addonId);
    });
  };

  const handleCreateEntry = async () => {
    setAddLoading(true);
    try {
      if (addType === 'Income') {
        if (incomeType === 'Addon') {
          if (selectedAddons.length === 0) {
            addNotification({ type: 'error', title: 'Empty Cart', message: 'Please add at least one snack/addon.' });
            setAddLoading(false);
            return;
          }
          await createCustomTransaction({
            type: 'Snack',
            amount: addonsTotal,
            addonsList: selectedAddons.map(item => ({ id: item.id, quantity: item.quantity, price: item.price })),
            comment: comment || 'Standalone snack/addon sale'
          });
          addNotification({ type: 'success', title: 'Snack Sale Recorded', message: `₹${addonsTotal} standalone sale added.` });
        } else {
          const cash = parseInt(amount) || 0;
          if (cash <= 0) {
            addNotification({ type: 'error', title: 'Invalid Cash', message: 'Enter a valid positive amount.' });
            setAddLoading(false);
            return;
          }
          await createCustomTransaction({
            type: 'Income',
            amount: cash,
            comment: comment || 'Custom generic income'
          });
          addNotification({ type: 'success', title: 'Income Recorded', message: `₹${cash} custom income added.` });
        }
      } else {
        const cash = parseInt(amount) || 0;
        if (cash <= 0) {
          addNotification({ type: 'error', title: 'Invalid Expense', message: 'Enter a valid positive amount.' });
          setAddLoading(false);
          return;
        }
        await createCustomTransaction({
          type: 'Expense',
          amount: cash,
          comment: comment || 'Business expense'
        });
        addNotification({ type: 'warning', title: 'Expense Logged', message: `₹${cash} expense deducted from cash flow.` });
      }

      // Reset
      setAddModalOpen(false);
      setAmount('');
      setComment('');
      setSelectedAddons([]);
      setAddonSearch('');
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Action Failed', message: e.message });
    }
    setAddLoading(false);
  };

  return (
    <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      
      {/* ─── Header ─── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-orbitron font-bold text-white tracking-wider">FINANCIAL REPORTS</h1>
          <p className="text-gray-400 mt-1 font-mono text-xs">Revenue, cash flows, and standalone sales ledger.</p>
        </div>
        <div className="flex items-end gap-4 bg-[#0f1026] border border-[#ff00ea]/30 p-4 rounded-xl shadow-[0_0_15px_rgba(255,0,234,0.08)]">
          <DatePicker label="From" value={startDate} onChange={setStartDate} />
          <span className="text-gray-600 font-mono text-xs pb-2">—</span>
          <DatePicker label="To" value={endDate} onChange={setEndDate} />
        </div>
      </div>

      {/* ─── Top Stats Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stat Card 1: Income */}
        <Card className="bg-[#0f1026] border-[#00ff55]/40 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#00ff55]/5 rounded-full blur-xl group-hover:bg-[#00ff55]/10 transition-all duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-xs font-mono text-[#00ff55] uppercase">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-[#00ff55]" />
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-3xl font-pixel text-[#00ff55]">₹{totalIncome}</div>
            <p className="text-[10px] text-gray-500 font-mono mt-1">Lounge cash inflow</p>
          </CardContent>
        </Card>

        {/* Stat Card 2: Expenses */}
        <Card className="bg-[#0f1026] border-[#ff00ea]/40 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#ff00ea]/5 rounded-full blur-xl group-hover:bg-[#ff00ea]/10 transition-all duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-xs font-mono text-[#ff00ea] uppercase">Total Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-[#ff00ea]" />
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-3xl font-pixel text-[#ff00ea]">₹{totalExpenses}</div>
            <p className="text-[10px] text-gray-500 font-mono mt-1">Outflows and snacks cost</p>
          </CardContent>
        </Card>

        {/* Stat Card 3: Net Profit */}
        <Card className={`bg-[#0f1026] rounded-xl relative overflow-hidden border-2 group ${
          netProfit >= 0 ? 'border-[#ffea00]/40' : 'border-red-500/40'
        }`}>
          <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-xl transition-all duration-300 ${
            netProfit >= 0 ? 'bg-[#ffea00]/5 group-hover:bg-[#ffea00]/10' : 'bg-red-500/5 group-hover:bg-red-500/10'
          }`} />
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className={`text-xs font-mono uppercase ${netProfit >= 0 ? 'text-[#ffea00]' : 'text-red-500'}`}>Net Profit</CardTitle>
            <IndianRupee className={`h-4 w-4 ${netProfit >= 0 ? 'text-[#ffea00]' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className={`text-3xl font-pixel ${netProfit >= 0 ? 'text-[#ffea00]' : 'text-red-500'}`}>
              {netProfit >= 0 ? '' : '-' }₹{Math.abs(netProfit)}
            </div>
            <p className="text-[10px] text-gray-500 font-mono mt-1">Profit margins breakdown</p>
          </CardContent>
        </Card>

        {/* Stat Card 4: Total Sessions */}
        <Card className="bg-[#0f1026] border-[#00f3ff]/40 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#00f3ff]/5 rounded-full blur-xl group-hover:bg-[#00f3ff]/10 transition-all duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-xs font-mono text-[#00f3ff] uppercase">Total Sessions</CardTitle>
            <Gamepad2 className="h-4 w-4 text-[#00f3ff]" />
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-3xl font-pixel text-white">{totalSessions}</div>
            <p className="text-[10px] text-gray-500 font-mono mt-1">Completed console play allotments</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Charts Section ─── */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Net Flow / Revenue Trend */}
        <div className="bg-[#0a0a1a] border border-gray-800 rounded-xl p-6">
          <h3 className="font-orbitron text-white text-base mb-4">CASH FLOW TREND (INCOME & EXPENSES)</h3>
          <div className="h-64">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f1026', border: '1px solid #00ff55', borderRadius: '8px' }} itemStyle={{ color: '#00ff55', fontFamily: 'monospace' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#00ff55" strokeWidth={2} dot={{ fill: '#00ff55', r: 3 }} activeDot={{ r: 5 }} name="Net cash flow" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 font-mono text-sm">No data for selected range.</div>
            )}
          </div>
        </div>

        {/* Peak Hours Chart */}
        <div className="bg-[#0a0a1a] border border-gray-800 rounded-xl p-6">
          <h3 className="font-orbitron text-white text-base mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#ffea00]" /> PEAK HOURS (SESSIONS)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="hour" stroke="#6b7280" fontSize={9} tickLine={false} axisLine={false} interval={2} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,234,0,0.05)' }}
                  contentStyle={{ backgroundColor: '#0a0a1a', border: '1px solid #ffea00', borderRadius: '8px' }} 
                  itemStyle={{ color: '#ffea00', fontFamily: 'monospace' }} 
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {peakHoursData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#ffea00' : '#1f2937'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── Ledger Header & Search ─── */}
      <div className="bg-[#0a0a1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-orbitron text-white text-base">TRANSACTION LEDGER</h3>
          <div className="flex w-full sm:w-auto items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input placeholder="Search ledger..." className="pl-10 bg-[#0f1026] border-gray-700 text-white font-mono text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Button 
              onClick={() => setAddModalOpen(true)}
              className="bg-[#ff00ea] hover:bg-transparent border-2 border-[#ff00ea] text-black hover:text-[#ff00ea] font-pixel text-xs rounded-none h-10 px-4 shrink-0 transition-all shadow-[0_0_15px_rgba(255,0,234,0.3)]"
            >
              <Plus className="w-4 h-4 mr-1.5" /> ADD
            </Button>
          </div>
        </div>

        {/* ─── Ledger Table ─── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-sm">
            <thead className="bg-[#0f1026] text-gray-500 text-xs">
              <tr>
                {['TXN ID','DATE & TIME','USER DETAILS','TYPE','PLAYED TIME','SESSION PERIOD','CASH (₹)','T8 COINS','VIEW'].map(h => (
                  <th key={h} className={`p-4 border-b border-gray-800 ${h === 'VIEW' ? 'text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(txn => {
                const isExpense = txn.transactionType === 'Expense';
                return (
                  <tr key={txn.id} className="border-b border-gray-800/50 hover:bg-[#0f1026]/50 transition-colors">
                    <td className="p-4 text-gray-400">TXN-{txn.id}</td>
                    <td className="p-4 text-gray-400 font-mono text-xs">{new Date(txn.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-4">
                      {txn.transactionType === 'Expense' || txn.transactionType === 'Income' ? (
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{txn.comment || (isExpense ? 'Business Expense' : 'Other Income')}</span>
                          {txn.customerName && <span className="text-[11px] text-gray-500 font-mono">{txn.customerName}</span>}
                        </div>
                      ) : txn.transactionType === 'Snack' && !txn.sessionId ? (
                        <div className="flex flex-col">
                          <span className="text-[#00ff55] font-bold">Standalone Snack Sale</span>
                          {txn.comment && <span className="text-[11px] text-gray-400 font-mono">{txn.comment}</span>}
                        </div>
                      ) : txn.userName ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-bold">{txn.userName}</span>
                            <Crown className="w-3 h-3 text-[#ffea00] shrink-0" />
                          </div>
                          <span className="text-[11px] text-[#00f3ff] font-mono">{txn.userPhone}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-gray-300 font-bold">{txn.customerName || txn.userPhone || 'Walk-In'}</span>
                          <div className="flex flex-col">
                            {txn.customerName && txn.userPhone && <span className="text-[11px] text-[#00f3ff] font-mono">{txn.userPhone}</span>}
                            {!txn.customerName && !txn.userPhone && <span className="text-[10px] text-gray-600 uppercase font-pixel tracking-tighter">Guest</span>}
                            {(txn.customerName || txn.userPhone) && !txn.userName && <span className="text-[10px] text-gray-600 uppercase font-pixel tracking-tighter">Walk-In</span>}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider ${
                        txn.transactionType === 'Session' ? 'bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/20' :
                        txn.transactionType === 'Membership' ? 'bg-[#ffea00]/10 text-[#ffea00] border border-[#ffea00]/20' :
                        txn.transactionType === 'Snack' ? 'bg-[#00ff55]/10 text-[#00ff55] border border-[#00ff55]/20' :
                        txn.transactionType === 'Income' ? 'bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20' :
                        'bg-[#ff00ea]/10 text-[#ff00ea] border border-[#ff00ea]/20'
                      }`}>
                        {txn.transactionType}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300 font-bold">{formatPlayedDuration(txn.sessionDuration)}</td>
                    <td className="p-4 text-gray-400 text-xs">{formatPeriod(txn.sessionStartTime, txn.sessionEndTime)}</td>
                    <td className={`p-4 font-bold ${isExpense ? 'text-[#ff00ea]' : 'text-[#00ff55]'}`}>
                      {isExpense ? `-₹${txn.amountCash}` : `+₹${txn.amountCash || 0}`}
                    </td>
                    <td className="p-4 text-[#ffea00] font-bold">{txn.amountCreditsUsed > 0 ? `-${txn.amountCreditsUsed}` : '-'}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleViewDetails(txn.id)}
                        className="p-1 rounded bg-[#ff00ea]/10 hover:bg-[#ff00ea]/30 text-[#ff00ea] transition-all hover:scale-110 border border-[#ff00ea]/20 flex items-center justify-center mx-auto"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={9} className="p-8 text-center text-gray-600">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── ADD TRANSACTION ENTRY MODAL ─── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div 
            className="bg-[#0a0a1a] rounded-xl w-full max-w-lg shadow-[0_0_50px_rgba(255,0,234,0.15)] flex flex-col max-h-[90vh]" 
            style={{ border: `2px solid ${addType === 'Income' ? '#00f3ff' : '#ff00ea'}` }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-800 shrink-0">
              <h2 className="font-orbitron text-white text-xl font-bold tracking-wide flex items-center gap-2">
                <Wallet className={`w-5 h-5 ${addType === 'Income' ? 'text-[#00f3ff]' : 'text-[#ff00ea]'}`} /> 
                {addType === 'Income' ? 'RECORD INCOME' : 'RECORD EXPENSE'}
              </h2>
              <button onClick={() => setAddModalOpen(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 font-mono overflow-y-auto flex-1">
              
              {/* Type Toggle Button Group */}
              <div className="space-y-1">
                <label className="block text-gray-500 text-xs uppercase">Entry Category</label>
                <div className="grid grid-cols-2 bg-[#0f1026] border border-gray-800 p-0.5 rounded-lg">
                  <button 
                    onClick={() => setAddType('Income')}
                    className={`py-2 rounded font-pixel text-[10px] transition-all ${
                      addType === 'Income' 
                        ? 'bg-[#00f3ff] text-black font-bold' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    INCOME
                  </button>
                  <button 
                    onClick={() => setAddType('Expense')}
                    className={`py-2 rounded font-pixel text-[10px] transition-all ${
                      addType === 'Expense' 
                        ? 'bg-[#ff00ea] text-black font-bold' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    EXPENSE
                  </button>
                </div>
              </div>

              {/* INCOME SPECIFIC TYPE TOGGLE */}
              {addType === 'Income' && (
                <div className="space-y-1">
                  <label className="block text-gray-500 text-xs uppercase">Income Type</label>
                  <div className="grid grid-cols-2 bg-[#0f1026] border border-gray-800 p-0.5 rounded-lg">
                    <button 
                      onClick={() => setIncomeType('Addon')}
                      className={`py-1.5 rounded text-xs font-bold transition-all ${
                        incomeType === 'Addon' 
                          ? 'bg-[#00ff55]/20 text-[#00ff55] border border-[#00ff55]/30' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <CupSoda className="w-3.5 h-3.5 inline mr-1.5" /> Snack / Addon
                    </button>
                    <button 
                      onClick={() => setIncomeType('Other')}
                      className={`py-1.5 rounded text-xs font-bold transition-all ${
                        incomeType === 'Other' 
                          ? 'bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/30' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5 inline mr-1.5" /> Other Income
                    </button>
                  </div>
                </div>
              )}

              {/* STANDALONE ADDON CART SELECTOR */}
              {addType === 'Income' && incomeType === 'Addon' ? (
                <div className="space-y-4">
                  {/* Cart List */}
                  <div className="p-3 bg-[#0a0a1a] border border-gray-800 rounded-lg min-h-[80px] max-h-[160px] overflow-y-auto space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">SELECTED ITEMS</p>
                    {selectedAddons.length === 0 ? (
                      <p className="text-xs text-gray-600 italic">No snacks selected yet. Search and click below to add.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedAddons.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300">{item.name} <span className="text-gray-500">x{item.quantity}</span></span>
                            <div className="flex items-center gap-2">
                              <span className="text-[#00ff55] font-bold">₹{item.price * item.quantity}</span>
                              <div className="flex border border-gray-800 rounded overflow-hidden">
                                <button onClick={() => handleRemoveAddon(item.id)} className="px-1.5 py-0.5 bg-gray-800 text-white hover:bg-gray-700">-</button>
                                <span className="px-2 text-white">{item.quantity}</span>
                                <button onClick={() => handleAddAddon({ id: item.id, name: item.name, price: item.price })} className="px-1.5 py-0.5 bg-gray-800 text-white hover:bg-gray-700">+</button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="border-t border-gray-850 pt-2 flex justify-between font-bold text-xs">
                          <span className="text-gray-400">TOTAL STANDALONE CASH</span>
                          <span className="text-[#00ff55]">₹{addonsTotal}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Addon Selector with Search */}
                  <div className="space-y-2">
                    <label className="block text-gray-500 text-xs uppercase">Search & Add snacks</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input 
                        placeholder="Search addon..." 
                        className="pl-9 bg-[#0f1026] border-gray-700 text-white text-xs h-9" 
                        value={addonSearch} 
                        onChange={e => setAddonSearch(e.target.value)} 
                      />
                    </div>
                    <div className="max-h-[140px] overflow-y-auto grid grid-cols-2 gap-2 pt-1.5">
                      {filteredAddons.map(addon => (
                        <button
                          key={addon.id}
                          onClick={() => handleAddAddon(addon)}
                          className="p-2 bg-[#0f1026] border border-gray-800 hover:border-[#00ff55] text-left rounded text-xs flex justify-between items-center transition-colors group"
                        >
                          <span className="text-gray-300 truncate max-w-[110px] group-hover:text-white">{addon.name}</span>
                          <span className="text-[#00ff55] font-bold">₹{addon.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Note/Comment */}
                  <div>
                    <label className="block text-gray-500 text-xs uppercase mb-1">Optional Comment</label>
                    <Input 
                      placeholder="e.g. Counter sale cash" 
                      className="bg-[#0f1026] border-gray-700 text-white h-10" 
                      value={comment} 
                      onChange={e => setComment(e.target.value)} 
                    />
                  </div>
                </div>
              ) : (
                /* CUSTOM CASH & COMMENTS FORM (FOR OTHER INCOME OR EXPENSE) */
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-500 text-xs uppercase mb-1">CASH AMOUNT (₹)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-gray-400 font-bold">₹</span>
                      <Input 
                        type="number"
                        placeholder="e.g. 500" 
                        className="pl-8 bg-[#0f1026] border-gray-700 text-white h-11" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-500 text-xs uppercase mb-1">Comment / Notes</label>
                    <Input 
                      placeholder={addType === 'Income' ? 'e.g. PS5 tournaments sponsor cash' : 'e.g. Monthly internet bills paid'} 
                      className="bg-[#0f1026] border-gray-700 text-white h-11" 
                      value={comment} 
                      onChange={e => setComment(e.target.value)} 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-5 border-t border-gray-800 flex gap-3 shrink-0">
              <Button 
                onClick={() => setAddModalOpen(false)} 
                variant="outline" 
                className="flex-1 border-gray-700 text-gray-400"
              >
                CANCEL
              </Button>
              <Button 
                onClick={handleCreateEntry} 
                disabled={addLoading}
                className="flex-1 text-black font-pixel text-xs border-none"
                style={{ backgroundColor: addType === 'Income' ? '#00f3ff' : '#ff00ea' }}
              >
                {addLoading ? 'SAVING...' : 'SAVE RECORD'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal sheet */}
      <TransactionDetailsModal 
        open={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        txnId={selectedTxnId} 
      />
    </main>
  );
}
