declare module 'undici' {
  export interface Dispatcher {
    // The Dispatcher interface is intentionally left empty for the purposes of local type checking.
  }

  export class ProxyAgent implements Dispatcher {
    constructor(proxyUrl: string);
  }
}
