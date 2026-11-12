export type UserStatus = 'online' | 'busy' | 'offline';

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  status: UserStatus;
  customStatus?: string;
  phone?: string;
  about?: string;
}

export type MessageType =
  | 'text'
  | 'image'
  | 'video_note'
  | 'voice_note'
  | 'video_call'
  | 'voice_call'
  | 'file';

export type MessageDeliveryStatus = 'sent' | 'delivered' | 'read';

export interface CallDetails {
  durationSeconds?: number;
  callStatus: 'completed' | 'missed' | 'declined';
  isVideo: boolean;
}

export interface MessageReply {
  id: string;
  text: string;
  senderName: string;
  type?: MessageType;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  timestamp: number;
  status: MessageDeliveryStatus;
  type: MessageType;
  mediaUrl?: string;
  mediaCaption?: string;
  mediaDuration?: number; // seconds
  mediaWaveform?: number[]; // list of numbers for audio waveform
  replyTo?: MessageReply;
  reactions?: Record<string, string[]>; // emoji -> array of user names
  callDetails?: CallDetails;
  isStarred?: boolean;
  fileName?: string;
  fileSize?: string;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name: string;
  avatar: string;
  participants: string[];
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  lastMessage?: Message;
  about?: string;
}

export interface StatusStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  timestamp: number;
  mediaType: 'image' | 'text' | 'video';
  mediaUrl?: string;
  textContent?: string;
  backgroundColor?: string;
  caption?: string;
  viewsCount: number;
}

export interface CallRecord {
  id: string;
  conversationId: string;
  contactName: string;
  contactAvatar: string;
  timestamp: number;
  durationSeconds: number;
  type: 'incoming' | 'outgoing' | 'missed';
  isVideo: boolean;
}

export interface VoiceRoomMember {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
}

export interface VoiceRoom {
  id: string;
  name: string;
  category: string;
  members: VoiceRoomMember[];
}
