// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestSignatures, TransportRequestMessage, TransportResponseMessage } from '@subwallet/extension-base/background/types';
import { createPromiseHandler } from '@subwallet/extension-base/utils';
import EventEmitter from 'eventemitter3';

export interface VirtualEvent {
  id: string;
  data: any;
  message: string;
  origin?: string;
}

export interface VMCUIEventMap {
  'message': VirtualEvent;
}

export interface VMCBGEventMap {
  'message': VirtualEvent;
}

export class BGMessageCenter {
  emitter: EventEmitter<VMCBGEventMap> = new EventEmitter();
  private readyHandler = createPromiseHandler<void>();

  get isReady () {
    return this.readyHandler.promise;
  }

  setReady () {
    // console.log('setReady BGMessageCenter');
    this.readyHandler.resolve();
  }

  ui?: UIMessageCenter;
  setUI (ui: UIMessageCenter) {
    this.ui = ui;
  }

  addEventListener (event: 'message', cb: (ev: VirtualEvent) => void) {
    // console.log('addEventListener BGMessageCenter');

    this.readyHandler.promise.then(() => {
      this.emitter.on(event, cb);
    }).catch(console.error);
  }

  postMessage (data: TransportResponseMessage<keyof RequestSignatures>) {
    let _data = data;

    if (typeof data === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      _data = JSON.parse(JSON.stringify(data));
    }

    // console.log('postMessage BGMessageCenter', _data);

    this.readyHandler.promise.then(() => {
      this.ui?.emitter.emit('message', {
        id: _data.id,
        data: _data
      });
    }).catch(console.error);
  }
}

export class UIMessageCenter {
  bg?: BGMessageCenter;
  emitter: EventEmitter<VMCUIEventMap> = new EventEmitter();
  private readyHandler = createPromiseHandler<void>();

  get isReady () {
    return this.readyHandler.promise;
  }

  setReady () {
    // console.log('setReady UIMessageCenter');

    (async () => {
      await this.bg?.isReady;
      await new Promise((resolve) => setTimeout(resolve, 99));
      this.readyHandler.resolve();
    })().catch(console.error);
  }

  setBg (bg: BGMessageCenter) {
    this.bg = bg;
  }

  addEventListener (event: 'message', cb: (ev: VirtualEvent) => void) {
    // console.log('addEventListener UIMessageCenter');

    this.readyHandler.promise.then(() => {
      this.emitter.on(event, cb);
    }).catch(console.error);
  }

  postMessage (data: any) {
    let _data = data as TransportRequestMessage<keyof RequestSignatures>;

    if (typeof data === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      _data = JSON.parse(JSON.stringify(data));
    }

    // console.log('postMessage UIMessageCenter', _data);

    this.readyHandler.promise.then(() => {
      this.bg?.emitter.emit('message', {
        id: _data.id,
        origin: 'extension',
        data: _data,
        message: _data.message
      });
    }).catch(console.error);
  }
}

export class VirtualMessageCenter {
  ui: UIMessageCenter = new UIMessageCenter();
  bg: BGMessageCenter = new BGMessageCenter();

  constructor () {
    this.ui.setBg(this.bg);
    this.bg.setUI(this.ui);
  }

  static getInstance (): VirtualMessageCenter {
    // @ts-ignore
    if (!window.virtualMessageCenter) {
      // @ts-ignore
      window.virtualMessageCenter = new VirtualMessageCenter();
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return window.virtualMessageCenter;
  }
}
