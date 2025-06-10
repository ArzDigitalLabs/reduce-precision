// const NumberFormatter = require('../../format/index.js');
// Corrected path: from lib/test/format/index.spec.js to lib/format/index.js
// Apply .default due to ES module export style in the source JS
const NumberFormatter = require('../../format/index.js').default;


describe('NumberFormatter Low Precision Fix', () => {
  // Test cases for English locale
  describe('English Locale (en)', () => {
    const formatter = new NumberFormatter({ precision: 'low', language: 'en' });

    it('should correctly format very small numbers (0 <= number < 0.01) after fix', () => {
      // This range now uses: p=4, d=2, r=true, f=2 (d was 0, p was 2)
      expect(formatter.toString(0.001)).toBe('0.001'); // p=4, d=2 -> shows up to 4 decimal places if needed, rounds to 2 if not specific
      expect(formatter.toString(0.0001)).toBe('0.0001');
      expect(formatter.toString(0.00001)).toBe('0.0000'); // rounds to p=4
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
      expect(formatter.toString(0.1)).toBe('0.1');
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
      expect(formatter.toString(0.01)).toBe('۰٬۰۱');
      expect(formatter.toString(0.05)).toBe('۰٬۱');
    });
  });
});

describe('Incremental Input Scenarios', () => {
  describe('Very Small Decimal Number (High Precision)', () => {
    const formatter = new NumberFormatter({ precision: 'high', language: 'en' });
    it('should correctly format incremental input for very small decimals', () => {
      expect(formatter.toString('0')).toBe('0');
      expect(formatter.toString('0.')).toBe('0.');
      expect(formatter.toString('0.0')).toBe('0.0');
      expect(formatter.toString('0.00000003')).toBe('0.00000003');
      expect(formatter.toString('0.000000030')).toBe('0.000000030'); // Preserves trailing zero if in originalInput
      expect(formatter.toString('0.00000003021')).toBe('0.00000003021');
    });
  });

  describe('E-commerce Price (USD Template)', () => {
    const usdFormatter = new NumberFormatter({ language: 'en', template: 'usd', precision: 'high' });
    it('should correctly format incremental input for USD prices', () => {
      expect(usdFormatter.toString('1')).toBe('$1');
      expect(usdFormatter.toString('19')).toBe('$19');
      expect(usdFormatter.toString('19.')).toBe('$19.');
      expect(usdFormatter.toString('19.9')).toBe('$19.9');
      expect(usdFormatter.toString('19.99')).toBe('$19.99');
    });
  });

  describe('Percentage Value (Percent Template)', () => {
    const percentFormatter = new NumberFormatter({ language: 'en', template: 'percent', precision: 'low' });

    it('should format initial percentage inputs as per typical percent template behavior', () => {
      expect(percentFormatter.toString(0)).toBe('0.00%');
      expect(percentFormatter.toString('0')).toBe('0.00%');
      // originalInput "0." with fixedDecimalZeros=2 for this range (0-0.01 in low precision)
      // fractionalPartStr becomes "00"
      // wholeNumberStr becomes "0.00"
      expect(percentFormatter.toString('0.')).toBe('0.00%');
    });

    it('should correctly format incremental percentage inputs', () => {
      // 0.1 to 1 range in low precision: p=2, d=2, r=true, f=0
      expect(percentFormatter.toString('0.2')).toBe('0.2%'); // fractionalPartStr is "2", not padded by fixedDecimalZeros
      expect(percentFormatter.toString('0.25')).toBe('0.25%');
      expect(percentFormatter.toString('0.257')).toBe('0.26%'); // p=2, d=2, r=true -> rounds
    });
  });

  describe('Banking Amount (High Precision)', () => {
    const highPrecisionFormatter = new NumberFormatter({ language: 'en', precision: 'high' });
    it('should correctly format incremental input for banking amounts with thousand separators', () => {
      expect(highPrecisionFormatter.toString('5')).toBe('5');
      expect(highPrecisionFormatter.toString('50000')).toBe('50,000');
      expect(highPrecisionFormatter.toString('50000.')).toBe('50,000.');
      expect(highPrecisionFormatter.toString('50000.5')).toBe('50,000.5');
      expect(highPrecisionFormatter.toString('50000.50')).toBe('50,000.50');
    });
  });

  describe('Thousand Separator Test (High Precision)', () => {
    const highPrecisionFormatter = new NumberFormatter({ language: 'en', precision: 'high' });
    it('should correctly apply thousand separators during incremental input', () => {
      expect(highPrecisionFormatter.toString('1')).toBe('1');
      expect(highPrecisionFormatter.toString('10')).toBe('10');
      expect(highPrecisionFormatter.toString('100')).toBe('100');
      expect(highPrecisionFormatter.toString('1000')).toBe('1,000');
      expect(highPrecisionFormatter.toString('10000')).toBe('10,000');
      expect(highPrecisionFormatter.toString('100002')).toBe('100,002');
      expect(highPrecisionFormatter.toString('1000023')).toBe('1,000,023');
      expect(highPrecisionFormatter.toString('1000023.')).toBe('1,000,023.');
      expect(highPrecisionFormatter.toString('1000023.4')).toBe('1,000,023.4');
      expect(highPrecisionFormatter.toString('1000023.45')).toBe('1,000,023.45');
    });
  });

  describe('Edge Case: Inputting Just a Decimal Separator', () => {
    const formatter = new NumberFormatter({ precision: 'high', language: 'en' });
    it('should handle input of just "."', () => {
      // nonFractionalStr becomes "0", originalInput is "."
      // fractionalPartStr becomes "" (originalDecimalPart is "")
      // wholeNumberStr becomes `0${decimalSeparator}${""}` which is "0."
      expect(formatter.toString('.')).toBe('0.');
    });
    it('should handle input of just "-."', () => {
      expect(formatter.toString('-.')).toBe('-0.');
    });
  });

  describe('Persian Locale Incremental Input', () => {
    const faFormatter = new NumberFormatter({ language: 'fa', precision: 'high' });
    it('should correctly format incremental Persian numbers with correct separators', () => {
      expect(faFormatter.toString('1')).toBe('۱');
      expect(faFormatter.toString('1234')).toBe('۱٬۲۳۴');
      expect(faFormatter.toString('1234.')).toBe('۱٬۲۳۴٫'); // Persian decimal separator
      expect(faFormatter.toString('1234.5')).toBe('۱٬۲۳۴٫۵');
      expect(faFormatter.toString('1234.56')).toBe('۱٬۲۳۴٫۵۶');
      expect(faFormatter.toString('0.')).toBe('۰٫');
      expect(faFormatter.toString('.5')).toBe('۰٫۵'); // nonFractionalStr '0' + decimal sep + '5'
    });

    const faPercentFormatter = new NumberFormatter({ language: 'fa', template: 'percent', precision: 'low' });
    it('should correctly format incremental Persian percentages', () => {
      // precision 'low', 0-0.01 range has f=2
      expect(faPercentFormatter.toString('0')).toBe('۰٫۰۰٪');
      expect(faPercentFormatter.toString('0.')).toBe('۰٫۰۰٪');
      // precision 'low', 0.1-1 range has f=0
      expect(faPercentFormatter.toString('0.2')).toBe('۰٫۲٪');
      expect(faPercentFormatter.toString('0.25')).toBe('۰٫۲۵٪');
    });
  });
});
