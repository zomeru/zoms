'use client';

import React, { useState } from 'react';
import Modal from 'react-modal';

import TerminalCard from '@/components/ui/TerminalCard';
import { CLIENT_ERROR_MESSAGES, getClientErrorMessage } from '@/lib/errorMessages';

interface GenerateBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (token: string) => Promise<void>;
}

const GenerateBlogModal: React.FC<GenerateBlogModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [token, setToken] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.SyntheticEvent): void => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError(CLIENT_ERROR_MESSAGES.TOKEN_REQUIRED);
      return;
    }

    setIsGenerating(true);
    onGenerate(token)
      .then(() => {
        setToken('');
        onClose();
      })
      .catch((err: unknown) => {
        setError(getClientErrorMessage(err));
      })
      .finally(() => {
        setIsGenerating(false);
      });
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
      className='max-w-xl mx-auto mt-16 outline-none animate-modalSlideIn'
      overlayClassName='fixed inset-0 bg-black bg-opacity-90 backdrop-blur-md flex items-start justify-center px-4 z-50 animate-fadeIn'
      ariaHideApp={false}
      closeTimeoutMS={200}
      style={{
        overlay: {
          background: 'none'
        }
      }}
    >
      <TerminalCard
        title='blog-generator.sh'
        className='shadow-[0_24px_80px_rgba(0,0,0,0.45)]'
        bodyClassName='p-5 font-mono text-sm'
      >
        <div className='mb-5 border-b border-code-border pb-4'>
          <div className='flex items-center gap-3 text-sm text-textPrimary'>
            <span className='text-terminal-green'>$</span>
            <span>generate_blog --provider ai --publish draft</span>
          </div>
          <p className='mt-3 text-xs leading-relaxed text-text-muted'>
            Authenticate the generator with your secret token to create a draft blog post.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label
              htmlFor='token'
              className='mb-2 block text-xs uppercase tracking-[0.18em] text-text-muted'
            >
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
              className='w-full rounded-md border border-code-border bg-surface-elevated/45 px-4 py-3 text-textPrimary outline-none transition-colors placeholder:text-text-muted focus:border-terminal-green/60 disabled:opacity-50'
              placeholder='sk_live_****************'
              autoComplete='off'
            />
          </div>

          {error && (
            <div className='mb-4 rounded-md border border-terminal-red/40 bg-terminal-red/10 px-4 py-3'>
              <p className='text-xs leading-relaxed text-terminal-red'>{error}</p>
            </div>
          )}

          <div className='flex items-center justify-between gap-3 border-t border-code-border pt-4'>
            <span className='text-xs text-text-muted'>
              {isGenerating ? 'Running generation job...' : 'Ready to start generation job.'}
            </span>

            <div className='flex gap-3'>
              <button
                type='button'
                onClick={handleClose}
                disabled={isGenerating}
                className='rounded-md border border-code-border px-4 py-2 text-xs uppercase tracking-[0.18em] text-text-muted transition-colors hover:cursor-pointer hover:border-textSecondary hover:text-textPrimary disabled:cursor-not-allowed disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isGenerating}
                className='rounded-md border border-terminal-green/40 bg-terminal-green/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-terminal-green transition-colors hover:cursor-pointer hover:bg-terminal-green/15 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isGenerating ? 'Generating...' : 'Run'}
              </button>
            </div>
          </div>
        </form>
      </TerminalCard>
    </Modal>
  );
};

export default GenerateBlogModal;
