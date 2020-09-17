#!/bin/bash
# Copyright 2019-2020 @polkadot/extension authors & contributors
# SPDX-License-Identifier: Apache-2.0

function copy_folder () {
  SRC="packages/$1/build"
  DST="../apps/node_modules/@polkadot/$1"

  echo "** Copying $SRC to $DST"

  rm -rf $DST
  cp -r $SRC $DST
}

yarn build

copy_folder "extension-dapp"
copy_folder "extension-inject"
