import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Experience, SourceNote } from "../science/Experience";
import { planets, findPlanet, factSource } from "./planets";
import type { SolarController } from "./solarRenderer";

export default function SolarSystem() {
  const [params, setParams] = useSearchParams();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  // Static HTML has no query string. Apply URL selection after hydration.
  const planet =
    (ready && findPlanet(params.get("planet") ?? "")) || planets[2];
  const [days, setDays] = useState(0),
    [speed, setSpeed] = useState(30),
    [playing, setPlaying] = useState(false);
  const [orbits, setOrbits] = useState(true),
    [labels, setLabels] = useState(true);
  const [active, setActive] = useState(false),
    [status, setStatus] = useState("static");
  const [reduced, setReduced] = useState(false);
  const host = useRef<HTMLDivElement>(null),
    engine = useRef<SolarController | null>(null);
  const select = useRef((slug: string) => setParams({ planet: slug }));
  select.current = (slug) => setParams({ planet: slug });
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      setReduced(media.matches);
      if (media.matches) setPlaying(false);
    };
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      if (!document.hidden)
        setDays((value) => Math.min(100000, value + speed / 5));
    }, 200);
    return () => clearInterval(timer);
  }, [playing, speed]);
  useEffect(() => {
    if (!active || !host.current) return;
    let cancelled = false;
    let controller: SolarController | undefined;
    const container = host.current;
    void import("./solarRenderer")
      .then(({ createSolar }) => {
        if (cancelled) return;
        controller = createSolar(
          container,
          (slug) => select.current(slug),
          () => {
            setStatus("error");
            setActive(false);
            setPlaying(false);
          },
        );
        engine.current = controller;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          setActive(false);
          setPlaying(false);
        }
      });
    return () => {
      cancelled = true;
      controller?.dispose();
      engine.current = null;
    };
  }, [active]);
  useEffect(() => {
    engine.current?.update({ days, selected: planet.slug, orbits, labels });
  }, [days, planet.slug, orbits, labels, status]);
  return (
    <Experience
      title="The Solar System"
      eyebrow="EIGHT WORLDS. ONE STAR."
      intro="Travel from the rocky inner worlds to the ice giants. Set the pace, choose a planet, and see how orbital periods shape our planetary neighborhood."
    >
      <div
        className="planet-selector"
        role="group"
        aria-label="Select a planet"
      >
        {planets.map((p) => (
          <button
            key={p.slug}
            data-testid={`solar-select-${p.slug}`}
            aria-pressed={p.slug === planet.slug}
            onClick={() => setParams({ planet: p.slug })}
          >
            <span
              className="planet-dot"
              style={{ "--planet-color": p.color } as CSSProperties}
            />
            {p.name}
          </button>
        ))}
      </div>
      <div className="experience-grid">
        <div>
          <div className="solar-viewport" data-testid="solar-viewport">
            <div
              className="solar-canvas"
              ref={host}
              hidden={status !== "ready"}
            />
            {status !== "ready" && (
              <div className="solar-fallback" data-testid="solar-fallback">
                <span className="eyebrow">A NEIGHBORHOOD OF WORLDS</span>
                <div className="schematic-planets">
                  {planets.map((p) => (
                    <div key={p.slug}>
                      <span
                        className="schematic-orb"
                        style={{ "--planet-color": p.color } as CSSProperties}
                      />
                      {p.name}
                    </div>
                  ))}
                </div>
                <p>
                  Illustrative colors and sizes. Read, select and compare
                  planets without loading 3D.
                </p>
                <button
                  data-testid="solar-activate"
                  disabled={status === "loading"}
                  onClick={() => {
                    setStatus("loading");
                    setActive(true);
                  }}
                >
                  {status === "loading"
                    ? "Preparing the scene…"
                    : status === "error"
                      ? "Retry 3D"
                      : "Launch 3D explorer"}
                </button>
              </div>
            )}
          </div>
          <p
            className="experience-status"
            role="status"
            data-testid="solar-status"
          >
            {status === "error"
              ? "3D is unavailable. Planet information and the model clock remain usable."
              : status === "ready"
                ? "Drag to rotate · Scroll or use buttons to zoom · Select a planet above."
                : "3D loads only when you launch it."}
          </p>
          <div className="control-bar">
            <button
              data-testid="solar-play"
              disabled={reduced}
              aria-pressed={playing}
              onClick={() => setPlaying(!playing)}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button
              data-testid="solar-reset"
              onClick={() => {
                setDays(0);
                setPlaying(false);
              }}
            >
              Reset simulation
            </button>
            <label>
              Speed · {speed} model days/second
              <input
                data-testid="solar-speed"
                type="range"
                min="1"
                max="365"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              />
            </label>
            <label>
              Model day
              <input
                data-testid="solar-day"
                type="number"
                min="0"
                max="100000"
                step="1"
                value={Math.floor(days)}
                onChange={(e) => {
                  setPlaying(false);
                  setDays(
                    Math.max(0, Math.min(100000, Number(e.target.value) || 0)),
                  );
                }}
              />
            </label>
          </div>
          {reduced && (
            <p>
              Automatic playback is disabled for reduced motion. You can change
              the model day directly.
            </p>
          )}
          <div className="control-bar" role="group" aria-label="View controls">
            <button
              disabled={status !== "ready"}
              onClick={() => engine.current?.focus()}
              data-testid="solar-focus"
            >
              Focus {planet.name}
            </button>
            <button
              disabled={status !== "ready"}
              onClick={() => engine.current?.rotate()}
              data-testid="solar-camera-rotate"
            >
              Rotate camera
            </button>
            <button
              disabled={status !== "ready"}
              onClick={() => engine.current?.zoom(0.8)}
              data-testid="solar-zoom-in"
            >
              Zoom in
            </button>
            <button
              disabled={status !== "ready"}
              onClick={() => engine.current?.zoom(1.25)}
              data-testid="solar-zoom-out"
            >
              Zoom out
            </button>
            <button
              disabled={status !== "ready"}
              onClick={() => engine.current?.reset()}
              data-testid="solar-camera-reset"
            >
              Reset camera
            </button>
            <label className="check-control">
              <input
                type="checkbox"
                checked={orbits}
                onChange={(e) => setOrbits(e.target.checked)}
                data-testid="solar-orbits"
              />
              Orbits
            </label>
            <label className="check-control">
              <input
                type="checkbox"
                checked={labels}
                onChange={(e) => setLabels(e.target.checked)}
                data-testid="solar-labels"
              />
              Labels
            </label>
          </div>
        </div>
        <aside
          className="fact-panel"
          aria-label="Selected planet facts"
          data-testid="solar-selected"
          aria-live="polite"
        >
          <span className="eyebrow">{planet.kind}</span>
          <h2>{planet.name}</h2>
          <p>{planet.story}</p>
          <dl>
            <dt>One orbit</dt>
            <dd>{planet.orbit.toLocaleString("en")} Earth days</dd>
            <dt>Equatorial diameter</dt>
            <dd>{planet.diameter.toLocaleString("en")} km</dd>
            <dt>Average distance from Sun</dt>
            <dd>{planet.distance.toLocaleString("en")} million km</dd>
          </dl>
          <p>{planet.features}</p>
          <a
            className="text-link"
            href={planet.source}
            data-testid="solar-planet-source"
          >
            Explore the NASA reference ↗
          </a>
        </aside>
      </div>
      <SourceNote>
        <p>
          This is an approximate circular, coplanar teaching model. Starting
          positions are illustrative; model day is not a date or a prediction of
          real-time positions. Orbital periods use{" "}
          <a href={factSource} data-testid="solar-model-source">
            NASA reference values
          </a>
          . Distances are evenly spaced and planet sizes compressed for
          visibility; neither uses a physical scale. Colors and lighting are
          illustrative.
        </p>
        <p>
          The planet selection is stored in this page’s URL, so you can share or
          bookmark it. The model starts paused.
        </p>
      </SourceNote>
    </Experience>
  );
}
