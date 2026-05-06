import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedValue } from '../useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update before the delay elapses', () => {
    let v = 'a';
    const { result, rerender } = renderHook(() => useDebouncedValue(v, 300));
    v = 'b';
    rerender(undefined);
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(result.current).toBe('a');
  });

  it('updates after the delay elapses', () => {
    let v = 'a';
    const { result, rerender } = renderHook(() => useDebouncedValue(v, 300));
    v = 'b';
    rerender(undefined);
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('b');
  });

  it('resets the timer when the input changes again', () => {
    let v = 'a';
    const { result, rerender } = renderHook(() => useDebouncedValue(v, 300));
    v = 'b';
    rerender(undefined);
    act(() => {
      jest.advanceTimersByTime(150);
    });
    v = 'c';
    rerender(undefined);
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(result.current).toBe('a');
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(result.current).toBe('c');
  });
});
