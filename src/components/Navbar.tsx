"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { navigation } from "@/constants";

const Navbar = (): React.JSX.Element => {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = React.useState("");
  const [isLoaded, setIsLoaded] = React.useState(false);

  const isHomePage = pathname === "/";

  React.useEffect(() => {
    setIsLoaded(true);

    // Only track active section on home page
    if (!isHomePage) return;

    let rafId: number | null = null;

    const handleScroll = (): void => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const sections = navigation.map((nav) => nav.url.replace("/#", ""));

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
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
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
          behavior: "smooth"
        });

        setActiveSection(sectionId);
      }
    }
    // On other pages, let Next.js handle the navigation to /#section
  };

  return (
    <header className="pointer-events-none fixed top-0 right-0 left-0 z-50 flex flex-col items-center">
      <nav
        className={`pointer-events-auto mx-4 mt-4 flex items-center gap-1 rounded-full border px-2 py-2 backdrop-blur-md transition-all duration-300 ${
          isLoaded ? "translate-y-0 opacity-100" : "-translate-y-5 opacity-0"
        } border-border/50 bg-background/60`}
      >
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center pr-3 pl-2" aria-label="zoms home">
          <span className="font-bold text-lg text-text-primary">zoms</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-1 md:flex">
          {navigation.map(({ name, url }) => {
            const sectionId = url.replace("/#", "");
            const isActive = activeSection === sectionId;
            const _url = !isHomePage && name === "Blog" ? "/blog" : url;

            return (
              <Link
                key={url}
                href={_url}
                onClick={(e) => handleNavClick(e, sectionId)}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-overlay-strong text-text-primary"
                    : "text-text-secondary hover:bg-overlay hover:text-text-primary"
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

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-overlay md:hidden"
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        <div className="relative flex h-3 w-4 flex-col justify-between">
          <span
            className={`block h-[1.5px] w-full origin-center rounded-full bg-current transition-all duration-300 ${
              isOpen ? "translate-y-1.25 rotate-45" : ""
            }`}
          ></span>
          <span
            className={`block h-[1.5px] w-full rounded-full bg-current transition-all duration-300 ${
              isOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            className={`block h-[1.5px] w-full origin-center rounded-full bg-current transition-all duration-300 ${
              isOpen ? "-translate-y-1.25 -rotate-45" : ""
            }`}
          ></span>
        </div>
      </button>

      {/* Mobile Menu Dropdown */}
      <div
        className={`pointer-events-none fixed top-20 right-0 left-0 flex justify-center transition-all duration-300 md:hidden ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="pointer-events-auto mx-4 mt-2 rounded-2xl border border-border/50 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-xl">
          <ul className="space-y-1">
            {navigation.map(({ name, url }) => {
              const sectionId = url.replace("/#", "");
              const isActive = isHomePage && activeSection === sectionId;
              const _url = !isHomePage && name === "Blog" ? "/blog" : url;

              return (
                <li key={url}>
                  <Link
                    href={_url}
                    onClick={(e) => {
                      onNavClick(e, sectionId);
                      setIsOpen(false);
                    }}
                    className={`block rounded-xl px-4 py-2.5 font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-surface/80 text-text-primary"
                        : "text-text-secondary hover:bg-surface/40 hover:text-text-primary"
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
