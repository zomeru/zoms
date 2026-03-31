import { About, Blog, Experience, Projects } from '@/components/sections';
import { Footer } from '@/components';

export default function Home(): React.JSX.Element {
  return (
    <>
      <main className='relative z-10 min-h-screen'>
        <div className='max-w-7xl mx-auto px-6 md:px-12'>
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
