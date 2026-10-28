import { useEffect, useRef, useState } from "react";
import type {
  EarthController,
  EarthCountry,
  EarthLocation,
} from "./earthRenderer";
import "./earth-globe.css";

export type EarthGlobeProps = {
  selected?: EarthLocation | null;
  onSelect?: (value: EarthLocation) => void;
};

export default function EarthGlobe({ selected, onSelect }: EarthGlobeProps) {
  const host = useRef<HTMLDivElement>(null);
  const activateButton = useRef<HTMLButtonElement>(null);
  const engine = useRef<EarthController | null>(null);
  const selection = useRef(selected);
  const selectCallback = useRef(onSelect);
  const [active, setActive] = useState(false);
  const [state, setState] = useState<"static" | "loading" | "ready" | "error">(
    "static",
  );
  const [rotation, setRotation] = useState(false);
  const [countries, setCountries] = useState<EarthCountry[]>([]);
  const [hover, setHover] = useState("");
  const [chosen, setChosen] = useState<EarthLocation | null>(selected ?? null);
  const [reduced, setReduced] = useState(false);
  selection.current = selected;
  selectCallback.current = onSelect;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    change();
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    if (!active || !host.current) return;
    let cancelled = false;
    let controller: EarthController | null = null;
    const container = host.current;
    void import("./earthRenderer")
      .then(({ createEarth }) =>
        createEarth({
          container,
          onSelect: (place) => {
            if (!cancelled) {
              setChosen(place);
              selectCallback.current?.(place);
            }
          },
          onHover: (name) => {
            if (!cancelled) setHover(name);
          },
          onRotationChange: (rotating) => {
            if (!cancelled) setRotation(rotating);
          },
          onContextLost: () => {
            if (!cancelled) {
              setState("error");
              setActive(false);
            }
          },
        }),
      )
      .then((created) => {
        controller = created;
        if (cancelled) {
          created.dispose();
          return;
        }
        engine.current = created;
        setCountries(created.countries);
        setState("ready");
        if (selection.current) created.select(selection.current);
      })
      .catch(() => {
        if (!cancelled) {
          setState("error");
          setActive(false);
        }
      });
    return () => {
      cancelled = true;
      controller?.dispose();
      engine.current = null;
    };
  }, [active]);

  useEffect(() => {
    engine.current?.select(selected);
    setChosen(selected ?? null);
  }, [selected]);

  useEffect(() => {
    if (state === "ready")
      host.current?.querySelector("canvas")?.focus({ preventScroll: true });
    if (state === "error")
      activateButton.current?.focus({ preventScroll: true });
  }, [state]);

  function activate() {
    setState("loading");
    setActive(true);
  }
  function chooseCountry(id: string) {
    const country = countries.find((item) => item.id === id);
    if (!country) return;
    engine.current?.select(country);
    setChosen(country);
    onSelect?.(country);
  }

  return (
    <figure
      className="home-earth"
      data-testid="home-globe"
      aria-label="Explore our planet"
    >
      <div
        className="home-earth-visual"
        data-testid="home-globe-visual"
        aria-busy={state === "loading"}
      >
        <img
          className="home-earth-photo"
          src="/images/earth-space/earth-hero.webp"
          srcSet="/images/earth-space/earth-hero-small.webp 640w, /images/earth-space/earth-hero-medium.webp 800w, /images/earth-space/earth-hero.webp 1100w"
          sizes="(max-width: 700px) 90vw, 620px"
          width="1100"
          height="1100"
          fetchPriority="high"
          alt="NASA Blue Marble composite of Earth's eastern hemisphere, with Africa, Asia and swirling clouds"
          data-testid="home-globe-fallback"
          hidden={state === "ready"}
        />
        <div
          ref={host}
          className="home-earth-canvas"
          data-testid="home-globe-host"
          hidden={state !== "ready"}
        />
        {hover && state === "ready" && (
          <span className="home-earth-hover" data-testid="home-globe-hover">
            {hover}
          </span>
        )}
        {state !== "ready" && (
          <button
            ref={activateButton}
            type="button"
            className="home-earth-activate"
            data-testid="home-globe-activate"
            onClick={activate}
            disabled={state === "loading"}
          >
            {state === "loading"
              ? "Preparing your globe…"
              : state === "error"
                ? "Try 3D again"
                : "Explore in 3D"}
            <span aria-hidden="true"> ↗</span>
          </button>
        )}
      </div>
      <figcaption className="home-earth-caption">
        <span className="home-earth-coordinate">
          OUR HOME PLANET <span aria-hidden="true">/</span> EARTH
        </span>
        <span>
          Historical composite ·{" "}
          <a
            href={
              state === "ready"
                ? "https://svs.gsfc.nasa.gov/2915/"
                : "https://science.nasa.gov/image-detail/amf-gsfc_20171208_archive_e001788/"
            }
            target="_blank"
            rel="noreferrer"
          >
            {state === "ready" ? "NASA / GSFC" : "NASA / NOAA"}
          </a>
        </span>
      </figcaption>
      <p
        className="home-earth-status"
        role="status"
        data-testid="home-globe-status"
      >
        {state === "error"
          ? "3D is unavailable. The NASA image and geographic search remain available."
          : state === "loading"
            ? "Loading 3D Earth. The image remains available."
            : state === "ready"
              ? `Drag to explore. Arrow keys rotate; + and − zoom. Lighting is illustrative.${reduced ? " Rotation is off for reduced motion." : ""}`
              : "A world worth getting to know."}
      </p>
      {state === "ready" && (
        <div className="home-earth-controls" data-testid="home-globe-controls">
          <div
            className="home-earth-buttons"
            role="group"
            aria-label="Globe controls"
          >
            <button
              type="button"
              aria-label="Zoom in on Earth"
              data-testid="home-globe-zoom-in"
              onClick={() => engine.current?.zoom(-0.3)}
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out from Earth"
              data-testid="home-globe-zoom-out"
              onClick={() => engine.current?.zoom(0.3)}
            >
              −
            </button>
            <button
              type="button"
              data-testid="home-globe-reset"
              onClick={() => engine.current?.reset()}
            >
              Reset view
            </button>
            <button
              type="button"
              data-testid="home-globe-rotate"
              aria-pressed={rotation}
              disabled={reduced}
              title={
                reduced
                  ? "Rotation is disabled by your reduced-motion preference"
                  : undefined
              }
              onClick={() => engine.current?.setRotation(!rotation)}
            >
              {rotation ? "Pause rotation" : "Rotate"}
            </button>
          </div>
          <label
            className="home-earth-country-label"
            htmlFor="home-globe-country"
          >
            Choose a country or territory
            <select
              id="home-globe-country"
              data-testid="home-globe-country"
              value={
                countries.find((country) => country.name === chosen?.name)
                  ?.id ?? ""
              }
              onChange={(event) => chooseCountry(event.target.value)}
            >
              <option value="">Select a place</option>
              {countries.map((country) => (
                <option
                  value={country.id}
                  key={`${country.id}-${country.name}`}
                >
                  {country.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {chosen && (
        <p
          className="home-earth-selection"
          role="status"
          data-testid="home-globe-selection"
        >
          <strong>{chosen.name}</strong>
          <span>
            {chosen.latitude.toFixed(2)}°, {chosen.longitude.toFixed(2)}°
          </span>
        </p>
      )}
    </figure>
  );
}
