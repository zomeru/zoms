'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

import { getClientErrorMessage } from '@/lib/errorMessages';

import GenerateBlogModal from './GenerateBlogModal';

const BlogGenerateButton: React.FC = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleGenerateBlog = async (token: string): Promise<void> => {
    const toastId = toast.loading('Generating blog post with AI...');

    try {
      const response = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          aiGenerated: false
        })
      });

      if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- API response is validated by backend
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'Failed to generate blog post');
      }

      toast.success('Blog post generated successfully!', { id: toastId });

      // Refresh the page to show the new blog post
      router.refresh();
    } catch (err) {
      const errorMessage = getClientErrorMessage(err);
      toast.error(errorMessage, { id: toastId });
      throw err;
    }
  };

  return (
    <>
      <Toaster
        position='top-center'
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#f2f2f2',
            border: '1px solid rgba(145, 145, 145, 0.2)'
          },
          success: {
            iconTheme: {
              primary: '#ad5aff',
              secondary: '#f2f2f2'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f2f2f2'
            }
          }
        }}
      />

      {isModalOpen && (
        <GenerateBlogModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
          }}
          onGenerate={handleGenerateBlog}
        />
      )}

      {/* Generate Blog Button */}
      <div className='mb-8 flex justify-center'>
        <button
          onClick={() => {
            setIsModalOpen(true);
          }}
          className='px-4 py-2 bg-secondary text-backgroundPrimary rounded-lg hover:bg-opacity-80 transition-all text-sm font-medium flex items-center gap-2 hover:cursor-pointer'
        >
          <span>🤖</span>
          <span>Generate Blog with AI</span>
        </button>
      </div>
    </>
  );
};

export default BlogGenerateButton;
