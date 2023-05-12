// Loose leading comment before imports (should not be dragged down with B)

import C from "c" /* trailing comment that spans
                     onto the following line */

/* Leading comment before B */
import B from "b"; /* Trailing comment on same-line as B */
/* Trailing comment on first line after B (this is treated as a leading comment for next import A!) */


/* Leading comment before A */
import A from "a"; /* Trailing comment on same-line as A */
/* Trailing comment on first line after A (this is treated as a "bottom-of-imports comment) */

// Loose trailing comment after imports (should not be dragged up with A)
