import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  MapPin,
  Search as SearchIcon,
  X,
  LoaderCircle,
} from "lucide-react";
import { explorerLink, findPlaces, type Place } from "./placeSearch";

export default function Search({
  onSelect,
}: {
  onSelect: (place: Place | null) => void;
}) {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [selected, setSelected] = useState<Place | null>(null);
  const [validation, setValidation] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 350);
    return () => clearTimeout(timer);
  }, [term]);
  const ready = debounced.length >= 2 && term.trim() === debounced && open;
  const query = useQuery({
    queryKey: ["home-places", debounced],
    queryFn: ({ signal }) => findPlaces(debounced, signal),
    enabled: ready,
    staleTime: 86400000,
    gcTime: 1800000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const results = ready ? (query.data ?? []) : [];
  const choose = (place: Place) => {
    setSelected(place);
    onSelect(place);
    setOpen(false);
    setActive(-1);
    input.current?.focus();
  };
  return (
    <div className="geographic-search" data-testid="home-search">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (term.trim().length < 2) {
            setValidation("Enter at least 2 characters to find a place.");
            input.current?.focus();
            return;
          }
          setValidation("");
          setOpen(true);
          setDebounced(term.trim());
          if (active >= 0 && results[active]) choose(results[active]);
          else if (query.isError) void query.refetch();
        }}
      >
        <label className="sr-only" htmlFor="home-search-input">
          Search cities and places
        </label>
        <div className="search-field">
          <SearchIcon size={20} aria-hidden="true" />
          <input
            id="home-search-input"
            data-testid="home-search-input"
            ref={input}
            value={term}
            maxLength={80}
            placeholder="Where will curiosity take you?"
            autoComplete="off"
            role="combobox"
            aria-expanded={open && results.length > 0}
            aria-controls="home-search-results"
            aria-autocomplete="list"
            aria-activedescendant={
              active >= 0 ? `home-result-${active}` : undefined
            }
            aria-describedby="home-search-status"
            onChange={(event) => {
              setTerm(event.target.value);
              setOpen(true);
              setSelected(null);
              onSelect(null);
              setActive(-1);
              setValidation("");
            }}
            onFocus={() => {
              if (!selected) setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false);
                setActive(-1);
              }
              if (event.key === "ArrowDown" && results.length) {
                event.preventDefault();
                setOpen(true);
                setActive(Math.min(active + 1, results.length - 1));
              }
              if (event.key === "ArrowUp" && results.length) {
                event.preventDefault();
                setActive(Math.max(0, active - 1));
              }
            }}
          />
          {term && (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear place search"
              data-testid="home-search-clear"
              onClick={() => {
                setTerm("");
                setOpen(false);
                setSelected(null);
                setValidation("");
                onSelect(null);
                input.current?.focus();
              }}
            >
              <X size={17} />
            </button>
          )}
          <button
            className="search-submit"
            type="submit"
            data-testid="home-search-submit"
            aria-label="Search places"
          >
            {query.isFetching && ready ? (
              <LoaderCircle size={19} className="spin" />
            ) : (
              <ArrowUpRight size={20} />
            )}
          </button>
        </div>
      </form>
      <p
        id="home-search-status"
        className="search-status"
        role="status"
        data-testid="home-search-status"
      >
        {validation ||
          (open && ready
            ? query.isFetching
              ? "Finding places…"
              : query.isError
                ? query.error.message
                : query.isSuccess && !results.length
                  ? "No places found. Try a nearby city or a different spelling."
                  : results.length
                    ? `${results.length} matching places. Use arrow keys and Enter to select.`
                    : ""
            : "")}
      </p>
      {open && results.length > 0 && (
        <ul
          id="home-search-results"
          className="search-results"
          role="listbox"
          aria-label="Matching places"
          data-testid="home-search-results"
        >
          {results.map((p, index) => (
            <li
              key={p.id}
              id={`home-result-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(p)}
            >
              <MapPin size={17} />
              <span>
                <strong>{p.name}</strong>
                <small>
                  {[p.region, p.country].filter(Boolean).join(", ")}
                </small>
              </span>
              <ArrowUpRight size={17} />
            </li>
          ))}
        </ul>
      )}
      {selected ? (
        <div className="selected-place" data-testid="home-selected-place">
          <MapPin size={18} />
          <span>
            <strong>
              {selected.name}, {selected.country}
            </strong>
            <small>
              {selected.latitude.toFixed(3)}°, {selected.longitude.toFixed(3)}°
            </small>
          </span>
          <a data-testid="home-place-weather" href={explorerLink(selected)}>
            Weather & atlas <ArrowUpRight size={14} />
          </a>
        </div>
      ) : (
        <div className="search-suggestions">
          <span>Try somewhere new</span>
          {["Kyoto", "Reykjavík", "Cape Town"].map((city) => (
            <button
              key={city}
              type="button"
              data-testid={`home-search-${city.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              onClick={() => {
                setTerm(city);
                setOpen(true);
                setSelected(null);
                onSelect(null);
                setActive(-1);
                input.current?.focus();
              }}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
