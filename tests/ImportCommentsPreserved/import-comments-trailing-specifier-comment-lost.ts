import {
    b3,
    a3,
    /* @ts-expect-error*/
} from "c";

import {
    b4,
    a4,
    // @ts-expect-error
} from "c2";

import {
    b2,a2,
    // @ts-expect-error
} from "b";

import {
    b1,
    a1,

    // @ts-expect-error
} from "a";
