import NumberFormatter from '../../src/format'; // Adjust path if necessary based on actual structure

describe('NumberFormatter - Liveformat Template', () => {
  const options = { template: 'liveformat' as any }; // Cast to any to allow new template type if TS is strict before build

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
    // Test cases for E-notation handling by incremental template
    { input: '1.23e-7', expected: '0.000000123' },
    { input: '1.23E-7', expected: '0.000000123' }, // Uppercase E
    { input: 0.000000123, expected: '0.000000123' }, // Number input that becomes E-notation
    { input: '12345e-2', expected: '123.45' }, // Positive coefficient, negative exponent
    { input: '0.00012345e+2', expected: '0.012345' }, // Decimal coefficient, positive exponent
    { input: '1.23e+8', expected: '123,000,000' },
    { input: '1.23E+8', expected: '123,000,000' },
    { input: 123000000, expected: '123,000,000' }, // Number input (large)
    { input: '1234567.89e+3', expected: '1,234,567,890' }, // Large number with decimal, positive exponent
    { input: '123456789012345', expected: '123,456,789,012,345' }, // Large integer string (no E)
    { input: 123456789012345, expected: '123,456,789,012,345' },   // Large integer number
    { input: '1e-3', expected: '0.001' },
    { input: 0.001, expected: '0.001' },
    { input: '1e+3', expected: '1,000' },
    { input: 1000, expected: '1,000' },
    { input: '0e0', expected: '0' }, // Zero in E-notation
    { input: 0e0, expected: '0' },
    { input: '0.0e0', expected: '0.0' },
    // Cases that might stress the convertENotationToRegularNumber
    { input: '123456789123456789123', expected: '123,456,789,123,456,789,123' }, // Very large integer string
    { input: 123456789123456789123, expected: '123,456,789,123,456,800,000' }, // Very large integer number (JS might show as E if too large for its default toString)
    { input: '1.0e-20', expected: '0.00000000000000000001'}, // Small number, many zeros
    { input: 1.0e-20, expected: '0.00000000000000000001'},
    { input: '1.0e+20', expected: '100,000,000,000,000,000,000'}, // Large number, many zeros
    { input: 1.0e+20, expected: '100,000,000,000,000,000,000'},
    // Check inputs that convertENotationToRegularNumber might have previously struggled with
    { input: '1e21', expected: '1,000,000,000,000,000,000,000' }, // Number that is 10^21
    { input: 1e21, expected: '1,000,000,000,000,000,000,000' },
    // Test with negative numbers in E-notation
    { input: '-1.23e-7', expected: '-0.000000123' },
    { input: -0.000000123, expected: '-0.000000123' },
    { input: '-1.23e+8', expected: '-123,000,000' },
    { input: -123000000, expected: '-123,000,000' },
  ];

  testCases.forEach(({ input, expected }) => {
    it(`should format '${input}' to '${expected}'`, () => {
      const formatter = new NumberFormatter(options);
      expect(formatter.toPlainString(input)).toBe(expected);
    });
  });

  // Test with different separators if possible, though the problem implies fixed separators for this template
  // For now, assuming default separators (',' and '.') as per examples
  describe('NumberFormatter - Liveformat Template with Fa Language (different separators)', () => {
    const faOptions = {
        template: 'liveformat' as any,
        language: 'fa' as any // 'fa' uses '٫' and '٬'
    };
    const formatter = new NumberFormatter(); // Create once
    formatter.setLanguage('fa'); // Set language
    formatter.setTemplate('liveformat' as any, 'auto' as any); // Set template

    // Confirmed Farsi Separators: Thousands: ٬ (U+066C), Decimal: ٫ (U+066B)
    // Output Digits: Persian Numerals ۰۱۲... (U+06F0 range) as per TS implementation

    it('should format Farsi input "۱۲۳۴" to "۱٬۲۳۴"', () => {
      expect(formatter.toPlainString('۱۲۳۴')).toBe('۱٬۲۳۴');
    });

    it('should format Farsi input "۱۲۳۴۵٫۶۷" (Farsi decimal) to "۱۲٬۳۴۵٫۶۷"', () => {
      expect(formatter.toPlainString('۱۲۳۴۵٫۶۷')).toBe('۱۲٬۳۴۵٫۶۷');
    });

    it('should format Farsi input "-۷۸۹٫۰۱" (Farsi decimal) to "-۷۸۹٫۰۱"', () => {
      expect(formatter.toPlainString('-۷۸۹٫۰۱')).toBe('-۷۸۹٫۰۱');
    });

    it('should format Farsi input "۰" to "۰"', () => {
      expect(formatter.toPlainString('۰')).toBe('۰');
    });

    it('should format Farsi input "-۰" to "۰"', () => { // Unsigned zero
      expect(formatter.toPlainString('-۰')).toBe('۰');
    });

    it('should format Farsi input "۰٫۱۲" (Farsi decimal) to "۰٫۱۲"', () => {
      expect(formatter.toPlainString('۰٫۱۲')).toBe('۰٫۱۲');
    });

    it('should format Farsi input "-۰٫۱۲" (Farsi decimal) to "-۰٫۱۲"', () => {
      expect(formatter.toPlainString('-۰٫۱۲')).toBe('-۰٫۱۲');
    });

    it('should format Farsi input "۱۲۳۴۵۶۷۸۹٫۱۲۳" (Farsi decimal) to "۱۲۳٬۴۵۶٬۷۸۹٫۱۲۳"', () => {
      expect(formatter.toPlainString('۱۲۳۴۵۶۷۸۹٫۱۲۳')).toBe('۱۲۳٬۴۵۶٬۷۸۹٫۱۲۳');
    });

    it('should format mixed Farsi/Western digit input "1۲۳۴٫۵۶" (Farsi decimal) to "۱٬۲۳۴٫۵۶"', () => {
      expect(formatter.toPlainString('1۲۳۴٫۵۶')).toBe('۱٬۲۳۴٫۵۶');
    });

    it('should format Farsi input with only Farsi decimal separator "٫" to "۰٫"', () => {
      expect(formatter.toPlainString('٫')).toBe('۰٫');
    });

    // User's critical case 1 (Farsi input, Farsi decimal '٫')
    it('should format Farsi input "۹۳۱۲۸۳٫۰۰۰۹۱۲۳" to "۹۳۱٬۲۸۳٫۰۰۰۹۱۲۳"', () => {
      expect(formatter.toPlainString('۹۳۱۲۸۳٫۰۰۰۹۱۲۳')).toBe('۹۳۱٬۲۸۳٫۰۰۰۹۱۲۳');
    });

    // User's critical case 2 (Western input "39312312.123123", lang 'fa')
    // TS liveformat needs input to use '٫' if lang=fa for correct parsing.
    it('should format Western digit input "39312312٫123123" (Farsi decimal) to "۳۹٬۳۱۲٬۳۱۲٫۱۲۳۱۲۳" when lang=fa', () => {
        expect(formatter.toPlainString('39312312٫123123')).toBe('۳۹٬۳۱۲٬۳۱۲٫۱۲۳۱۲۳');
    });

    it('should format Farsi input "۱۲۳۴۵۶۷" to "۱٬۲۳۴٬۵۶۷"', () => {
      expect(formatter.toPlainString('۱۲۳۴۵۶۷')).toBe('۱٬۲۳۴٬۵۶۷');
    });

    it('should format Farsi input "۱۲۳٫۴۵" (Farsi decimal) to "۱۲۳٫۴۵"', () => {
      expect(formatter.toPlainString('۱۲۳٫۴۵')).toBe('۱۲۳٫۴۵');
    });

    // Test "0.0" like inputs
    it('should format Farsi "۰٫۰" to "۰٫۰"', () => {
      expect(formatter.toPlainString('۰٫۰')).toBe('۰٫۰');
    });
    it('should format Farsi "-۰٫۰" to "-۰٫۰"', () => {
      expect(formatter.toPlainString('-۰٫۰')).toBe('-۰٫۰');
    });
    // Expectations for 0.0e0 related inputs, assuming they should result in "۰٫۰" after fixes
    it('should format "0.0e0" to "۰٫۰" when lang=fa', () => {
      expect(formatter.toPlainString('0.0e0')).toBe('۰٫۰');
    });
    it('should format "۰٫۰e0" (Farsi input) to "۰٫۰" when lang=fa', () => {
      expect(formatter.toPlainString('۰٫۰e0')).toBe('۰٫۰');
    });
  });
});
