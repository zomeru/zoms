'use client';

import React from 'react';
import Link from 'next/link';

import { navigation } from '@/constants';

const REGEX = /[/#]/g;

const Navigation = (): React.JSX.Element => {
  const [currentSection, setCurrentSection] = React.useState('about');

  React.useEffect(() => {
    const handleScroll = (): void => {
      const sections = document.querySelectorAll('section');

      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionBottom = section.getBoundingClientRect().bottom;

        const height = section.id === 'technologies' ? 150 : 100;

        if (sectionTop <= height && sectionBottom >= height) {
          const hasThisSection = navigation.find((nav) => {
            return nav.url.replace(REGEX, '') === section.id;
          });

          if (hasThisSection !== undefined) {
            setCurrentSection(section.id);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>): void => {
    e.preventDefault();

    const target = e.currentTarget.getAttribute('href');

    if (target !== null) {
      const newTarget = target.replace('/', '');

      const element = document.querySelector(newTarget);
      const offset = 90;

      if (element !== null) {
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <nav>
      <ul className='list-none space-y-4'>
        {navigation.map(({ name, url }) => {
          const isCurrentSection = currentSection === url.replace(REGEX, '');
          return (
            <li key={url}>
              <Link href={url} onClick={handleNavClick} className='flex items-center group'>
                <div
                  className={`h-[1px] mr-3 w-full ${
                    isCurrentSection
                      ? 'max-w-[60px] bg-textPrimary'
                      : 'max-w-[30px] bg-textSecondary'
                  } transition-all duration-200 ease-in-out group-hover:max-w-[60px] group-hover:bg-textPrimary`}
                ></div>
                <span
                  className={` uppercase text-sm ${
                    isCurrentSection
                      ? 'text-textPrimary'
                      : 'text-textSecondary transition-all duration-200 ease-in-out group-hover:text-textPrimary'
                  }`}
                >
                  {name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navigation;
