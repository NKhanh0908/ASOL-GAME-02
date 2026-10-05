import type { Patch, PatchIssue } from '../../audio-synth/patch.ts';
import { validatePatch } from '../../audio-synth/patch.ts';
import { renderPatch } from '../../audio-synth/render.ts';

export type RenderAttempt =
  | { ok: true; samples: Float32Array }
  | { ok: false; issues: PatchIssue[] };

/**
 * Renders a patch only if it validates. A slider can easily drag a patch out
 * of range (cutoff above Nyquist, zero duration) and renderPatch throws on
 * those, so the Lab asks here first and shows the issues instead.
 */
export function tryRender(patch: Patch, sampleRate: number): RenderAttempt {
  const issues = validatePatch(patch, sampleRate);
  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, samples: renderPatch(patch, sampleRate) };
}

export function formatIssues(issues: readonly PatchIssue[]): string {
  return issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n');
}
