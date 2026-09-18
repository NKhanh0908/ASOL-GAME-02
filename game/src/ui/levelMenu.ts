import { LevelRepository } from '../domain/levelRepository';
import { levels } from '../domain/levels';
import type { CustomLevelRecord, Level } from '../domain/types';

export function isCustomLevel(level: Level): level is CustomLevelRecord {
  return 'custom' in level && (level as CustomLevelRecord).custom === true;
}

export function formatLevelLabel(level: Level): string {
  if (isCustomLevel(level)) {
    return `${level.title} (Mẫu: ${level.sourceLevelId})`;
  }
  return `${level.id} · ${level.title}`;
}

export function groupLevels(allLevels: Level[]): {
  builtIn: Level[];
  custom: CustomLevelRecord[];
} {
  const builtIn: Level[] = [];
  const custom: CustomLevelRecord[] = [];

  for (const level of allLevels) {
    if (isCustomLevel(level)) {
      custom.push(level);
    } else {
      builtIn.push(level);
    }
  }

  return { builtIn, custom };
}

export function resolveLevel(levelId?: string): Level {
  if (!levelId) return levels[0];
  return LevelRepository.get(levelId) ?? levels[0];
}
