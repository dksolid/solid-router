import { JSX } from 'solid-js';

import { addNames } from './utils/addNames.js';
import { TypeRouteRaw } from './types/TypeRouteRaw.js';

type TypeRouteItemFinalGeneric<TConfig extends { [Key in keyof TConfig]: TypeRouteRaw }> = {
  [Key in keyof TConfig]: TConfig[Key] & {
    name: Key;
    store?: any;
    actions?: any;
    pageName?: string;
    component?: JSX.Element;
  };
};

export function createRouterConfig<
  TConfig extends {
    [Key in keyof TConfig]: TypeRouteRaw;
  },
>(config: TConfig): TypeRouteItemFinalGeneric<TConfig> {
  return addNames(config);
}
