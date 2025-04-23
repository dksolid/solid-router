/* eslint-disable  @typescript-eslint/naming-convention */

import { batch, createContext, createRenderEffect } from 'solid-js';
import { createMutable } from 'solid-js/store';
import { createUseStore, ViewModelConstructor } from '@dksolid/solid-vm';

import { history } from './utils/history.js';
import { TypeRoute } from './types/TypeRoute.js';
import { getInitialRoute } from './utils/getInitialRoute.js';
import { InterfaceRouterStore } from './types/InterfaceRouterStore.js';
import { redirectToGenerator } from './redirectToGenerator.js';

type ViewModel = ViewModelConstructor<null>;

type TypeProps<TRoutes extends Record<string, TypeRoute>> = {
  routes: TRoutes;
  redirectTo: ReturnType<typeof redirectToGenerator<TRoutes>>;
  routerStore: InterfaceRouterStore<TRoutes>;
  beforeMount?: () => void;
  beforeSetPageComponent?: (componentConfig: TRoutes[keyof TRoutes]) => void;
  beforeUpdatePageComponent?: () => void;
};

const StoreContext = createContext(null);

const useStore = createUseStore(StoreContext);

class VM<TRoutes extends Record<string, TypeRoute>> implements ViewModel {
  constructor(
    public context: null,
    public props: TypeProps<TRoutes>
  ) {
    return createMutable(this);
  }
  loadedComponentName?: keyof TRoutes = undefined;
  loadedComponentPage?: string = undefined;

  beforeMount() {
    this.props.beforeMount?.();

    this.redirectOnHistoryPop();

    createRenderEffect(() => this.setLoadedComponent());
  }

  redirectOnHistoryPop() {
    if (!history) return;

    history.listen((params) => {
      if (params.action !== 'POP') return;

      const previousRoutePathname =
        this.props.routerStore.routesHistory[this.props.routerStore.routesHistory.length - 2];

      if (previousRoutePathname === params.location.pathname) {
        this.props.routerStore.routesHistory.pop();
      }

      void this.props.redirectTo({
        noHistoryPush: true,
        ...getInitialRoute({
          routes: this.props.routes,
          pathname: history.location.pathname,
          fallback: 'error404',
        }),
      });
    });
  }

  setLoadedComponent() {
    const currentRouteName = this.props.routerStore.currentRoute.name;
    const currentRoutePage = this.props.routerStore.currentRoute.pageName;

    let preventRedirect = false;
    if ((this.props.redirectTo as any).state.isExecuting) preventRedirect = true;
    else if (this.loadedComponentName === currentRouteName) {
      preventRedirect = true;
    } else if (this.loadedComponentPage != null && currentRouteName != null) {
      if (this.loadedComponentPage === currentRoutePage) {
        preventRedirect = true;
      }
    }

    if (preventRedirect) return;

    batch(() => {
      if (!this.loadedComponentName) {
        this.setComponent();
      } else {
        this.props.beforeUpdatePageComponent?.();

        this.setComponent();
      }
    });
  }

  setComponent() {
    const currentRouteName = this.props.routerStore.currentRoute.name;

    const componentConfig = this.props.routes[currentRouteName];

    this.props.beforeSetPageComponent?.(componentConfig);

    this.loadedComponentName = currentRouteName;
    this.loadedComponentPage = componentConfig.pageName;
  }
}

export function Router<TRoutes extends Record<string, TypeRoute>>(props: TypeProps<TRoutes>) {
  const { vm } = useStore(VM<TRoutes>, props);

  return <>{props.routes[vm.loadedComponentName!]?.component || null}</>;
}
