import { DogeModal, Footer, MainInfo } from '@/components';
import { About, Experience, Projects, TechStack } from '@/components/Sections';

export default async function Home(): Promise<React.JSX.Element> {
  return (
    <main className='max-w-[1200px] mx-auto h-auto lg:h-full relative px-6 sm:px-12 md:px-16 lg:px-20 py-[50px] md:py-[90px]'>
      <MainInfo />
      <div className='w-full lg:w-1/2 ml-0 lg:ml-auto  relative'>
        <About />
        <TechStack />
        <Experience />
        <Projects />
        <Footer />
        <DogeModal />
      </div>
    </main>
  );
}
