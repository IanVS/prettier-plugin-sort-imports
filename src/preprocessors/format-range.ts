import { PrettierOptions } from '../types';

export interface FormatRange {
    start: number;
    end: number;
}

export function getPartialFormatRange(
    code: string,
    options: PrettierOptions,
): FormatRange | null {
    const start = clampRangeIndex(options.rangeStart, code.length, 0);
    const end = clampRangeIndex(options.rangeEnd, code.length, code.length);

    if (start <= 0 && end >= code.length) {
        return null;
    }

    return {
        start,
        end,
    };
}

export function rangesOverlap(
    firstRange: FormatRange,
    secondRange: FormatRange,
) {
    return (
        firstRange.end > secondRange.start && secondRange.end > firstRange.start
    );
}

export function toLocalFormatRange(
    fileRange: FormatRange,
    containerRange: FormatRange,
): FormatRange | null {
    const start = Math.max(fileRange.start, containerRange.start);
    const end = Math.min(fileRange.end, containerRange.end);

    if (end <= start) {
        return null;
    }

    return {
        start: start - containerRange.start,
        end: end - containerRange.start,
    };
}

function clampRangeIndex(value: number, codeLength: number, fallback: number) {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.max(0, Math.min(value, codeLength));
}
