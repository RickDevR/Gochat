import React, { useState } from 'react';
import { User } from '../types/chat';
import {
  X,
  User as UserIcon,
  Camera,
  Volume2,
  Mic,
  Shield,
  Bell,
  Trash2,
  Check,
  RefreshCw,
} from 'lucide-react';
import { soundManager } from '../services/mediaDevices';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (updated: Partial<User>) => void;
  onResetAllData: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onResetAllData,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [about, setAbout] = useState(currentUser.about || '');
  const [customStatus, setCustomStatus] = useState(currentUser.customStatus || '');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      name: name.trim() || currentUser.name,
      about: about.trim(),
      customStatus: customStatus.trim(),
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  const handleTestRingtone = () => {
    soundManager.startOutgoingRingtone();
    setTimeout(() => {
      soundManager.stopOutgoingRingtone();
      soundManager.playCallConnected();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg bg-[#111b21] rounded-2xl border border-[#222e35] shadow-2xl p-6 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222e35]">
          <h3 className="font-bold text-base text-[#e9edef] flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-[#00a884]" /> Profile & Desktop Settings
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <form onSubmit={handleSave} className="space-y-5 my-4">
          <div className="flex items-center gap-4 p-4 bg-[#202c33] rounded-xl border border-[#2a3942]">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#00a884]"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-white">{currentUser.name}</h4>
              <p className="text-xs text-[#00a884] font-medium mt-0.5">
                {currentUser.customStatus || 'Online'}
              </p>
              <p className="text-[11px] text-[#8696a0] mt-0.5">{currentUser.phone}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8696a0] mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#202c33] rounded-lg text-sm text-[#e9edef] border border-transparent focus:border-[#00a884] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8696a0] mb-1">About / Bio</label>
            <input
              type="text"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Tell your team what you're working on..."
              className="w-full px-3.5 py-2.5 bg-[#202c33] rounded-lg text-sm text-[#e9edef] border border-transparent focus:border-[#00a884] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8696a0] mb-1">Custom Status</label>
            <input
              type="text"
              value={customStatus}
              onChange={(e) => setCustomStatus(e.target.value)}
              placeholder="e.g. In a meeting, Coding 💻, Driving..."
              className="w-full px-3.5 py-2.5 bg-[#202c33] rounded-lg text-sm text-[#e9edef] border border-transparent focus:border-[#00a884] focus:outline-none"
            />
          </div>

          {/* Device & Hardware Test Section */}
          <div className="p-4 bg-[#182229] rounded-xl border border-[#222e35] space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#00a884]">
              Hardware & Acoustic Test
            </h5>
            <div className="flex items-center justify-between text-xs text-[#8696a0]">
              <span>Test Telephone Ringtone & Chime</span>
              <button
                type="button"
                onClick={handleTestRingtone}
                className="px-3 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] rounded-lg transition-colors flex items-center gap-1.5 font-medium"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#00a884]" /> Play Ringtone
              </button>
            </div>
          </div>

          {/* Reset App Data */}
          <div className="p-4 bg-[#182229] rounded-xl border border-[#222e35] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-400 block">Reset Data</span>
              <span className="text-[11px] text-[#8696a0]">Clear local history and restore defaults</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all conversations, messages, and calls to initial state?')) {
                  onResetAllData();
                  onClose();
                }
              }}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8696a0] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-[#00a884]/20"
            >
              {isSaved ? <Check className="w-4 h-4" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
