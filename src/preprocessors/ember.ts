import { PrettierOptions } from '../types';
import {
    extractTemplates,
    preprocessTemplateRange,
} from '../utils/glimmer-content-tag';
import { preprocessor } from './preprocessor';

export function emberPreprocessor(code: string, options: PrettierOptions) {
    let parseableCode = code;
    const templates = extractTemplates(code);

    for (const template of templates) {
        parseableCode = preprocessTemplateRange(template, parseableCode);
    }

    const sorted = preprocessor(code, { parseableCode, options });

    return sorted;
}
