// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

interface LazyItem {
  timeout?: NodeJS.Timeout;
  callback: () => void;
  lastFire: number;
}

const lazyMap: Record<string, LazyItem> = {};

export function removeLazy (key: string) {
  if (lazyMap[key]) {
    clearTimeout(lazyMap[key].timeout);
    delete lazyMap[key];
  }
}

// Add or update new lazy thread
export function addLazy (key: string, callback: () => void, lazyTime = 300, maxLazyTime = 3000, fireOnFirst = true) {
  const existed = lazyMap[key];
  const now = new Date().getTime();

  if (existed) {
    clearTimeout(existed.timeout);
    lazyMap[key] = {
      ...existed,
      callback
    };

    // Fire callback if last fire is too long
    if (now - existed.lastFire >= maxLazyTime) {
      callback();
      lazyMap[key].lastFire = now;
    } else {
      lazyMap[key].timeout = setTimeout(() => {
        // This will be fire in the last call of lazy thread
        callback();
        lazyMap[key].lastFire = new Date().getTime();
        removeLazy(key);
      }, lazyTime);
    }
  } else {
    if (fireOnFirst) {
      // Fire callback immediately in the first time
      callback();
      lazyMap[key] = {
        callback,
        lastFire: now
      };
    } else {
      lazyMap[key] = {
        callback,
        lastFire: now
      };

      lazyMap[key].timeout = setTimeout(() => {
        // This will be fire in the last call of lazy thread
        callback();
        lazyMap[key].lastFire = new Date().getTime();
        removeLazy(key);
      }, lazyTime);
    }
  }
}
