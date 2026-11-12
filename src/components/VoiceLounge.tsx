import React, { useState } from 'react';
import { VoiceRoom, VoiceRoomMember, User } from '../types/chat';
import {
  Volume2,
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  Monitor,
  Radio,
  Users,
  Sparkles,
  Signal,
} from 'lucide-react';
import { soundManager } from '../services/mediaDevices';

interface VoiceLoungeProps {
  rooms: VoiceRoom[];
  currentUser: User;
  onJoinRoom: (roomId: string) => void;
  onLeaveRoom: () => void;
  activeRoomId: string | null;
}

export const VoiceLounge: React.FC<VoiceLoungeProps> = ({
  rooms,
  currentUser,
  onJoinRoom,
  onLeaveRoom,
  activeRoomId,
}) => {
  const [isSelfMuted, setIsSelfMuted] = useState(false);
  const [isSelfDeafened, setIsSelfDeafened] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  const handleJoin = (roomId: string) => {
    soundManager.playCallConnected();
    onJoinRoom(roomId);
  };

  const handleLeave = () => {
    soundManager.playCallEnded();
    onLeaveRoom();
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a] overflow-hidden select-none">
      {/* Top Header */}
      <div className="px-6 py-4 bg-[#111b21] border-b border-[#222e35] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className="w-5 h-5 text-[#00a884]" />
          <div>
            <h2 className="text-base font-bold text-[#e9edef]">Discord Voice Lounges</h2>
            <p className="text-xs text-[#8696a0]">
              Low-latency collaborative voice rooms with live stage presence
            </p>
          </div>
        </div>

        {activeRoom && (
          <div className="flex items-center gap-2 bg-[#202c33] px-3.5 py-1.5 rounded-lg border border-[#00a884]/40">
            <Signal className="w-4 h-4 text-[#00a884] animate-pulse" />
            <span className="text-xs font-semibold text-[#00a884]">
              Connected to {activeRoom.name}
            </span>
          </div>
        )}
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {rooms.map((room) => {
          const isConnected = room.id === activeRoomId;

          return (
            <div
              key={room.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isConnected
                  ? 'bg-[#111b21] border-[#00a884]/50 shadow-xl shadow-[#00a884]/5'
                  : 'bg-[#111b21]/60 border-[#222e35] hover:border-[#2a3942]'
              }`}
            >
              {/* Room Header */}
              <div className="px-5 py-3.5 bg-[#202c33]/70 border-b border-[#222e35] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Volume2
                    className={`w-4 h-4 ${isConnected ? 'text-[#00a884]' : 'text-[#8696a0]'}`}
                  />
                  <span className="font-semibold text-sm text-[#e9edef]">{room.name}</span>
                  <span className="text-[11px] text-[#8696a0] font-mono">
                    ({room.members.length + (isConnected ? 1 : 0)} connected)
                  </span>
                </div>

                {isConnected ? (
                  <button
                    onClick={handleLeave}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <PhoneOff className="w-3.5 h-3.5" /> Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoin(room.id)}
                    className="px-4 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    Join Voice
                  </button>
                )}
              </div>

              {/* Members Stage Grid */}
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {/* Current User in Room */}
                  {isConnected && (
                    <div className="bg-[#202c33] p-4 rounded-xl border border-[#00a884]/40 flex flex-col items-center text-center relative group">
                      <div className="relative mb-2">
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-[#00a884]"
                        />
                        {!isSelfMuted && (
                          <div className="absolute -inset-1 rounded-full border-2 border-[#00a884] animate-ping pointer-events-none" />
                        )}
                        {isSelfMuted && (
                          <div className="absolute -bottom-1 -right-1 p-1 bg-rose-600 rounded-full text-white">
                            <MicOff className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-white">You</span>
                      <span className="text-[10px] text-[#00a884] font-medium">Host / Active</span>
                    </div>
                  )}

                  {/* Remote Room Members */}
                  {room.members.map((member) => (
                    <div
                      key={member.id}
                      className="bg-[#202c33] p-4 rounded-xl border border-[#2a3942] flex flex-col items-center text-center relative hover:border-[#384852] transition-colors"
                    >
                      <div className="relative mb-2">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className={`w-14 h-14 rounded-full object-cover border-2 transition-all ${
                            member.isSpeaking
                              ? 'border-[#00a884] shadow-lg shadow-[#00a884]/30'
                              : 'border-transparent'
                          }`}
                        />
                        {member.isSpeaking && (
                          <div className="absolute -inset-1 rounded-full border-2 border-[#00a884] animate-ping pointer-events-none" />
                        )}
                        {member.isMuted && (
                          <div className="absolute -bottom-1 -right-1 p-1 bg-[#111b21] rounded-full text-rose-400 border border-[#2a3942]">
                            <MicOff className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-[#e9edef] truncate max-w-[120px]">
                        {member.name}
                      </span>
                      <span className="text-[10px] text-[#8696a0]">
                        {member.isSpeaking
                          ? 'Speaking...'
                          : member.isScreenSharing
                          ? 'Screen Sharing'
                          : 'Connected'}
                      </span>
                    </div>
                  ))}

                  {!isConnected && room.members.length === 0 && (
                    <div className="col-span-full py-6 text-center text-xs text-[#8696a0]">
                      No one is currently in this lounge. Join in to start talking!
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Voice Control Dock for Active Room */}
      {activeRoom && (
        <div className="px-6 py-3.5 bg-[#111b21] border-t border-[#222e35] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00a884] animate-pulse" />
            <div className="text-xs">
              <span className="text-white font-semibold">Voice Connected</span>
              <span className="text-[#8696a0] ml-2">RTC High Fidelity / 48kHz</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSelfMuted(!isSelfMuted)}
              className={`p-2.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-2 ${
                isSelfMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-[#202c33] text-[#e9edef] hover:bg-[#2a3942]'
              }`}
            >
              {isSelfMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isSelfMuted ? 'Muted' : 'Mute'}</span>
            </button>

            <button
              onClick={() => setIsSelfDeafened(!isSelfDeafened)}
              className={`p-2.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-2 ${
                isSelfDeafened
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-[#202c33] text-[#e9edef] hover:bg-[#2a3942]'
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>{isSelfDeafened ? 'Deafened' : 'Deafen'}</span>
            </button>

            <button
              onClick={handleLeave}
              className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md"
            >
              <PhoneOff className="w-4 h-4" /> Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
