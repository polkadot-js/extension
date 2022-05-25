#!/usr/bin/env node
// Copyright 2017-2022 @polkadot/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

import path from 'path';
import axios from 'axios';
import fs from "fs";

import execSync from '@polkadot/dev/scripts/execSync.mjs';
import {Webhook} from "discord-webhook-node";

console.log('$ polkadot-ci-ghact-build', process.argv.slice(2).join(' '));

const discordHook = new Webhook(process.env.DISCORD_WEBHOOK);

function runClean() {
  execSync('yarn polkadot-dev-clean-build');
}

function runCheck() {
  execSync('yarn lint');
}

function runTest() {
  execSync('yarn test');
}

function runBuild() {
  execSync('yarn build');
}

function npmGetVersion() {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')).version;
}

async function uploadBuild() {
  const refName = process.env.REF_NAME
  const commitMessage = process.env.COMMIT_MESSAGE
  const nowTimestamp = new Date().getTime()
  const sRefName = refName.replace(/(\/)/g, '-');

  discordHook.send('Finish build ' + refName + ': ' + commitMessage)

  try {
    const cloudConfig = JSON.parse(process.env.NEXTCLOUD_CONFIG)
    const {nextCloudUrl, nextCloudUsername, nextCloudPassword, folder, shareFolder} = cloudConfig;

    const newName = `./${sRefName}-build-${npmGetVersion()}-${nowTimestamp}.zip`
    const downloadLink = `${nextCloudUrl}/s/${shareFolder}/download?path=%2F&files=${newName}`;
    const uploadUrl = `${nextCloudUrl}/remote.php/dav/files/${nextCloudUsername}/${folder}/${newName}`;

    const file = await fs.readFileSync('./master-build.zip');

    const rs = await axios.put(uploadUrl, file, {
      auth: {
        username: nextCloudUsername, password: nextCloudPassword
      },
      headers: {'Content-Type': 'text/octet-stream'},
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    })

    if (rs.statusText === 'Created') {
      discordHook.send('Upload success! Please download here:')
      discordHook.send(downloadLink)
    } else {
      console.warn('Can not upload build to discord!')
    }
  } catch (e) {
    console.warn('NEXTCLOUD_CONFIG WRONG', e)
  }
}

runClean();
runCheck();
runTest();
runBuild();

uploadBuild()
