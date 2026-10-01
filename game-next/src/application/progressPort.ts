export type StoragePort = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type Progress = {
  version: 1;
  campaignRevision: string;
  completed: string[];
  settings: {
    showTarget: boolean;
  };
};

export type LoadResult = {
  progress: Progress;
  recovered: boolean;
  persistence: 'persisted' | 'memory-only';
};

export interface ProgressRepository {
  read(): LoadResult;
  complete(id: string): LoadResult;
  setShowTarget(show: boolean): LoadResult;
}
