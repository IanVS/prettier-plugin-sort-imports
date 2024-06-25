import { PreprocessorOptions } from '../types';
import { preprocessor } from './preprocessor';

export function defaultPreprocessor(
    code: string,
    options: PreprocessorOptions,
) {
    if (options.filepath?.endsWith('.vue')) return code;
    return preprocessor(code, options);
}
