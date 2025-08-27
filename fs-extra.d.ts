declare module "fs-extra" {
  export function ensureDir(path: string): Promise<void>;
  export function writeJSON(
    file: string,
    data: any,
    options?: import("fs").WriteFileOptions & { spaces?: number },
  ): Promise<void>;
}
