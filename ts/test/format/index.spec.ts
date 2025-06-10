import NumberFormatter from '../../src/format'; // Adjust path if necessary based on actual structure

describe('NumberFormatter - Incremental Template', () => {
  const options = { template: 'incremental' as any }; // Cast to any to allow new template type if TS is strict before build

  const testCases = [
    { input: '0', expected: '0' },
    { input: '02', expected: '2' },
    { input: '29', expected: '29' },
    { input: '292', expected: '292' },
    { input: '2923', expected: '2,923' },
    { input: '29231', expected: '29,231' },
    { input: '292312', expected: '292,312' },
    { input: '2923123', expected: '2,923,123' },
    { input: '2923123.', expected: '2,923,123.' },
    { input: '2923123.0', expected: '2,923,123.0' },
    { input: '2923123.00', expected: '2,923,123.00' },
    { input: '2923123.003', expected: '2,923,123.003' },
    { input: '2923123.0030', expected: '2,923,123.0030' },
    { input: '2923123.00301', expected: '2,923,123.00301' },
    { input: '2923123.003012', expected: '2,923,123.003012' },
    // Edge cases
    { input: '', expected: '' }, // Empty input
    { input: '.', expected: '0.' }, // Just decimal separator
    { input: '0.0', expected: '0.0' },
    { input: '0.12', expected: '0.12' },
    { input: '.5', expected: '0.5' }, // Leading decimal separator
    { input: '007', expected: '7' }, // Multiple leading zeros, integer
    { input: '00.25', expected: '0.25' }, // Multiple leading zeros, decimal
    { input: '12345.6700', expected: '12,345.6700' }, // Trailing zeros in decimal
    { input: '000', expected: '0' }, // Multiple zeros
    { input: '000.000', expected: '0.000' }, // Multiple zeros with decimal
  ];

  testCases.forEach(({ input, expected }) => {
    it(`should format '${input}' to '${expected}'`, () => {
      const formatter = new NumberFormatter(options);
      expect(formatter.toPlainString(input)).toBe(expected);
    });
  });

  // Test with different separators if possible, though the problem implies fixed separators for this template
  // For now, assuming default separators (',' and '.') as per examples
  describe('NumberFormatter - Incremental Template with Fa Language (different separators)', () => {
    const faOptions = {
        template: 'incremental' as any,
        language: 'fa' as any // 'fa' uses '٫' and '٬'
    };
    const formatter = new NumberFormatter(); // Create once
    formatter.setLanguage('fa'); // Set language
    formatter.setTemplate('incremental' as any, 'auto' as any); // Set template

    // Test a few cases to ensure fa separators are used if logic is universal
    // The current implementation of incremental template hardcodes separators in regex.
    // This test might fail or show that fa separators are NOT used by incremental.
    // Based on the current implementation, it will use options.thousandSeparator, which is set by setLanguage.

    it('should format "1234.56" with Farsi separators if language is fa', () => {
      // Default fa: thousandSeparator: '٫', decimalSeparator: '٬'
      // Expected: "1٬234٫56" (Note: problem description implies fixed , and . for incremental)
      // The implementation uses this.options.thousandSeparator and this.options.decimalSeparator
      // which are correctly set by setLanguage('fa').
      // So, "1234.56" -> integer "1234", decimal "56"
      // formattedIntegerPart = "1" + '٬' + "234"
      // finalValue = "1٬234" + '٫' + "56"
          expect(formatter.toPlainString('1234٫56')).toBe('1٬234٫56');
    });

    it('should format "1234567.89" with Farsi separators if language is fa', () => {
          expect(formatter.toPlainString('1234567٫89')).toBe('1٬234٬567٫89');
    });
  });
});
