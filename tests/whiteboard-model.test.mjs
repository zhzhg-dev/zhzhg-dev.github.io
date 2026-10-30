import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { loadSource, repository } from "./support/source-harness.mjs";

const model = loadSource(resolve(repository, "src/lib/whiteboard-model.ts"));
const { DEFAULT_POINTS, CHECK_POINTS, fitCurve, predictCurve, rootMeanSquaredError, updatePoint } = model;
const degrees = [1, 3, 6];

function assertFiniteCurve(coefficients) {
  assert.ok(coefficients.length > 0);
  assert.ok(coefficients.every(Number.isFinite));
  for (let sample = 0; sample <= 100; sample++) {
    assert.ok(Number.isFinite(predictCurve(coefficients, sample / 100)), `finite prediction at x=${sample / 100}`);
  }
}

test("the board uses deterministic illustrative training points and separate unseen checks", () => {
  assert.equal(DEFAULT_POINTS.length, 7);
  assert.ok(CHECK_POINTS.length >= 3);
  assert.equal(new Set(DEFAULT_POINTS.map(point => point.x)).size, DEFAULT_POINTS.length);
  for (const point of [...DEFAULT_POINTS, ...CHECK_POINTS]) {
    assert.ok(point.x >= 0 && point.x <= 1);
    assert.ok(point.y >= 0 && point.y <= 1);
    assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
  }
  assert.ok(CHECK_POINTS.every(check => !DEFAULT_POINTS.some(point => point.x === check.x)), "unseen points were not included among the fitted samples");
  const before = structuredClone({ DEFAULT_POINTS, CHECK_POINTS });
  for (const degree of degrees) {
    assert.deepEqual(fitCurve(DEFAULT_POINTS, degree), fitCurve(DEFAULT_POINTS, degree), "fitting the same samples does not introduce randomness");
  }
  assert.deepEqual({ DEFAULT_POINTS, CHECK_POINTS }, before);
});

test("curve fitting solves an actual line and cubic rather than drawing canned paths", () => {
  const sampleX = [0.02, 0.17, 0.32, 0.47, 0.62, 0.77, 0.92];
  for (const [degree, target] of [[1, x => 0.2 + 0.55 * x], [3, x => 0.25 + x - 1.4 * x * x + 0.6 * x * x * x]]) {
    const points = sampleX.map(x => Object.freeze({ x, y: target(x) }));
    Object.freeze(points);
    const coefficients = fitCurve(points, degree);
    assertFiniteCurve(coefficients);
    for (const x of [0.05, 0.26, 0.5, 0.83, 0.97]) assert.ok(Math.abs(predictCurve(coefficients, x) - target(x)) < 1e-7);
    assert.ok(rootMeanSquaredError(points, coefficients) < 1e-7);
  }
});

test("the default example distinguishes sample fit from performance on unseen illustrative points", () => {
  const results = degrees.map(degree => {
    const coefficients = fitCurve(DEFAULT_POINTS, degree);
    return { degree, training: rootMeanSquaredError(DEFAULT_POINTS, coefficients), check: rootMeanSquaredError(CHECK_POINTS, coefficients) };
  });
  const [straight, balanced, flexible] = results;
  assert.ok(flexible.training < balanced.training);
  assert.ok(flexible.training < straight.training);
  assert.ok(balanced.check < straight.check);
  assert.ok(balanced.check < flexible.check);
  for (const result of results) assert.ok(Number.isFinite(result.training) && Number.isFinite(result.check));
});

test("moving a training point changes the real fit without changing x positions, check points or source data", () => {
  const points = DEFAULT_POINTS.map(point => Object.freeze({ ...point }));
  Object.freeze(points);
  const before = structuredClone(points);
  const checkBefore = structuredClone(CHECK_POINTS);
  const next = updatePoint(points, 3, points[3].y < 0.5 ? 0.9 : 0.1);
  assert.notDeepEqual(next, points);
  assert.deepEqual(points, before);
  assert.deepEqual(next.map(point => point.x), points.map(point => point.x));
  assert.deepEqual(CHECK_POINTS, checkBefore);
  const oldCurve = fitCurve(points, 3), newCurve = fitCurve(next, 3);
  assert.ok(Math.abs(predictCurve(oldCurve, points[3].x) - predictCurve(newCurve, points[3].x)) > 0.01);
  for (const [input, expected] of [[-100, 0.05], [100, 0.95]]) assert.equal(updatePoint(points, 2, input)[2].y, expected);
  for (const input of [NaN, Infinity, -Infinity]) assert.ok(updatePoint(points, 2, input).every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
  for (const index of [-1, 100, NaN]) assert.deepEqual(updatePoint(points, index, 0.2), points);
});

test("all allowed endpoint heights and degenerate samples keep the polynomial solver finite", () => {
  for (let mask = 0; mask < 2 ** DEFAULT_POINTS.length; mask++) {
    const points = DEFAULT_POINTS.map((point, index) => ({ x: point.x, y: mask & (1 << index) ? 0.95 : 0.05 }));
    for (const degree of degrees) {
      const coefficients = fitCurve(points, degree);
      assertFiniteCurve(coefficients);
      assert.ok(Number.isFinite(rootMeanSquaredError(CHECK_POINTS, coefficients)));
    }
  }
  for (const points of [[], [{ x: 0.5, y: 0.3 }], [{ x: 0.5, y: 0.2 }, { x: 0.5, y: 0.8 }]]) {
    for (const degree of degrees) assertFiniteCurve(fitCurve(points, degree));
  }
});
