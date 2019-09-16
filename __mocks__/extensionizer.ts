/* eslint-disable @typescript-eslint/no-explicit-any */
import chrome from 'sinon-chrome';

class MessagingFake {
  private listeners: any = [];

  get onMessage (): any {
    return {
      addListener: (cb: any): any => this.listeners.push(cb)
    };
  }

  get onDisconnect (): any {
    return {
      addListener: (): any => {}
    };
  }

  postMessage (data: any): void {
    this.listeners.forEach((cb: any) => cb.call(this, data));
  }
}
chrome.runtime.connect.returns(new MessagingFake());

export default chrome;
