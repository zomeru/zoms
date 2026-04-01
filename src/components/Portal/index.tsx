import React from 'react';
import Image from 'next/image';
import { AiOutlineClose } from 'react-icons/ai';

import './index.css';

interface PortalProps {
  closeModal: () => void;
}

const Portal: React.FC<PortalProps> = ({ closeModal }): React.JSX.Element => {
  return (
    <div className='size-screen fixed bg-background/70 backdrop-blur-sm' onClick={closeModal}>
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
        className='size-full flex items-center justify-center z-50 text-red-600 absolute'
      >
        <button
          aria-label='Close button'
          onClick={closeModal}
          className='absolute top-5 right-8 cursor-pointer text-text-secondary'
        >
          <AiOutlineClose className='size-7.5' />
        </button>
        <div
          style={{
            transform: 'rotateX(25deg) translateZ(100px)',
            transformOrigin: '50% 100%'
          }}
          className='max-w-75 flex flex-col items-center mt-12 sm:mt-4'
          onClick={(e): void => {
            e.stopPropagation();
          }}
        >
          <p className='mb-1 w-37.5 text-center text-sm text-text-secondary sm:mb-3 sm:w-50 sm:text-base md:w-full md:text-xl'>
            Looking for my different portfolio? Go back in time...
          </p>
          <a
            href='https://zomer.vercel.app/'
            target='_blank'
            rel='noopener noreferrer'
            className='relative hover:scale-105 transition-transform h-25 w-30 sm:w-37.5 md:w-50 rounded-md overflow-hidden my-auto'
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
