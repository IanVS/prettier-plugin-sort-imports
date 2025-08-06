import type { ParseResult } from '@babel/parser';
import traverse, { type NodePath } from '@babel/traverse';
import { File, ImportDeclaration } from '@babel/types';

export function extractASTNodes(ast: ParseResult<File>) {
    const importDeclarations: ImportDeclaration[] = [];

    traverse(ast, {
        noScope: true, // This is required in order to avoid traverse errors if a variable is redefined (https://github.com/babel/babel/issues/12950#issuecomment-788974837)
        ImportDeclaration(path: NodePath<ImportDeclaration>) {
            const tsModuleParent = path.findParent((p) =>
                p.isTSModuleDeclaration(),
            );
            // Do not sort imports inside of typescript module declarations.  See `import-inside-ts-declare.ts` test.
            if (!tsModuleParent) {
                importDeclarations.push(path.node);
            }
        },
    });
    return { importDeclarations };
}
