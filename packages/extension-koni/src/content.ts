// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Message } from '@subwallet/extension-base/types';

import { TransportRequestMessage } from '@subwallet/extension-base/background/types';
import { MESSAGE_ORIGIN_CONTENT, MESSAGE_ORIGIN_PAGE, PORT_CONTENT } from '@subwallet/extension-base/defaults';
import { getId } from '@subwallet/extension-base/utils/getId';

let port: chrome.runtime.Port;
let imageSrc = '';
let isShowNotification = false;

onConnectPort();

function onConnectPort () {
  if (!chrome.runtime) {
    console.error('The connection to the SubWallet port will be disconnected. Please reload your Dapp to reconnect the wallet.');

    return;
  }

  // connect to the extension
  port = chrome.runtime.connect({ name: PORT_CONTENT });
  imageSrc = chrome.extension.getURL('/images/icons/__error__.png');

  // send any messages from the extension back to the page
  port.onMessage.addListener((data: {id: string, response: any}): void => {
    const { id, resolve } = handleRedirectPhishing;

    if (data?.id === id) {
      resolve && resolve(Boolean(data.response));
    } else {
      window.postMessage({ ...data, origin: MESSAGE_ORIGIN_CONTENT }, '*');
    }
  });

  port.onDisconnect.addListener(onDisconnectPort);
}

function onDisconnectPort () {
  const err = checkForLastError();

  port.onDisconnect.removeListener(
    onDisconnectPort
  );

  if (err) {
    console.warn(`${err.message}, Reconnecting to the port.`);
    setTimeout(onConnectPort, 1000);
  } else {
    console.error('The connection to the SubWallet port will be disconnected. Please reload your Dapp to reconnect the wallet.');
  }
}

function checkForLastError () {
  const { lastError } = chrome.runtime;

  if (!lastError) {
    return undefined;
  }

  // repair incomplete error object (eg chromium v77)
  return new Error(lastError.message);
}

// redirect users if this page is considered as phishing, otherwise return false
const handleRedirectPhishing: { id: string, resolve?: (value: (boolean | PromiseLike<boolean>)) => void, reject?: (e: Error) => void } = {
  id: 'redirect-phishing-' + getId()
};

const onMessage = ({ data, source }: Message): void => {
  // only allow messages from our window, by the inject
  if (source !== window || data.origin !== MESSAGE_ORIGIN_PAGE) {
    return;
  }

  try {
    port.postMessage(data);
  } catch (e) {
    if (!isShowNotification) {
      addNotificationPopUp();
      isShowNotification = true;
    }
  }
};

function removeNotificationPopup () {
  const divContainerExisted = document.getElementById('__notification-container');

  divContainerExisted && divContainerExisted.remove();
}

function addNotificationPopUp () {
  removeNotificationPopup();

  const divContainer = document.createElement('div');
  const divBox = document.createElement('div');
  const imgElement = document.createElement('img');
  const divContent = document.createElement('div');
  const styleElement = document.createElement('style');

  const notificationContainerStyles: Partial<CSSStyleDeclaration> = {
    position: 'fixed',
    top: '5%',
    zIndex: '10001',
    width: '100%',
    animation: 'slideDown 5s ease-in-out'
  };

  const notificationBoxStyles: Partial<CSSStyleDeclaration> = {
    borderRadius: '8px',
    margin: 'auto',
    width: 'fit-content',
    backgroundColor: 'black',
    alignItems: 'center',
    border: '2px solid #BF1616',
    display: 'flex',
    gap: '8px',
    padding: '8px 16px 8px 16px'
  };

  const notificationContentStyles: Partial<CSSStyleDeclaration> = {
    fontFamily: 'inherit',
    fontSize: '14px',
    fontStyle: 'normal',
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    lineHeight: '22px'
  };

  const keyframes = `@keyframes slideDown {
    0% { transform: translateY(-100%); opacity: 0; }
    20% { transform: translateY(0); opacity: 1; }
    95% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(-100%); opacity: 0; }
  }`;

  Object.assign(divContent.style, notificationContentStyles);
  Object.assign(divContainer.style, notificationContainerStyles);
  Object.assign(divBox.style, notificationBoxStyles);

  divContainer.id = '__notification-container';
  imgElement.src = imageSrc;
  divContent.innerText = 'Unable to connect. Reload dApp site and try again.';
  styleElement.innerHTML = keyframes;

  document.head.appendChild(styleElement);
  imageSrc !== '' && divBox.appendChild(imgElement);
  divBox.appendChild(divContent);
  divContainer.appendChild(divBox);
  document.body.appendChild(divContainer);

  setTimeout(removeNotificationPopup, 5000);
}

const redirectIfPhishingProm = new Promise<boolean>((resolve, reject) => {
  handleRedirectPhishing.resolve = resolve;
  handleRedirectPhishing.reject = reject;

  const transportRequestMessage: TransportRequestMessage<'pub(phishing.redirectIfDenied)'> = {
    id: handleRedirectPhishing.id,
    message: 'pub(phishing.redirectIfDenied)',
    origin: MESSAGE_ORIGIN_PAGE,
    request: null
  };

  port.postMessage(transportRequestMessage);
});

// all messages from the page, pass them to the extension
window.addEventListener('message', onMessage);

redirectIfPhishingProm.then((gotRedirected) => {
  if (!gotRedirected) {
    console.log('Check phishing by URL: Passed.');
  }
}).catch((e) => {
  console.warn(`Unable to determine if the site is in the phishing list: ${(e as Error).message}`);
});
