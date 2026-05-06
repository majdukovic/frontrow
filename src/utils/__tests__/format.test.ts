import { formatPrice } from '../format';

describe('formatPrice', () => {
  it('formats USD with two decimals', () => {
    expect(formatPrice(4500, 'USD')).toBe('$45.00');
  });

  it('formats GBP with two decimals', () => {
    expect(formatPrice(8500, 'GBP')).toBe('£85.00');
  });

  it('formats EUR with two decimals', () => {
    expect(formatPrice(12000, 'EUR')).toBe('€120.00');
  });

  it('formats JPY without decimals or division', () => {
    expect(formatPrice(4500, 'JPY')).toBe('¥4500');
  });
});
