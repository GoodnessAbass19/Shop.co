export const ITEM_PER_PAGE = 20;

export const FashionStyles = [
  {
    title: "casual",
    img: "/images/casual.png",
  },
  {
    title: "formal",
    img: "/images/image 13.png",
  },
  {
    title: "party",
    img: "/images/image 12.png",
  },
  {
    title: "gym",
    img: "/images/image 14.png",
  },
];

export function getColorCategoryFromHex(hex: any) {
  // Ensure the hex code starts with '#' and is valid
  if (!/^#([A-Fa-f0-9]{6})$/.test(hex)) {
    throw new Error("Invalid hex color code!");
  }

  // Extract red, green, and blue components
  const r = parseInt(hex.slice(1, 3), 16); // Red
  const g = parseInt(hex.slice(3, 5), 16); // Green
  const b = parseInt(hex.slice(5, 7), 16); // Blue

  // Determine the dominant color component
  if (r >= g && r >= b) return "Red";
  if (g >= r && g >= b) return "Green";
  if (b >= r && b >= g) return "Blue";

  // Optional: Check for grayscale (all components are similar)
  const tolerance = 10; // Allowable range for differences
  if (Math.abs(r - g) <= tolerance && Math.abs(g - b) <= tolerance) {
    return "Gray/Neutral";
  }

  return "Unknown";
}

export function getColorCategory(color: any) {
  let r, g, b;

  if (color.startsWith("#")) {
    // Convert hex to RGB
    if (color.length === 4) {
      // Short hex (#RGB)
      r = parseInt(color[1] + color[1], 16);
      g = parseInt(color[2] + color[2], 16);
      b = parseInt(color[3] + color[3], 16);
    } else if (color.length === 7) {
      // Full hex (#RRGGBB)
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    }
  } else if (color.startsWith("rgb")) {
    // Extract RGB values from rgb() or rgba()
    const match = color.match(/\d+/g);
    if (match) {
      [r, g, b] = match.map(Number);
    }
  } else {
    throw new Error("Unsupported color format!");
  }

  // Determine the dominant color component
  if (r >= g && r >= b) return "Red";
  if (g >= r && g >= b) return "Green";
  if (b >= r && b >= g) return "Blue";

  return "Unknown";
}
