#!/bin/bash

SELF=$(cd `dirname $0`; pwd)

pushd $SELF
./node_modules/.bin/webpack
cp ./config.json dist/config.json
cp -r ./src/static dist/static
mkdir -p local
cd dist
zip -r ../local/nodebase-template-server.zip *
cd ..
popd
