import Image from "next/image";
import { InfoActionButton } from "@/components/info";
import { StaggerContainer } from "@/components/stagger-container";
import { AnimatedTextLink } from "@/components/ui/animated-text-link";
import { info, socials } from "@/lib/data/personal";

const photoLinks = [
  "/photos/3.jpg",
  "/photos/4.jpg",
  "/photos/5.jpg",
  "/photos/6.jpg",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen px-4 lg:px-0 grid grid-cols-1 md:grid-cols-5 gap-4 pt-20 pb-20 max-w-3xl mx-auto">
      <StaggerContainer
        className="h-fit md:sticky md:top-6 md:col-span-2"
        delayStep={100}
      >
        <AnimatedTextLink href="/" arrowSide="left">
          About Me
        </AnimatedTextLink>

        <div className="flex flex-col gap-4 my-4 [&>p]:text-sm [&>p]:text-neutral-700 [&>p]:dark:text-neutral-300">
          <p>
            Hello, I'm Jaedon! I'm a software engineer with a passion for
            building products that solve problems at scale.
          </p>
          <p>
            Currently, I work at Lockheed Martin in Orlando, Florida building
            software to help automate business processes.
          </p>
          <p>
            In my free time, I enjoy rock climbing, skiing, hiking, muay thai,
            and reading philosophy or historical classics.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <InfoActionButton
            tooltip="GitHub"
            ariaLabel="Open GitHub profile"
            href={socials.github}
            external
            icon={
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 512 512"
                height="18"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>GitHub</title>
                <path d="M256 32C132.3 32 32 134.9 32 261.7c0 101.5 64.2 187.5 153.2 217.9 1.4.3 2.6.4 3.8.4 8.3 0 11.5-6.1 11.5-11.4 0-5.5-.2-19.9-.3-39.1-8.4 1.9-15.9 2.7-22.6 2.7-43.1 0-52.9-33.5-52.9-33.5-10.2-26.5-24.9-33.6-24.9-33.6-19.5-13.7-.1-14.1 1.4-14.1h.1c22.5 2 34.3 23.8 34.3 23.8 11.2 19.6 26.2 25.1 39.6 25.1 10.5 0 20-3.4 25.6-6 2-14.8 7.8-24.9 14.2-30.7-49.7-5.8-102-25.5-102-113.5 0-25.1 8.7-45.6 23-61.6-2.3-5.8-10-29.2 2.2-60.8 0 0 1.6-.5 5-.5 8.1 0 26.4 3.1 56.6 24.1 17.9-5.1 37-7.6 56.1-7.7 19 .1 38.2 2.6 56.1 7.7 30.2-21 48.5-24.1 56.6-24.1 3.4 0 5 .5 5 .5 12.2 31.6 4.5 55 2.2 60.8 14.3 16.1 23 36.6 23 61.6 0 88.2-52.4 107.6-102.3 113.3 8 7.1 15.2 21.1 15.2 42.5 0 30.7-.3 55.5-.3 63 0 5.4 3.1 11.5 11.4 11.5 1.2 0 2.6-.1 4-.4C415.9 449.2 480 363.1 480 261.7 480 134.9 379.7 32 256 32z"></path>
              </svg>
            }
          />
          <InfoActionButton
            tooltip="LinkedIn"
            ariaLabel="Open LinkedIn profile"
            href={socials.linkedin}
            external
            icon={
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-4 fill-current"
              >
                <title>LinkedIn</title>
                <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5.001 2.5 2.5 0 0 0 0-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.1c.53-1 1.83-2.06 3.77-2.06C21.2 8.64 22 10.96 22 14v7h-4v-6.2c0-1.48-.03-3.38-2.06-3.38-2.06 0-2.38 1.61-2.38 3.28V21H10V9z" />
              </svg>
            }
          />

          <InfoActionButton
            tooltip="Resume"
            ariaLabel="Open resume"
            href={info.resume}
            external
            icon={
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-4 fill-current"
              >
                <title>Resume</title>
                <path d="M14 2H7a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8l-6-6zM9 16h6a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2zm6-3H9a1 1 0 1 1 0-2h6a1 1 0 1 1 0 2zm-1-4V4.5L18.5 9H14z" />
              </svg>
            }
          />

          <InfoActionButton
            tooltip="Email"
            ariaLabel="Send email"
            href={`mailto:${socials.email}`}
            icon={
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-4 fill-current"
              >
                <title>Email</title>
                <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v.35l-9 5.4-9-5.4V6zm0 2.67V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.67l-8.48 5.09a1 1 0 0 1-1.04 0L3 8.67z" />
              </svg>
            }
          />
        </div>
      </StaggerContainer>

      <StaggerContainer
        className="flex flex-col gap-4 md:col-span-3 md:pl-20"
        delayStep={100}
      >
        {photoLinks.map((link) => (
          <div
            key={link}
            className="relative aspect-video w-full overflow-hidden bg-muted rounded-md h-[300px]"
          >
            <Image
              src={link}
              alt={link}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
        ))}
      </StaggerContainer>
    </div>
  );
}
