import { NumberFormatter } from '../../src';

const scales = [
  [1000, 'هزار'], [1e6, 'میلیون'], [1e9, 'میلیارد'],
  [1e12, 'هزار میلیارد'], [1e15, 'کادریلیون'], [1e18, 'کنتیلیون'],
] as const;

describe('Rial currency labels', () => {
  for (const precision of ['high', 'medium', 'low', 'auto'] as const) {
    for (const [value, scale] of scales) {
      it(`${precision}: ${value} keeps Rial across every output`, () => {
        const formatter = new NumberFormatter({ template: 'irr', precision, currencySymbol: 'svg' }).setLanguage('fa');
        const compact = precision === 'medium' || precision === 'low' || (precision === 'auto' && value >= 1e12);
        const plain = formatter.toPlainString(value);
        expect(plain).toMatch(/ ر$/);
        expect(plain).not.toMatch(/تومان|همت| ت(?:$|\s)/);
        if (compact) expect(plain).toContain(` ${scale} ر`);
        expect(formatter.formatToParts(value).map(p => p.value).join('')).toBe(plain);
        expect(formatter.toHtmlString(value)).toContain('<i>' + (compact ? ` ${scale} ر` : ' ر') + '</i>');
        expect(formatter.toMdString(value)).not.toContain(' ت');
        const json = formatter.toJson(value);
        expect(json.postfix).toContain(' ر');
        if (compact) expect(json.fullPostfix).toContain(` ${scale} ریال`);
        expect(formatter.toString(value)).toBe(formatter.toMdString(value));
      });
    }
  }
  it('preserves signs, affixes, and Toman behavior', () => {
    const f = new NumberFormatter({template: 'irr', precision: 'medium'}).setLanguage('fa', {prefix: 'قیمت: ', postfix: ' امروز'});
    expect(f.toPlainString(-1e6)).toBe('-قیمت: ۱٫۰۰ میلیون ر امروز');
    expect(f.toPlainString(0)).toContain(' ر');
    expect(f.toPlainString('')).toBe('');
    f.setTemplate('irt', 'medium');
    expect(f.toPlainString(1e12)).toContain(' همت');
  });
});
