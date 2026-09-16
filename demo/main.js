import { NumberFormatter, tomanSymbolSvg } from 'reduce-precision';
import './style.css';

const fields = {
  symbol: document.querySelector('#symbol'),
  number: document.querySelector('#number'),
  template: document.querySelector('#template'),
  precision: document.querySelector('#precision'),
  language: document.querySelector('#language'),
  format: document.querySelector('#format'),
  prefix: document.querySelector('#prefix'),
  postfix: document.querySelector('#postfix'),
};

const result = document.querySelector('#result');
const json = document.querySelector('#json');
const status = document.querySelector('#status');
const copy = document.querySelector('#copy');

function createFormatter() {
  const formatter = new NumberFormatter({ currencySymbol: fields.symbol.value });
  formatter.setLanguage(fields.language.value, {
    prefix: fields.prefix.value,
    postfix: fields.postfix.value,
  });
  formatter.setTemplate(fields.template.value, fields.precision.value);
  return formatter;
}

function render() {
  try {
    const formatter = createFormatter();
    const input = fields.number.value;
    const method = {
      plain: 'toPlainString',
      html: 'toHtmlString',
      markdown: 'toMdString',
    }[fields.format.value];

    const parts = formatter.formatToParts(input);
    const output = fields.format.value === 'parts' ? parts.map(part => part.value).join('') : formatter[method](input);
    result.replaceChildren();
    if (fields.format.value === 'parts') {
      for (const part of parts) {
        if (part.type === 'currency' && fields.symbol.value === 'svg') {
          const icon = new DOMParser().parseFromString(tomanSymbolSvg, 'image/svg+xml').documentElement;
          result.append(document.importNode(icon, true));
        } else result.append(document.createTextNode(part.value));
      }
    } else if (fields.format.value === 'html') {
      // Only copy supported formatter markup; never insert user affixes as active HTML.
      const parsed = new DOMParser().parseFromString(output, 'text/html');
      function appendSafe(source, target) {
        for (const node of source.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) target.append(document.createTextNode(node.textContent));
          else if (node.nodeName.toLowerCase() === 'svg' && node.classList.contains('rp-currency-symbol')) {
            target.append(document.importNode(new DOMParser().parseFromString(tomanSymbolSvg, 'image/svg+xml').documentElement, true));
          } else if (['I', 'STRONG', 'EM', 'SPAN', 'B'].includes(node.nodeName)) {
            const element = document.createElement(node.nodeName.toLowerCase());
            appendSafe(node, element); target.append(element);
          } else target.append(document.createTextNode(node.textContent));
        }
      }
      appendSafe(parsed.body, result);
    } else result.textContent = output || '—';
    document.querySelector('#raw').textContent = output;
    copy.dataset.output = output;
    json.textContent = JSON.stringify(fields.format.value === 'parts' ? parts : createFormatter().toJson(input), null, 2);
    status.textContent = `${fields.format.value} · ${fields.language.value}`;
    document.documentElement.lang = fields.language.value;
    result.dir = fields.language.value === 'fa' ? 'rtl' : 'ltr';
  } catch (error) {
    result.textContent = 'Could not format this value';
    json.textContent = error instanceof Error ? error.message : String(error);
  }
}

Object.values(fields).forEach((field) => {
  field.addEventListener('input', render);
  field.addEventListener('change', render);
});

copy.addEventListener('click', async () => {
  await navigator.clipboard.writeText(copy.dataset.output || '');
  copy.textContent = 'Copied';
  window.setTimeout(() => { copy.textContent = 'Copy output'; }, 1200);
});

render();
