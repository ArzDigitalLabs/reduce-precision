# reduce-precision

## Install

```bash
npm i reduce-precision
```

## Usage

#### Require

```javascript
const { format } = require('reduce-precision);

const formated = format(123456, options);
```

#### import

```ts
import { format } from 'reduce-precision';

const formated = format(123456, options);
```

## Options

| Option        | Description                                                        | Default Value |
| ------------- | ------------------------------------------------------------------ | ------------- |
| precision     | Precision level ('high', 'medium', 'low', 'auto')                  | 'high'        |
| template      | Template for formatting ('number', 'usd', 'irt', 'irr', 'percent') | 'number'      |
| language      | Language for formatting                                            | 'en'          |
| outputFormat  | Output format ('plain','html','markdown')                          | 'plain'       |
| prefixMarker  | Prefix marker                                                      | 'i'           |
| postfixMarker | Postfix marker                                                     | 'i'           |
| prefix        | Prefix                                                             | ''            |
| postfix       | Postfix                                                            | ''            |
