import { About, Blog, Experience, Projects } from "@/components/sections";

export default function Home(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-7xl px-6 md:px-12">
      <About />
      <Experience />
      <Projects />
      <Blog />
    </div>
  );
}
