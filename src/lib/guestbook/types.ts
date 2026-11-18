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

/** Limits the composer and the API both hold a note to: it has to fit a card. */
export const GUESTBOOK_NAME_MAX = 40;
export const GUESTBOOK_MESSAGE_MAX = 200;
