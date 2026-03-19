'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  formatNumber?: (num: number) => string;
  className?: string;
  startOnMount?: boolean;
}

/**
 * AnimatedCounter Component
 *
 * Animates a number from 0 to the target value when it enters the viewport.
 * Uses requestAnimationFrame for smooth animation performance.
 * Respects prefers-reduced-motion preference.
 */
const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  target,
  duration = 2000,
  formatNumber = (num) => num.toLocaleString(),
  className = '',
  startOnMount = true
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);
  const counterRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Check for reduced motion preference
  const prefersReducedMotion = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Easing function for smooth animation (ease-out-cubic)
  const easeOutCubic = useCallback((t: number): number => {
    return 1 - (1 - t) ** 3;
  }, []);

  // Animation frame handler
  const animate = useCallback(
    (timestamp: number) => {
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing, logical-assignment-operators -- Intentional: only set if not already set
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentValue = Math.floor(target * easedProgress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we end exactly at the target
        setDisplayValue(target);
        animationRef.current = null;
      }
    },
    [target, duration, easeOutCubic]
  );

  // Start animation
  const startAnimation = useCallback(() => {
    if (hasAnimated || animationRef.current) return;

    setHasAnimated(true);

    // If reduced motion is preferred, jump straight to the target
    if (prefersReducedMotion()) {
      setDisplayValue(target);
      return;
    }

    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);
  }, [hasAnimated, target, prefersReducedMotion, animate]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Setup IntersectionObserver to trigger animation when in viewport
  useEffect(() => {
    if (!startOnMount || hasAnimated || !counterRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          startAnimation();
          observer.disconnect();
        }
      },
      {
        threshold: 0.2, // Trigger when 20% of the element is visible
        rootMargin: '50px' // Start slightly before fully in view
      }
    );

    observer.observe(counterRef.current);

    return () => {
      observer.disconnect();
    };
  }, [startOnMount, hasAnimated, startAnimation]);

  // Start animation immediately on mount if specified
  useEffect(() => {
    if (startOnMount && !hasAnimated) {
      startAnimation();
    }
  }, [startOnMount, hasAnimated, startAnimation]);

  return (
    <span ref={counterRef} className={className}>
      {formatNumber(displayValue)}
    </span>
  );
};

export default AnimatedCounter;
