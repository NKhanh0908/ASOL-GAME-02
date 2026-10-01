import type { ManifestEntry } from '../content/document.ts';
import { levelAccess } from '../domain/campaign.ts';
import type {
  LoadResult,
  Progress,
  ProgressRepository,
  StoragePort,
} from '../application/progressPort.ts';

const PROGRESS_KEY = 'mirror.rebuild.progress.v1';
const RECOVERY_KEY = 'mirror.rebuild.progress.recovery';

export function createProgressRepository(
  storage: StoragePort,
  manifest: readonly ManifestEntry[],
  revision: string
): ProgressRepository {
  let memorySnapshot: Progress | null = null;
  let isMemoryOnly = false;

  function defaultProgress(): Progress {
    return {
      version: 1,
      campaignRevision: revision,
      completed: [],
      settings: {
        showTarget: true,
      },
    };
  }

  function readFromStorage(): LoadResult {
    if (isMemoryOnly && memorySnapshot) {
      return {
        progress: JSON.parse(JSON.stringify(memorySnapshot)),
        recovered: false,
        persistence: 'memory-only',
      };
    }

    let raw: string | null = null;
    try {
      raw = storage.getItem(PROGRESS_KEY);
    } catch {
      isMemoryOnly = true;
      memorySnapshot = memorySnapshot ?? defaultProgress();
      return {
        progress: JSON.parse(JSON.stringify(memorySnapshot)),
        recovered: false,
        persistence: 'memory-only',
      };
    }

    if (!raw) {
      const def = defaultProgress();
      memorySnapshot = def;
      try {
        storage.setItem(PROGRESS_KEY, JSON.stringify(def));
      } catch {
        isMemoryOnly = true;
      }
      return {
        progress: JSON.parse(JSON.stringify(def)),
        recovered: false,
        persistence: isMemoryOnly ? 'memory-only' : 'persisted',
      };
    }

    try {
      const parsed = JSON.parse(raw);
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        parsed.version !== 1 ||
        parsed.campaignRevision !== revision ||
        !Array.isArray(parsed.completed)
      ) {
        throw new Error('schema-mismatch');
      }

      // Lọc danh sách completed chỉ giữ lại các ID hợp lệ trong manifest
      const validCompleted = parsed.completed.filter(
        (id: unknown) => typeof id === 'string' && manifest.some((m) => m.id === id)
      );

      const showTarget =
        parsed.settings && typeof parsed.settings.showTarget === 'boolean'
          ? parsed.settings.showTarget
          : true;

      const progress: Progress = {
        version: 1,
        campaignRevision: revision,
        completed: validCompleted,
        settings: { showTarget },
      };

      memorySnapshot = progress;
      return {
        progress: JSON.parse(JSON.stringify(progress)),
        recovered: false,
        persistence: 'persisted',
      };
    } catch {
      // Phục hồi dữ liệu lỗi: lưu chuỗi lỗi vào recovery key và trả về default
      try {
        storage.setItem(RECOVERY_KEY, raw);
      } catch {
        // bỏ qua nếu recovery lưu cũng lỗi
      }

      const recovered = defaultProgress();
      memorySnapshot = recovered;
      try {
        storage.setItem(PROGRESS_KEY, JSON.stringify(recovered));
      } catch {
        isMemoryOnly = true;
      }

      return {
        progress: JSON.parse(JSON.stringify(recovered)),
        recovered: true,
        persistence: isMemoryOnly ? 'memory-only' : 'persisted',
      };
    }
  }

  function saveToStorage(progress: Progress): LoadResult {
    memorySnapshot = JSON.parse(JSON.stringify(progress));

    if (!isMemoryOnly) {
      try {
        storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      } catch {
        isMemoryOnly = true;
      }
    }

    return {
      progress: JSON.parse(JSON.stringify(progress)),
      recovered: false,
      persistence: isMemoryOnly ? 'memory-only' : 'persisted',
    };
  }

  return {
    read(): LoadResult {
      return readFromStorage();
    },

    complete(id: string): LoadResult {
      const current = readFromStorage().progress;

      // Nếu đã hoàn thành từ trước, trả về snapshot hiện tại không ghi đè
      if (current.completed.includes(id)) {
        return {
          progress: current,
          recovered: false,
          persistence: isMemoryOnly ? 'memory-only' : 'persisted',
        };
      }

      // Kiểm tra quyền unlock
      const access = levelAccess(manifest, current.completed, id);
      if (!access.unlocked) {
        throw new Error(`cannot-complete-locked:${id}`);
      }

      const nextCompleted = [...current.completed, id];
      const nextProgress: Progress = {
        ...current,
        completed: nextCompleted,
      };

      return saveToStorage(nextProgress);
    },

    setShowTarget(show: boolean): LoadResult {
      const current = readFromStorage().progress;
      const nextProgress: Progress = {
        ...current,
        settings: {
          ...current.settings,
          showTarget: show,
        },
      };

      return saveToStorage(nextProgress);
    },
  };
}
