import { isDatabaseAvailable } from "@/lib/database-availability";
import GuestbookClient from "./guestbook-client";
import { GuestbookUnavailable } from "./guestbook-unavailable";

export default async function GuestbookPage() {
  if (!(await isDatabaseAvailable())) {
    return <GuestbookUnavailable />;
  }
  return <GuestbookClient />;
}
