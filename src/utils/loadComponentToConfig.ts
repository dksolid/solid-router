import { JSX } from 'solid-js';

import { TypeRoute } from '../types/TypeRoute.js';

export function loadComponentToConfig(params: { route: TypeRoute }): Promise<void> {
  const { route } = params;

  if (!route.component && route.loader) {
    return route
      .loader()
      .then((module: { default: JSX.Element; store?: any; actions?: any; pageName?: string }) => {
        route.component = module.default;
        route.store = module.store;
        route.actions = module.actions;
        route.pageName = module.pageName;
      });
  }

  return Promise.resolve();
}
