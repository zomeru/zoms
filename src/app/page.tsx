import { About, Experience, Projects, TechStack } from '@/components/Sections';
import { DogeModal, Footer, MainInfo } from '@/components';

export default async function Home(): Promise<React.JSX.Element> {
  return (
    <main className='max-w-[1300px] mx-auto h-auto lg:h-full relative px-6 sm:px-12 md:px-16 lg:px-20 py-[50px] md:py-[90px]'>
      <MainInfo />
      <div className='w-full lg:w-1/2 ml-0 lg:ml-auto relative pb-20 sm:pb-0'>
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
