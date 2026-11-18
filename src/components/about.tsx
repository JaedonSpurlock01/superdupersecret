import aboutJson from "@/lib/data/about.json";
import { type AboutPhoto, AboutPhotoWord } from "./about-photo";
import { InlineCompany } from "./inline-company";
import Section from "./section";

/**
 * Words in the About copy that reveal a photo on hover or focus, and open it
 * on click. Keep these in sync with the text in about.json.
 *
 * TODO: fill in the bracketed places and dates.
 */
const WORD_PHOTOS: Record<string, AboutPhoto> = {
  "rock climbing": {
    src: "/photos/climbing.jpg",
    alt: "Lead climbing a sunlit rock spire against a deep blue sky",
    caption: "Leading a sun-baked spire.",
    place: "[where?]",
    date: "[when?]",
  },
  skiing: {
    src: "/photos/skiing.jpg",
    alt: "Standing on skis beside the Mammoth Mountain summit sign",
    caption: "Top of the mountain, Sierra peaks behind.",
    place: "Mammoth Mountain, CA",
    date: "[when?]",
  },
  hiking: {
    src: "/photos/hiking.jpg",
    alt: "Two hikers holding the Mt. Whitney 14,505 ft summit sign",
    caption: "Summit of Mt. Whitney, 14,505 ft.",
    place: "Mt. Whitney, CA",
    date: "[when?]",
  },
  traveling: {
    src: "/photos/travel.jpg",
    alt: "On a boat at night with a lit-up city skyline behind",
    caption: "City lights from the water at night.",
    place: "[where?]",
    date: "[when?]",
  },
};

const wordPattern = new RegExp(`(${Object.keys(WORD_PHOTOS).join("|")})`, "g");

function withHoverPhotos(text: string) {
  return text.split(wordPattern).map((part, i) =>
    WORD_PHOTOS[part] ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: static split of static text
      <AboutPhotoWord key={i} word={part} photo={WORD_PHOTOS[part]} />
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
