import { expect } from 'chai';

import { constants } from '../src/utils/constants.js';

describe('constants', () => {
  it('Correct constants', () => {
    expect(constants).to.deep.eq({
      dynamicSeparator: ':',
      pathPartSeparator: '/',
      isClient: true,
      errorRedirect: 'REDIRECT',
      errorPrevent: 'PREVENT_REDIRECT',
    });
  });
});
