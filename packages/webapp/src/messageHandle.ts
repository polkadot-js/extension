// Copyright 2019-2022 @subwallet/webapp authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestSignatures, TransportRequestMessage, TransportResponseMessage } from '@subwallet/extension-base/background/types';
import { ID_PREFIX, PORT_CONTENT, PORT_EXTENSION, PORT_MOBILE } from '@subwallet/extension-base/defaults';
import { SWHandler } from '@subwallet/extension-base/koni/background/handlers';
import { VirtualMessageCenter } from '@subwallet/extension-web-ui/messaging/VirtualMessageCenter';

const handlers = SWHandler.instance;

export interface CustomResponse<T> {
  id: string,
  response: T,
  error?: string
}

export type PageStatus = CustomResponse<{ status: 'init' | 'load' | 'crypto_ready' }>

const bgMessage = VirtualMessageCenter.getInstance().bg;

export function responseMessage (response: TransportResponseMessage<keyof RequestSignatures> | PageStatus) {
  bgMessage.postMessage(response);
}

export function setupHandlers () {
  bgMessage.addEventListener('message', (ev) => {
    const data = ev.data as TransportRequestMessage<keyof RequestSignatures>;
    const port = {
      name: PORT_EXTENSION,
      sender: { url: data.origin || ev.origin },
      postMessage: responseMessage,
      onDisconnect: {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        addListener: () => {
        }
      }
    };

    if (data.id?.startsWith(ID_PREFIX) && data.id && data.message) {
      console.log('===LOG: setupHandlers data.message', data.message);

      if (data.message.startsWith('mobile')) {
        port.name = PORT_MOBILE;
      } else if (data.message.startsWith('pri')) {
        port.name = PORT_EXTENSION;
      } else {
        port.name = PORT_CONTENT;
      }

      // @ts-ignore
      handlers.handle(data, port);
    }
  });
}

bgMessage.setReady();
