// Copyright 2019-2025 @polkadot/extension-mocks authors & contributors
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

/**
 * Adjusts the resolver to point to empty files for .svg
 *
 * @param {*} specifier
 * @param {*} context
 * @param {*} nextResolve
 * @returns {*}
 */
export function resolve (specifier, context, nextResolve) {
  if (/\.(png|svg)$/.test(specifier)) {
    return {
      format: 'module',
      shortCircuit: true,
      url: pathToFileURL(
        path.join(process.cwd(), 'packages/extension-mocks/src/empty.js')
      ).href
    };
  }

  return nextResolve(specifier, context);
}
