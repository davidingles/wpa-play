// scripts/generate-icons.js
// Converts SVG icons to PNG using sharp
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const iconsDir = path.join(__dirname, '..', 'icons');
const sizes = [192, 512];

async function generate() {
  // Ensure output directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  for (const size of sizes) {
    const svgPath = path.join(iconsDir, `icon-${size}.svg`);
    const pngPath = path.join(iconsDir, `icon-${size}.png`);

    if (!fs.existsSync(svgPath)) {
      console.warn(`Skipping icon-${size}.svg — not found`);
      continue;
    }

    const svgBuffer = fs.readFileSync(svgPath);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(pngPath);

    console.log(`✅ icon-${size}.png generated`);
  }
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
