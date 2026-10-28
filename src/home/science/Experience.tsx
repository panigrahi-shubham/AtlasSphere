import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import "./experiences.css";

export function Experience({
  title,
  eyebrow,
  intro,
  children,
}: {
  title: string;
  eyebrow: string;
  intro: string;
  children: ReactNode;
}) {
  useEffect(() => {
    document.title = `${title} — AtlasSphere`;
  }, [title]);
  return (
    <main id="home-main" className="home-container experience" tabIndex={-1}>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/" data-testid="experience-breadcrumb-home">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{title}</span>
      </nav>
      <header className="experience-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>
      {children}
    </main>
  );
}
export function SourceNote({ children }: { children: ReactNode }) {
  return (
    <aside
      className="source-note"
      aria-label="Scientific sources and limitations"
    >
      <strong>Science, with context.</strong>
      <div>{children}</div>
    </aside>
  );
}
