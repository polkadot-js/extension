#!/usr/bin/env node
// Copyright 2017-2022 @polkadot/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import path from 'path';

import execSync from '@polkadot/dev/scripts/execSync.mjs';
import {Webhook} from "discord-webhook-node";

console.log('$ polkadot-ci-ghact-build', process.argv.slice(2).join(' '));

const discordHook = new Webhook(process.env.DISCORD_WEBHOOK);

function runClean () {
  execSync('yarn polkadot-dev-clean-build');
}

function runCheck () {
  execSync('yarn lint');
}

function runTest () {
  execSync('yarn test');
}

function runBuild () {
  execSync('yarn build');
}

function npmGetVersion () {
  return JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')
  ).version;
}

function uploadBuild(){
  const refName = process.env.REF_NAME
  const commitMessage = process.env.COMMIT_MESSAGE
  const nowTimestamp = new Date().getTime()
  const sRefName = refName.replace(/(\/)/g, '-');
  const newName = `./${sRefName}-build-${npmGetVersion()}-${nowTimestamp}.zip`
  fs.renameSync('./master-build.zip', newName)
  discordHook.send('Finish build ' + refName + ': '+ commitMessage)
  discordHook.sendFile(newName)
}

runClean();
runCheck();
runTest();
runBuild();

uploadBuild()
