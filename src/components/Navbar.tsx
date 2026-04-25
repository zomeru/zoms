"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { navigation } from "@/constants";

const NAV_OFFSET = 100; // px — fixed navbar height

export function Navbar() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const isHomePage = pathname === "/";

  // Entrance animation
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Track active section via IntersectionObserver (home page only)
  useEffect(() => {
    if (!isHomePage) return;

    const sectionIds = navigation.map((nav) => nav.url.replace("/#", ""));
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      // Fires when section crosses 100px from top (accounts for fixed navbar)
      { rootMargin: `-${NAV_OFFSET}px 0px -60% 0px`, threshold: 0 }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [isHomePage]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string): void => {
    if (!isHomePage) return;
    const el = document.getElementById(sectionId);
    if (!el) return; // no element = page route, let Next.js handle it
    e.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveSection(sectionId);
  };

  return (
    <header className="pointer-events-none fixed top-0 right-0 left-0 z-50 flex flex-col items-center">
      <nav
        className={`pointer-events-auto mx-4 mt-4 flex items-center gap-1 rounded-full border px-2 py-2 backdrop-blur-md transition-all duration-300 ${
          isLoaded ? "translate-y-0 opacity-100" : "-translate-y-5 opacity-0"
        } border-border/50 bg-background/60`}
      >
        <Link href="/" className="flex shrink-0 items-center pr-3 pl-2" aria-label="zoms home">
          <span className="font-bold text-lg text-text-primary">zoms</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {navigation.map(({ name, url }) => {
            const sectionId = url.replace("/#", "");
            const href = !isHomePage && name === "Blog" ? "/blog" : url;
            const isActive = isHomePage ? activeSection === sectionId : pathname === href;

            return (
              <Link
                key={url}
                href={href}
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

        <MobileMenu
          activeSection={activeSection}
          onNavClick={handleNavClick}
          isHomePage={isHomePage}
          pathname={pathname}
        />
      </nav>
    </header>
  );
}

const MobileMenu = ({
  activeSection,
  onNavClick,
  isHomePage,
  pathname
}: {
  activeSection: string;
  onNavClick: (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => void;
  isHomePage: boolean;
  pathname: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close on desktop resize
  useEffect(() => {
    const close = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  // Close on route change — pathname is a trigger, not read in body
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname triggers close, not consumed
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-overlay md:hidden"
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        <div className="relative flex h-3 w-4 flex-col justify-between">
          <span
            className={`block h-[1.5px] w-full origin-center rounded-full bg-current transition-all duration-300 ${isOpen ? "translate-y-1.25 rotate-45" : ""}`}
          />
          <span
            className={`block h-[1.5px] w-full rounded-full bg-current transition-all duration-300 ${isOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-[1.5px] w-full origin-center rounded-full bg-current transition-all duration-300 ${isOpen ? "-translate-y-1.25 -rotate-45" : ""}`}
          />
        </div>
      </button>

      <div
        className={`pointer-events-none fixed top-20 right-0 left-0 flex justify-center transition-all duration-300 md:hidden ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="pointer-events-auto mx-4 mt-2 rounded-2xl border border-border/50 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-xl">
          <ul className="space-y-1">
            {navigation.map(({ name, url }) => {
              const sectionId = url.replace("/#", "");
              const href = !isHomePage && name === "Blog" ? "/blog" : url;
              const isActive = isHomePage ? activeSection === sectionId : pathname === href;

              return (
                <li key={url}>
                  <Link
                    href={href}
                    onClick={(e) => {
                      onNavClick(e, sectionId);
                      setIsOpen(false);
                    }}
                    className={`block rounded-xl px-4 py-2.5 font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-overlay-strong text-text-primary"
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
