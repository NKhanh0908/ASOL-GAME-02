import Phaser from 'phaser';
import type { GalaxyTheme } from './galaxyTheme.ts';
import { isReducedMotion } from './transitions/motion.ts';
import { mulberry32 } from './starField.ts';
import type { ChapterBand } from './constellationLayout.ts';
import { resolveGalaxyTheme } from './galaxyTheme.ts';
import { createGalaxyStars, galaxyStarPose } from './galaxyStars.ts';
import { GALAXY_ART_FILES, isLayeredGalaxy } from './galaxyArtFiles.ts';
import { buildGalaxyLayers } from './galaxyLayers.ts';

/** One continuous texture avoids opaque strips cutting across galaxy artwork. */
export function galaxyMapGradient(scene: Phaser.Scene, bands: readonly ChapterBand[], height: number): string {
  const key = `galaxy-map-sky-${height}`;
  if (scene.textures.exists(key)) return key;
  const texture = scene.textures.createCanvas(key, 720, 2048)!;
  const ctx = texture.context;
  const gradient = ctx.createLinearGradient(0, 0, 0, 2048);
  bands.forEach((band, i) => {
    const colors = resolveGalaxyTheme(band.chapter).colors;
    gradient.addColorStop(i === 0 ? 0 : (band.top + 120) / height, colors.bgTopHex);
    gradient.addColorStop(i === bands.length - 1 ? 1 : (band.bottom - 120) / height, colors.bgBottomHex);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 720, 2048);
  const random = mulberry32(712);
  for (let i = 0; i < 420; i++) {
    ctx.fillStyle = `rgba(225,239,255,${0.2 + random() * 0.5})`;
    ctx.beginPath();
    ctx.ellipse(random() * 720, random() * 2048, 0.7 + random(), (0.7 + random()) * 2048 / height, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  texture.refresh();
  return key;
}

/** SVG filters are rasterized once by the loader, never redrawn each frame. */
export function preloadGalaxyArtwork(scene: Phaser.Scene, themeIds: readonly string[] = ['dwarf', 'spiral', 'tapestry']): void {
  for (const id of themeIds) {
    for (const stem of GALAXY_ART_FILES[id] ?? []) {
      const key = `galaxy-${stem}`;
      if (!scene.textures.exists(key)) scene.load.svg(key, `assets/galaxies/${stem}.svg`);
    }
  }
}

export function galaxyGradient(scene: Phaser.Scene, theme: GalaxyTheme): string {
  const key = `galaxy-gradient-${theme.id}`;
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, 720, 1600)!;
    const gradient = texture.context.createLinearGradient(0, 0, 0, 1600);
    gradient.addColorStop(0, theme.colors.bgTopHex);
    gradient.addColorStop(1, theme.colors.bgBottomHex);
    texture.context.fillStyle = gradient;
    texture.context.fillRect(0, 0, 720, 1600);
    const random = mulberry32(172 + theme.chapter);
    for (let i = 0; i < 160; i++) {
      texture.context.fillStyle = `rgba(225,239,255,${0.25 + random() * 0.5})`;
      texture.context.beginPath();
      texture.context.arc(random() * 720, random() * 1600, 0.5 + random() * 1.5, 0, Math.PI * 2);
      texture.context.fill();
    }
    texture.refresh();
  }
  return key;
}

/** Shared chapter art with a separate motion container for scene choreography. */
export function addGalaxyArtwork(
  scene: Phaser.Scene, theme: GalaxyTheme, x: number, y: number, size: number,
): Phaser.GameObjects.Container {
  const root = scene.add.container(x, y);
  const motion: Phaser.Tweens.Tween[] = [];
  const frame: Array<(elapsedMs: number) => void> = [];
  if (isLayeredGalaxy(theme.id)) {
    buildGalaxyLayers({ scene, root, size, motion, frame }, theme.id);
  } else {
    const key = `galaxy-${theme.id === 'spiral' ? 'spiral' : 'dwarf'}`;
    const art = scene.add.image(0, 0, key).setDisplaySize(size, size);
    if (theme.id !== 'spiral') {
      for (const [i, layer] of ['A', 'B'].entries()) {
        const cloud = scene.add.image(0, 0, `galaxy-dwarf-cloud${layer}`).setDisplaySize(size, size);
        root.add(cloud);
        motion.push(scene.tweens.add({ targets: cloud, x: i === 0 ? 20 : -20, y: i === 0 ? -8 : 8, duration: 12000 + i * 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
      }
    }
    root.add(art);
    if (theme.id === 'spiral') {
      motion.push(scene.tweens.add({ targets: art, angle: 360, duration: 240000, repeat: -1, ease: 'Linear' }));
    }
  }
  const stars = theme.chapter === 1 ? createGalaxyStars(173) : [];
  const starKey = 'galaxy-white-star';
  if (stars.length && !scene.textures.exists(starKey)) {
    const texture = scene.textures.createCanvas(starKey, 32, 32)!;
    const glow = texture.context.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, 'rgba(255,255,255,1)');
    glow.addColorStop(0.15, 'rgba(255,255,255,0.95)');
    glow.addColorStop(0.45, 'rgba(200,235,255,0.25)');
    glow.addColorStop(1, 'rgba(200,235,255,0)');
    texture.context.fillStyle = glow;
    texture.context.fillRect(0, 0, 32, 32);
    texture.refresh();
  }
  const starViews = stars.map(star => {
    const image = scene.add.image(0, 0, starKey)
      .setName('moving-white-star')
      .setDisplaySize(star.radius * 8, star.radius * 8)
      .setBlendMode(Phaser.BlendModes.ADD);
    root.add(image);
    return image;
  });
  let elapsedMs = 0;
  const updateMotion = (_time = 0, delta = 0) => {
    const paused = isReducedMotion() || !root.visible;
    motion.forEach(tween => { if (paused) tween.pause(); else tween.resume(); });
    if (!paused) elapsedMs += Math.min(delta, 50);
    starViews.forEach((image, i) => {
      const pose = galaxyStarPose(stars[i], elapsedMs, size);
      image.setPosition(pose.x, pose.y).setAlpha(pose.alpha);
    });
    frame.forEach((animate) => animate(elapsedMs));
  };
  updateMotion();
  scene.events.on(Phaser.Scenes.Events.UPDATE, updateMotion);
  root.once(Phaser.GameObjects.Events.DESTROY, () => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, updateMotion);
    motion.forEach(tween => tween.remove());
  });
  return root;
}
