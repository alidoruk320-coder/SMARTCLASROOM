export const DEFAULT_ROOM_CODE = "STUDY";

export type RoomRecord = {
  roomCode: string;
  maxPlayers: number;
};

export function getRoom(roomCode: string): RoomRecord | null {
  if (roomCode.toUpperCase() !== DEFAULT_ROOM_CODE) return null;
  return { roomCode: DEFAULT_ROOM_CODE, maxPlayers: 10 };
}
