#!/bin/bash

function copy_folder () {
  SRC="packages/$1/build"
  DST="../apps/node_modules/@polkadot/$1"

  echo "** Copying $SRC to $DST"

  rm -rf $DST
  cp -r $SRC $DST
}

yarn polkadot-dev-build-ts

copy_folder "extension-dapp"
copy_folder "extension-inject"
