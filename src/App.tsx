import React, { useState, useEffect } from 'react';
import {
  Conversation,
  Message,
  MessageType,
  User,
  StatusStory,
  CallRecord,
  VoiceRoom,
  MessageReply,
} from './types/chat';
import {
  CURRENT_USER,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_STATUS_STORIES,
  INITIAL_CALL_RECORDS,
  INITIAL_VOICE_ROOMS,
} from './data/initialData';
import { NavigationRail, ActiveTab } from './components/NavigationRail';
import { ConversationList } from './components/ConversationList';
import { ChatStage } from './components/ChatStage';
import { CameraModal } from './components/CameraModal';
import { VideoNoteRecorder } from './components/VideoNoteRecorder';
import { VoiceNoteRecorder } from './components/VoiceNoteRecorder';
import { CallTheater } from './components/CallTheater';
import { StatusViewer } from './components/StatusViewer';
import { StatusTabList } from './components/StatusTabList';
import { VoiceLounge } from './components/VoiceLounge';
import { CallHistoryList } from './components/CallHistoryList';
import { MediaGalleryDrawer } from './components/MediaGalleryDrawer';
import { NewChatModal } from './components/NewChatModal';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { soundManager } from './services/mediaDevices';

const STORAGE_KEYS = {
  USER: 'pulsechat_user',
  CONVERSATIONS: 'pulsechat_conversations',
  MESSAGES: 'pulsechat_messages',
  STORIES: 'pulsechat_stories',
  CALLS: 'pulsechat_calls',
  VOICE_ROOMS: 'pulsechat_voicerooms',
};

