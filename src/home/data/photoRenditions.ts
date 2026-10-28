/** Proportional WebP derivatives; original photographs and their licenses are preserved. */
export interface PhotoRendition {
  src: string;
  small: string;
  width: number;
  height: number;
}

export const photoRenditions: Record<string, PhotoRendition> = {
  "/images/alpine-lake.jpg": {
    src: "/images/discovery/alpine-lake-960.webp",
    small: "/images/discovery/alpine-lake-480.webp",
    width: 960,
    height: 640,
  },
  "/images/central-amazon-conservation-complex.jpg": {
    src: "/images/discovery/central-amazon-conservation-complex-960.webp",
    small: "/images/discovery/central-amazon-conservation-complex-480.webp",
    width: 960,
    height: 639,
  },
  "/images/fujisan.jpg": {
    src: "/images/discovery/fujisan-960.webp",
    small: "/images/discovery/fujisan-480.webp",
    width: 960,
    height: 469,
  },
  "/images/grand-canyon-national-park.jpg": {
    src: "/images/discovery/grand-canyon-national-park-960.webp",
    small: "/images/discovery/grand-canyon-national-park-480.webp",
    width: 960,
    height: 616,
  },
  "/images/great-barrier-reef.jpg": {
    src: "/images/discovery/great-barrier-reef-960.webp",
    small: "/images/discovery/great-barrier-reef-480.webp",
    width: 960,
    height: 639,
  },
  "/images/great-wall.jpg": {
    src: "/images/discovery/great-wall-960.webp",
    small: "/images/discovery/great-wall-480.webp",
    width: 960,
    height: 638,
  },
  "/images/los-glaciares-national-park.jpg": {
    src: "/images/discovery/los-glaciares-national-park-960.webp",
    small: "/images/discovery/los-glaciares-national-park-480.webp",
    width: 960,
    height: 411,
  },
  "/images/machu-picchu.jpg": {
    src: "/images/discovery/machu-picchu-960.webp",
    small: "/images/discovery/machu-picchu-480.webp",
    width: 960,
    height: 640,
  },
  "/images/mont-saint-michel-and-its-bay.jpg": {
    src: "/images/discovery/mont-saint-michel-and-its-bay-960.webp",
    small: "/images/discovery/mont-saint-michel-and-its-bay-480.webp",
    width: 960,
    height: 540,
  },
  "/images/pyramids-of-giza.jpg": {
    src: "/images/discovery/pyramids-of-giza-960.webp",
    small: "/images/discovery/pyramids-of-giza-480.webp",
    width: 960,
    height: 400,
  },
  "/images/sagarmatha-national-park.jpg": {
    src: "/images/discovery/sagarmatha-national-park-960.webp",
    small: "/images/discovery/sagarmatha-national-park-480.webp",
    width: 960,
    height: 640,
  },
  "/images/serengeti-national-park.jpg": {
    src: "/images/discovery/serengeti-national-park-960.webp",
    small: "/images/discovery/serengeti-national-park-480.webp",
    width: 960,
    height: 553,
  },
  "/images/swiss-alps-jungfrau-aletsch.jpg": {
    src: "/images/discovery/swiss-alps-jungfrau-aletsch-960.webp",
    small: "/images/discovery/swiss-alps-jungfrau-aletsch-480.webp",
    width: 960,
    height: 640,
  },
  "/images/taj-mahal.jpg": {
    src: "/images/discovery/taj-mahal-960.webp",
    small: "/images/discovery/taj-mahal-480.webp",
    width: 960,
    height: 631,
  },
  "/images/the-dolomites.jpg": {
    src: "/images/discovery/the-dolomites-960.webp",
    small: "/images/discovery/the-dolomites-480.webp",
    width: 960,
    height: 664,
  },
  "/images/western-ghats.jpg": {
    src: "/images/discovery/western-ghats-960.webp",
    small: "/images/discovery/western-ghats-480.webp",
    width: 960,
    height: 641,
  },
  "/images/yellowstone-national-park.jpg": {
    src: "/images/discovery/yellowstone-national-park-960.webp",
    small: "/images/discovery/yellowstone-national-park-480.webp",
    width: 960,
    height: 1164,
  },
};
