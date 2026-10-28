import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import photos from "../data/photos.json";
import {
  scienceImages,
  universeCategories,
  astronomyFacts,
  earthScienceTopics,
  historyTopics,
} from "./data/discoveries";

export default function Information({
  kind,
}: {
  kind: "sources" | "privacy" | "accessibility" | "missing";
}) {
  const title = {
    sources: "A world of trusted sources.",
    privacy: "Your privacy, explained.",
    accessibility: "Exploration is for everyone.",
    missing: "This place is still undiscovered.",
  }[kind];
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${title} — AtlasSphere`;
    document.getElementById("information-title")?.focus();
    return () => {
      document.title = "AtlasSphere — Explore Earth and Beyond";
    };
  }, [title]);
  return (
    <main id="home-main" className="home-container information">
      <Link className="text-link" to="/">
        <ArrowLeft size={16} />
        Back to discovery
      </Link>
      <h1 id="information-title" tabIndex={-1}>
        {title}
      </h1>
      {kind === "sources" ? (
        <>
          <p>
            AtlasSphere is an independent educational project. Scientific
            content is curated, source-linked and distinct from live
            observations. Imagery does not imply endorsement by its creators.
          </p>
          <h2>Earth, maps and weather</h2>
          <ul>
            <li>
              <a href="https://svs.gsfc.nasa.gov/2915/">
                NASA Blue Marble (2002)
              </a>{" "}
              — Globe texture. NASA/GSFC Scientific Visualization Studio; Blue
              Marble data courtesy Reto Stöckli and NASA Earth Observatory.
              Public-domain NASA visualization, locally resized and encoded as
              WebP. A composite, not a live view.
            </li>
            <li>
              <a href="https://science.nasa.gov/image-detail/amf-gsfc_20171208_archive_e001788/">
                Eastern Hemisphere — Blue Marble 2012
              </a>{" "}
              — Static Earth hero. NASA/NOAA, compiled by Norman Kuring from
              Suomi NPP observations. Reused under NASA media guidelines;
              locally resized and WebP encoded. Historical composite, not live
              imagery.
            </li>
            <li>
              <a href="https://www.naturalearthdata.com/about/terms-of-use/">
                Natural Earth
              </a>{" "}
              via world-atlas — generalized country boundaries, public domain.
            </li>
            <li>
              <a href="https://github.com/mledoze/countries">
                mledoze/countries
              </a>{" "}
              — bundled country metadata, ODbL; no claims about disputed
              borders.
            </li>
            <li>
              <a href="https://open-meteo.com/">
                Weather data by Open-Meteo.com
              </a>{" "}
              — geographic search uses GeoNames via Open-Meteo. Weather data is
              modelled, not an emergency warning service.
            </li>
          </ul>
          <h2>Space imagery</h2>
          <ul>
            {Object.values(scienceImages).map((image) => (
              <li key={image.src}>
                <a href={image.source}>{image.alt}</a>
                <br />
                {image.credit}. NASA educational media reuse; image credits
                retained. Locally resized and WebP encoded.
              </li>
            ))}
          </ul>
          <p>
            {scienceImages.nebula.note} See{" "}
            <a href="https://www.nasa.gov/nasa-brand-center/images-and-media/">
              NASA media usage guidelines
            </a>{" "}
            and{" "}
            <a href="https://www.jpl.nasa.gov/jpl-image-use-policy/">
              JPL image policy
            </a>
            .
          </p>
          <h2>Geographic photographs</h2>
          <p>
            The original files and their credits are retained. Responsive WebP
            copies use the same licenses. Cards may crop their display;
            attribution and license links are provided below.
          </p>
          <div className="source-list">
            {Object.entries(photos).map(([name, p]) => (
              <article key={name}>
                <h3>{name}</h3>
                <p>
                  {p.author.trim()} · <a href={p.licenseUrl}>{p.license}</a>
                </p>
                <a href={p.source}>
                  Original image and attribution
                  <ArrowUpRight size={14} />
                </a>
              </article>
            ))}
          </div>
          <h2>Scientific and historical reading</h2>
          <p>
            References checked 28 October 2026. Approximate values are labelled;
            full interactive astronomy and history explorers are coming soon.
          </p>
          <ul>
            {[
              ...universeCategories,
              ...astronomyFacts,
              ...earthScienceTopics,
              ...historyTopics,
            ].map((item, index) => (
              <li key={`${item.id}-${index}`}>
                <a href={item.source}>
                  {item.title} — {item.sourceLabel}
                </a>
              </li>
            ))}
          </ul>
          <h2>Typography and software</h2>
          <p>
            Manrope, locally served through Fontsource, uses the SIL Open Font
            License. React, Vite, Tailwind, Lucide and supporting libraries
            retain their open-source licenses. Full asset filenames and licenses
            are recorded in the repository’s ATTRIBUTION.md.
          </p>
        </>
      ) : kind === "privacy" ? (
        <>
          <p>
            You can browse and play without creating an account. This homepage
            adds no analytics, advertising or tracking cookies.
          </p>
          <h2>Search and location</h2>
          <p>
            When you search, your query is sent through our server to
            Open-Meteo’s geographic service. Selecting a result is local until
            you open the weather explorer. Using browser location in the
            explorer requires your permission.
          </p>
          <h2>Local preferences</h2>
          <p>
            Your theme, anonymous favorites and GeoGuess scores can be stored in
            your browser. The homepage caches recent geographic results in
            memory. Clearing browser storage removes local preferences.
          </p>
          <h2>Accounts and saved data</h2>
          <p>
            The existing account service stores account information and saved
            journeys in PostgreSQL. Session cookies are used for sign-in. You
            can export your data or delete your account from the account section
            of the explorer.
          </p>
          <h2>External sources</h2>
          <p>
            Source links open third-party websites governed by their own privacy
            practices. NASA imagery on this homepage is served locally. The
            separate Journeys satellite viewer contacts NASA only when you
            request imagery.
          </p>
          <a className="button secondary" href="/explore.html#account-section">
            Manage your account
            <ArrowUpRight size={16} />
          </a>
        </>
      ) : kind === "accessibility" ? (
        <>
          <p>
            Use the skip link to jump past navigation. All essential
            interactions have keyboard alternatives and visible focus states.
          </p>
          <h2>Navigation and search</h2>
          <p>
            Open the menu at any screen size. Tab stays within the open menu;
            Escape closes it and returns focus to the menu button. In place
            search, use arrow keys to review results and Enter to select, or
            select with a pointer.
          </p>
          <h2>The Earth globe</h2>
          <p>
            The static Earth image loads first. The optional 3D view supports
            keyboard rotation, zoom buttons and a country selector. A static
            view remains available if WebGL fails. Rotation is optional and
            respects reduced-motion preferences.
          </p>
          <h2>Appearance</h2>
          <p>
            Light and dark themes are available. Reduced motion disables
            decorative transitions. Layouts are designed for small screens and
            zoom. Automated accessibility checks supplement, but do not replace,
            assistive-technology review.
          </p>
          <a
            className="text-link"
            href="https://github.com/panigrahi-shubham/AtlasSphere/issues"
          >
            Report an accessibility issue
            <ArrowUpRight size={16} />
          </a>
        </>
      ) : (
        <p>
          <Link to="/">Return to the homepage</Link> or{" "}
          <a href="/explore.html">open the world explorer</a>.
        </p>
      )}
    </main>
  );
}
