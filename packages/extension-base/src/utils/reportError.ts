// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TARGET_ENV } from '@subwallet/extension-base/utils/environment';

const EXTENSION_REPORT_ERROR_URL = 'https://extension-feedback.subwallet.app/gelf';
const WEBAPP_REPORT_ERROR_URL = 'https://web-feedback.subwallet.app/gelf';

export const reportError = async (e: Error, pathName: string) => {
  const errorContent = JSON.stringify(e.stack);
  const errorShortMessage = e.message;
  const body = {
    content: errorContent,
    short_message: errorShortMessage,
    platform: TARGET_ENV,
    device_version: '',
    app_version: JSON.stringify(process.env.PKG_VERSION),
    current_routes: pathName
  };

  await fetch(TARGET_ENV === 'extension' ? EXTENSION_REPORT_ERROR_URL : WEBAPP_REPORT_ERROR_URL, {
    method: 'POST',
    body: JSON.stringify(body)
  });
};
