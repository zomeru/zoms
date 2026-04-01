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

import { readThemeVisualTokens, THEME_CHANGE_EVENT } from '@/lib/theme/dom';

const DEFAULT_THEME_VISUALS = {
  nodeLink: 'rgba(148, 163, 184, 0.28)',
  particle1: '#8b5cf6',
  particle2: '#3b82f6',
  particle3: '#6366f1'
};

const ParticleBackground = () => {
  const [init, setInit] = useState(false);
  const [themeVisuals, setThemeVisuals] = useState(DEFAULT_THEME_VISUALS);

  useEffect(() => {
    void initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  useEffect(() => {
    const syncThemeVisuals = () => {
      setThemeVisuals((current) => ({
        ...current,
        ...readThemeVisualTokens()
      }));
    };

    syncThemeVisuals();
    window.addEventListener(THEME_CHANGE_EVENT, syncThemeVisuals);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, syncThemeVisuals);
    };
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
        color: { value: [themeVisuals.particle1, themeVisuals.particle2, themeVisuals.particle3] },
        links: {
          color: themeVisuals.nodeLink,
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
    [themeVisuals]
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
