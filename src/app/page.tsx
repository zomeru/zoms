import { MainInfo } from '@/components';

export default async function Home(): Promise<React.JSX.Element> {
  return (
    <main className='max-w-[1300px] mx-auto h-auto lg:h-full flex '>
      <MainInfo />
      <div className='w-full bg-gray-700'>TEST</div>
    </main>
  );
}
