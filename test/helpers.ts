/* eslint-disable @typescript-eslint/naming-convention */

import { addState } from '@dksolid/solid-stateful-fn';
import { createMutable } from 'solid-js/store';

import { redirectToGenerator } from '../src/redirectToGenerator.js';
import { InterfaceRouterStore } from '../src/types/InterfaceRouterStore.js';
import { TypeRoute } from '../src/index.js';

import { routes } from './routes.js';

function createSeparateFunction<TRoutes extends Record<string, TypeRoute>>(
  customRoutes: TRoutes,
  lifecycleParams?: any
) {
  class RouterStore implements InterfaceRouterStore<TRoutes> {
    constructor() {
      return createMutable(this);
    }

    routesHistory: InterfaceRouterStore<TRoutes>['routesHistory'] = [];
    currentRoute: InterfaceRouterStore<TRoutes>['currentRoute'] = {} as any;
  }

  const routerStore = new RouterStore();

  const redirectTo = addState(
    redirectToGenerator({
      routes: customRoutes || routes,
      routerStore,
      lifecycleParams,
      routeError500: customRoutes.error500 as any,
    }),
    'redirectTo'
  );

  return { redirectTo, routerStore };
}

function createStoreFunction<TRoutes extends Record<string, TypeRoute>>(
  customRoutes: TRoutes,
  lifecycleParams?: any
) {
  class RouterStore implements InterfaceRouterStore<TRoutes> {
    constructor() {
      this.redirectTo = addState(this.redirectTo, 'redirectTo');

      return createMutable(this);
    }

    routesHistory: InterfaceRouterStore<TRoutes>['routesHistory'] = [];
    currentRoute: InterfaceRouterStore<TRoutes>['currentRoute'] = {} as any;

    redirectTo = redirectToGenerator({
      routes: customRoutes || routes,
      routerStore: this,
      lifecycleParams,
      routeError500: customRoutes.error500 as any,
    });
  }

  const routerStore = new RouterStore();

  return { routerStore };
}

export function getData<TRoutes extends Record<string, TypeRoute>>(
  mode: 'separate' | 'store',
  customRoutes: TRoutes,
  lifecycleParams?: any
) {
  let redirectTo: ReturnType<typeof redirectToGenerator<TRoutes>>;
  let routerStore: InterfaceRouterStore<TRoutes>;

  if (mode === 'store') {
    const output = createStoreFunction(customRoutes, lifecycleParams);

    routerStore = output.routerStore;
    redirectTo = output.routerStore.redirectTo;
  } else {
    const output = createSeparateFunction(customRoutes, lifecycleParams);

    routerStore = output.routerStore;
    redirectTo = output.redirectTo;
  }

  return { redirectTo, routerStore };
}
