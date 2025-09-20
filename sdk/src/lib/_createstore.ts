export type Dict = Record<string, string>;

type ProxyHandlerWithoutTarget = {
  has?(p: string | symbol): boolean;
  get?(p: string | symbol, receiver: any): any;
  set?(p: string | symbol, newValue: any, receiver: any): boolean;
  deleteProperty?(p: string | symbol): boolean;
  ownKeys?(): ArrayLike<string | symbol>;
};

export const createStore = (implementation: ProxyHandlerWithoutTarget): Dict => {
  const target = {} as Dict;
  const handler: ProxyHandler<Dict> = {};

  for (const key of Object.keys(implementation) as (keyof ProxyHandlerWithoutTarget)[]) {
    const trap = implementation[key] as any;
    handler[key] = (_, ...args: unknown[]) => trap(...args);
  }

  return new Proxy(target, handler);
};
