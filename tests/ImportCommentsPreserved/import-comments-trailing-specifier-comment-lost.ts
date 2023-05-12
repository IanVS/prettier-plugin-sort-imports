import {
    b3,
    a3,
    /* @ts-expect-error*/
} from "c";

import {
    b2,a2,
    // @ts-expect-error
} from "b";

import {
    b1,
    a1,

    // @ts-expect-error
} from "a";
