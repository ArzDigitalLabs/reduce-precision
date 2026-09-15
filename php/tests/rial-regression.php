<?php
// Standalone regression check: php php/tests/rial-regression.php
require_once __DIR__ . '/../src/NumberFormatter.php';

foreach (['high', 'medium', 'low', 'auto'] as $precision) {
    foreach ([1000, 1000000, 1000000000, 1000000000000, 1000000000000000, 1000000000000000000] as $value) {
        $formatter = new \NumberFormatter\NumberFormatter(['template' => 'irr', 'precision' => $precision]);
        $formatter->setLanguage('fa');
        foreach (['toPlainString', 'toHtmlString', 'toMdString', 'toString'] as $method) {
            $output = $formatter->$method($value);
            if (strpos($output, ' ر') === false || strpos($output, ' ت') !== false || strpos($output, 'همت') !== false) {
                throw new RuntimeException("Invalid Rial label: $precision / $method / $value: $output");
            }
        }
    }
}
echo "Rial labels passed: 96 PHP output cases\n";
