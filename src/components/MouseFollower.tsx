'use client';

import React, { useEffect, useState } from 'react';

const MouseFollower = (): React.JSX.Element => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent): void => {
      setPosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      className='w-[1000px] h-[1000px] rounded-full pointer-events-none fixed transform -translate-x-1/2 -translate-y-1/2'
      style={{
        opacity: 0.1,
        top: position.y,
        left: position.x,
        background: 'radial-gradient(circle at center, #8001fe 0%, rgba(255, 0, 0, 0) 70%)'
      }}
    />
  );
};

export default MouseFollower;
