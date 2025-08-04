import { PrettierOptions } from '../types';
import {
    extractTemplates,
    preprocessTemplateRange,
} from '../utils/glimmer-content-tag';
import { preprocessor } from './preprocessor';

export function emberPreprocessor(code: string, options: PrettierOptions) {
    const originalCode = code;
    let processedCode = code;
    const templates = extractTemplates(code);

    for (const template of templates) {
        processedCode = preprocessTemplateRange(template, processedCode);
    }

    const sorted = preprocessor(originalCode, processedCode, options);

    return sorted;
}
