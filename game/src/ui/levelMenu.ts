import { LevelRepository } from '../domain/levelRepository';
import { levels } from '../domain/levels';
import type { CustomLevelRecord, Level } from '../domain/types';

export function isCustomLevel(level: Level): level is CustomLevelRecord {
  return 'kind' in level && (level as CustomLevelRecord).kind === 'new';
}

export function isOverrideLevel(level: Level): level is CustomLevelRecord {
  return 'kind' in level && (level as CustomLevelRecord).kind === 'override';
}

export function formatLevelLabel(level: Level): string {
  if (isCustomLevel(level)) {
    return `${level.title} · level mới`;
  }
  if (isOverrideLevel(level)) {
    return `${level.id} · ${level.title} · đã sửa`;
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
