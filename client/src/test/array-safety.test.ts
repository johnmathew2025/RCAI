/**
 * Array Safety Test - Prevents .map() errors in Evidence Library form
 * Tests that all option arrays are safely normalized and don't crash on undefined/null
 */

import { asArray, assertArray } from '@/lib/array';

describe('Array normalization safety', () => {
  it('handles undefined gracefully', () => {
    expect(asArray(undefined)).toEqual([]);
  });

  it('handles null gracefully', () => {
    expect(asArray(null)).toEqual([]);
  });

  it('handles valid arrays', () => {
    const input = [{ id: '1', name: 'Test' }];
    expect(asArray(input)).toEqual(input);
  });

  it('handles object with array field', () => {
    const input = { data: [{ id: '1', name: 'Test' }] };
    expect(asArray(input)).toEqual([{ id: '1', name: 'Test' }]);
  });

  it('handles non-array objects', () => {
    const input = { not: 'array' };
    expect(asArray(input)).toEqual([]);
  });

  it('handles strings gracefully', () => {
    expect(asArray('not an array')).toEqual([]);
  });

  it('handles numbers gracefully', () => {
    expect(asArray(123)).toEqual([]);
  });
});

describe('Array assertion helper', () => {
  it('logs error for non-arrays', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    assertArray('testArray', 'not an array');
    expect(consoleSpy).toHaveBeenCalledWith('[AddEvidence] testArray not array', 'not an array');
    consoleSpy.mockRestore();
  });

  it('does not log for valid arrays', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    assertArray('testArray', [1, 2, 3]);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});