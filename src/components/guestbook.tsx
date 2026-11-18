import type { GuestbookEntryJson } from "@/lib/guestbook/types";
import { GuestbookDeck } from "./guestbook-deck";
import Section from "./section";

export default function Guestbook({
  entries,
}: {
  entries: GuestbookEntryJson[];
}) {
  return (
    <Section title="GUESTBOOK">
      <GuestbookDeck initialEntries={entries} />
    </Section>
  );
}
