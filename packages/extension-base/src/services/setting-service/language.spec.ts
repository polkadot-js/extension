// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import readXlsxFile from 'read-excel-file/node';

jest.setTimeout(1000 * 60 * 10);

const filePath = './language-round-1.xlsx';
const originPath = './packages/extension-koni/public/locales/en/translation.json';
const resultPath = './packages/extension-koni/public/locales/vi/translation.json';
const missingTranslatePath = './missing-translate.txt';
const missingKeyPath = './missing-key.txt';

describe('language', () => {
  it('do migrate translate', async () => {
    return new Promise<void>((resolve) => {
      readXlsxFile(fs.readFileSync(filePath))
        .then((rows) => {
          const origin: Record<string, string> = JSON.parse(fs.readFileSync(originPath).toString()) as Record<string, string>;
          const result: Record<string, string> = {};
          const missingTranslate: Record<string, boolean> = {};
          const missingKey: Array<string> = [];

          for (const key of Object.keys(origin)) {
            missingTranslate[key] = true;
          }

          for (const key of Object.keys(origin)) {
            result[key] = '';
          }

          for (const row of rows) {
            const [en, vi, , inExtension] = row as string[];

            if (vi && origin[en] !== undefined && inExtension === 'Yes') {
              result[en] = vi || '';
              missingTranslate[en] = false;
            } else {
              if (inExtension === 'Yes') {
                missingKey.push(en);
              }
            }
          }

          return {
            result,
            missingTranslate: Object.entries(missingTranslate).filter(([, value]) => value).map(([key]) => key),
            missingKey
          };
        })
        .then(({ missingKey, missingTranslate, result }) => {
          fs.writeFileSync(resultPath, JSON.stringify(result, undefined, 2));
          fs.writeFileSync(missingTranslatePath, missingTranslate.join('\n'));
          fs.writeFileSync(missingKeyPath, missingKey.join('\n'));
        })
        .catch(console.error)
        .finally(resolve);
    });
  });
});
