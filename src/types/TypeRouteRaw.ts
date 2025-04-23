import { TypeValidator } from './TypeValidator.js';

export type TypeRouteRaw = {
  path: string;
  loader: () => Promise<{ default: any }>;
  props?: Record<string, any>;
  query?: Record<string, TypeValidator>;
  params?: Record<string, TypeValidator>;
  beforeEnter?: (
    config: {
      nextUrl: string;
      nextRoute: any;
      nextPathname: string;
      nextQuery?: any;
      nextSearch?: string;

      currentUrl?: string;
      currentQuery?: any;
      currentRoute?: any;
      currentSearch?: string;
      currentPathname?: string;
    },
    ...args: Array<any>
  ) => Promise<any>;
  beforeLeave?: (
    config: {
      nextUrl: string;
      nextRoute: any;
      nextPathname: string;
      nextQuery?: any;
      nextSearch?: string;

      currentUrl?: string;
      currentQuery?: any;
      currentRoute?: any;
      currentSearch?: string;
      currentPathname?: string;
    },
    ...args: Array<any>
  ) => Promise<any> | null;
};
