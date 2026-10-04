import type { LevelSource } from '../content/authoring.ts';
import type { LevelDocument } from '../content/document.ts';
import type { DeleteResult, SaveResult, StudioLevelSummary } from '../content/studioStore.ts';

export async function fetchStudioList(): Promise<StudioLevelSummary[]> {
  const res = await fetch('/__studio/list');
  if (!res.ok) {
    throw new Error(`fetchStudioList failed with status ${res.status}`);
  }
  return res.json();
}

export async function saveStudioLevelApi(source: LevelSource): Promise<SaveResult> {
  const res = await fetch('/__studio/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ source }),
  });
  return res.json();
}

export async function deleteStudioLevelApi(id: string): Promise<DeleteResult> {
  const res = await fetch('/__studio/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  });
  return res.json();
}

export async function fetchStudioLevelDoc(id: string): Promise<LevelDocument> {
  const res = await fetch(`/src/content/studio/levels/${id}.json`);
  if (!res.ok) {
    throw new Error(`fetchStudioLevelDoc failed with status ${res.status}`);
  }
  return res.json();
}
