import Image from "next/image";
import type React from "react";
import { AiOutlineClose } from "react-icons/ai";

import "./index.css";

interface PortalProps {
  closeModal: () => void;
}

const Portal: React.FC<PortalProps> = ({ closeModal }): React.JSX.Element => {
  return (
    <div className="fixed inset-0 size-screen">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 size-full bg-background/70 backdrop-blur-sm"
        onClick={closeModal}
      />
      <div className="portal-spinner m-0">
        <div className="portal"></div>
        <div className="portal"></div>
        <div className="portal"></div>
        <div className="portal"></div>
        <div className="portal"></div>
      </div>
      <div
        style={{
          perspective: "400px"
        }}
        className="absolute z-50 flex size-full items-center justify-center text-red-600"
      >
        <button
          type="button"
          aria-label="Close button"
          onClick={closeModal}
          className="absolute top-5 right-8 cursor-pointer text-text-secondary"
        >
          <AiOutlineClose className="size-7.5" />
        </button>
        <div
          style={{
            transform: "rotateX(25deg) translateZ(100px)",
            transformOrigin: "50% 100%"
          }}
          className="mt-12 flex max-w-75 flex-col items-center sm:mt-4"
        >
          <p className="mb-1 w-37.5 text-center text-sm text-text-secondary sm:mb-3 sm:w-50 sm:text-base md:w-full md:text-xl">
            Looking for my different portfolio? Go back in time...
          </p>
          <a
            href="https://zomer.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="relative my-auto h-25 w-30 overflow-hidden rounded-md transition-transform hover:scale-105 sm:w-37.5 md:w-50"
            aria-label="Old Portfolio Link"
          >
            <Image
              src="/assets/images/old_site.jpg"
              alt="Old Portfolio Screenshot"
              className="h-auto w-full object-contain"
              fill
              sizes="(max-width: 768px) 100vw"
              loading="lazy"
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Portal;
