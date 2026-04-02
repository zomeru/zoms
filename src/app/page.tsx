import { Footer } from '@/components';
import { About, Blog, Experience, Projects } from '@/components/sections';

export default function Home(): React.JSX.Element {
  return (
    <main className="relative z-10 min-h-screen">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <About />
        <Experience />
        <Projects />
        <Blog />
        <Footer />
      </div>
    </main>
  );
}
