import { parse as babelParser, type ParserOptions } from '@babel/parser';
import traverse, { type NodePath } from '@babel/traverse';
import { ImportDeclaration, isTSModuleDeclaration } from '@babel/types';

export const getImportNodes = (
    code: string,
    options?: ParserOptions,
): ImportDeclaration[] => {
    const importNodes: ImportDeclaration[] = [];
    const ast = babelParser(code, {
        ...options,
        sourceType: 'module',
    });

    traverse(ast, {
        ImportDeclaration(path: NodePath<ImportDeclaration>) {
            const tsModuleParent = path.findParent((p) =>
                isTSModuleDeclaration(p.node),
            );
            if (!tsModuleParent) {
                importNodes.push(path.node);
            }
        },
    });

    return importNodes;
};
