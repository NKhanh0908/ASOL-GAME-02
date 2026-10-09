// Extract only the supplied vector artwork; UI and animation stay native Phaser.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const source = new URL('../../docs/gdd/assets/Bộ nhận diện năm thiên hà-html/GalaxyKit.dc.html', import.meta.url);
const html = readFileSync(source, 'utf8');
const art = [...html.matchAll(/<svg\b[\s\S]*?<\/svg>/g)]
  .map(m => m[0]).filter(svg => svg.includes('viewBox="0 0 350 350"'));
const output = new URL('../public/assets/galaxies/', import.meta.url);
mkdirSync(output, { recursive: true });
for (const [i, name] of ['dwarf', 'spiral'].entries()) {
  if (!art[i]) throw new Error(`Missing ${name} reference`);
  let extracted = art[i]
    .replace(/<svg[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 350 350">')
    .replaceAll('x="-80%" y="-80%" width="260%" height="260%"', 'x="-200%" y="-200%" width="500%" height="500%"')
    .replace(/<rect width="350" height="350"[^>]*><\/rect>/, '');
  const save = (name, source) => {
    // Fade the square artboard boundary so overlapping chapter art has no seams.
    const svg = source.replace(/(<svg[^>]*>)/, '$1<defs><radialGradient id="edgeFade" gradientUnits="userSpaceOnUse" cx="175" cy="175" r="175"><stop offset="0.58" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><mask id="artEdge" maskUnits="userSpaceOnUse" x="0" y="0" width="350" height="350"><rect width="350" height="350" fill="url(#edgeFade)"/></mask></defs><g mask="url(#artEdge)">').replace('</svg>', '</g></svg>');
    writeFileSync(new URL(`${name}.svg`, output), svg + '\n');
  };
  if (name === 'dwarf') {
    for (const layer of ['A', 'B']) {
      const cloud = extracted.match(new RegExp(`<g class="drift${layer}">[\\s\\S]*?</g>`))?.[0];
      if (!cloud) throw new Error(`Missing cloud ${layer}`);
      const head = extracted.match(/<svg[^>]*>/)[0];
      const defs = extracted.match(/<defs>[\s\S]*?<\/defs>/)[0];
      save(`dwarf-cloud${layer}`, `${head}${defs}${cloud}</svg>`);
      extracted = extracted.replace(cloud, '');
    }
  }
  save(name, extracted);
}
