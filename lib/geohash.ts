const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

// ---- Types ----
type DirectionMap = {
  even: string;
  odd: string;
};

// ---- Neighbors Lookup ----
const neighbors: Record<"right" | "left" | "top" | "bottom", DirectionMap> = {
  right: { even: "bc01fg45238967deuvhjyznpkmstqrwx", odd: "" },
  left: { even: "238967debc01fg45kmstqrwxuvhjyznp", odd: "" },
  top: { even: "p0r21436x8zb9dcf5h7kjnmqesgutwvy", odd: "" },
  bottom: { even: "14365h7k9dcfesgujnmqp0r2twvyx8zb", odd: "" },
};

// Fill odd maps
neighbors.bottom.odd = neighbors.left.even;
neighbors.top.odd = neighbors.right.even;
neighbors.left.odd = neighbors.bottom.even;
neighbors.right.odd = neighbors.top.even;

// ---- Borders Lookup ----
const borders: Record<"right" | "left" | "top" | "bottom", DirectionMap> = {
  right: { even: "bcfguvyz", odd: "" },
  left: { even: "0145hjnp", odd: "" },
  top: { even: "prxz", odd: "" },
  bottom: { even: "028b", odd: "" },
};

// Fill odd maps
borders.bottom.odd = borders.left.even;
borders.top.odd = borders.right.even;
borders.left.odd = borders.bottom.even;
borders.right.odd = borders.top.even;

// ---- Encode to Geohash ----
export function encodeGeoHash5(latitude: number, longitude: number): string {
  let isEven = true;
  let bit = 0;
  let ch = 0;
  let geohash = "";

  let latMin = -90.0,
    latMax = 90.0;
  let lonMin = -180.0,
    lonMax = 180.0;

  while (geohash.length < 5) {
    if (isEven) {
      const mid = (lonMin + lonMax) / 2;
      if (longitude > mid) {
        ch |= 1 << (4 - bit);
        lonMin = mid;
      } else {
        lonMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (latitude > mid) {
        ch |= 1 << (4 - bit);
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

// ---- Get Adjacent ----
function calculateAdjacent(
  srcHash: string,
  dir: "top" | "bottom" | "right" | "left"
): string {
  srcHash = srcHash.toLowerCase();
  const lastChr = srcHash.charAt(srcHash.length - 1);
  const type = srcHash.length % 2 ? "odd" : "even";
  let base = srcHash.substring(0, srcHash.length - 1);

  if (borders[dir][type].includes(lastChr)) {
    base = calculateAdjacent(base, dir);
  }

  return base + BASE32.charAt(neighbors[dir][type].indexOf(lastChr));
}

// ---- Get Neighbors ----
export function getGeoHashNeighbors(geohash: string): string[] {
  const top = calculateAdjacent(geohash, "top");
  const bottom = calculateAdjacent(geohash, "bottom");
  const right = calculateAdjacent(geohash, "right");
  const left = calculateAdjacent(geohash, "left");

  const topright = calculateAdjacent(top, "right");
  const topleft = calculateAdjacent(top, "left");
  const bottomright = calculateAdjacent(bottom, "right");
  const bottomleft = calculateAdjacent(bottom, "left");

  return [top, bottom, right, left, topright, topleft, bottomright, bottomleft];
}
