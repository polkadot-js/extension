// Copyright 2019-2020 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

export default function (pathname: string): boolean {
  const prohibitedFiles: RegExp[] = [
    /\.xml$/u,
    /\.pdf$/u,
    /1281/u
  ];

  return prohibitedFiles.some((file) => {
    console.log(pathname, file, file.test(pathname));

    if (file.test(pathname)) {
      return true;
    }

    return false;
  });
}
