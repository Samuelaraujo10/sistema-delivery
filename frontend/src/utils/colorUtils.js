/**
 * Converts a hex color to HSL and adjusts the lightness to ensure
 * high readability in dark mode interfaces.
 * 
 * @param {string} hexColor - The HEX color string (e.g. "#414442").
 * @returns {object} An object containing readable `text` and semi-transparent `bg` styles.
 */
export const getReadableColor = (hexColor) => {
  if (!hexColor || !hexColor.startsWith('#')) {
    return { text: hexColor || 'inherit', bg: 'rgba(255, 255, 255, 0.08)' };
  }

  // Parse HEX to RGB
  let r = parseInt(hexColor.slice(1, 3), 16);
  let g = parseInt(hexColor.slice(3, 5), 16);
  let b = parseInt(hexColor.slice(5, 7), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return { text: hexColor, bg: 'rgba(255, 255, 255, 0.08)' };
  }

  // Convert RGB to HSL
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  // If lightness is too low for a dark mode layout, boost it to at least 70%
  const textL = l < 60 ? 70 : l;
  // Increase saturation slightly if color was boosted to keep it vibrant
  const textS = l < 60 ? Math.min(s + 15, 100) : s;

  return {
    text: `hsl(${h}, ${textS}%, ${textL}%)`,
    bg: `hsla(${h}, ${textS}%, ${textL}%, 0.15)`,
    border: `hsla(${h}, ${textS}%, ${textL}%, 0.3)`,
  };
};
