import { Component, type ReactNode } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Header, { Brand } from "./Header";
import Home from "./Home";
import Information from "./Information";
import SolarSystem from "./universe/SolarSystem";
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="home-container information">
        <h1>Let’s find another way to explore.</h1>
        <p>
          The discovery page could not load. Your existing tools are still
          available.
        </p>
        <a className="button primary" href="/explore.html">
          Open the world explorer <ArrowUpRight size={18} />
        </a>
      </main>
    ) : (
      this.props.children
    );
  }
}
function Footer() {
  return (
    <footer className="home-footer">
      <div className="home-container">
        <div className="footer-main">
          <div className="footer-brand">
            <Brand testId="home-footer-brand" />
            <p>
              For the endlessly curious.
              <br />
              Explore Earth and beyond.
            </p>
            <span className="eyebrow">Independent · Educational · Free</span>
          </div>
          <div>
            <h2>Explore</h2>
            <a href="/#planet">Explore Earth</a>
            <a href="/#universe">Explore Space</a>
            <a href="/explore.html#atlas-section">Geography</a>
            <a href="/#astronomy">Astronomy</a>
          </div>
          <div>
            <h2>Discover</h2>
            <a href="/#earth-science">Earth Science</a>
            <a href="/#history">History</a>
            <a href="/#learning">Learning Hub</a>
            <a href="/explore.html#city">Weather</a>
          </div>
          <div>
            <h2>AtlasSphere</h2>
            <a href="/about.html">About</a>
            <Link to="/sources">Data Sources & Attribution</Link>
            <Link to="/accessibility">Accessibility</Link>
            <a
              href="https://github.com/panigrahi-shubham/AtlasSphere/issues"
              target="_blank"
              rel="noreferrer"
            >
              Contact & feedback <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>AtlasSphere. Made for discovery.</span>
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Weather data by Open-Meteo.com
          </a>
          <Link to="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
export default function App() {
  return (
    <div className="atlas-home">
      <Header />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/index.html" element={<Home />} />
          <Route path="/universe/solar-system" element={<SolarSystem />} />
          <Route path="/sources" element={<Information kind="sources" />} />
          <Route path="/privacy" element={<Information kind="privacy" />} />
          <Route
            path="/sources.html"
            element={<Information kind="sources" />}
          />
          <Route
            path="/privacy.html"
            element={<Information kind="privacy" />}
          />
          <Route
            path="/accessibility.html"
            element={<Information kind="accessibility" />}
          />
          <Route
            path="/accessibility"
            element={<Information kind="accessibility" />}
          />
          <Route path="*" element={<Information kind="missing" />} />
        </Routes>
      </ErrorBoundary>
      <Footer />
    </div>
  );
}
