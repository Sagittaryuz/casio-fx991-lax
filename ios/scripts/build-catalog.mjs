// Preserve the verified web catalog and its identifiers without duplicating constants by hand.
import {CONSTANTS,CONVERSIONS} from '../../src/catalog.js';import fs from 'node:fs';
fs.writeFileSync(new URL('../Resources/catalog.json',import.meta.url),JSON.stringify({constants:CONSTANTS,conversions:CONVERSIONS})+'\n');
