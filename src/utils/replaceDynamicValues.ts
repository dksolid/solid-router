import { TypeRoute } from '../types/TypeRoute.js';
import { TypeRouteWithParams } from '../types/TypeRouteWithParams.js';
import { TypeCurrentRoute } from '../types/TypeCurrentRoute.js';

import { constants } from './constants.js';
import { isDynamic, clearDynamic } from './dynamic.js';

const re = new RegExp(`[^${constants.pathPartSeparator}]+`, 'g');

export function replaceDynamicValues<
  TRouteItem extends TypeRoute | TypeRouteWithParams | TypeCurrentRoute<TypeRoute>,
>({
  route,
  params = {} as any,
}: {
  route: TRouteItem;
  params?: Record<keyof TRouteItem['params'], string>;
}): string {
  return route.path.replace(re, (paramName) => {
    if (!isDynamic(paramName)) return paramName;

    const value = params[clearDynamic(paramName) as keyof TRouteItem['params']];

    if (!value) {
      throw new Error(
        `replaceDynamicValues: no param "${paramName}" passed for route ${route.name}`
      );
    }

    return encodeURIComponent(value);
  });
}
