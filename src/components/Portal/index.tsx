import Image from 'next/image';
import React from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import './index.css';

interface PortalProps {
  closeModal: () => void;
}

const Portal: React.FC<PortalProps> = ({ closeModal }): React.JSX.Element => {
  return (
    <div className='h-screen w-screen fixed bg-backgroundPrimary/50 backdrop-blur-sm'>
      <div className='portal-spinner m-0'>
        <div className='portal'></div>
        <div className='portal'></div>
        <div className='portal'></div>
        <div className='portal'></div>
        <div className='portal'></div>
      </div>
      <div
        style={{
          perspective: '400px'
        }}
        className='w-full h-full flex items-center justify-center z-50 text-red-600 absolute'
      >
        <button
          aria-label='Close button'
          onClick={closeModal}
          className='absolute top-5 right-8 text-textSecondary'
        >
          <AiOutlineClose className='w-[30px] h-[30px]' />
        </button>
        <div
          style={{
            transform: 'rotateX(25deg) translateZ(100px)',
            transformOrigin: '50% 100%'
          }}
          className='max-w-[300px] flex flex-col items-center mt-12 sm:mt-4'
        >
          <p className='text-center text-sm sm:text-base md:text-xl text-backgroundSecondary mb-1 sm:mb-3 w-[150px] sm:w-[200px] md:w-full'>
            Looking for my different portfolio? Go back in time...
          </p>
          <a
            href='https://legacy.zomeru.com'
            target='_blank'
            rel='noopener noreferrer'
            className='relative hover:scale-105 transition-transform h-[100px] w-[120px] sm:w-[150px] md:w-[200px] rounded-md overflow-hidden my-auto'
            aria-label='Old Portfolio Link'
          >
            <Image
              src='/assets/images/old_site.jpg'
              alt='Old Portfolio Screenshot'
              className='w-full h-auto object-contain'
              fill
              sizes='(max-width: 768px) 100vw'
              loading='lazy'
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Portal;
