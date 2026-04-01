'use client';

import { useEffect, useRef, useState } from 'react';
import {
  InteractivityDetect,
  MoveDirection,
  OutMode,
  type Container,
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

function updateParticleSourceOptions(
  sourceOptions: ISourceOptions | undefined,
  themeVisuals: typeof DEFAULT_THEME_VISUALS
): boolean {
  if (!sourceOptions?.particles) {
    return false;
  }

  const { particles } = sourceOptions;

  particles.color = {
    value: [themeVisuals.particle1, themeVisuals.particle2, themeVisuals.particle3]
  };
  particles.links = {
    ...(particles.links ?? {}),
    color: themeVisuals.nodeLink
  };

  return true;
}

const ParticleBackground = () => {
  const [init, setInit] = useState(false);
  const containerRef = useRef<Container | undefined>(undefined);
  const refreshTimerRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);
  const queuedRefreshRef = useRef(false);
  const themeVisualsRef = useRef(DEFAULT_THEME_VISUALS);

  useEffect(() => {
    void initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  useEffect(() => {
    const applyThemeVisuals = async () => {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const nextThemeVisuals = themeVisualsRef.current;

      if (!updateParticleSourceOptions(container.sourceOptions, nextThemeVisuals)) {
        return;
      }

      await container.refresh();
    };

    const flushThemeRefresh = async () => {
      if (isRefreshingRef.current) {
        queuedRefreshRef.current = true;
        return;
      }

      isRefreshingRef.current = true;

      try {
        await applyThemeVisuals();
      } finally {
        isRefreshingRef.current = false;

        if (queuedRefreshRef.current) {
          queuedRefreshRef.current = false;
          scheduleThemeRefresh();
        }
      }
    };

    const scheduleThemeRefresh = () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        void flushThemeRefresh();
      }, 40);
    };

    const syncThemeVisuals = () => {
      themeVisualsRef.current = {
        ...DEFAULT_THEME_VISUALS,
        ...readThemeVisualTokens()
      };

      scheduleThemeRefresh();
    };

    syncThemeVisuals();
    window.addEventListener(THEME_CHANGE_EVENT, syncThemeVisuals);

    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }

      window.removeEventListener(THEME_CHANGE_EVENT, syncThemeVisuals);
    };
  }, []);

  const optionsRef = useRef<ISourceOptions>({
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
      color: {
        value: [
          DEFAULT_THEME_VISUALS.particle1,
          DEFAULT_THEME_VISUALS.particle2,
          DEFAULT_THEME_VISUALS.particle3
        ]
      },
      links: {
        color: DEFAULT_THEME_VISUALS.nodeLink,
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
  });

  if (init) {
    return (
      <Particles
        id='tsparticles'
        className='pointer-events-none absolute inset-0 block h-full w-full'
        options={optionsRef.current}
        particlesLoaded={async (container) => {
          if (!container) {
            return;
          }

          containerRef.current = container;
          themeVisualsRef.current = {
            ...DEFAULT_THEME_VISUALS,
            ...readThemeVisualTokens()
          };

          if (!updateParticleSourceOptions(container.sourceOptions, themeVisualsRef.current)) {
            return;
          }

          await container.refresh();
        }}
      />
    );
  }

  return null;
};

export default ParticleBackground;
