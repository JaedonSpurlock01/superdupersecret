import Info from "@/components/info";
import About from "@/components/about";
import Experience from "@/components/experience";
import Projects from "@/components/projects";
import Photos from "@/components/photos";
import { StaggerContainer } from "@/components/stagger-container";

export default function Home() {
  return (
    <StaggerContainer className="min-h-screen grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 pb-20 max-w-4xl mx-auto">

      <Info />

      <div className="flex flex-col gap-8 md:col-span-2">
        <About />
        <Experience />
        <Projects />
        <Photos />
      </div>
    </StaggerContainer>
  );
}
