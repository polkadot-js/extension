# Copyright 2019-2025 @polkadot/extension-compat-metamask authors & contributors
# SPDX-License-Identifier: Apache-2.0

#!/bin/bash

# build firefox target
yarn build:ff

# Reorg the builds to 
mkdir ff-diff

OS=$(uname)
FILE_PATH="./ff-diff"

compare_directories() {
    local dir1=$1
    local dir2=$2

    if diff -qr "$dir1" "$dir2" | sort; then
        echo "Builds are identical"
        exit 0
    else
        echo "Builds are not identical"
        exit 1
    fi
}

unzip_ff() {

    unzip -o master-ff-src.zip -d master-ff-src
    unzip -o master-ff-build.zip -d master-ff-build

    cd ./master-ff-src && yarn install && yarn build:ff && cd ..
}

if [ "$OS" == "Darwin" || "$RUNNER_OS" == "Linux" ]; then
    echo "Running on macOS"
    # macOS-specific commands go here

    mv ./master-ff-src.zip ./master-ff-build.zip $FILE_PATH && cd $FILE_PATH

    unzip_ff
    
    compare_directories ./master-ff-build ./master-ff-src/packages/extension/build
else # Assuming it will be Linux
    echo "Running on Linux"
    # Linux-specific commands go here

    mv -t $FILE_PATH ./master-ff-src.zip ./master-ff-build.zip && cd $FILE_PATH
    unzip_ff
    
    compare_directories ./master-ff-build ./master-ff-src/packages/extension/build
fi
