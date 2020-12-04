// Copyright 2019-2020 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

export default function (pathname: string): boolean {
  const prohibitedFiles: RegExp[] = [
    /\.xml$/u,
    /\.pdf$/u
  ];

  return prohibitedFiles.some((file) => {
    if (file.test(pathname)) {
      return true;
    }

    return false;
  });
}
