import { MainInfo } from '@/components'

export default function Home(): React.JSX.Element {
  return (
    <main className='max-w-[1300px] mx-auto h-auto lg:h-full flex '>
      <MainInfo />
      <div className='w-full bg-gray-700'></div>
    </main>
  )
}
