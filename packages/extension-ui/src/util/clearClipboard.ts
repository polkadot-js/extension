// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

const clearClipboardFallback = () => {
  const form = document.createElement('textarea');

  form.textContent = ' ';
  document.body.appendChild(form);
  form.select();
  document.execCommand('copy'); // eslint-disable-line deprecation/deprecation
  form.blur();
  document.body.removeChild(form);
};

export default () => {
  navigator.clipboard.writeText(' ').catch(clearClipboardFallback);
};
