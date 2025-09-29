// src/types/forum.ts
export interface Space {
  id: string;
  name: string;
  title: string;
  type: SpaceType;
  category: string;
  specialty: string;
  description: string;
  isPublic: boolean;
  isJoined: boolean;
  members: number;
  activity: string;
  lastActive: string;
  isPremium: boolean;
  exampleThreads?: Array<{
    id: string;
    title: string;
  }>;
}

export type SpaceType = 'forum' | 'community_space' | 'community';
export type JoinMechanism = 'instant' | 'approval' | 'open' | 'moderator_approval' | 'admin_approval';

export interface MessageWithAuthor {
  id: number;
  thread_id: string;
  body: string;
  created_at: string;
  email: string;
}