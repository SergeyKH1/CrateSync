/* eslint-disable @typescript-eslint/no-explicit-any */
interface ChromeRuntime {
  sendMessage: (extensionId: string, message: any, callback?: (response: any) => void) => void;
  lastError: { message: string } | undefined;
}

interface Chrome {
  runtime: ChromeRuntime;
}

declare let chrome: Chrome | undefined;
