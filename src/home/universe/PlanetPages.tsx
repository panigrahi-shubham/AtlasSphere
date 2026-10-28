import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Experience, SourceNote } from "../science/Experience";
import {
  planets,
  findPlanet,
  factSource,
  factNotes,
  type Planet,
} from "./planets";
import Information from "../Information";
import "./planetPages.css";

const metrics = [
  ["diameter", "Equatorial diameter", "km"],
  ["mass", "Mass", "× 10²⁴ kg"],
  ["gravity", "Reference gravity", "m/s²"],
  ["distance", "Mean distance from Sun", "million km"],
  ["orbit", "Sidereal orbital period", "Earth days"],
  ["rotation", "Sidereal rotation", "hours"],
  ["temperature", "Mean reference temperature", "°C"],
] as const;
type Metric = (typeof metrics)[number][0];
const number = (value: number) =>
  value.toLocaleString("en", { maximumFractionDigits: 3 });
function References() {
  return (
    <SourceNote>
      <p>
        Reference values from the{" "}
        <a href={factSource}>NASA planetary fact sheet</a> (18 March 2025
        snapshot, checked 28 October 2026). Moon counts are dated, not a live
        census.
      </p>
      <p>
        Negative rotation denotes retrograde spin, not a negative duration.
        Rotation is measured against the stars, not sunrise to sunrise.
        Temperatures are mean reference values: surface values for rocky planets
        and atmospheric values for giants, which have no solid surface. These
        are not local weather predictions. Gravity refers to the surface or
        atmospheric reference level. See{" "}
        <a href={factNotes}>measurement definitions</a>.
      </p>
    </SourceNote>
  );
}
function Photo({ planet, eager = false }: { planet: Planet; eager?: boolean }) {
  return (
    <figure className="planet-photo">
      <img
        src={planet.image}
        alt={planet.alt}
        width="1000"
        height="700"
        loading={eager ? "eager" : "lazy"}
      />
      <figcaption>{planet.credit}</figcaption>
    </figure>
  );
}
function useHydratedParams() {
  const [params, setParams] = useSearchParams();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return [ready ? params : new URLSearchParams(), setParams] as const;
}
export function PlanetDirectory() {
  const [params, setParams] = useHydratedParams();
  const query = params.get("q") ?? "";
  const kind = params.get("kind") ?? "all";
  const filtered = planets.filter(
    (p) =>
      p.name.toLowerCase().includes(query.trim().toLowerCase()) &&
      (kind === "all" || p.kind === kind),
  );
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };
  return (
    <Experience
      title="Eight worlds to discover"
      eyebrow="THE PLANET DIRECTORY"
      intro="From rocky neighbors to distant ice giants. Follow a world, explore its story, and compare the numbers that make it unique."
    >
      <div className="feature-links">
        <Link to="/universe/solar-system">Explore the Solar System ↗</Link>
        <Link to="/universe/compare" data-testid="planets-compare-link">
          Compare planets ↗
        </Link>
      </div>
      <div className="control-bar">
        <label>
          Search planets
          <input
            type="search"
            data-testid="planet-search"
            value={query}
            onChange={(e) => update("q", e.target.value)}
          />
        </label>
        <label>
          Classification
          <select
            data-testid="planet-filter"
            value={kind}
            onChange={(e) => update("kind", e.target.value)}
          >
            <option value="all">All planets</option>
            {["Terrestrial", "Gas giant", "Ice giant"].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <button data-testid="planet-clear" onClick={() => setParams({})}>
          Clear filters
        </button>
      </div>
      <p role="status" data-testid="planet-results">
        {filtered.length} {filtered.length === 1 ? "planet" : "planets"} found
      </p>
      <div className="encyclopedia-grid">
        {filtered.map((p) => (
          <article
            className="encyclopedia-card"
            key={p.slug}
            data-testid={`planet-card-${p.slug}`}
          >
            <Photo planet={p} />
            <div>
              <span className="eyebrow">{p.kind}</span>
              <h2>
                <Link to={`/universe/planets/${p.slug}`}>{p.name} ↗</Link>
              </h2>
              <p>{p.story}</p>
              <p>
                {number(p.diameter)} km across · {number(p.orbit)} Earth days
                per orbit
              </p>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <p>No planets match. Try a different name or clear the filters.</p>
      )}
      <References />
    </Experience>
  );
}
export function PlanetProfile() {
  const { slug } = useParams();
  const planet = findPlanet(slug);
  if (!planet) return <Information kind="missing" />;
  const index = planets.indexOf(planet);
  const previous = planets[(index + 7) % 8],
    next = planets[(index + 1) % 8];
  return (
    <Experience
      title={planet.name}
      eyebrow={planet.kind.toUpperCase()}
      intro={planet.story}
    >
      <div className="feature-links">
        <Link to="/universe/planets">All planets</Link>
        <Link
          data-testid="planet-view-model"
          to={`/universe/solar-system?planet=${planet.slug}`}
        >
          Explore {planet.name} in 3D ↗
        </Link>
        <Link
          data-testid="planet-compare"
          to={`/universe/compare?planets=${planet.slug},${planet.slug === "earth" ? "mars" : "earth"}`}
        >
          Compare this world ↗
        </Link>
      </div>
      <div className="planet-profile">
        <Photo planet={planet} eager />
        <div>
          <h2>A closer look</h2>
          <p>{planet.features}</p>
          <h3>Atmosphere</h3>
          <p>{planet.atmosphere}</p>
          <h3>Exploration</h3>
          <p>{planet.missions}</p>
          <a href={planet.source}>Read the NASA science reference ↗</a>
        </div>
      </div>
      <section className="experience-section" aria-label="Planet measurements">
        <h2>{planet.name}, by the numbers</h2>
        <dl className="planet-facts" data-testid="planet-facts">
          {metrics.map(([key, label, unit]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd data-testid={`planet-value-${key}`}>
                {number(planet[key])} {unit}
              </dd>
            </div>
          ))}
          <div>
            <dt>Moons · March 2025 snapshot</dt>
            <dd>{planet.moons}</dd>
          </div>
          <div>
            <dt>Ring system</dt>
            <dd>{planet.rings ? "Yes" : "No"}</dd>
          </div>
        </dl>
      </section>
      <nav className="planet-pagination" aria-label="Related planets">
        <Link
          data-testid="planet-previous"
          to={`/universe/planets/${previous.slug}`}
        >
          ← {previous.name}
        </Link>
        <Link data-testid="planet-next" to={`/universe/planets/${next.slug}`}>
          {next.name} →
        </Link>
      </nav>
      <References />
    </Experience>
  );
}
export function PlanetComparison() {
  const [params, setParams] = useHydratedParams();
  const raw = params.get("planets");
  const parseSelection = (value: string | null) =>
    value === null
      ? [planets[2], planets[3]]
      : planets.filter((p) => value.split(",").includes(p.slug)).slice(0, 4);
  const [selected, setSelected] = useState(() => parseSelection(raw));
  const [lastRaw, setLastRaw] = useState(raw);
  // Keep native checkbox feedback synchronous; URL navigation is a transition.
  // External navigation (including Back) still restores the URL selection.
  if (raw !== lastRaw) {
    setLastRaw(raw);
    setSelected(parseSelection(raw));
  }
  const [metric, setMetric] = useState<Metric>("diameter");
  const chosen = metrics.find((m) => m[0] === metric)!;
  const toggle = (slug: string) => {
    const slugs = selected.map((p) => p.slug);
    const next = slugs.includes(slug)
      ? slugs.filter((s) => s !== slug)
      : [...slugs, slug].slice(0, 4);
    setSelected(planets.filter((p) => next.includes(p.slug)));
    setParams({ planets: next.join(",") });
  };
  const min = Math.min(0, ...selected.map((p) => p[metric]));
  const max = Math.max(0, ...selected.map((p) => p[metric]));
  const span = max - min || 1;
  const zero = (-min / span) * 100;
  return (
    <Experience
      title="Worlds, side by side"
      eyebrow="PLANET COMPARISON"
      intro="Choose up to four planets. Compare the same measurements, with their units and scientific context kept in view."
    >
      <div className="feature-links">
        <Link to="/universe/planets">Browse all planets ↗</Link>
      </div>
      <fieldset className="comparison-picker">
        <legend>Choose planets · up to four</legend>
        {planets.map((p) => (
          <label key={p.slug}>
            <input
              type="checkbox"
              data-testid={`compare-select-${p.slug}`}
              checked={selected.includes(p)}
              disabled={selected.length === 4 && !selected.includes(p)}
              onChange={() => toggle(p.slug)}
            />
            {p.name}
          </label>
        ))}
      </fieldset>
      <p role="status" data-testid="compare-status">
        {selected.length} planets selected.{" "}
        {selected.length < 2
          ? "Choose at least two to compare."
          : "Your selection is saved in the URL."}
      </p>
      {selected.length >= 2 && (
        <>
          <p className="comparison-hint">
            On narrow screens, swipe the table sideways to see every planet.
            Keyboard users can focus the table and use the arrow keys.
          </p>
          <div
            className="comparison-scroll"
            tabIndex={0}
            role="region"
            aria-label="Planet comparison table"
          >
            <table data-testid="planet-comparison">
              <caption>
                NASA reference measurements · March 2025 snapshot
              </caption>
              <thead>
                <tr>
                  <th scope="col">Measurement</th>
                  {selected.map((p) => (
                    <th scope="col" key={p.slug}>
                      <Link to={`/universe/planets/${p.slug}`}>{p.name}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map(([key, label, unit]) => (
                  <tr key={key}>
                    <th scope="row">
                      {label} ({unit})
                    </th>
                    {selected.map((p) => (
                      <td key={p.slug} data-testid={`compare-${p.slug}-${key}`}>
                        {number(p[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <section className="comparison-chart" aria-label="Measurement chart">
            <label>
              Chart measurement
              <select
                data-testid="compare-metric"
                value={metric}
                onChange={(e) => setMetric(e.target.value as Metric)}
              >
                {metrics.map(([key, label, unit]) => (
                  <option key={key} value={key}>
                    {label} ({unit})
                  </option>
                ))}
              </select>
            </label>
            <p>
              Linear scale · zero at {number(zero)}% of the chart width.
              Negative values extend left of zero.
            </p>
            <ul>
              {selected.map((p) => (
                <li key={p.slug}>
                  <span>{p.name}</span>
                  <div className="comparison-track" aria-hidden="true">
                    <i
                      className="comparison-zero"
                      style={{ left: `${zero}%` }}
                    />
                    <i
                      className="comparison-bar"
                      style={{
                        left: `${((Math.min(0, p[metric]) - min) / span) * 100}%`,
                        width: `${(Math.abs(p[metric]) / span) * 100}%`,
                      }}
                    />
                  </div>
                  <strong data-testid={`chart-value-${p.slug}`}>
                    {number(p[metric])} {chosen[2]}
                  </strong>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      <References />
    </Experience>
  );
}
