import {
    importFlavorIgnore,
    importFlavorRegular,
    importFlavorSideEffect,
    importFlavorType,
} from '../constants';
import type { GetImportFlavorOfNode } from '../types';

/**
 * Classifies nodes by import-flavor, primarily informing whether the node is a candidate for merging
 *
 * @param node
 * @returns {("prettier-ignore"|"regular"|"side-effect"|"type")}
 */
export const getImportFlavorOfNode: GetImportFlavorOfNode = (node) => {
    const hasIgnoreNextNode = (node.leadingComments ?? []).some(
        (comment) => comment.value.trim() === 'prettier-ignore',
    );
    if (hasIgnoreNextNode) {
        return importFlavorIgnore;
    }
    if (node.specifiers.length === 0) {
        return importFlavorSideEffect;
    }
    if (node.importKind === 'type') {
        return importFlavorType;
    }
    return importFlavorRegular;
};
