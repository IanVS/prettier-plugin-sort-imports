// Loose leading comment before imports (should not be dragged down with B)

/* Leading comment before B */
import B from "b"; /* Trailing comment on same-line as B (babel doesn't like CommentBlocks on same-line as anything else, so it will be shifted to a clean line) */
/* Trailing comment on first line after B (This is treated as a leading comment for next import A!) */


/* Leading comment before A */
import A from "a"; /* Trailing comment on same-line as A (babel doesn't like CommentBlocks on same-line as anything else, so it will be shifted to a clean line) */
/* Trailing comment on first line after A (will initially, because this is "close" to last-import 'a' */

// Loose trailing comment after imports (should not be dragged up with A)
