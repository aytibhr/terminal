'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, IndianRupee, Gamepad2, ChevronLeft, ChevronRight, Clock, Crown, Eye } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TransactionDetailsModal } from '@/components/ui/transaction-details-modal';

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

export function ReportsClient({ transactions }: { transactions: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxnId, setSelectedTxnId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
                       String(t.id).includes(searchQuery);
      return inRange && inSearch;
    });
  }, [transactions, startDate, endDate, searchQuery]);

  const totalCash = filtered.reduce((s, t) => s + (t.amountCash || 0), 0);
  const totalSessions = filtered.filter(t => t.transactionType === 'Session').length;

  const revenueData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(t => {
      const d = new Date(t.timestamp);
      const key = `${d.getDate()}/${d.getMonth()+1}`;
      map.set(key, (map.get(key) || 0) + (t.amountCash || 0));
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

  return (
    <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-orbitron font-bold text-white tracking-wider">FINANCIAL REPORTS</h1>
          <p className="text-gray-400 mt-1 font-mono text-xs">Revenue, sessions, and ledger analysis.</p>
        </div>
        <div className="flex items-end gap-4 bg-[#0f1026] border border-[#ff00ea]/30 p-4 rounded-xl shadow-[0_0_15px_rgba(255,0,234,0.08)]">
          <DatePicker label="From" value={startDate} onChange={setStartDate} />
          <span className="text-gray-600 font-mono text-xs pb-2">—</span>
          <DatePicker label="To" value={endDate} onChange={setEndDate} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-[#0f1026] border-[#00ff55]/40 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono text-[#00ff55] uppercase">Total Cash</CardTitle>
            <IndianRupee className="h-4 w-4 text-[#00ff55]" />
          </CardHeader>
          <CardContent><div className="text-4xl font-pixel text-[#00ff55]">₹{totalCash}</div></CardContent>
        </Card>
        <Card className="bg-[#0f1026] border-[#00f3ff]/40 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono text-[#00f3ff] uppercase">Total Sessions</CardTitle>
            <Gamepad2 className="h-4 w-4 text-[#00f3ff]" />
          </CardHeader>
          <CardContent><div className="text-4xl font-pixel text-white">{totalSessions}</div></CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="bg-[#0a0a1a] border border-gray-800 rounded-xl p-6">
          <h3 className="font-orbitron text-white text-base mb-4">REVENUE TREND</h3>
          <div className="h-64">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f1026', border: '1px solid #00ff55', borderRadius: '8px' }} itemStyle={{ color: '#00ff55', fontFamily: 'monospace' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#00ff55" strokeWidth={2} dot={{ fill: '#00ff55', r: 3 }} activeDot={{ r: 5 }} />
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

      {/* Ledger */}
      <div className="bg-[#0a0a1a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-orbitron text-white text-base">TRANSACTION LEDGER</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input placeholder="Search phone or ID..." className="pl-10 bg-[#0f1026] border-gray-700 text-white font-mono text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
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
              {filtered.length > 0 ? filtered.map(txn => (
                <tr key={txn.id} className="border-b border-gray-800/50 hover:bg-[#0f1026]/50 transition-colors">
                  <td className="p-4 text-gray-400">TXN-{txn.id}</td>
                  <td className="p-4 text-gray-400 font-mono text-xs">{new Date(txn.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-4">
                    {txn.userName ? (
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
                  <td className="p-4"><span className="px-2 py-0.5 bg-gray-800 rounded text-xs uppercase">{txn.transactionType}</span></td>
                  <td className="p-4 text-gray-300 font-bold">{formatPlayedDuration(txn.sessionDuration)}</td>
                  <td className="p-4 text-gray-400 text-xs">{formatPeriod(txn.sessionStartTime, txn.sessionEndTime)}</td>
                  <td className="p-4 text-[#00ff55] font-bold">{txn.amountCash > 0 ? `+${txn.amountCash}` : '-'}</td>
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
              )) : (
                <tr><td colSpan={9} className="p-8 text-center text-gray-600">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <TransactionDetailsModal 
        open={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        txnId={selectedTxnId} 
      />
    </main>
  );
}
