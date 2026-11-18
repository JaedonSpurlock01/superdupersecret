import About from "@/components/about";
import Books from "@/components/books";
import Climbing from "@/components/climbing";
import Guestbook from "@/components/guestbook";
import Info from "@/components/info";
import Music from "@/components/music";
import Projects from "@/components/projects";
import { RevealStack } from "@/components/reveal-stack";
import { SectionRail } from "@/components/section-rail";
import Writings from "@/components/writings";
import { getGuestbookEntries } from "@/lib/guestbook/entries";
import { getFavoriteTracks } from "@/lib/music";

export default async function Home() {
  const [tracks, guestbook] = await Promise.all([
    getFavoriteTracks(),
    getGuestbookEntries(),
  ]);

  const sections = [
    { id: "about", label: "About", content: <About /> },
    { id: "projects", label: "Projects", content: <Projects /> },
    { id: "writings", label: "Writings", content: <Writings /> },
    { id: "books", label: "Books", content: <Books /> },
    ...(tracks.length > 0
      ? [{ id: "music", label: "Music", content: <Music tracks={tracks} /> }]
      : []),
    { id: "climbing", label: "Climbing", content: <Climbing /> },
    // Needs the database; without it the section simply isn't there.
    ...(guestbook
      ? [
          {
            id: "guestbook",
            label: "Guestbook",
            content: <Guestbook entries={guestbook} />,
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="min-h-screen px-4 lg:px-0 grid grid-cols-1 md:grid-cols-5 gap-20 pt-20 pb-20 max-w-4xl mx-auto">
        <div className="hero-card h-fit md:sticky md:top-6 md:col-span-2">
          <Info />
        </div>

        <RevealStack className="flex flex-col gap-16 md:col-span-3">
          {sections.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-6">
              {section.content}
            </div>
          ))}
        </RevealStack>
      </div>

      <SectionRail
        sections={sections.map(({ id, label }) => ({ id, label }))}
      />
    </>
  );
}
