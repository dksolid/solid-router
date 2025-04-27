import { modifyMutable, produce } from 'solid-js/store';

export function replaceObject<TObj extends Record<string, any>>(obj: TObj, newObj: TObj) {
  modifyMutable(
    obj,
    produce((state) => {
      if (typeof state === 'object' && state != null) {
        // eslint-disable-next-line guard-for-in
        for (const variableKey in state) {
          delete state[variableKey];
        }
      }

      Object.assign(state || {}, newObj);
    })
  );
}
