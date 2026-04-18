import About from "@/components/about";
import Books from "@/components/books";
import Education from "@/components/education";
import Experience from "@/components/experience";
import Info from "@/components/info";
import Projects from "@/components/projects";
import Skills from "@/components/skills";
import { StaggerContainer } from "@/components/stagger-container";
import Writings from "@/components/writings";

export default function Home() {
  return (
    <div className="min-h-screen px-4 lg:px-0 grid grid-cols-1 md:grid-cols-5 gap-20 pt-20 pb-20 max-w-4xl mx-auto">
      <StaggerContainer
        className="h-fit md:sticky md:top-6 md:col-span-2"
        delayStep={100}
      >
        <Info />
      </StaggerContainer>

      <StaggerContainer
        className="flex flex-col gap-16 md:col-span-3"
        delayStep={100}
      >
        <About />
        <Education />
        <Experience />
        <Projects />
        <Skills />
        <Writings />
        <Books />
      </StaggerContainer>
    </div>
  );
}
