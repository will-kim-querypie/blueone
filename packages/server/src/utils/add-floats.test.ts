import { describe, expect, test } from 'vitest';
import addFloats from './add-floats';

describe('addFloats', () => {
  test('두 정수를 더한다', () => {
    expect(addFloats(1, 2)).toBe(3);
  });

  test('부동소수점 오차 없이 소수를 더한다', () => {
    expect(addFloats(0.1, 0.2)).toBe(0.3);
  });

  test('여러 개의 숫자를 더한다', () => {
    expect(addFloats(0.1, 0.2, 0.3)).toBe(0.6);
  });

  test('인자가 없으면 0을 반환한다', () => {
    expect(addFloats()).toBe(0);
  });

  test('인자가 하나면 그대로 반환한다', () => {
    expect(addFloats(5.5)).toBe(5.5);
  });

  test('음수를 처리한다', () => {
    expect(addFloats(-0.1, 0.3)).toBe(0.2);
  });
});
