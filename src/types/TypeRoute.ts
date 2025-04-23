import { JSX } from 'solid-js';

import { TypeRouteRaw } from './TypeRouteRaw.js';

export type TypeRoute = TypeRouteRaw & {
  name: string;
  store?: any;
  actions?: any;
  pageName?: string;
  component?: JSX.Element;
};
