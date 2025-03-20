type Template = 'number' | 'usd' | 'irt' | 'irr' | 'percent';
type Precision = 'auto' | 'high' | 'medium' | 'low';
type Language = 'en' | 'fa';
type OutputFormat = 'plain' | 'html' | 'markdown';
interface FormattedObject {
    value?: string;
    prefix: string;
    postfix: string;
    fullPostfix?: string;
    sign: string;
    wholeNumber: string;
}
interface LanguageConfig {
    prefixMarker?: string;
    postfixMarker?: string;
    prefix?: string;
    postfix?: string;
    thousandSeparator?: string;
    decimalSeparator?: string;
}
interface Options extends LanguageConfig {
    precision?: Precision;
    template?: Template;
    language?: Language;
    outputFormat?: OutputFormat;
}
declare class NumberFormatter {
    private readonly languageBaseConfig;
    private defaultLanguageConfig;
    private options;
    constructor(options?: Options);
    setLanguage(lang: Language, config?: LanguageConfig): NumberFormatter;
    setTemplate(template: Template, precision: Precision): NumberFormatter;
    toJson(input: string | number): FormattedObject;
    toString(input: string | number): string;
    toPlainString(input: string | number): string;
    toHtmlString(input: string | number): string;
    toMdString(input: string | number): string;
    private isENotation;
    private format;
    private convertENotationToRegularNumber;
    private reducePrecision;
}
export default NumberFormatter;
