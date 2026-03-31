'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  InteractivityDetect,
  MoveDirection,
  OutMode,
  type ISourceOptions
} from '@tsparticles/engine';
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
      fullScreen: {
        enable: false
      },
      interactivity: {
        detectsOn: InteractivityDetect.window,
        events: {
          onHover: {
            enable: true,
            mode: 'repulse'
          },
          resize: {
            enable: true
          }
        },
        modes: {
          repulse: {
            distance: 140,
            duration: 0.5,
            factor: 120,
            maxSpeed: 18,
            speed: 1
          }
        }
      },
      fpsLimit: 60,
      particles: {
        color: { value: ['#8b5cf6', '#3b82f6', '#6366f1'] },
        links: {
          color: '#6366f1',
          distance: 140,
          enable: true,
          opacity: 0.15,
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
          value: 90
        },
        opacity: { value: 0.4 },
        shape: { type: 'circle' },
        size: { value: { min: 1, max: 3 } }
      },
      detectRetina: true
    }),
    []
  );

  if (init) {
    return (
      <Particles
        id='tsparticles'
        className='pointer-events-none absolute inset-0 block h-full w-full'
        options={options}
      />
    );
  }

  return null;
};

export default ParticleBackground;
