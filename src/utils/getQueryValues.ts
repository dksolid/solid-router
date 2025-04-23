// eslint-disable-next-line import/no-unresolved
import queryString from 'query-string';

import { TypeRoute } from '../types/TypeRoute.js';

import { getTypedEntries } from './getTypedEntries.js';

export function getQueryValues<TRoute extends TypeRoute>(params: {
  route: TRoute;
  pathname: string;
}): Record<Partial<keyof TRoute['query']>, string> {
  const { route, pathname } = params;

  const qs = queryString.extract(pathname);

  if (!qs || !route.query) return {} as any;

  const query: Record<keyof TRoute['query'], string> = queryString.parse(qs) as any;

  getTypedEntries(query).forEach(([key, value]) => {
    // @ts-ignore
    const validator = route.query![key];

    if (typeof validator !== 'function' || !validator(value)) {
      delete query[key];
    }
  });

  return query;
}
