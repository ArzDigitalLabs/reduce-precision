import NumberFormatter from '../../src/format'; // Path from ts/test/format/ to ts/src/format/index.ts

describe('NumberFormatter Low Precision Fix', () => {
  // Test cases for English locale
  describe('English Locale (en)', () => {
    const formatter = new NumberFormatter({ precision: 'low', language: 'en' });

    it('should correctly format very small numbers (0 <= number < 0.01) after fix', () => {
      // This range now uses: p=2, d=2, r=true, f=2 (d was 0)
      expect(formatter.toString(0.001)).toBe('0.001');
      expect(formatter.toString(0.0001)).toBe('0.0001');
      expect(formatter.toString(0.00001)).toBe('0.0000');
      expect(formatter.toString(0.005)).toBe('0.005');
      expect(formatter.toString(0.0099)).toBe('0.0099');
    });

    it('should format zero correctly with fixed decimal places for (0 <= number < 0.01) range', () => {
      // With f=2 for this range, 0 should be "0.00"
      expect(formatter.toString(0)).toBe('0.00');
    });

    it('should correctly format numbers where 0.01 <= number < 0.1 (existing behavior)', () => {
      // This range uses: p=2, d=1, r=true. (f is not set, so 0)
      expect(formatter.toString(0.01)).toBe('0.01');
      expect(formatter.toString(0.04)).toBe('0.04');
      expect(formatter.toString(0.05)).toBe('0.1');
      expect(formatter.toString(0.09)).toBe('0.1');
    });

    it('should correctly format numbers where 0.1 <= number < 1 (existing behavior)', () => {
      // This range uses: p=2, d=2, r=true. (f is not set, so 0)
      expect(formatter.toString(0.1)).toBe('0.1'); // Not "0.10" as f=0
      expect(formatter.toString(0.12)).toBe('0.12');
      expect(formatter.toString(0.123)).toBe('0.12');
      expect(formatter.toString(0.99)).toBe('0.99');
      expect(formatter.toString(0.999)).toBe('1.00');
    });
  });

  // Test cases for Persian locale
  describe('Persian Locale (fa)', () => {
    const formatter = new NumberFormatter({ precision: 'low', language: 'fa' });

    it('should correctly format very small numbers (0 <= number < 0.01) after fix', () => {
      expect(formatter.toString(0.001)).toBe('۰٬۰۰۱');
      expect(formatter.toString(0.0001)).toBe('۰٬۰۰۰۱');
      expect(formatter.toString(0.00001)).toBe('۰٬۰۰۰۰');
    });

    it('should format zero correctly with fixed decimal places in fa for (0 <= number < 0.01) range', () => {
      expect(formatter.toString(0)).toBe('۰٬۰۰');
    });

    it('should correctly format numbers where 0.01 <= number < 0.1 in fa', () => {
      expect(formatter.toString(0.01)).toBe('۰٬۰۱'); // English "0.0"
      expect(formatter.toString(0.05)).toBe('۰٬۱'); // English "0.1"
    });
  });
});
