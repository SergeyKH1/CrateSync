/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Minimal Chrome extension API type declarations.
 * Provides enough surface area for the useExtension hook to compile.
 */
declare namespace chrome {
  namespace runtime {
    const lastError: { message?: string } | undefined;
    const id: string | undefined;
    function sendMessage(
      extensionId: string,
      message: any,
      callback?: (response: any) => void
    ): void;
    function sendMessage(
      message: any,
      callback?: (response: any) => void
    ): void;
  }
}
