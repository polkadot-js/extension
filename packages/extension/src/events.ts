// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

// for FireFox, we need to listent here to allow origin restrictions to not
// be an issue (otherwise we cannot read the properties on the created events)
// const contentDocument = typeof gBrowser !== 'undefined'
//   ? gBrowser.selectedBrowser.contentDocument
//   : document;
const eventTarget = document;

const events = {
  request: 'PolkadotJsWebRequest',
  response: 'PolkadotJsWebResponse'
};

export { eventTarget };

export default events;
