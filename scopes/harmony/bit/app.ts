/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/first */
process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('uncaughtException', err);
  process.exit(1);
});

import { nativeCompileCache } from '@teambit/toolbox.performance.v8-cache';

// to activate this on demand, run in the terminal "kill -USR2 <pid>".
// eslint-disable-next-line @typescript-eslint/no-unused-vars, import/order
const heapdump = require('heapdump');

// Enable v8 compile cache, keep this before other imports
nativeCompileCache?.install();

import './hook-require';
import { bootstrap } from '@teambit/legacy/dist/bootstrap';
import { handleErrorAndExit } from '@teambit/legacy/dist/cli/handle-errors';
import { runCLI } from './load-bit';

// eslint-disable-next-line
if (process.env.SCOPE_NAME && process.env.HEAPDUMP_PATH) {
  process.on('SIGUSR2', function () {
    // eslint-disable-next-line
    heapdump.writeSnapshot(`${process.env.HEAPDUMP_PATH}/${process.env.SCOPE_NAME}` + Date.now() + '.heapsnapshot');
  });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
initApp();

async function initApp() {
  try {
    await bootstrap();
    // registerCoreExtensions();
    // const harmony = await Harmony.load([ConfigExt], {});
    await runCLI();
  } catch (err: any) {
    const originalError = err.originalError || err;
    await handleErrorAndExit(originalError, process.argv[2]);
  }
}
