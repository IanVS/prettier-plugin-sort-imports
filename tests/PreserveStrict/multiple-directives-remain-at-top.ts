// below is a directive prologue
  'use custom' ; /* more directives... */ 'enable typecheck'
                 'forbid IE'

import './SetupEnvironment';
import type { Period } from './Period'

"this is not a directive prologue";

function foo() {
}