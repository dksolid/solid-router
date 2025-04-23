import { TypeRoute } from '../types/TypeRoute.js';
import { TypeValidator } from '../types/TypeValidator.js';

import { constants } from './constants.js';

export function isDynamic(param: string): boolean {
  // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
  return param[0] === constants.dynamicSeparator;
}

export function clearDynamic(param: string): string {
  return param.replace(new RegExp(`^${constants.dynamicSeparator}`), '');
}

export function isDynamicRoute<TRoute extends TypeRoute>(
  route: TRoute
): route is TRoute & { params: Record<keyof TRoute, TypeValidator> } {
  return 'params' in route;
}
