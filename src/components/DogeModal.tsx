'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Modal from 'react-modal';

import Portal from './Portal';

const customStyles = {
  content: {
    padding: '0',
    border: 'none',
    margin: '0',
    top: '0',
    left: '0',
    backgroundColor: 'transparent',
    overflow: 'hidden'
  }
};

Modal.setAppElement('#my-root');

const DogeModal = (): React.JSX.Element => {
  const [modalIsOpen, setModalOpen] = useState(false);

  const closeModal = (): void => {
    setModalOpen(false);
  };

  const openModal = (): void => {
    setModalOpen(true);
  };

  useEffect(() => {
    // set overflow hidden to html element when modal is open
    if (modalIsOpen) {
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = 'auto';
    }
  }, [modalIsOpen]);

  return (
    <div className='absolute right-0 bottom-0 transform translate-y-20 pb-10 sm:pb-10'>
      <button
        className='relative w-[80px] h-[80px] hover:-translate-y-3 transition-transform duration-200 cursor-pointer'
        type='button'
        onClick={openModal}
      >
        <Image
          src='/assets/images/doge-dance.gif'
          alt='Modal button - Dancing doge'
          className='h-full w-auto object-contain'
          fill
          sizes='(max-width: 768px) 100vw'
          loading='lazy'
        />
      </button>

      <Modal
        style={customStyles}
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        overlayClassName='bg-backgroundPrimary/50'
      >
        <Portal closeModal={closeModal} />
      </Modal>
    </div>
  );
};

export default DogeModal;
