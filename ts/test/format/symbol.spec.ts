import { NumberFormatter, tomanSymbolSvg } from '../../src';

describe('Toman SVG rendering', () => {
  const make = (svg = true) => new NumberFormatter({ template: 'irt', currencySymbol: svg ? 'svg' : 'text' }).setLanguage('fa');
  it('keeps text, markdown, and JSON compatible even after HTML rendering', () => {
    const icon = make(); const text = make(false);
    for (const value of [0, -12500, 1e6, 1e12, '0.000001', '']) {
      expect(icon.toPlainString(value)).toBe(text.toPlainString(value));
      expect(icon.toMdString(value)).toBe(text.toMdString(value));
      icon.toHtmlString(value); text.toHtmlString(value);
      expect(icon.toJson(value)).toEqual(text.toJson(value));
    }
  });
  it('keeps SVG coordinates and path commands intact', () => {
    const output = make().toHtmlString(12500);
    expect(output).toContain(tomanSymbolSvg);
    expect(output).toContain('۱۲');
    expect(output).toContain('stroke-width="1.65"');
  });
  it('separates compact scale, currency, and affixes', () => {
    const formatter = make().setTemplate('irt', 'medium').setLanguage('fa', { prefix: 'قیمت: ', postfix: ' پایان' });
    const parts = formatter.formatToParts(1e12);
    expect(parts.find(p => p.type === 'compact')?.value).toBe('هزار میلیارد');
    expect(parts.filter(p => p.type === 'currency')).toEqual([{ type: 'currency', value: 'ت' }]);
    expect(parts[0]).toEqual({ type: 'prefix', value: 'قیمت: ' });
    expect(parts[parts.length - 1]).toEqual({ type: 'postfix', value: ' پایان' });
  });
  it('retains supported HTML affix markers', () => {
    const output = make().setLanguage('fa', { prefix: 'قیمت ', prefixMarker: 'strong', postfixMarker: 'span' }).toHtmlString(12);
    expect(output).toContain('<strong>قیمت </strong>');
    expect(output).toContain('<span> ' + tomanSymbolSvg + '</span>');
  });
  it('escapes user affixes in SVG HTML', () => {
    expect(make().setLanguage('fa', { postfix: '<img src=x onerror=alert(1)>' }).toHtmlString(12)).toContain('&lt;img');
  });
  it('does not affect other templates and does not mutate format during parts rendering', () => {
    const formatter = make().setTemplate('usd', 'high');
    expect(formatter.toHtmlString(12)).toBe(make(false).setTemplate('usd', 'high').toHtmlString(12));
    const irt = make(); const before = irt.toHtmlString(12);
    irt.formatToParts(12);
    expect(irt.toString(12)).toBe(before);
    expect(irt.formatToParts('')).toEqual([]);
    expect(irt.formatToParts('bad')).toEqual([]);
  });
});
