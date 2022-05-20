import {
    importFlavorIgnore,
    importFlavorSideEffect,
    importFlavorType,
    importFlavorValue,
} from '../constants';
import type { GetImportFlavorOfNode } from '../types';
import { hasIgnoreNextNode } from './has-ignore-next-node';

/**
 * Classifies nodes by import-flavor, primarily informing whether the node is a candidate for merging
 *
 * @param node
 * @returns the flavor of the import node
 */
export const getImportFlavorOfNode: GetImportFlavorOfNode = (node) => {
    if (hasIgnoreNextNode(node.leadingComments)) {
        return importFlavorIgnore;
    }
    if (node.specifiers.length === 0) {
        return importFlavorSideEffect;
    }
    if (node.importKind === 'type') {
        return importFlavorType;
    }
    return importFlavorValue;
};
