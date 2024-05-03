#!/usr/bin/env node
// Copyright 2017-2022 @polkadot/dev authors & contributors
// SPDX-License-Identifier: Apache-2.0

import path from 'path';
import axios from 'axios';
import fs from "fs";

import execSync from '@polkadot/dev/scripts/execSync.mjs';
import {Webhook} from "discord-webhook-node";

console.log('$ koni-ci-build-webapp', process.argv.slice(2).join(' '));

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

function runBuildWebApp() {
  execSync('yarn webapp:build');
}

function npmGetVersion() {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')).version;
}

const prNumber = process.env.PR_NUMBER || ''
const branchName = prNumber ? `${process.env.TARGET_BRANCH}-pr-${prNumber}` : (process.env.CURRENT_BRANCH || 'webapp').replace('refs/heads/', '');
const refName = process.env.BRANCH_NAME || 'koni-dev';
const commitMessage = process.env.COMMIT_MESSAGE
const buildDateString = new Date().toISOString().slice(0, 19).replaceAll(':', '-')

function runDeployWebApp(alias) {
  discordHook.send('Finish build version ' + npmGetVersion() + ' | ' + refName + ': ' + commitMessage)
  execSync(`netlify deploy --dir ./packages/webapp/build --site subwallet-app --alias ${alias}`);
  discordHook.send(`Update new web app: https://${alias}--subwallet-app.netlify.app/`)
}

runClean();
runCheck();

// Web app
runBuildWebApp();
runDeployWebApp(branchName);

