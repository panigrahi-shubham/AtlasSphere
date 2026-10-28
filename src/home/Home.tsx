import { useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Compass,
  Gamepad2,
  Globe2,
  Layers3,
  MapPin,
  Mountain,
  Orbit,
  Sparkles,
  Telescope,
} from "lucide-react";
import Search from "./Search";
import EarthGlobe from "./globe/EarthGlobe";
import { explorerLink, type Place } from "./placeSearch";
import {
  astronomyFacts,
  earthScienceTopics,
  historyTopics,
  scienceImages,
  universeCategories,
} from "./data/discoveries";
import photos from "../data/photos.json";
import { landmarks } from "../data/landmarks.js";
import { photoRenditions } from "./data/photoRenditions";

function photoProps(original: string, sizes: string) {
  const photo = photoRenditions[original];
  return photo
    ? {
        src: photo.src,
        srcSet: `${photo.small} 480w, ${photo.src} ${photo.width}w`,
        sizes,
      }
    : { src: original };
}

const photoMap = photos as Record<
  string,
  {
    src: string;
    author: string;
    license: string;
    licenseUrl: string;
    source: string;
    alt: string;
  }
>;
const planetCards = [
  {
    title: "Continents",
    description: "See how our world fits together.",
    photo: "Serengeti National Park",
    tag: "THE BIG PICTURE",
    href: "/explore.html#atlas-section",
  },
  {
    title: "Countries",
    description: "A world of places, people and possibility.",
    photo: "Taj Mahal",
    tag: "CROSS A BORDER",
    href: "/explore.html#atlas-section",
  },
  {
    title: "Mountains",
    description: "Find a different perspective.",
    photo: "The Dolomites",
    tag: "REACH NEW HEIGHTS",
    href: "/explore.html#landmarks-worldwide",
  },
  {
    title: "Oceans",
    description: "Explore our extraordinary blue planet.",
    photo: "Great Barrier Reef",
    tag: "BENEATH THE SURFACE",
    href: "/#earth-science",
  },
  {
    title: "Rivers",
    description: "Follow the landscapes shaped by water.",
    photo: "Grand Canyon National Park",
    href: "/explore.html#landmarks-worldwide",
  },
  {
    title: "Deserts",
    description: "Discover life and history at the extremes.",
    photo: "Pyramids of Giza",
    href: "/explore.html#landmarks-worldwide",
  },
  {
    title: "Islands",
    description: "Look closer at worlds surrounded by water.",
    photo: "Mont-Saint-Michel and its Bay",
    href: "/explore.html#landmarks-worldwide",
  },
  {
    title: "Natural Wonders",
    description: "Meet the remarkable places worth knowing.",
    photo: "Los Glaciares National Park",
    href: "/#destinations",
  },
];
function SectionHeading({
  number,
  eyebrow,
  title,
  children,
  action,
}: {
  number: string;
  eyebrow: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">
          <span className="section-number">{number}</span>
          {eyebrow}
        </span>
        <h2>{title}</h2>
        {children && <p>{children}</p>}
      </div>
      {action}
    </div>
  );
}
function PhotoCredit({ name }: { name: string }) {
  const p = photoMap[name];
  return (
    <a
      className="photo-credit"
      href={p.source}
      target="_blank"
      rel="noreferrer"
      title={`${p.author} · ${p.license}`}
    >
      Photo: {p.author.trim()} · {p.license}
    </a>
  );
}
export default function Home() {
  const [place, setPlace] = useState<Place | null>(null);
  const [space, setSpace] = useState(0);
  const [fact, setFact] = useState(0);
  const [science, setScience] = useState(0);
  const [history, setHistory] = useState(0);
  const topic = universeCategories[space],
    insight = astronomyFacts[fact],
    scienceTopic = earthScienceTopics[science],
    historyTopic = historyTopics[history];
  return (
    <main id="home-main" tabIndex={-1}>
      <section
        className="home-hero home-container"
        aria-labelledby="home-title"
      >
        <div className="hero-copy">
          <div className="hero-kicker">
            <span />A WORLD OF WONDER AWAITS
          </div>
          <h1 id="home-title">
            Explore Earth
            <br /> <span>and Beyond.</span>
          </h1>
          <p className="hero-description">
            Discover our planet, explore distant worlds, and uncover the science
            and history of the universe.
          </p>
          <div className="hero-actions">
            <a
              href="/explore.html#atlas-section"
              data-testid="home-explore-earth"
              className="button primary"
            >
              <Globe2 size={18} />
              Explore Earth
              <ArrowUpRight size={17} />
            </a>
            <a
              href="#universe"
              data-testid="home-discover-space"
              className="button secondary"
            >
              Discover Space
              <ArrowRight size={18} />
            </a>
          </div>
          <Search onSelect={setPlace} />
          <div className="hero-footnote">
            <Compass size={15} />
            <span>No sign-up needed. Just bring your curiosity.</span>
          </div>
        </div>
        <div className="hero-earth">
          <div className="earth-heading">
            <span className="eyebrow">01 / OUR HOME PLANET</span>
            <span className="earth-coordinate">EARTH · SOLAR SYSTEM</span>
          </div>
          <EarthGlobe
            selected={place}
            onSelect={(selected) =>
              setPlace({
                ...selected,
                id: selected.name,
                country: "",
                region: "",
              })
            }
          />
        </div>
        <a className="scroll-cue" href="#introduction">
          <ArrowDown size={16} />
          SCROLL TO DISCOVER
        </a>
      </section>
      <div className="discovery-strip">
        <div className="home-container">
          <span>
            <Globe2 size={18} />
            Real places.
          </span>
          <span>
            <Telescope size={18} />
            Remarkable science.
          </span>
          <span>
            <BookOpen size={18} />A little more wonder.
          </span>
          <a href="/sources">
            Grounded in trusted sources
            <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
      <section
        id="introduction"
        className="home-container home-section introduction"
      >
        <div className="intro-heading">
          <span className="eyebrow">WELCOME TO ATLASSPHERE</span>
          <h2>
            Curiosity has
            <br />
            no boundaries.
          </h2>
        </div>
        <div className="intro-body">
          <p>
            From the mountains beneath our feet to the galaxies above our heads,
            there’s always more to discover.
          </p>
          <p className="muted">
            AtlasSphere brings geography and astronomy together. Explore our
            living planet, get to know distant worlds, and find the stories that
            connect them.
          </p>
          <a className="text-link" href="/about.html">
            A place for the endlessly curious <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="discovery-paths">
          {[
            {
              icon: Globe2,
              label: "Explore Geography",
              sub: "Get to know your world",
              href: "/explore.html#atlas-section",
              image: "/images/great-barrier-reef.jpg",
            },
            {
              icon: Orbit,
              label: "Discover the Solar System",
              sub: "Curated preview · explorer coming soon",
              href: "#universe",
              image: scienceImages.saturn.src,
            },
            {
              icon: Layers3,
              label: "Learn Earth Science",
              sub: "The forces that shape our planet",
              href: "#earth-science",
              image: "/images/fujisan.jpg",
            },
            {
              icon: BookOpen,
              label: "Travel Through History",
              sub: "Curated stories · explorer coming soon",
              href: "#history",
              image: "/images/pyramids-of-giza.jpg",
            },
            {
              icon: Gamepad2,
              label: "Play Educational Games",
              sub: "Put your geography to the test",
              href: "/geoguess",
              image: "/images/machu-picchu.jpg",
            },
          ].map(({ icon: Icon, label, sub, href, image }) => (
            <a href={href} key={label} className="discovery-path">
              <img
                {...photoProps(image, "80px")}
                alt=""
                width="80"
                height="80"
                loading="lazy"
              />
              <Icon size={20} />
              <span>
                <strong>{label}</strong>
                <small>{sub}</small>
              </span>
              <ArrowUpRight size={16} />
            </a>
          ))}
        </div>
      </section>
      <section id="planet" className="home-container home-section">
        <SectionHeading
          number="01"
          eyebrow="EARTH, UP CLOSE"
          title="Extraordinary starts here."
          action={
            <a className="text-link" href="/explore.html#atlas-section">
              Open the world atlas <ArrowUpRight size={18} />
            </a>
          }
        >
          From familiar coastlines to places you’ve never imagined.
        </SectionHeading>
        <div className="planet-grid">
          {planetCards.map((card, index) => (
            <article
              className={`planet-card ${index < 4 ? "planet-card-featured" : ""}`}
              key={card.title}
            >
              <a
                href={card.href}
                data-testid={`home-category-${card.title.toLowerCase().replaceAll(" ", "-")}`}
              >
                <div className="image-frame">
                  <img
                    {...photoProps(
                      photoMap[card.photo].src,
                      "(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 300px",
                    )}
                    alt={photoMap[card.photo].alt}
                    width="640"
                    height="480"
                    loading="lazy"
                  />
                  <span className="round-arrow">
                    <ArrowUpRight size={20} />
                  </span>
                </div>
                <div className="planet-card-content">
                  {card.tag && <span className="eyebrow">{card.tag}</span>}
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
              </a>
              <PhotoCredit name={card.photo} />
            </article>
          ))}
        </div>
      </section>
      <section id="universe" className="universe-section home-section">
        <div className="home-container">
          <SectionHeading
            number="02"
            eyebrow="LOOK A LITTLE FURTHER"
            title="A universe of possibilities."
          >
            Our planet is just the beginning. Meet the worlds beyond it.
          </SectionHeading>
          <div className="universe-feature">
            <div className="saturn-image">
              <img
                src={scienceImages.saturn.src}
                srcSet={`${scienceImages.saturn.small} 640w, ${scienceImages.saturn.src} 1600w`}
                sizes="(max-width: 760px) 100vw, 60vw"
                alt={scienceImages.saturn.alt}
                width={scienceImages.saturn.width}
                height={scienceImages.saturn.height}
                loading="lazy"
              />
              <a
                href={scienceImages.saturn.source}
                target="_blank"
                rel="noreferrer"
                className="photo-credit"
              >
                {scienceImages.saturn.credit} · Cassini
              </a>
            </div>
            <div className="universe-copy">
              <span className="eyebrow">THE NEXT FRONTIER</span>
              <h3>
                There’s a whole
                <br />
                universe out there.
              </h3>
              <p>
                Eight planets. One extraordinary star. Countless questions
                waiting to be asked.
              </p>
              <a
                className="button outline-light"
                href="/universe/solar-system"
                data-testid="home-solar-system"
              >
                Explore the Solar System
                <ArrowRight size={17} />
              </a>
              <span className="coming-soon">
                Interactive 3D · Eight worlds to explore
              </span>
            </div>
          </div>
          <div className="topic-buttons" aria-label="Explore universe topics">
            {universeCategories.map((entry, index) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={space === index}
                onClick={() => setSpace(index)}
                data-testid={`home-space-${entry.id}`}
              >
                {entry.title}
              </button>
            ))}
          </div>
          <div
            className="topic-description"
            data-testid="home-space-detail"
            aria-live="polite"
          >
            <Orbit size={28} />
            <div>
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
            </div>
            <a href={topic.source} target="_blank" rel="noreferrer">
              Read at {topic.sourceLabel}
              <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </section>
      <section id="destinations" className="home-container home-section">
        <SectionHeading
          number="03"
          eyebrow="PLACES THAT STAY WITH YOU"
          title="Your next sense of wonder."
          action={
            <a className="text-link" href="/explore.html#landmarks-worldwide">
              All 16 destinations
              <ArrowUpRight size={18} />
            </a>
          }
        >
          Real places. Remarkable stories. A closer look is always worth it.
        </SectionHeading>
        <div className="destination-grid">
          {[
            {
              name: "The Dolomites",
              country: "Italy",
              category: "MOUNTAIN LANDSCAPE",
            },
            {
              name: "Machu Picchu",
              country: "Peru",
              category: "CULTURAL HERITAGE",
            },
            {
              name: "Great Barrier Reef",
              country: "Australia",
              category: "NATURAL WONDER",
            },
          ].map((destination) => {
            const landmark = landmarks.find(
              (item) => item.name === destination.name,
            )!;
            return (
              <article key={destination.name} className="destination-card">
                <a
                  href={explorerLink({
                    ...landmark,
                    country: destination.country,
                  })}
                  data-testid={`home-destination-${destination.country.toLowerCase()}`}
                  className="destination-visual"
                >
                  <img
                    {...photoProps(
                      photoMap[destination.name].src,
                      "(max-width: 760px) 90vw, 400px",
                    )}
                    alt={photoMap[destination.name].alt}
                    width="640"
                    height="480"
                    loading="lazy"
                  />
                  <span className="destination-category">
                    {destination.category}
                  </span>
                  <div>
                    <span>
                      <MapPin size={13} />
                      {destination.country}
                    </span>
                    <h3>{destination.name}</h3>
                  </div>
                  <span className="round-arrow">
                    <ArrowUpRight size={21} />
                  </span>
                </a>
                <p>{landmark.fact}</p>
                <div className="destination-credit">
                  <a href={landmark.source} target="_blank" rel="noreferrer">
                    UNESCO source
                    <ArrowUpRight size={12} />
                  </a>
                  <PhotoCredit name={destination.name} />
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section
        id="astronomy"
        className="home-container home-section astronomy-section"
      >
        <div className="nebula-visual">
          <img
            src={scienceImages.nebula.src}
            srcSet={`${scienceImages.nebula.small} 640w, ${scienceImages.nebula.src} 1200w`}
            sizes="(max-width: 760px) 100vw, 45vw"
            alt={scienceImages.nebula.alt}
            width={1200}
            height={1123}
            loading="lazy"
          />
          <div>
            <span className="eyebrow">SEEN THROUGH A DIFFERENT LENS</span>
            <h2>
              Wonder,
              <br />
              on a cosmic scale.
            </h2>
            <p>The Pillars of Creation, through Webb’s eyes.</p>
          </div>
          <a
            className="photo-credit"
            href={scienceImages.nebula.source}
            target="_blank"
            rel="noreferrer"
          >
            NASA / ESA / CSA / STScI · Full credits in Data Sources
          </a>
        </div>
        <div className="astronomy-insight">
          <span className="eyebrow">04 / SMALL FACTS. BIG PERSPECTIVES.</span>
          <h2>
            A little knowledge.
            <br />A bigger universe.
          </h2>
          <div className="fact-selector" aria-label="Astronomy discoveries">
            {astronomyFacts.map((entry, index) => (
              <button
                type="button"
                key={entry.id}
                aria-pressed={fact === index}
                data-testid={`home-fact-${entry.id}`}
                onClick={() => setFact(index)}
              >
                {entry.title}
              </button>
            ))}
          </div>
          <div
            className="fact-detail"
            data-testid="home-fact-detail"
            aria-live="polite"
          >
            <span className="fact-value">
              {insight.value}
              <small>{insight.unit}</small>
            </span>
            <h3>{insight.label}</h3>
            <p>{insight.description}</p>
            <small>
              {insight.approximate ? "Approximate value" : "Reference value"} ·
              Source checked {insight.verifiedAt}
            </small>
            <a
              className="text-link"
              href={insight.source}
              target="_blank"
              rel="noreferrer"
            >
              {insight.sourceLabel}
              <ArrowUpRight size={15} />
            </a>
          </div>
          <p className="image-note">
            About the image: {scienceImages.nebula.note}
          </p>
        </div>
      </section>
      <section id="earth-science" className="science-section home-section">
        <div className="home-container">
          <SectionHeading
            number="05"
            eyebrow="A PLANET THAT NEVER STANDS STILL"
            title="Discover the science beneath the surface."
          >
            From moving plates to ocean currents, everything is connected.
          </SectionHeading>
          <div className="science-layout">
            <div className="science-photo">
              <img
                {...photoProps(
                  "/images/fujisan.jpg",
                  "(max-width: 760px) 90vw, 550px",
                )}
                alt="Mount Fuji rising above the surrounding volcanic landscape"
                width="900"
                height="600"
                loading="lazy"
              />
              <PhotoCredit name="Fujisan" />
              <span className="science-photo-label">
                <Mountain size={20} />
                FUJISAN, JAPAN
              </span>
            </div>
            <div className="science-content">
              <div className="topic-buttons" aria-label="Earth science topics">
                {earthScienceTopics.map((entry, index) => (
                  <button
                    type="button"
                    key={entry.id}
                    aria-pressed={science === index}
                    data-testid={`home-science-${entry.id}`}
                    onClick={() => setScience(index)}
                  >
                    {entry.title}
                  </button>
                ))}
              </div>
              <div aria-live="polite" data-testid="home-science-detail">
                <span className="eyebrow">CURATED FIELD NOTES</span>
                <h3>{scienceTopic.title}</h3>
                <p>{scienceTopic.description}</p>
                <a
                  className="text-link"
                  href={scienceTopic.source}
                  target="_blank"
                  rel="noreferrer"
                >
                  Continue reading at {scienceTopic.sourceLabel}
                  <ArrowUpRight size={16} />
                </a>
                <small className="coming-soon">
                  Live earthquake explorer · Coming soon
                </small>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="history" className="home-container home-section">
        <SectionHeading
          number="06"
          eyebrow="LOOK BACK. SEE FURTHER."
          title="Every place has a past."
        >
          Discover the ideas, journeys and civilizations that changed our view
          of the world.
        </SectionHeading>
        <div className="history-layout">
          <div className="history-content">
            <BookOpen size={32} />
            <div className="history-topics" aria-label="History topics">
              {historyTopics.map((entry, index) => (
                <button
                  type="button"
                  key={entry.id}
                  aria-pressed={history === index}
                  onClick={() => setHistory(index)}
                  data-testid={`home-history-${entry.id}`}
                >
                  {entry.title}
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
            <div className="history-detail" aria-live="polite">
              <h3>{historyTopic.title}</h3>
              <p>{historyTopic.description}</p>
              <a
                className="text-link"
                href={historyTopic.source}
                target="_blank"
                rel="noreferrer"
              >
                Read the story · {historyTopic.sourceLabel}
                <ArrowUpRight size={15} />
              </a>
            </div>
            <span className="coming-soon">
              Interactive history explorer · Coming soon
            </span>
          </div>
          <figure className="history-photo">
            <img
              {...photoProps(
                "/images/pyramids-of-giza.jpg",
                "(max-width: 760px) 90vw, 650px",
              )}
              alt="The pyramids of Giza in the Egyptian desert"
              width="1000"
              height="700"
              loading="lazy"
            />
            <figcaption>
              <span>GIZA, EGYPT</span>
              <PhotoCredit name="Pyramids of Giza" />
            </figcaption>
          </figure>
        </div>
      </section>
      <section
        id="learning"
        className="home-container home-section learning-section"
      >
        <div className="learning-copy">
          <span className="eyebrow">07 / TURN CURIOSITY INTO DISCOVERY</span>
          <h2>
            How well do you
            <br />
            know your world?
          </h2>
          <p>
            A familiar landmark. An unexpected outline. Put your sense of place
            to the test with GeoGuess.
          </p>
          <a
            className="button primary"
            href="/geoguess"
            data-testid="home-play-geoguess"
          >
            <Gamepad2 size={18} />
            Let’s play GeoGuess
            <ArrowUpRight size={17} />
          </a>
          <a className="text-link" href="/geoguess">
            Your saved scores live in GeoGuess
            <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="learning-games">
          <a href="/geoguess" className="learning-game">
            <span className="game-symbol">
              <MapPin size={31} />
            </span>
            <div>
              <span className="eyebrow">FIVE ROUNDS. ONE WORLD.</span>
              <h3>Pin the landmark</h3>
              <p>Spot a place. Drop a pin. See how close you get.</p>
            </div>
            <ArrowUpRight size={23} />
          </a>
          <a href="/geoguess" className="learning-game">
            <span className="game-symbol">
              <Globe2 size={31} />
            </span>
            <div>
              <span className="eyebrow">A DIFFERENT PERSPECTIVE</span>
              <h3>Name that country</h3>
              <p>Recognize a country from its outline.</p>
            </div>
            <ArrowUpRight size={23} />
          </a>
          <div className="future-games">
            <Sparkles size={18} />
            <span>Flag, capital and astronomy quizzes</span>
            <span className="coming-soon">Coming soon</span>
          </div>
        </div>
      </section>
      <section className="closing-note home-container">
        <Compass size={27} />
        <p>
          The more you explore,
          <br />
          <strong>the more there is to discover.</strong>
        </p>
        <a className="text-link" href="#home-title">
          Find your next discovery
          <ArrowUpRight size={17} />
        </a>
      </section>
    </main>
  );
}
