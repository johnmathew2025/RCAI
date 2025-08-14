/**
 * Options Safety Test Suite
 * Tests for preventing empty value SelectItem errors
 */

import { describe, it, expect } from 'vitest';
import { sanitizeOptions, assertNoEmptyOption } from '@/lib/options';

describe('Options Safety', () => {
  it('removes null/empty values and forces string IDs', () => {
    const input = [
      { id: 1, name: 'Valid' },
      { id: '', name: 'Empty ID' },
      { id: 2, name: '' },
      null,
      undefined,
      { id: 3, name: '  ' },
      { id: '  ', name: 'Whitespace ID' },
      { id: 4, name: 'Good Option' }
    ];
    
    const result = sanitizeOptions(input);
    
    expect(result).toEqual([
      { id: '1', name: 'Valid' },
      { id: '4', name: 'Good Option' }
    ]);
  });

  it('handles non-array input gracefully', () => {
    expect(sanitizeOptions(null)).toEqual([]);
    expect(sanitizeOptions(undefined)).toEqual([]);
    expect(sanitizeOptions("not an array")).toEqual([]);
    expect(sanitizeOptions({})).toEqual([]);
  });

  it('renders Add Evidence selects without empty values', () => {
    const opts = [{ id: "abc", name: "ValidEquipment" }, { id: " ", name: " " }]; // bad one will be filtered
    const sanitized = sanitizeOptions(opts);
    expect(sanitized.every(o => o.id && o.name)).toBe(true);
  });

  it('prevents empty option assertions in dev mode', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    
    const badOptions = [{ id: '', name: 'test' }];
    assertNoEmptyOption('test', badOptions);
    
    expect(consoleError).toHaveBeenCalledWith('[test] has empty option', { id: '', name: 'test' }, badOptions);
    
    consoleError.mockRestore();
  });

  it('allows good options to pass assertion', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    
    const goodOptions = [{ id: 'valid', name: 'Valid Option' }];
    assertNoEmptyOption('test', goodOptions);
    
    expect(consoleError).not.toHaveBeenCalled();
    
    consoleError.mockRestore();
  });
});