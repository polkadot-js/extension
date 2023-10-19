#!/usr/bin/env node
// Copyright 2017-2022 @polkadot/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from "fs";

import execSync from '@polkadot/dev/scripts/execSync.mjs';


function runBuild() {
  execSync('yarn i18next-scanner --config i18next-scanner.config.js');
}

const path= './packages/{{name}}/public/locales';

const source = 'extension-koni'
const destinations = ['web-runner', 'webapp']


const createPath = (source) => {
  return path.replace('{{name}}', source);
}

function cloneTrans() {
  const sourcePath = createPath(source)
  for (const destination of destinations) {
    const destinationPath = createPath(destination)

    try {
      fs.cpSync(sourcePath, destinationPath, { recursive: true })
      console.log(`Clone ${destination} done`);
    } catch (e) {
      console.error(`Fail to clone trans on ${destination}`, e);
    }
  }
}

// runTest();
runBuild();

// Web runner
cloneTrans();
