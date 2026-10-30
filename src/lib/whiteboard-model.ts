export type BoardPoint = { x: number; y: number };
export type ModelDegree = 1 | 3 | 6;

export const MIN_POINT_HEIGHT = 0.05;
export const MAX_POINT_HEIGHT = 0.95;

// Deliberately small, synthetic teaching data: observations of one smooth curve
// with fixed noise. The check points have different x values and no added noise.
// They are never passed to the fitter by this module.
const target = (x: number) => 0.5 + 0.28 * Math.sin(2 * Math.PI * x - 0.45);
const trainingX = [0.02, 0.18, 0.34, 0.5, 0.66, 0.82, 0.98];
const observationNoise = [-0.01, 0.02, -0.035, 0.11, -0.025, 0.02, -0.01];

export const DEFAULT_POINTS: readonly BoardPoint[] = Object.freeze(trainingX.map((x, index) =>
  Object.freeze({ x, y: target(x) + observationNoise[index] }),
));

export const CHECK_POINTS: readonly BoardPoint[] = Object.freeze([0.08, 0.26, 0.42, 0.58, 0.74, 0.9].map(x =>
  Object.freeze({ x, y: target(x) }),
));

function chebyshevBasis(x: number, degree: number): number[] {
  const values = [1];
  const t = 2 * x - 1;
  if (degree > 0) values.push(t);
  for (let order = 2; order <= degree; order++) values.push(2 * t * values[order - 1] - values[order - 2]);
  return values;
}

function dot(left: readonly number[], right: readonly number[]): number {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

/**
 * Least-squares fit in the Chebyshev basis T_k(2x - 1), not monomial powers.
 * Returns [c_0, ..., c_d] for use with predictCurve. It does not read check data.
 * Finite points are retained without clamping their values; non-finite points
 * are ignored. Empty input yields [0]. Insufficient or rank-deficient data is
 * fitted at a lower degree, with a constant fit as the final safe fallback.
 */
export function fitCurve(points: readonly BoardPoint[], degree: ModelDegree): number[] {
  const valid = points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (!valid.length) return [0];
  const requested = degree === 3 || degree === 6 ? degree : 1;
  const rows = valid.map(point => chebyshevBasis(point.x, requested));
  const yScale = Math.max(1, ...valid.map(point => Math.abs(point.y)));
  const response = valid.map(point => point.y / yScale);

  for (let effective = Math.min(requested, valid.length - 1); effective >= 0; effective--) {
    const columns: number[][] = [];
    const upper = Array.from({ length: effective + 1 }, () => Array<number>(effective + 1).fill(0));
    let fullRank = true;
    for (let column = 0; column <= effective; column++) {
      let residual = rows.map(row => row[column]);
      // Reorthogonalized modified Gram–Schmidt avoids the squared condition
      // number of normal equations, even for the interpolating degree-6 fit.
      for (let pass = 0; pass < 2; pass++) {
        for (let previous = 0; previous < column; previous++) {
          const projection = dot(columns[previous], residual);
          upper[previous][column] += projection;
          residual = residual.map((value, index) => value - projection * columns[previous][index]);
        }
      }
      const norm = Math.hypot(...residual);
      if (!Number.isFinite(norm) || norm < 1e-10) { fullRank = false; break; }
      upper[column][column] = norm;
      columns.push(residual.map(value => value / norm));
    }
    if (!fullRank) continue;

    const projected = columns.map(column => dot(column, response));
    const coefficients = Array<number>(effective + 1).fill(0);
    for (let row = effective; row >= 0; row--) {
      let value = projected[row];
      for (let column = row + 1; column <= effective; column++) value -= upper[row][column] * coefficients[column];
      coefficients[row] = value / upper[row][row];
    }
    const scaled = coefficients.map(value => value * yScale);
    if (scaled.every(Number.isFinite)) return scaled;
  }
  // Only reached for extreme, numerically unrepresentable input.
  return [valid.reduce((sum, point) => sum + point.y / valid.length, 0)];
}

/** Evaluate the returned Chebyshev coefficients without clipping the curve. */
export function predictCurve(coefficients: readonly number[], x: number): number {
  if (!Number.isFinite(x) || !coefficients.length || !coefficients.every(Number.isFinite)) return 0;
  const t = 2 * x - 1;
  let next = 0;
  let nextNext = 0;
  // Clenshaw's recurrence is stable over the normalized board interval [0, 1].
  for (let index = coefficients.length - 1; index >= 1; index--) {
    const current = coefficients[index] + 2 * t * next - nextNext;
    nextNext = next;
    next = current;
  }
  const value = coefficients[0] + t * next - nextNext;
  return Number.isFinite(value) ? value : 0;
}

/** RMSE in the board's y units, using actual un-clipped predictions. */
export function rootMeanSquaredError(points: readonly BoardPoint[], coefficients: readonly number[]): number {
  const valid = points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (!valid.length) return 0;
  const residuals = valid.map(point => point.y - predictCurve(coefficients, point.x));
  const scale = Math.max(...residuals.map(Math.abs));
  if (scale === 0) return 0;
  if (!Number.isFinite(scale)) return Number.MAX_VALUE;
  return Math.sqrt(residuals.reduce((sum, error) => sum + (error / scale) ** 2, 0) / valid.length) * scale;
}

/** Move one observation vertically; retain x values and never mutate inputs. */
export function updatePoint(points: readonly BoardPoint[], index: number, y: number): BoardPoint[] {
  const next = points.map(point => ({ ...point }));
  if (!Number.isInteger(index) || index < 0 || index >= next.length || !Number.isFinite(y)) return next;
  next[index].y = Math.max(MIN_POINT_HEIGHT, Math.min(MAX_POINT_HEIGHT, y));
  return next;
}
