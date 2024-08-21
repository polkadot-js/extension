// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

const unableConnectImageSrc = chrome.runtime.getURL('/images/icons/__error__.png');

export function removeNotificationPopup () {
  const divContainerExisted = document.getElementById('__notification-container');

  divContainerExisted && divContainerExisted.remove();
}

export function addNotificationPopUp () {
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
  imgElement.src = unableConnectImageSrc;
  divContent.innerText = 'Unable to connect. Reload dApp site and try again.';
  styleElement.innerHTML = keyframes;

  document.head.appendChild(styleElement);
  unableConnectImageSrc !== 'chrome-extension://invalid/' && divBox.appendChild(imgElement);
  divBox.appendChild(divContent);
  divContainer.appendChild(divBox);
  document.body.appendChild(divContainer);

  setTimeout(removeNotificationPopup, 5000);
}
