'use client';

import React, { useState } from 'react';
import Modal from 'react-modal';

interface GenerateBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (token: string) => Promise<void>;
}

const GenerateBlogModal: React.FC<GenerateBlogModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [token, setToken] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError('Please enter the blog generation secret token');
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerate(token);
      setToken('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate blog post');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = (): void => {
    if (!isGenerating) {
      setToken('');
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className='max-w-md mx-auto mt-20 bg-backgroundSecondary rounded-lg p-6 outline-none animate-modalSlideIn'
      overlayClassName='fixed inset-0 bg-black bg-opacity-90 backdrop-blur-md flex items-start justify-center px-4 z-50 animate-fadeIn'
      ariaHideApp={false}
      closeTimeoutMS={200}
      style={{
        overlay: {
          background: 'none'
        }
      }}
    >
      <div className='mb-4'>
        <h2 className='text-2xl font-bold text-textPrimary mb-2'>Generate Blog with AI</h2>
        <p className='text-textSecondary text-sm'>
          Enter your secret token to generate a new blog post using AI.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label htmlFor='token' className='block text-textPrimary mb-2 text-sm font-medium'>
            Secret Token
          </label>
          <input
            type='password'
            id='token'
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
            }}
            disabled={isGenerating}
            className='w-full px-4 py-2 bg-backgroundPrimary text-textPrimary border border-textSecondary border-opacity-20 rounded-lg focus:outline-none focus:border-primary focus:border-opacity-50 transition-colors disabled:opacity-50'
            placeholder='Enter your token'
            autoComplete='off'
          />
        </div>

        {error && (
          <div className='mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg'>
            <p className='text-white text-sm'>{error}</p>
          </div>
        )}

        <div className='flex gap-3 justify-end'>
          <button
            type='button'
            onClick={handleClose}
            disabled={isGenerating}
            className='px-4 py-2 text-textSecondary hover:text-textPrimary transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={isGenerating}
            className='px-6 py-2 bg-primary text-textPrimary rounded-lg hover:bg-opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:cursor-pointer'
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GenerateBlogModal;
