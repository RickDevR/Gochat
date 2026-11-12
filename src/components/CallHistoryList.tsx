import React, { useState } from 'react';
import { CallRecord } from '../types/chat';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, Search } from 'lucide-react';

interface CallHistoryListProps {
  calls: CallRecord[];
  onStartCall: (contactId: string, isVideo: boolean) => void;
}

export const CallHistoryList: React.FC<CallHistoryListProps> = ({ calls, onStartCall }) => {
  const [filter, setFilter] = useState<'all' | 'missed'>('all');
  const [search, setSearch] = useState('');

  const filteredCalls = calls.filter((call) => {
    if (filter === 'missed' && call.type !== 'missed') return false;
    if (search.trim() && !call.contactName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const formatDuration = (sec: number) => {
    if (sec === 0) return 'Missed';
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s}s`;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#111b21] border-r border-[#222e35] overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 bg-[#202c33] border-b border-[#222e35] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#e9edef]">Calls & Recents</h2>
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-[#111b21] p-1 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-[#202c33] text-[#e9edef]'
                  : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('missed')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                filter === 'missed'
                  ? 'bg-[#202c33] text-rose-400'
                  : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              Missed
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8696a0] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search recent calls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#111b21] rounded-lg text-xs text-[#e9edef] placeholder-[#8696a0] border border-transparent focus:border-[#00a884] focus:outline-none"
          />
        </div>
      </div>

      {/* Calls List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#222e35]/60">
        {filteredCalls.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#8696a0]">
            No call records found.
          </div>
        ) : (
          filteredCalls.map((call) => (
            <div
              key={call.id}
              className="p-3.5 hover:bg-[#202c33]/50 transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <img
                  src={call.contactAvatar}
                  alt={call.contactName}
                  className="w-11 h-11 rounded-full object-cover border border-[#2a3942]"
                />
                <div>
                  <h4
                    className={`text-sm font-semibold leading-tight ${
                      call.type === 'missed' ? 'text-rose-400' : 'text-[#e9edef]'
                    }`}
                  >
                    {call.contactName}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-[#8696a0] mt-0.5">
                    {call.type === 'incoming' && (
                      <PhoneIncoming className="w-3.5 h-3.5 text-[#00a884]" />
                    )}
                    {call.type === 'outgoing' && (
                      <PhoneOutgoing className="w-3.5 h-3.5 text-[#00a884]" />
                    )}
                    {call.type === 'missed' && (
                      <PhoneMissed className="w-3.5 h-3.5 text-rose-500" />
                    )}
                    <span>
                      {new Date(call.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                      ,{' '}
                      {new Date(call.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">{formatDuration(call.durationSeconds)}</span>
                  </div>
                </div>
              </div>

              {/* Redial Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onStartCall(call.conversationId, false)}
                  className="p-2 rounded-full text-[#8696a0] hover:text-[#00a884] hover:bg-[#202c33] transition-colors"
                  title="Voice call back"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onStartCall(call.conversationId, true)}
                  className="p-2 rounded-full text-[#8696a0] hover:text-[#00a884] hover:bg-[#202c33] transition-colors"
                  title="Video call back"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
