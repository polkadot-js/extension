#!/usr/bin/env node
// Copyright 2017-2022 @polkadot/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from "fs";

import execSync from '@polkadot/dev/scripts/execSync.mjs';


function runBuild() {
  execSync('yarn i18next-scanner --config i18next-scanner.config.js');
}

const sourcePath = './packages/extension-koni/public/locales'
const destinationPath = './packages/web-runner/public/locales'


function cloneTrans() {
  try {
    fs.cpSync(sourcePath, destinationPath, { recursive: true })
    console.log('Clone done');
  } catch (e) {
    console.error('Fail to clone trans', e);
  }
}

// runTest();
runBuild();

// Web runner
cloneTrans();
