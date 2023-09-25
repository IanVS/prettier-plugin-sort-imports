import { importDeclaration, type ImportSpecifier } from '@babel/types';

import { ExplodeTypeAndValueSpecifiers } from '../types';

/**
 * Breaks apart import declarations containing mixed type and value imports into separate declarations.
 *
 * e.g.
 *
 * ```diff
 * - import foo, { bar, type Baz } from './source';
 * + import foo, { bar } from './source';
 * + import type { Baz } from './source';
 * ```
 */
export const explodeTypeAndValueSpecifiers: ExplodeTypeAndValueSpecifiers = (
    nodes,
) => {
    const explodedNodes = [];

    for (const node of nodes) {
        // We don't need to explode type imports, they won't mix type and value
        if (node.importKind === 'type') {
            explodedNodes.push(node);
            continue;
        }

        // Nothing to do if there's only one specifier
        if (node.specifiers.length <= 1) {
            explodedNodes.push(node);
            continue;
        }

        // @ts-expect-error TS is not refining correctly, but we're checking the type
        const typeImports: ImportSpecifier[] = node.specifiers.filter(
            (i) => i.type === 'ImportSpecifier' && i.importKind === 'type',
        );

        // If we have a mix of type and value imports, we need to 'splode them into two import declarations
        if (typeImports.length && typeImports.length < node.specifiers.length) {
            const valueImports = node.specifiers.filter(
                (i) =>
                    !(i.type === 'ImportSpecifier' && i.importKind === 'type'),
            );
            const newValueNode = importDeclaration(valueImports, node.source);
            explodedNodes.push(newValueNode);

            // Change the importKind of the specifiers, to avoid `import type {type Foo} from 'foo'`
            typeImports.forEach(
                (specifier) => (specifier.importKind = 'value'),
            );
            const newTypeNode = importDeclaration(typeImports, node.source);
            newTypeNode.importKind = 'type';
            explodedNodes.push(newTypeNode);
            continue;
        }

        // Just a boring old values-only node
        explodedNodes.push(node);
    }
    return explodedNodes;
};
