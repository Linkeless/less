declare module 'nuqs' {
  // 简化的类型声明，仅用于在未安装包时通过 TS 检查。建议实际安装 nuqs 以获得完整类型。
  export function useQueryState<T = any>(
    key: string,
    parser?: any
  ): [T, (value: T | ((prev: T) => T)) => void];

  export const parseAsString: {
    withDefault: (def: string) => any;
  };

  export const parseAsInteger: {
    withDefault: (def: number) => any;
  };
}


