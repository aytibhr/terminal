'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Monitor, PauseCircle, PlayCircle, Edit, X } from 'lucide-react';
import { createStation, updateStation, toggleStationStatus, deleteStation } from './actions';
import { useNotifications } from '@/lib/hooks/useNotifications';

function Modal({ open, onClose, title, borderColor = '#00f3ff', children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a1a] rounded-xl w-full max-w-md shadow-2xl" style={{ border: `2px solid ${borderColor}` }}>
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="font-orbitron text-white text-xl">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function StationsClient({ initialStations }: { initialStations: any[] }) {
  const { addNotification } = useNotifications();
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; station: any }>({ open: false, station: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; station: any }>({ open: false, station: null });
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('PS5');
  const [formRate, setFormRate] = useState(150);
  const [formCoins, setFormCoins] = useState(4);

  const handleAdd = async () => {
    await createStation({ name: formName || 'New Station', type: formType, ratePerHour: formRate, coinsPerHour: formCoins });
    setAddModal(false); setFormName(''); setFormRate(150); setFormCoins(4);
    addNotification({ type: 'success', title: 'Station Added', message: `${formName} is now live.` });
  };

  const handleEdit = async () => {
    await updateStation(editModal.station.id, { name: formName, type: formType, ratePerHour: formRate, coinsPerHour: formCoins });
    setEditModal({ open: false, station: null });
    addNotification({ type: 'info', title: 'Station Updated', message: `Changes saved.` });
  };

  const handleDelete = async () => {
    await deleteStation(deleteModal.station.id);
    setDeleteModal({ open: false, station: null });
    addNotification({ type: 'warning', title: 'Station Deleted', message: `${deleteModal.station.name} removed.` });
  };

  const handleToggle = async (station: any) => {
    if (station.status === 'Occupied') { addNotification({ type: 'error', title: 'Blocked', message: 'Cannot modify an occupied station.' }); return; }
    await toggleStationStatus(station.id, station.status);
  };

  return (
    <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-orbitron font-bold text-white tracking-wider">STATIONS</h1>
          <p className="text-gray-400 mt-2 font-mono text-sm">Manage gaming stations, pricing, and maintenance.</p>
        </div>
        <Button onClick={() => { setFormName(''); setFormRate(150); setFormCoins(4); setFormType('PS5'); setAddModal(true); }}
          className="bg-[#00f3ff] hover:bg-transparent border-2 border-[#00f3ff] text-black hover:text-[#00f3ff] transition-all rounded-none font-pixel text-xs px-4 py-6">
          <Plus className="mr-2 h-4 w-4" /> ADD STATION
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialStations.map(station => (
          <div key={station.id} className="bg-[#0f1026] border border-gray-800 rounded-xl p-6 flex flex-col hover:border-[#00f3ff]/40 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <Monitor className={`h-6 w-6 mr-3 ${station.status === 'Active' ? 'text-[#00ff55]' : station.status === 'Occupied' ? 'text-[#00f3ff]' : 'text-gray-500'}`} />
                <div>
                  <h3 className="font-orbitron text-base font-bold text-white">{station.name}</h3>
                  <p className="text-gray-500 font-mono text-xs">{station.type} · ₹{station.ratePerHour}/hr · <span className="text-[#ffea00] font-bold">{station.coinsPerHour || 4} coins/hr</span></p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-mono uppercase font-bold ${station.status === 'Active' ? 'text-[#00ff55] bg-[#00ff55]/20' : station.status === 'Occupied' ? 'text-[#00f3ff] bg-[#00f3ff]/20' : 'text-gray-400 bg-gray-800'}`}>
                {station.status}
              </span>
            </div>
            <div className="flex gap-2 mt-auto pt-4">
              <Button variant="outline" size="sm" className="flex-1 border-gray-700 text-gray-300 hover:text-[#ffea00] hover:border-[#ffea00] font-mono text-xs"
                onClick={() => { setFormName(station.name); setFormType(station.type); setFormRate(station.ratePerHour); setFormCoins(station.coinsPerHour || 4); setEditModal({ open: true, station }); }}>
                <Edit className="h-3 w-3 mr-1" /> Edit
              </Button>
              <Button variant="outline" size="sm" className={`flex-1 border-gray-700 font-mono text-xs ${station.status === 'Maintenance' ? 'text-[#00ff55] hover:border-[#00ff55]' : 'text-gray-400'}`}
                onClick={() => handleToggle(station)}>
                {station.status === 'Maintenance' ? <><PlayCircle className="h-3 w-3 mr-1" />Resume</> : <><PauseCircle className="h-3 w-3 mr-1" />Pause</>}
              </Button>
              <Button variant="outline" size="sm" className="border-gray-700 text-red-500 hover:bg-red-500/10 hover:border-red-500"
                onClick={() => setDeleteModal({ open: true, station })}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="ADD STATION" borderColor="#00f3ff">
        <div className="space-y-4 font-mono">
          <div><label className="block text-[#00f3ff] text-xs mb-1">NAME</label><Input value={formName} onChange={e => setFormName(e.target.value)} className="bg-[#0f1026] border-gray-700 text-white" placeholder="e.g. PS5 Station 4" /></div>
          <div><label className="block text-[#00f3ff] text-xs mb-1">TYPE</label><Input value={formType} onChange={e => setFormType(e.target.value)} className="bg-[#0f1026] border-gray-700 text-white" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[#00f3ff] text-xs mb-1">RATE/HR (₹)</label><Input type="number" value={formRate} onChange={e => setFormRate(parseInt(e.target.value) || 0)} className="bg-[#0f1026] border-gray-700 text-white" /></div>
            <div><label className="block text-[#00f3ff] text-xs mb-1">COINS/HR</label><Input type="number" value={formCoins} onChange={e => setFormCoins(parseInt(e.target.value) || 0)} className="bg-[#0f1026] border-gray-700 text-white" /></div>
          </div>
          <div className="flex gap-3 pt-2"><Button onClick={() => setAddModal(false)} variant="outline" className="flex-1 border-gray-700 text-gray-400">CANCEL</Button><Button onClick={handleAdd} className="flex-1 bg-[#00f3ff] text-black font-pixel text-xs border-none">CREATE</Button></div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, station: null })} title="EDIT STATION" borderColor="#ffea00">
        <div className="space-y-4 font-mono">
          <div><label className="block text-[#ffea00] text-xs mb-1">NAME</label><Input value={formName} onChange={e => setFormName(e.target.value)} className="bg-[#0f1026] border-gray-700 text-white" /></div>
          <div><label className="block text-[#ffea00] text-xs mb-1">TYPE</label><Input value={formType} onChange={e => setFormType(e.target.value)} className="bg-[#0f1026] border-gray-700 text-white" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[#ffea00] text-xs mb-1">RATE/HR (₹)</label><Input type="number" value={formRate} onChange={e => setFormRate(parseInt(e.target.value) || 0)} className="bg-[#0f1026] border-gray-700 text-white" /></div>
            <div><label className="block text-[#ffea00] text-xs mb-1">COINS/HR</label><Input type="number" value={formCoins} onChange={e => setFormCoins(parseInt(e.target.value) || 0)} className="bg-[#0f1026] border-gray-700 text-white" /></div>
          </div>
          <div className="flex gap-3 pt-2"><Button onClick={() => setEditModal({ open: false, station: null })} variant="outline" className="flex-1 border-gray-700 text-gray-400">CANCEL</Button><Button onClick={handleEdit} className="flex-1 bg-[#ffea00] text-black font-pixel text-xs border-none">SAVE</Button></div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, station: null })} title="DELETE STATION" borderColor="#ff0000">
        <p className="text-gray-300 font-mono text-sm mb-6">Permanently delete <span className="text-white font-bold">{deleteModal.station?.name}</span>? This cannot be undone.</p>
        <div className="flex gap-3">
          <Button onClick={() => setDeleteModal({ open: false, station: null })} variant="outline" className="flex-1 border-gray-700 text-gray-400">CANCEL</Button>
          <Button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-pixel text-xs border-none">DELETE</Button>
        </div>
      </Modal>
    </main>
  );
}
