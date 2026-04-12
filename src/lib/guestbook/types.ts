export type GuestbookEntryJson = {
  id: string;
  dotId: string;
  name: string;
  message: string;
  createdAt: string;
};

export type GuestbookListJson = {
  entries: GuestbookEntryJson[];
  /** Present when `deviceId` query matches a stored entry */
  mine: GuestbookEntryJson | null;
};
