import { TypeRoute } from '../types/TypeRoute.js';
import { TypeRedirectToParams } from '../types/TypeRedirectToParams.js';

import { findRouteByPathname } from './findRouteByPathname.js';
import { getDynamicValues } from './getDynamicValues.js';
import { getQueryValues } from './getQueryValues.js';

export function getInitialRoute<TRoutes extends Record<string, TypeRoute>>(params: {
  routes: TRoutes;
  pathname: string;
  fallback: TRoutes[keyof TRoutes]['name'];
}): TypeRedirectToParams<TRoutes, keyof TRoutes> {
  const route =
    findRouteByPathname({ pathname: params.pathname, routes: params.routes }) ||
    params.routes[params.fallback];

  return {
    route: route.name as keyof TRoutes,
    query: getQueryValues({ route, pathname: params.pathname }),
    params: getDynamicValues({ route, pathname: params.pathname }),
  } as any;
}
