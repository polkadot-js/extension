// Copyright 2019-2023 @polkadot/extension-bg authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export default <Content>(schema: z.ZodType<Content>, defaultValue?: Content) => (namespace: string) => {
  const get = async (): Promise<Content> => {
    try {
      const { [namespace]: storageContent = defaultValue } = await chrome.storage.local.get([namespace]);

      return schema.parse(storageContent as unknown);
    } catch (e) {
      console.error(`The content of the "${namespace}" namespace in local storage does not match the schema:`, e);

      if (defaultValue) {
        return defaultValue;
      } else {
        throw e;
      }
    }
  };

  const set = async (value: Content) => {
    await chrome.storage.local.set({ [namespace]: value });
  };

  const update = async (updater: (currentContent: Content) => Content): Promise<Content> => {
    const currentContent = await get();
    const newContent = updater(currentContent);

    await chrome.storage.local.set({ [namespace]: newContent });

    return newContent;
  };

  return {
    get,
    set,
    update
  };
};
