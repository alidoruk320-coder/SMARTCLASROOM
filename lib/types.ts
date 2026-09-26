export type UserProfile = {
  id: string;
  username: string;
  email: string;
  avatar: string;
  totalStudySeconds: number;
  recordStudySeconds: number;
  totalQuestions: number;
  xp: number;
  level: number;
  createdAt: string;
};

export type RoomSummary = {
  roomCode: string;
  ownerId: string;
  ownerName: string;
  maxPlayers: number;
  members: Array<{
    id: string;
    username: string;
    avatar: string;
    seatNumber: number;
    joinedAt: string;
  }>;
  createdAt: string;
  startedAt: string;
};
