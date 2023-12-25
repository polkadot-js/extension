// Copyright 2019-2022 @subwallet/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import pkgJson from '../packages/webapp/package.json' assert {type: 'json'};

function getBuildNumber(number) {
    if (number < 10) {
        return `00${number}`
    }
    if (number < 100) {
        return `0${number}`
    }
    return number;
}
function replaceAll(str, find, replace) {
  return str.split(find).join(replace);
}

async function main() {
    const {version, buildNumber} = pkgJson;
    const textVersion = replaceAll(version, '.', '');
    if (buildNumber && buildNumber.startsWith(textVersion)) {
        const buildNumberWithoutVersion = replaceAll(buildNumber, textVersion, '');
        pkgJson.buildNumber = `${textVersion}${getBuildNumber(parseInt(buildNumberWithoutVersion) + 1)}`;
    }else {
        pkgJson.buildNumber = `${textVersion}001`;
    }
    await fs.promises.writeFile('packages/webapp/package.json', JSON.stringify(pkgJson, null, 2));
    console.log(`You are update build number to ${pkgJson.buildNumber} `)
}

main().catch(console.error).finally(() => process.exit());
