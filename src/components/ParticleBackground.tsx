'use client';

import { useEffect, useMemo, useState } from 'react';
import { MoveDirection, OutMode, type ISourceOptions } from '@tsparticles/engine';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

const ParticleBackground = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    void initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: { value: 'transparent' }
      },
      fpsLimit: 120,
      particles: {
        color: { value: ['#8b5cf6', '#3b82f6', '#6366f1'] },
        links: {
          color: '#6366f1',
          distance: 140,
          enable: true,
          opacity: 0.2,
          width: 1
        },
        move: {
          direction: MoveDirection.none,
          enable: true,
          outModes: { default: OutMode.bounce },
          random: true,
          speed: 0.5,
          straight: false
        },
        number: {
          density: { enable: true },
          value: 80
        },
        opacity: { value: 0.5 },
        shape: { type: 'circle' },
        size: { value: { min: 1, max: 3 } }
      },
      detectRetina: true
    }),
    []
  );

  if (init) {
    return <Particles id='tsparticles' className='pointer-events-none' options={options} />;
  }

  return null;
};

export default ParticleBackground;
