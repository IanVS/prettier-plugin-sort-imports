'use strict';

import { expect } from 'vitest';

const RAW = Symbol.for('raw');

expect.addSnapshotSerializer({
    print(val) {
        return val[RAW];
    },
    test(val) {
        return (
            val &&
            Object.prototype.hasOwnProperty.call(val, RAW) &&
            typeof val[RAW] === 'string'
        );
    },
});
