#!/usr/bin/env bash
cd client/
./repack
cd ..
cat client/node_modules/nodewebkit/nodewebkit`getconf LONG_BIT`/nw client/app.nw > out/app.run
cp client/node_modules/nodewebkit/nodewebkit`getconf LONG_BIT`/* out/
chmod +x out/app.run
rm out/nw