export default function App() {
  // Load state from localStorage or initial defaults
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : CURRENT_USER;
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
  });

  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  const [statusStories, setStatusStories] = useState<StatusStory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STORIES);
    return saved ? JSON.parse(saved) : INITIAL_STATUS_STORIES;
  });

  const [callRecords, setCallRecords] = useState<CallRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CALLS);
    return saved ? JSON.parse(saved) : INITIAL_CALL_RECORDS;
  });

  const [voiceRooms, setVoiceRooms] = useState<VoiceRoom[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VOICE_ROOMS);
    return saved ? JSON.parse(saved) : INITIAL_VOICE_ROOMS;
  });

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('chats');
  const [activeConversationId, setActiveConversationId] = useState<string>(
    conversations[0]?.id || 'conv_sarah'
  );
  const [isMediaDrawerOpen, setIsMediaDrawerOpen] = useState(false);

  // Modals & Overlays
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isVideoNoteModalOpen, setIsVideoNoteModalOpen] = useState(false);
  const [isVoiceNoteModalOpen, setIsVoiceNoteModalOpen] = useState(false);
  const [isCallTheaterOpen, setIsCallTheaterOpen] = useState(false);
  const [isCallVideo, setIsCallVideo] = useState(true);
  const [callContact, setCallContact] = useState<Conversation | null>(null);

  const [isStatusViewerOpen, setIsStatusViewerOpen] = useState(false);
  const [statusViewerInitialIndex, setStatusViewerInitialIndex] = useState(0);

  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeVoiceRoomId, setActiveVoiceRoomId] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(statusStories));
      localStorage.setItem(STORAGE_KEYS.CALLS, JSON.stringify(callRecords));
      localStorage.setItem(STORAGE_KEYS.VOICE_ROOMS, JSON.stringify(voiceRooms));
    } catch {
      // Storage quota or privacy mode
    }
  }, [currentUser, conversations, messages, statusStories, callRecords, voiceRooms]);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];
  const activeMessages = messages[activeConversationId] || [];

  // Total unread count calculation
  const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  /**
   * Send a message in current chat
   */
  const handleSendMessage = (
    text?: string,
    type: MessageType = 'text',
    mediaUrl?: string,
    mediaCaption?: string,
    mediaDuration?: number,
    mediaWaveform?: number[],
    replyTo?: MessageReply
  ) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId: activeConversationId,
      senderId: 'user_me',
      text,
      timestamp: Date.now(),
      status: 'sent',
      type,
      mediaUrl,
      mediaCaption,
      mediaDuration,
      mediaWaveform,
      replyTo,
    };

    // Update messages
    setMessages((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), newMessage],
    }));

    // Update conversation lastMessage
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              lastMessage: newMessage,
              unreadCount: 0,
            }
          : c
      )
    );

    // Realistic delivery progression: sent -> delivered -> read
    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [activeConversationId]: (prev[activeConversationId] || []).map((m) =>
          m.id === newMessage.id ? { ...m, status: 'delivered' } : m
        ),
      }));
    }, 700);

    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [activeConversationId]: (prev[activeConversationId] || []).map((m) =>
          m.id === newMessage.id ? { ...m, status: 'read' } : m
        ),
      }));
    }, 2000);

    // Realistic counter-reply if it's a DM (after 3.5 seconds)
    if (!activeConversation.isGroup) {
      setTimeout(() => {
        simulateContactReply(activeConversation);
      }, 3500);
    }
  };

  /**
   * Simulate authentic contact response to user action
   */
  const simulateContactReply = (conv: Conversation) => {
    const replyOptions: Record<string, string[]> = {
      conv_sarah: [
        'Got your update! The audio and video quality on PulseChat is stellar.',
        'Optics are crystal clear. Love the circular video notes.',
        'I saw your status update! Looking forward to testing the screen share next.',
      ],
      conv_elena: [
        'Awesome! The dark slate contrast is super easy on the eyes.',
        'That snapshot turned out sharp! Loving the filter colors.',
        'Let me know when you want to jump on a live video call.',
      ],
      conv_marcus: [
        'Acknowledged. Streams look very stable on the pipeline.',
        'Latency is under 15ms. Good work on the audio analyzer!',
      ],
      conv_techlead: [
        'Reviewed! Everything is functioning with real WebRTC and MediaRecorder.',
        'Looking ready for release. Call me anytime if you want to test peer feeds.',
      ],
    };

    const replies = replyOptions[conv.id] || [
      'Thanks for reaching out! The desktop client is running smoothly.',
    ];
    const pickedReply = replies[Math.floor(Math.random() * replies.length)];

    const replyMsg: Message = {
      id: `msg_reply_${Date.now()}`,
      conversationId: conv.id,
      senderId: conv.participants.find((p) => p !== 'user_me') || 'user_remote',
      text: pickedReply,
      timestamp: Date.now(),
      status: 'read',
      type: 'text',
    };

    soundManager.playCallConnected(); // gentle notification sound

    setMessages((prev) => ({
      ...prev,
      [conv.id]: [...(prev[conv.id] || []), replyMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conv.id
          ? {
              ...c,
              lastMessage: replyMsg,
            }
          : c
      )
    );
  };

  /**
   * Camera snapshot handler
   */
  const handleCaptureCameraSnapshot = (imageDataUrl: string, caption?: string) => {
    handleSendMessage(undefined, 'image', imageDataUrl, caption);
  };

  /**
   * Video note handler
   */
  const handleSendVideoNote = (videoBlobUrl: string, duration: number) => {
    handleSendMessage(undefined, 'video_note', videoBlobUrl, undefined, duration);
  };

  /**
   * Voice note handler
   */
  const handleSendVoiceNote = (
    audioUrl: string,
    durationSeconds: number,
    waveform: number[]
  ) => {
    handleSendMessage(
      undefined,
      'voice_note',
      audioUrl,
      undefined,
      durationSeconds,
      waveform
    );
  };

  /**
   * Start a live call (video or voice)
   */
  const handleStartCall = (isVideo: boolean, targetConvId?: string) => {
    const target = targetConvId
      ? conversations.find((c) => c.id === targetConvId) || activeConversation
      : activeConversation;

    setCallContact(target);
    setIsCallVideo(isVideo);
    setIsCallTheaterOpen(true);
  };

  /**
   * End call handler
   */
  const handleEndCall = (durationSeconds: number) => {
    setIsCallTheaterOpen(false);

    if (callContact) {
      // 1. Add CallRecord
      const newCall: CallRecord = {
        id: `call_${Date.now()}`,
        conversationId: callContact.id,
        contactName: callContact.name,
        contactAvatar: callContact.avatar,
        timestamp: Date.now(),
        durationSeconds,
        type: 'outgoing',
        isVideo: isCallVideo,
      };

      setCallRecords((prev) => [newCall, ...prev]);

      // 2. Add in-chat message record
      const callMsg: Message = {
        id: `msg_call_${Date.now()}`,
        conversationId: callContact.id,
        senderId: 'user_me',
        timestamp: Date.now(),
        status: 'read',
        type: isCallVideo ? 'video_call' : 'voice_call',
        callDetails: {
          durationSeconds,
          callStatus: 'completed',
          isVideo: isCallVideo,
        },
      };

      setMessages((prev) => ({
        ...prev,
        [callContact.id]: [...(prev[callContact.id] || []), callMsg],
      }));
    }
  };

  /**
   * Create status story
   */
  const handleAddStory = (
    newStoryData: Omit<StatusStory, 'id' | 'timestamp' | 'viewsCount'>
  ) => {
    const newStory: StatusStory = {
      ...newStoryData,
      id: `story_${Date.now()}`,
      timestamp: Date.now(),
      viewsCount: 1,
    };
    setStatusStories((prev) => [newStory, ...prev]);
  };

  /**
   * Voice lounge join / leave
   */
  const handleJoinVoiceRoom = (roomId: string) => {
    setActiveVoiceRoomId(roomId);
  };

  const handleLeaveVoiceRoom = () => {
    setActiveVoiceRoomId(null);
  };

  /**
   * Reset all app data
   */
  const handleResetAllData = () => {
    localStorage.clear();
    setCurrentUser(CURRENT_USER);
    setConversations(INITIAL_CONVERSATIONS);
    setMessages(INITIAL_MESSAGES);
    setStatusStories(INITIAL_STATUS_STORIES);
    setCallRecords(INITIAL_CALL_RECORDS);
    setVoiceRooms(INITIAL_VOICE_ROOMS);
    setActiveConversationId(INITIAL_CONVERSATIONS[0].id);
  };

  return (
    <div className="flex h-screen w-screen bg-[#0c1317] text-[#e9edef] overflow-hidden font-sans select-none antialiased">
      {/* 1. Left Navigation Rail (64px) */}
      <NavigationRail
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'settings') {
            setIsProfileModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        unreadCount={totalUnreadCount}
        hasUnreadStories={statusStories.length > 0}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* 2. Middle Panel: Depends on activeTab */}
      {activeTab === 'chats' && (
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => {
            setActiveConversationId(id);
            // Mark unread as 0
            setConversations((prev) =>
              prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
            );
          }}
          onNewChat={() => setIsNewChatModalOpen(true)}
        />
      )}

      {activeTab === 'status' && (
        <StatusTabList
          stories={statusStories}
          currentUser={currentUser}
          onOpenStory={(idx) => {
            setStatusViewerInitialIndex(idx);
            setIsStatusViewerOpen(true);
          }}
          onOpenSnapStatus={() => setIsCameraModalOpen(true)}
          onOpenTextStatus={() => {
            setStatusViewerInitialIndex(0);
            setIsStatusViewerOpen(true);
          }}
        />
      )}

      {activeTab === 'calls' && (
        <CallHistoryList
          calls={callRecords}
          onStartCall={(convId, isVideo) => {
            setActiveConversationId(convId);
            handleStartCall(isVideo, convId);
          }}
        />
      )}

      {/* 3. Main Stage: Chat View or Voice Lounge View */}
      {activeTab === 'voice' ? (
        <VoiceLounge
          rooms={voiceRooms}
          currentUser={currentUser}
          onJoinRoom={handleJoinVoiceRoom}
          onLeaveRoom={handleLeaveVoiceRoom}
          activeRoomId={activeVoiceRoomId}
        />
      ) : activeConversation ? (
        <ChatStage
          conversation={activeConversation}
          messages={activeMessages}
          currentUser={currentUser}
          onSendMessage={handleSendMessage}
          onStartCall={(isVideo) => handleStartCall(isVideo)}
          onOpenLiveCamera={() => setIsCameraModalOpen(true)}
          onOpenVideoNote={() => setIsVideoNoteModalOpen(true)}
          onOpenVoiceNote={() => setIsVoiceNoteModalOpen(true)}
          onToggleMediaDrawer={() => setIsMediaDrawerOpen(!isMediaDrawerOpen)}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0b141a] text-[#8696a0]">
          <p className="text-sm">Select a conversation to start messaging</p>
        </div>
      )}

      {/* 4. Right Contact & Media Drawer */}
      {activeConversation && isMediaDrawerOpen && activeTab !== 'voice' && (
        <MediaGalleryDrawer
          conversation={activeConversation}
          messages={activeMessages}
          isOpen={isMediaDrawerOpen}
          onClose={() => setIsMediaDrawerOpen(false)}
          onStartCall={(isVideo) => handleStartCall(isVideo)}
        />
      )}

      {/* 5. Live Camera Snapshot Modal */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCaptureCameraSnapshot}
        title="Take Photo"
      />

      {/* 6. WhatsApp Circular Video Note Recorder */}
      <VideoNoteRecorder
        isOpen={isVideoNoteModalOpen}
        onClose={() => setIsVideoNoteModalOpen(false)}
        onSendVideoNote={handleSendVideoNote}
      />

      {/* 7. Real-Time Audio Voice Note Recorder */}
      <VoiceNoteRecorder
        isOpen={isVoiceNoteModalOpen}
        onCancel={() => setIsVoiceNoteModalOpen(false)}
        onSendVoiceNote={handleSendVoiceNote}
      />

      {/* 8. Live Call Theater (Video, Voice, Screen Share) */}
      {callContact && (
        <CallTheater
          isOpen={isCallTheaterOpen}
          isVideo={isCallVideo}
          contact={callContact}
          currentUser={currentUser}
          onEndCall={handleEndCall}
        />
      )}

      {/* 9. WhatsApp Status / Story Viewer */}
      <StatusViewer
        isOpen={isStatusViewerOpen}
        onClose={() => setIsStatusViewerOpen(false)}
        stories={statusStories}
        initialIndex={statusViewerInitialIndex}
        onReplyToStory={(story, text) => {
          handleSendMessage(`Replying to status: "${text}"`);
        }}
        onAddStory={handleAddStory}
      />

      {/* 10. New Chat / Group Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onStartNewConversation={(newConv) => {
          const fullConv: Conversation = {
            id: newConv.id || `conv_${Date.now()}`,
            isGroup: !!newConv.isGroup,
            name: newConv.name || 'New Chat',
            avatar: newConv.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
            participants: newConv.participants || ['user_me'],
            unreadCount: 0,
            about: newConv.about || 'New chat thread',
          };
          setConversations((prev) => [fullConv, ...prev]);
          setActiveConversationId(fullConv.id);
          setActiveTab('chats');
        }}
      />

      {/* 11. Profile & Desktop Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => {
          setCurrentUser((prev) => ({ ...prev, ...updated }));
        }}
        onResetAllData={handleResetAllData}
      />
    </div>
  );
}
