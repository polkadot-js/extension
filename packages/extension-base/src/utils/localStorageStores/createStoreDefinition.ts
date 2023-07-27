// Copyright 2019-2023 @polkadot/extension-bg authors & contributors
// SPDX-License-Identifier: Apache-2.0

import deepEquals from 'fast-deep-equal';
import { z } from 'zod';

export default <Content>(schema: z.ZodType<Content>, defaultValue?: Content) => (namespace: string) => {
  type ChangeListener = (content: Content) => void
  const changeListeners = new Set<ChangeListener>();

  const invokeChangeListeners = (changes: { [namespace: string]: { newValue?: Content, oldValue?: Content }}, storageArea: string) => {
    if (storageArea !== 'local') {
      return;
    }

    const { [namespace]: changesFromNamespace } = changes;

    if (!changesFromNamespace) {
      return;
    }

    const newValueParsingResult = schema.safeParse(changesFromNamespace.newValue);

    if (!newValueParsingResult.success) {
      console.error(`The new local storage value in namespace "${namespace}" failed to match the namespace schema with error: "${newValueParsingResult.error.toString()}"`);

      return;
    }

    const newValue = newValueParsingResult.data;

    if (deepEquals(newValue, changesFromNamespace.oldValue)) {
      return;
    }

    changeListeners.forEach((changeListener) => changeListener(newValue));
  };

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

  type Unsubscribe = () => void

  const subscribe = (listener: ChangeListener): Unsubscribe => {
    changeListeners.add(listener);

    if (!chrome.storage.onChanged.hasListener(invokeChangeListeners)) {
      chrome.storage.onChanged.addListener(invokeChangeListeners);
    }

    get().then(listener).catch((e) => console.warn('Error getting data for a listener:', e));

    return () => {
      changeListeners.delete(listener);

      if (!changeListeners.size) {
        chrome.storage.onChanged.removeListener(invokeChangeListeners);
      }
    };
  };

  return {
    get,
    set,
    update,
    subscribe
  };
};
