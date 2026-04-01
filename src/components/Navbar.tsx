'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { navigation } from '@/constants';

const Navbar = (): React.JSX.Element => {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = React.useState('');
  const [isLoaded, setIsLoaded] = React.useState(false);

  const isHomePage = pathname === '/';

  React.useEffect(() => {
    setIsLoaded(true);

    // Only track active section on home page
    if (!isHomePage) return;

    const handleScroll = (): void => {
      const sections = navigation.map((nav) => nav.url.replace('/#', ''));

      for (const section of sections.reverse()) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHomePage]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    sectionId: string
  ): void => {
    // Only prevent default and smooth scroll on home page
    if (isHomePage) {
      e.preventDefault();

      const element = document.getElementById(sectionId);
      const offset = 100;

      if (element) {
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        setActiveSection(sectionId);
      }
    }
    // On other pages, let Next.js handle the navigation to /#section
  };

  return (
    <header className='fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none'>
      <nav
        className={`pointer-events-auto mt-4 mx-4 flex items-center gap-1 px-2 py-2 rounded-full border transition-all duration-300 backdrop-blur-md ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'
        } bg-background/60 border-border/50`}
      >
        {/* Logo */}
        <Link href='/' className='flex items-center shrink-0 pl-2 pr-3' aria-label='zoms home'>
          <span className='text-lg font-bold text-text-primary'>zoms</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className='hidden md:flex items-center gap-1'>
          {navigation.map(({ name, url }) => {
            const sectionId = url.replace('/#', '');
            const isActive = activeSection === sectionId;
            const _url = !isHomePage && name === 'Blog' ? '/blog' : url;

            return (
              <Link
                key={url}
                href={_url}
                onClick={(e) => handleNavClick(e, sectionId)}
                className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                  isActive
                    ? 'bg-overlay-strong text-text-primary'
                    : 'text-text-secondary hover:bg-overlay hover:text-text-primary'
                }`}
              >
                {name}
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Button */}
        <MobileMenu
          activeSection={activeSection}
          onNavClick={handleNavClick}
          isHomePage={isHomePage}
        />
      </nav>
    </header>
  );
};

const MobileMenu = ({
  activeSection,
  onNavClick,
  isHomePage
}: {
  activeSection: string;
  onNavClick: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, sectionId: string) => void;
  isHomePage: boolean;
}): React.JSX.Element => {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='md:hidden ml-1 flex h-8 w-8 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-overlay'
        aria-label='Open menu'
        aria-expanded={isOpen}
      >
        <div className='relative w-4 h-3 flex flex-col justify-between'>
          <span
            className={`block h-[1.5px] w-full rounded-full bg-current origin-center transition-all duration-300 ${
              isOpen ? 'rotate-45 translate-y-1.25' : ''
            }`}
          ></span>
          <span
            className={`block h-[1.5px] w-full rounded-full bg-current transition-all duration-300 ${
              isOpen ? 'opacity-0' : ''
            }`}
          ></span>
          <span
            className={`block h-[1.5px] w-full rounded-full bg-current origin-center transition-all duration-300 ${
              isOpen ? '-rotate-45 -translate-y-1.25' : ''
            }`}
          ></span>
        </div>
      </button>

      {/* Mobile Menu Dropdown */}
      <div
        className={`md:hidden fixed top-20 left-0 right-0 flex justify-center pointer-events-none transition-all duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className='pointer-events-auto mx-4 mt-2 px-4 py-3 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg'>
          <ul className='space-y-1'>
            {navigation.map(({ name, url }) => {
              const sectionId = url.replace('/#', '');
              const isActive = isHomePage && activeSection === sectionId;
              const _url = !isHomePage && name === 'Blog' ? '/blog' : url;

              return (
                <li key={url}>
                  <Link
                    href={_url}
                    onClick={(e) => {
                      onNavClick(e, sectionId);
                      setIsOpen(false);
                    }}
                    className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-surface/80 text-text-primary'
                        : 'text-text-secondary hover:bg-surface/40 hover:text-text-primary'
                    }`}
                  >
                    {name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Navbar;
