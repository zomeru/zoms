import { About, Blog, Experience, Projects } from '@/components/Sections';
import { Footer } from '@/components';

export default async function Home(): Promise<React.JSX.Element> {
  return (
    <>
      <main className='relative z-10 min-h-screen'>
        <div className='max-w-7xl mx-auto px-6'>
          <About />
          <Experience />
          <Projects />
          <Blog />
          <Footer />
        </div>
      </main>
    </>
  );
}
