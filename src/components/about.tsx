import { info } from "@/lib/data/personal";
import Section from "./section";
import { AnimatedTextLink } from "./ui/animated-text-link";

export default function About() {
  return (
    <Section title="ABOUT">
      <div className="pt-8 space-y-4">
        <p className="leading-relaxed text-xs text-neutral-700 dark:text-neutral-300">
          {info.description}
        </p>

        <div className="pt-2 text-xs">
          <AnimatedTextLink href="/about">More about me</AnimatedTextLink>
        </div>
      </div>
    </Section>
  );
}
