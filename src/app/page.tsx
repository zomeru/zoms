import { Footer, MainInfo } from '@/components';
import { About, Experience, Projects, TechStack } from '@/components/Sections';

export default async function Home(): Promise<React.JSX.Element> {
  return (
    <main className='max-w-[1100px] mx-auto h-auto lg:h-full'>
      <MainInfo />
      <div className='w-1/2 ml-auto pb-[90px]'>
        <About />
        <TechStack />
        <Experience />
        <Projects />
        <Footer />
      </div>
    </main>
  );
}
