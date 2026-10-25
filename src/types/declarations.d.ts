declare module "@babel/standalone" {
  export function transform(
    code: string,
    options?: Record<string, any>
  ): { code?: string | null };
}

