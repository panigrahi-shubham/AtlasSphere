import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Globe2,
  Menu,
  Moon,
  Search,
  Sun,
  UserRound,
  X,
} from "lucide-react";

export function Brand({ testId = "home-brand" }: { testId?: string }) {
  return (
    <Link
      to="/"
      className="home-brand"
      aria-label="AtlasSphere home"
      data-testid={testId}
      onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
    >
      <span className="brand-orbit">
        <Globe2 size={25} strokeWidth={1.3} />
      </span>
      Atlas<span>Sphere</span>
      <span className="brand-period">.</span>
    </Link>
  );
}
const groups = [
  {
    label: "Our planet",
    links: [
      ["Explore Earth", "/explore.html#atlas-section"],
      ["Countries", "/explore.html#country-directory"],
      ["Continents", "/explore.html#atlas-section"],
      ["Geography", "/#planet"],
      ["Natural Wonders", "/#destinations"],
      ["Earth Science", "/#earth-science"],
      ["Weather", "/explore.html#city"],
    ],
  },
  {
    label: "Beyond Earth",
    links: [
      ["Explore Space", "/#universe"],
      ["Solar System", "/universe/solar-system"],
      ["Planets and Moons", "/universe/planets"],
      ["Compare planets", "/universe/compare"],
      ["Astronomy", "/#astronomy"],
      ["History", "/#history"],
    ],
  },
  {
    label: "Your next discovery",
    links: [
      ["Home", "/"],
      ["Learning Hub", "/#learning"],
      ["GeoGuess", "/geoguess"],
      ["Journeys", "/journeys"],
      ["Your account", "/explore.html#account-section"],
      ["About AtlasSphere", "/about.html"],
      ["Data Sources", "/sources"],
    ],
  },
];
export default function Header() {
  const [theme, setTheme] = useState("dark");
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "light" ? "light" : "dark",
    );
  }, []);
  const close = () => {
    dialog.current?.close();
    setOpen(false);
    toggle.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  const switchTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("earthscope:theme:v1", JSON.stringify(next));
      setNotice("");
    } catch {
      setNotice(
        "Theme changed for this visit. Your browser could not save it.",
      );
    }
  };
  return (
    <>
      <a className="home-skip" href="#home-main" data-testid="home-skip">
        Skip to content
      </a>
      <header className="home-header">
        <div className="home-container header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="/#planet" data-testid="home-nav-earth">
              Explore Earth
            </a>
            <a href="/#universe" data-testid="home-nav-space">
              Explore Space
            </a>
            <a
              href="/explore.html#atlas-section"
              data-testid="home-nav-geography"
            >
              Geography
            </a>
            <a href="/#astronomy" data-testid="home-nav-astronomy">
              Astronomy
            </a>
            <a href="/#learning" data-testid="home-nav-learning">
              Learning Hub
            </a>
          </nav>
          <div className="nav-actions">
            <a
              href="/#home-search-input"
              className="icon-button"
              aria-label="Go to geographic search"
              data-testid="home-nav-search"
            >
              <Search size={19} />
            </a>
            <button
              onClick={switchTheme}
              className="icon-button"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              aria-pressed={theme === "light"}
              data-testid="home-theme-toggle"
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <a
              href="/explore.html#account-section"
              className="icon-button account-link"
              aria-label="Your account"
              data-testid="home-account-link"
            >
              <UserRound size={19} />
            </a>
            <span className="nav-divider" />
            <button
              ref={toggle}
              className="icon-button menu-button"
              aria-label="Open navigation menu"
              aria-expanded={open}
              aria-controls="home-menu"
              data-testid="home-menu-toggle"
              onClick={() => setOpen(true)}
            >
              <Menu size={23} />
            </button>
          </div>
        </div>
      </header>
      {notice && (
        <p role="status" className="home-container">
          {notice}
        </p>
      )}
      <dialog
        ref={dialog}
        id="home-menu"
        className="home-menu"
        aria-labelledby="home-menu-heading"
        data-testid="home-menu"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const focusable = dialog.current?.querySelectorAll<HTMLElement>(
            "a[href], button:not([disabled])",
          );
          if (!focusable?.length) return;
          const first = focusable[0],
            last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="menu-surface">
          <div className="menu-top">
            <span className="eyebrow" id="home-menu-heading">
              Follow your curiosity
            </span>
            <button
              className="icon-button"
              aria-label="Close navigation menu"
              data-testid="home-menu-close"
              onClick={close}
            >
              <X size={25} />
            </button>
          </div>
          <div className="menu-groups">
            {groups.map((group) => (
              <div key={group.label}>
                <h2>{group.label}</h2>
                <ul>
                  {group.links.map(([label, href]) => (
                    <li key={label}>
                      {href ? (
                        <a href={href} onClick={close}>
                          {label}
                          <ArrowUpRight size={16} />
                        </a>
                      ) : (
                        <span className="future-menu">
                          {label}
                          <small>Coming soon</small>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="menu-bottom">
            One planet. Endless discoveries.
            <span>Independent. Educational. Free to explore.</span>
          </div>
        </div>
      </dialog>
    </>
  );
}
