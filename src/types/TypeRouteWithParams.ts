import { TypeRoute } from './TypeRoute.js';

export type TypeRouteWithParams = Omit<TypeRoute, 'params'> & {
  params: Record<string, string>;
  query: Record<string, string>;
};
