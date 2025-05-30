import { expect } from 'chai';

import { isDynamic, isDynamicRoute, clearDynamic } from '../src/utils/dynamic.js';

import { routes } from './routes.js';

describe('isDynamic', () => {
  it('Correctly detects', () => {
    expect(isDynamic('test')).to.eq(false);
    expect(isDynamic('t:e:s:t:')).to.eq(false);
    expect(isDynamic(':test')).to.eq(true);
    expect(isDynamic(':t:e:s:t:')).to.eq(true);
    expect(isDynamic('::t:e:s:t:')).to.eq(true);
  });
});

describe('clearDynamic', () => {
  it('Correctly clears', () => {
    expect(clearDynamic('test')).to.eq('test');
    expect(clearDynamic('t:e:s:t:')).to.eq('t:e:s:t:');
    expect(clearDynamic('test')).to.eq('test');
    expect(clearDynamic(':t:e:s:t:')).to.eq('t:e:s:t:');
    expect(clearDynamic('::t:e:s:t:')).to.eq(':t:e:s:t:');
  });
});

describe('isDynamicRoute', () => {
  it('Correctly detects', () => {
    expect(isDynamicRoute(routes.staticRoute)).to.eq(false);
    expect(isDynamicRoute(routes.dynamicRoute)).to.eq(true);
  });
});
