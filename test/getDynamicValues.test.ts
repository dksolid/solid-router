import { expect } from 'chai';

import { getDynamicValues } from '../src/utils/getDynamicValues.js';

import { routes } from './routes.js';

describe('getDynamicValues', () => {
  it('Should return params from pathname', () => {
    const params = getDynamicValues({
      route: routes.dynamicRoute,
      pathname: '/test/dynamic',
    });

    expect(params).to.deep.equal({ static: 'dynamic' });

    const params2 = getDynamicValues({
      route: routes.dynamicRoute3,
      pathname: '/test4/dynamic',
    });

    // eslint-disable-next-line @typescript-eslint/naming-convention
    expect(params2).to.deep.equal({ ':static': 'dynamic' });

    const params3 = getDynamicValues({
      route: routes.dynamicRoute,
      pathname: '/test/dynamic?q=test',
    });

    expect(params3).to.deep.equal({ static: 'dynamic' });

    const params4 = getDynamicValues({
      route: routes.dynamicRoute3,
      pathname: '/test4/dynamic?q=test',
    });

    // eslint-disable-next-line @typescript-eslint/naming-convention
    expect(params4).to.deep.equal({ ':static': 'dynamic' });
  });

  it('Should return multi params from pathname', () => {
    const params = getDynamicValues({
      route: routes.dynamicRouteMultiple,
      pathname: '/test/dynamic/dynamic2',
    });

    expect(params).to.deep.equal({ param: 'dynamic', param2: 'dynamic2' });

    const params2 = getDynamicValues({
      route: routes.dynamicRouteMultiple,
      pathname: '/test/dynamic/dynamic2?q=test',
    });

    expect(params2).to.deep.equal({ param: 'dynamic', param2: 'dynamic2' });
  });

  it('Should return empty params', () => {
    const params = getDynamicValues({
      route: routes.staticRoute,
      pathname: '/test/static',
    });

    // eslint-disable-next-line no-unused-expressions,@typescript-eslint/no-unused-expressions
    expect(params).to.be.empty;

    const params2 = getDynamicValues({
      route: routes.staticRoute,
      pathname: '/test/static?q=test',
    });

    // eslint-disable-next-line no-unused-expressions,@typescript-eslint/no-unused-expressions
    expect(params2).to.be.empty;
  });

  it('Special symbols', () => {
    const params = getDynamicValues({
      route: routes.dynamicRouteMultiple,
      pathname: '/test/%D1%88%D0%B5%D0%BB%D0%BB%D1%8B/%3Fx%3Dtest',
    });

    expect(params).to.deep.equal({ param: 'шеллы', param2: '?x=test' });
  });
});
