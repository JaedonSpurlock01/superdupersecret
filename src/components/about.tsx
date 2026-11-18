import Image from "next/image";
import aboutJson from "@/lib/data/about.json";
import { InlineCompany } from "./inline-company";
import Section from "./section";

/**
 * Words in the About copy that reveal a photo on hover, focus or tap.
 * Keep these in sync with the text in about.json.
 */
const WORD_PHOTOS: Record<string, string> = {
  "rock climbing": "/photos/climbing.jpg",
  skiing: "/photos/skiing.jpg",
  hiking: "/photos/hiking.jpg",
  traveling: "/photos/travel.jpg",
};

const wordPattern = new RegExp(`(${Object.keys(WORD_PHOTOS).join("|")})`, "g");

function withHoverPhotos(text: string) {
  return text.split(wordPattern).map((part, i) =>
    WORD_PHOTOS[part] ? (
      <span
        // biome-ignore lint/suspicious/noArrayIndexKey: static split of static text
        key={i}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: focus reveals the photo for touch and keyboard
        tabIndex={0}
        className="group relative cursor-default text-foreground underline decoration-neutral-400 decoration-dotted underline-offset-4 outline-none transition-colors duration-200 hover:decoration-foreground focus-visible:decoration-foreground"
      >
        {part}
        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 block size-36 origin-bottom -translate-x-1/2 translate-y-1 -rotate-3 scale-90 overflow-hidden rounded-md border-2 border-neutral-100 bg-muted opacity-0 shadow-md transition-[opacity,scale,translate] duration-200 ease-(--ease-out) group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus:translate-y-0 group-focus:scale-100 group-focus:opacity-100 motion-reduce:transition-[opacity] dark:border-neutral-900">
          <Image
            src={WORD_PHOTOS[part]}
            alt={part}
            fill
            sizes="144px"
            className="object-cover"
          />
        </span>
      </span>
    ) : (
      part
    ),
  );
}

export default function About() {
  // The first paragraph runs straight into the "Right now" copy below.
  const [intro = "", ...rest] = aboutJson.paragraphs;

  return (
    <Section title="ABOUT">
      <div className="pt-8 space-y-4 text-base leading-6 text-neutral-700 dark:text-neutral-300">
        <p>
          {withHoverPhotos(intro)} I'm a software engineer at{" "}
          <InlineCompany name="Lockheed Martin" />. On the side I run{" "}
          <InlineCompany name="Spurlock Labs" />, a small studio for SaaS
          products. Before that I interned on the mobile team at{" "}
          <InlineCompany name="Welfie" />.
        </p>
        {rest.map((paragraph) => (
          <p key={paragraph}>{withHoverPhotos(paragraph)}</p>
        ))}
      </div>
    </Section>
  );
}
