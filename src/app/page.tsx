import { About, Blog, Experience, Projects, TechStack } from '@/components/Sections';
import { Footer } from '@/components';

export default async function Home(): Promise<React.JSX.Element> {
  return (
    <>
      <main className='relative z-10 min-h-screen'>
        <div className='max-w-6xl mx-auto px-6 py-16 md:py-24'>
          <About />
          <TechStack />
          <Experience />
          <Projects />
          <Blog />
          <Footer />
        </div>
      </main>
    </>
  );
}
