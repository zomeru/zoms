import { MainInfo } from '@/components';
import { About, TechStack } from '@/components/Sections';

export default async function Home(): Promise<React.JSX.Element> {
  return (
    <main className='max-w-[1100px] mx-auto h-auto lg:h-full relative'>
      <MainInfo />
      <div className='w-1/2 ml-auto'>
        <About />
        <TechStack />
        {Array(20)
          .fill(null)
          .map((_, index) => (
            <div key={index}>{index}</div>
          ))}
      </div>
    </main>
  );
}
