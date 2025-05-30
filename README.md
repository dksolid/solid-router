## Config-based routing for Solid.js

[![npm](https://img.shields.io/npm/v/@dksolid/solid-router)](https://www.npmjs.com/package/@dksolid/solid-router)
![coverage](https://github.com/dksolid/solid-router/blob/main/assets/coverage.svg)
![size-esm](https://github.com/dksolid/solid-router/blob/main/assets/esm.svg)
![size-cjs](https://github.com/dksolid/solid-router/blob/main/assets/cjs.svg)


#### Contents

- [Features](#features)
- [Setup (SPA)](#setup-spa)
- [Setup (SSR)](#setup-ssr)
- [Route configuration](#route-configuration)
  - [path, params](#path-params)
  - [loader](#loader)
  - [props](#props)
  - [query](#query)
  - [beforeEnter](#beforeenter)
  - [beforeLeave](#beforeleave)
- [RedirectTo configuration](#redirectto-configuration)
- [Router configuration](#router-configuration)
- [RedirectTo usage](#redirectto-usage)
- [Use cases](#use-cases)
  - [Show loader on redirect](#show-loader-on-redirect)
  - [Handle redirect errors](#handle-redirect-errors)
  - [Multiple redirects](#multiple-redirects)
  - [Watch and react to params / query changes](#watch-and-react-to-params--query-changes)
  - [Prevent rerendering if the page component is the same](#prevent-rerendering-if-the-page-component-is-the-same)
  - [Modular (page's) stores / actions](#modular-pages-stores--actions)
  - [History manipulation](#history-manipulation)
  - [Hash support inside currentRoute](#hash-support-inside-currentroute)
  - [Why @dksolid/solid-stateful-fn dependency + how to write custom logic inside redirectTo](#why-@dksolid/solid-stateful-fn-dependency--how-to-write-custom-logic-inside-redirectto)

> [!WARNING]  
> All SSR-related specifics are not tested yet

### Features

- Has a lifecycle with `beforeEnter` and `beforeLeave`
- Supports dynamically loaded components (from async chunks like `() => import('/some-page')`)
- Supports dynamically loaded modular stores and actions for pages
- Supports SSR
- Ensures that every dynamic parameter from the URL has a validator
- TypeScript works for every route and its dynamic parameters and search-query
- It is a separate layer, so there is no more markup like `<Route path="..." />` inside React components

### Setup (SPA)

The setup consists of three parts:
- Routes config: Describes your routes in a plain object
- Router store: A Solid.js store or an object that includes current route data and transition history
- Redirect function: May be a part of the router store or a separate function

1. Install `@dksolid/solid-router` and `@dksolid/solid-stateful-fn`
2. Create a basic routes config `routes.ts`

```typescript
import { createRouterConfig } from '@dksolid/solid-router';

export const routes = createRouterConfig({
  home: {
    path: '/',
    loader: (() => import('./pages/home')),
  },
  static: {
    path: '/static',
    loader: (() => import('./pages/static')),
  },
  dynamic: {
    path: '/page/:foo/id/:bar',
    params: {
      foo: (value) => value.length > 2,
      bar: (value) => value.length > 0,
    },
    loader: (() => import('./pages/dynamic')),
  },
  // this page is necessary
  error404: {
    path: '/error404',
    props: { errorCode: 404 },
    loader: (() => import('./pages/error')),
  },
  // this page is necessary
  error500: {
    path: '/error500',
    props: { errorCode: 500 },
    loader: (() => import('./pages/error')),
  },
});
```

3. Configure a router store

```typescript
import { createMutable } from 'solid-js/store';
import { InterfaceRouterStore } from '@dksolid/solid-router';

import { routes } from 'routes';

type TInterfaceRouterStore = InterfaceRouterStore<typeof routes>;

export class RouterStore implements TInterfaceRouterStore {
  constructor() {
    return createMutable(this);
  }

  routesHistory: TInterfaceRouterStore['routesHistory'] = [];
  // we will load/hydrate initial route before the app is rendered, so "as any" is safe
  currentRoute: TInterfaceRouterStore['currentRoute'] = {} as any;
}

export const routerStore = new RouterStore();
```

4. Configure an action for redirecting. It may be an independent function

```typescript
import { redirectToGenerator } from '@dksolid/solid-router';
import { addState } from '@dksolid/solid-stateful-fn';

import { routes } from 'routes';
import { routerStore } from 'routerStore';

export const redirectTo = addState(redirectToGenerator({
  routes,
  routerStore,
  routeError500: routes.error500,
}), 'redirectTo');
```

Or may be a part of `RouterStore`.

```typescript
import { addState } from '@dksolid/solid-stateful-fn';

export class RouterStore implements TInterfaceRouterStore {
  constructor() {
    return createMutable(this);
  }

  routesHistory: TInterfaceRouterStore['routesHistory'] = [];
  currentRoute: TInterfaceRouterStore['currentRoute'] = {} as any;
  
  redirectTo = addState(redirectToGenerator({
    routes,
    routerStore: this,
    routeError500: routes.error500,
  }), 'redirectTo');
}
```

5. Now it is time to create a Router React component that will react to changes in `routerStore.currentRoute`
   and render the relevant page component.

```typescript
import { Router as RouterSolid } from '@dksolid/solid-router';

import { routes } from 'routes';
import { routerStore } from 'routerStore';

export function Router() {
  return (
    <RouterSolid
      routes={routes}
      redirectTo={routerStore.redirectTo}
      routerStore={routerStore}
    />
  );
}
```

6. The last step to make it work is to find the initial route and render the application
   (an example for SPA without SSR).

```typescript
import { getInitialRoute } from '@dksolid/solid-router';
import { render } from 'solid-js/web';

import { Router } from 'components/Router';
import { routes } from 'routes';
import { routerStore } from 'routerStore';

function App() {
  return (
    <>
      <div className="menu">
        <div 
          onClick={() => routerStore.redirectTo({ route: 'home' })}
          className={routerStore.currentRoute.name === 'home' ? 'active' : ''}
        >
          Home
        </div>
        <div 
          onClick={() => routerStore.redirectTo({ route: 'static' })}
          className={routerStore.currentRoute.name === 'static' ? 'active' : ''}
        >
          Static
        </div>
        <div 
          onClick={() => routerStore.redirectTo({ route: 'dynamic', params: { foo: 'test', bar: 'smth' } })}
          className={routerStore.currentRoute.name === 'dynamic' ? 'active' : ''}
        >
          Dynamic
        </div>
      </div>
      <Router />
    </>
  );
}

Promise.resolve()
  // be sure to load an initial route
  .then(() => routerStore.redirectTo(getInitialRoute({ 
    routes, 
    pathname: location.pathname + location.search, 
    fallback: 'error404'
  })))
  .then(() => render(() => <App />, document.getElementById('app')!));
```

### Setup (SSR)

1. SSR needs the store to be passed by Context and an initial route to be passed from Node server

```typescript
import { createContext } from 'solid-js';
import { loadComponentToConfig } from '@dksolid/solid-router';

import { routes } from './routes';
import { RouterStore } from './routerStore';

// Create context

const StoreContext = createContext(undefined as unknown as { routerStore: RouterStore });

const contextValue = { routerStore: new RouterStore() };

Promise.resolve()
  // restore current route from Node server, no need to call 'location'
  .then(() => restoreState({ target: contextValue, source: window.INITIAL_DATA }))
  .then(() => {
    // Load the async chunk for this page
    const preloadedRouteName = Object.keys(routes).find(
      (routeName) => contextValue.routerStore.currentRoute.name === routeName
    ) as keyof typeof routes;

    return loadComponentToConfig({ route: routes[preloadedRouteName] });
  })
  .then(() => {
    // hydrate app
  });
```

2. And relevant Node server code for isomorphic rendering

```typescript
const template500 = fs.readFileSync(path.resolve(__dirname, '../build/index.html'), 'utf-8');
      
const app = express()
  .use(serveStatic(path.resolve(__dirname, '../build/public')))
  .get('*', async (req, res) => {
    const contextValue = { routerStore: new RouterStore() };
    const reactApp = (
      <StoreContext.Provider value={contextValue}>
        <App />
      </StoreContext.Provider>
    );

    try {
      await contextValue.routerStore.redirectTo(
        getInitialRoute({
          routes,
          pathname: req.originalUrl,
          fallback: 'error404',
        })
      );
    } catch (error: any) {
      if (error.name === 'REDIRECT') {
        res.redirect(error.message);

        return;
      }

      console.error(error);

      res.status(500).send(template500);

      return;
    }

    const htmlMarkup = renderToString(reactApp);
    const storeJS = JSON.parse(JSON.stringify(contextValue));

    res.send(
      fs
        .readFileSync(path.resolve(__dirname, '../build/public/index.html'), 'utf-8')
        .replace(`<!-- HTML -->`, htmlMarkup)
        .replace('<!-- INITIAL_DATA -->', JSON.stringify(escapeAllStrings(storeJS)))
    );
  });
```

So, we only look at `req.originalUrl` on the Node server and do not look at `location` in the
Client code; we just restore the state from `window.INITIAL_DATA`.

### Route configuration

#### path, params

`path (string) required`

`params (Record<string, (value: string) => boolean>) required if the path is dynamic`

Should have a leading slash. It may be a constant value or a dynamic value with `:param` syntax like

```typescript
{
  path: '/static'
}

{
  path: '/dynamic/:param1/:param2',
  params: {
    param1: (value: string) => value.length > 0,
    param2: (value: string) => value === 'some',
  },
}
```

When dynamic path is used - `params` object with validators is necessary. Each validator should return
a `boolean` value.

#### loader

`(async import) required`

```typescript
{
  loader: () => import('./pages/home')
}

// @loadable/component should work, too
import loadable from '@loadable/component';

{
  loader: loadable(() => import('./pages/home'))
}
```

The imported file should have a `default` export with a React Component. It may also export
`pageName`, `store`, `actions` - this will be explained in other sections of this documentation.

#### props

`(Record<string, any>) optional`

```typescript
{
  error404: {
    path: '/error404',
    props: { errorCode: 404 },
    loader: () => import('./pages/error'),
  },
  error500: {
    path: '/error500',
    props: { errorCode: 500 },
    loader: () => import('./pages/error'),
  },
}

function ErrorPage(props: { errorCode: number }) {
  return `Error ${props.errorCode}`;
}
```

These `props` will be passed to the page component. In some cases it may be useful for
Dependency Injection (DI).

#### query

`(Record<string, (value: string) => boolean>) optional`

```typescript
{
  query: {
    foo: (value: string) => value.length > 0,
  }
}
```

These parameters are always optional. So, if you go to `http://site?bar=1`
then `routerStore.currentRoute.query` will be an empty object `{}`. Only query params which are
described in the `query` config will be present.

#### beforeEnter

`((config, ...args) => Promise<TypeRedirectToParams | void>) optional`

`config` argument is not perfectly TS-typed to avoid a circular dependency, so use the console to
check its contents

```typescript
{
  beforeEnter(config) {
    /*
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
    */
  
    console.log(config);
  
    if (config.nextRoute.name === 'query') {
      return Promise.resolve({ route: 'dynamic', params: { foo: 'bar' }, query: { foo: 'bar' } });
    }

    return Promise.resolve();
  }
}
```

This method has the capability to redirect to another page, as shown in the example above.

You can also pass some arguments to this function by adding `lifecycleParams` to the
`redirectTo` function

```typescript
redirectTo = redirectToGenerator({
  routes,
  routerStore: this,
  routeError500: routes.error500,
  lifecycleParams: [userStore]
});
  
{
  beforeEnter(config, userStore) {
    if (!userStore.isLoggedIn) {
      return Promise.resolve({ route: 'login' });
    }

    return Promise.resolve();
  }
}
```

#### beforeLeave

`((config, ...args) => Promise<void> | Error<{ name: 'PREVENT_REDIRECT'} >) optional`

`config` argument is not perfectly TS-typed to avoid a circular dependency, so use the console to
check its contents

```typescript
{
  beforeLeave(config) {
    /*
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
    */
  
    console.log(config);
  
    if (config.nextRoute.name === 'query') {
      throw Object.assign(new Error(''), { name: 'PREVENT_REDIRECT' });
    }

    return Promise.resolve();
  }
}
```

This method has the capability to prevent redirect, as shown in the example above.

You can also pass some arguments to this function by adding `lifecycleParams` to the
`redirectTo` function

```typescript
redirectTo = redirectToGenerator({
  routes,
  routerStore: this,
  routeError500: routes.error500,
  lifecycleParams: [userStore]
});
  
{
  beforeLeave(config, userStore) {
    if (userStore.someFormNotFilled) {
      const allowLeavePage = confirm('You form data will be lost, sure to go to another page?');
    
      if (!allowLeavePage) {
        throw Object.assign(new Error(''), { name: 'PREVENT_REDIRECT' });
      }
    }

    return Promise.resolve();
  }
}
```

### RedirectTo configuration

`routes (required) - config returned from createRouterConfig function`

`routerStore (required) - InterfaceRouterStore-compliant object`

`routeError500 (required) - route config for 500 error`

`lifecycleParams (optional) - Array<any>` This parameter is used to pass arguments to the
`beforeEnter` and `beforeLeave` methods. For example, you can pass `lifecycleParams: [userStore]`
to check if the user is logged in or has rights to view this page.

It can also be used for data-loading like

```typescript
redirectTo = redirectToGenerator({
  routes,
  routerStore: this,
  routeError500: routes.error500,
  lifecycleParams: [apiStore]
});
  
{
  beforeEnter(config, apiStore) {
    return Promise.resolve()
      .then(() => apiStore.getUser())
      .then(() => apiStore.getDashboard())
      .then(() => apiStore.getCart())
      .then(() => undefined)
  }
}
```

If you use the SPA (no SSR) approach, then you can use `userStore` and `apiStore` directly without
this dependency injection (DI), but for SSR websites, this is a powerful helper.

### Router configuration

`routes (required) - config returned from createRouterConfig function`

`routerStore (required) - InterfaceRouterStore-compliant object`

`redirectTo (required) - a function created with redirectToGenerator and addState`

`beforeMount (optional) - () => void` - this function is called only once on component mount

`beforeSetPageComponent (optional) - (route) => void` - this function is called every time
before the render of any page. `config` here is an extended route config

`beforeUpdatePageComponent (optional) - () => void` - this function is called on every page update
before the render. Therefore, it will not be called for the first page render

```typescript
<RouterSolid 
  routes={routes} 
  redirectTo={routerStore.redirectTo} 
  routerStore={routerStore} 
  beforeMount={() => {
    // component just mounted
  }}
  beforeSetPageComponent={(route) => {
    // some page will be rendered soon
    console.log(route); // shows which page will be loaded
  }}
  beforeUpdatePageComponent={() => {
    // some new page will be rendered soon
    // You may stop async actions and clear modular stores here
    
    cancelExecutingApi();
    cancelExecutingActions();
    someStore.reset();
  }}
/>
```

### RedirectTo usage

`route (required) - a string representing some route`

`params (required if in route config) - Record<string, string>`

`query (optional) - Record<string, string>`

`noHistoryPush (optional) - if true, this redirect will not be present in the browser's history`

This function is fully TypeScript-typed, and TypeScript hints will be shown for autocomplete.

```typescript
const routes = createRouterConfig({
  static: {
    path: '/static',
    loader: () => import('./pages/static'),
  },
  dynamic: {
    path: '/page/:foo',
    params: {
      foo: (value: string) => value.length > 0,
    },
    query: {
      q: (value: string) => value.length > 0,
    },
    loader: () => import('./pages/dynamic'),
  },
});

// Good
redirectTo({ route: 'static' })
redirectTo({ route: 'dynamic', params: { foo: 'bar' } })
redirectTo({ route: 'dynamic', params: { foo: 'bar' }, query: { q: 's' } })

// TS errors
redirectTo({ });
redirectTo({ route: 'nonExisting' });
redirectTo({ route: 'static', params: {} });
redirectTo({ route: 'dynamic' });
redirectTo({ route: 'dynamic', params: {} });
redirectTo({ route: 'dynamic', params: { a: 'b' } });
redirectTo({ route: 'dynamic', params: { foo: 'bar' }, query: { some: 'value' } });
```

### Use cases

#### Show loader on redirect

`redirectTo` function has a reactive state because of `@dksolid/solid-stateful-fn`,
so we can utilize all of its capabilities.

```typescript
fucntion GlobalHeader() {
  createEffect(() => {
    console.log(`Last redirect took ${routerStore.redirectTo.state.executionTime}ms`)
  });
  
  return <>{routerStore.redirectTo.state.isExecuting ? <Loader /> : null}</>;
}
```

#### Handle redirect errors

`redirectTo` is an async function, so it's a good practice to handle errors

```typescript
redirectTo({ route: 'static' }).catch(error => console.error(error))
```

otherwise if some unexpected error happens in `beforeEnter` / `beforeLeave`, you will get an
Uncaught exception.

#### Multiple redirects

This library fully supports unlimited redirects in SPA / SSR.

```typescript
const routes = createRouterConfig({
  one: {
    path: '/1',
    loader: () => import('./pages/one'),
  },
  two: {
    path: '/2',
    loader: () => import('./pages/two'),
    beforeEnter(config, userStore) {
      if (!userStore.isLoggedIn) {
        return Promise.resolve({ route: 'one' });
      }

      return Promise.resolve();
    },
  },
  three: {
    path: '/3',
    loader: () => import('./pages/three'),
    beforeEnter(config, userStore) {
      if (!userStore.isLoggedIn) {
        return Promise.resolve({ route: 'two' });
      }

      return Promise.resolve();
    },
  },
  four: {
    path: '/4',
    loader: () => import('./pages/four'),
    beforeEnter(config, userStore) {
      if (!userStore.isLoggedIn) {
        return Promise.resolve({ route: 'three' });
      }

      return Promise.resolve();
    },
  },
});

redirectTo({ route: 'four' })
```

In this case if user goes to '/4' he will be redirected to '/3' then '/2' then '/1'. Browser's history
and `routerStore.routesHistory` will only have `['/1']`. Also, chunks for pages `four, three, two` will not be loaded.

#### Watch and react to params / query changes

`routerStore.currentRoute` is an observable, so you can use it inside
`createEffect`, or within a component.

```typescript
import { TypeCurrentRoute } from '@dksolid/solid-router';
import { routes } from 'routes';

function MyComponent() {
  createEffect(() => {
    const currentRoute = routerStore.currentRoute as TypeCurrentRoute<typeof routes.tabs>;
    
    console.log(toJS(currentRoute.params))
    console.log(toJS(currentRoute.query))
  });
  
  return (<>
    {currentRoute.params.tab === 'dashboard' && <Dashboard />}
    {currentRoute.params.tab === 'table' && <Table />}
  </>);
}
```

`routerStore.currentRoute as TypeCurrentRoute<typeof routes.tabs>` here tells TS that we expect
the route to be 'routes.tabs' so its `params` and `query` will be TS-typed.

#### Prevent rerendering if the page component is the same

(maybe obsolete section)

`Router` will not rerender the page component if `params` or `query` have been changed.
However, if redirected to another route, the page component will be rerendered.

```typescript
const routes = createRouterConfig({
  home: {
    path: '/',
    loader: () => import('./pages/home'),
  },
  static: {
    path: '/static',
    loader: () => import('./pages/home'),
  }
};

redirectTo({ route: 'home' })
  .then(() => redirectTo({ route: 'static' }))
```

Here we have the same component `'./pages/home'`, but different routes. Sometimes it's necessary
to prevent rerendering in this scenario. You may include in `pages/home/index.ts` this code

```typescript
import { default as PageComponent } from './Home';

// This line
export const pageName = 'home';

// Or if you have __dirname access you can use the folder's name
export const pageName = __dirname.split('/').pop();

export default PageComponent;
```

This way the component will not be rerendered and the `Router` will not call `beforeSetPageComponent`
or `beforeUpdatePageComponent`. This is useful for the 'Modular stores / actions' section.

#### Modular (page's) stores / actions

It's a good practice to split your stores / actions by pages. This library
has a built-in mechanism to do so.

Inside your page file, ex. `pages/home/index.ts`, include relevant exports

```typescript
import { default as PageComponent } from './Home';

class HomeStore {}

export const pageName = 'home';

// This line
export const store = new HomeStore();

// And this
export const actions = {
  getData() {
    return api.fetchData().then(data => { store.data = data });
  }
}

export default PageComponent;
```

Then in the `Router` lifecycle, you may operate these variables like this:

```typescript
<Router
  routes={routes}
  redirectTo={routerStore.redirectTo}
  routerStore={routerStore}
  beforeSetPageComponent={(route: any) => {
    if (!route.pageName) return;
  
    if (route.store) {
      globalStore.pages[route.pageName] = route.store;
    }
    
    if (route.actions) {
      globalActions.pages[route.pageName] = route.actions;
    }
  }}
  beforeUpdatePageComponent={() => {
    globalStore.pages = {};
    globalActions.pages = {};
  }}
/>
```

You may operate `route.store` and `route.actions` according to your architecture; this library
simply provides a way to separate them inside the page's async chunks and initialize them
when the page is loaded.

#### History manipulation

This library uses [history.js](https://github.com/remix-run/history), and it is exported
for some custom scenarios. Be aware that in SSR (Node.js server code) `history` is `null`.

```typescript
import { history } from '@dksolid/solid-router';

if (typeof window !== 'undefined') {
  history.listen((params) => {
    // some logic
  });
  
  history.back();
}
```

#### Hash support inside currentRoute

There are no plans to implement it. Use `history.listen` to track the hash and synchronize it with
your own signal (may be a part of the `routerStore`).

#### Why @dksolid/solid-stateful-fn dependency + how to write custom logic inside redirectTo

`@dksolid/solid-stateful-fn` is necessary for the `Router`. `redirectTo` is an async function, so we have
to track when it has finished before rendering the page component.

However, this does not prevent you from using custom logic inside your redirect function.
For example, if you want to scroll the page to the top on every redirect, you may use this:

```typescript
import { TypeRedirectToParams } from '@dksolid/solid-router';
import { TypeFnState } from '@dksolid/solid-stateful-fn';
import { routes } from 'routes';

type TypeCustomRedirectTo = (<TRouteName extends keyof typeof routes>(
  params: TypeRedirectToParams<typeof routes, TRouteName>
) => Promise<void>) &
  TypeFnState;

export class RouterStore implements TInterfaceRouterStore {
  redirectTo: TypeCustomRedirectTo = addState((params) => {
    if (typeof window !== 'undefined') {
      window.scroll(0, 0);
    }

    return redirectToGenerator({
      routes,
      routerStore: this,
      routeError500: routes.error500,
    })(params);
  }, 'redirectTo');
}
```

It is a bit tricky to construct `TypeCustomRedirectTo`, but it's helpful in some cases.

Usually the `Router`'s lifecycle, like `beforeSetPageComponent`, should be sufficient for most cases.
