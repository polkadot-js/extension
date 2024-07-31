# Copyright 2019-2024 @polkadot/extension-compat-metamask authors & contributors
# SPDX-License-Identifier: Apache-2.0

#!/bin/bash

# build firefox target
yarn build:ff

# Reorg the builds to 
mkdir ff-diff

OS=$(uname)
FILE_PATH="./ff-diff"

# TODO check if corepack needs to be enabled.
# Might need unzip

compare_directories() {
    local dir1=$1
    local dir2=$2

    if diff -qr "$dir1" "$dir2" | sort; then
        echo "Builds are identical"
        return 0
    else
        echo "Builds are not identical"
        return 1
    fi
}

move_unzip() {
    mv ./master-ff-src.zip ./master-ff-build.zip $FILE_PATH && cd $FILE_PATH
    unzip -o master-ff-src.zip -d master-ff-src
    unzip -o master-ff-build.zip -d master-ff-build

    cd ./master-ff-src && yarn install && yarn build:ff && cd ..
}

if [ "$OS" == "Darwin" ]; then
    echo "Running on macOS"
    # macOS-specific commands go here

    move_unzip
    
    compare_directories ./master-ff-build ./master-ff-src/packages/extension/build
elif [ "$OS" == "Linux" ]; then
    echo "Running on Linux"
    # Linux-specific commands go here

    move_unzip
    
    compare_directories ./master-ff-build ./master-ff-src/packages/extension/build
else
    echo "Unsupported OS: $OS"
    exit 1
fi