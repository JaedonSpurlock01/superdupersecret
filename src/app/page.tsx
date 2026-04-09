import Info from "@/components/info";
import About from "@/components/about";
import Experience from "@/components/experience";
import Projects from "@/components/projects";
import Writings from "@/components/writings";
import Photos from "@/components/photos";
import { StaggerContainer } from "@/components/stagger-container";
import Education from "@/components/education";
import Skills from "@/components/skills";

export default function Home() {
  return (
    <div className="min-h-screen px-4 lg:px-0 grid grid-cols-1 md:grid-cols-5 gap-20 pt-20 pb-20 max-w-4xl mx-auto">

      <StaggerContainer className="h-fit md:sticky md:top-6 md:col-span-2" delayStep={100}>
        <Info />
      </StaggerContainer>

      <StaggerContainer className="flex flex-col gap-16 md:col-span-3" delayStep={100}>
        <About />
        <Education />
        <Experience />
        <Projects />
        <Skills />
        <Writings />
      </StaggerContainer>
    </div>
  );
}
