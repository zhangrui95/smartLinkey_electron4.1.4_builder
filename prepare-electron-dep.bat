REM ---------------------------
REM Obfuscator electron's files
REM ---------------------------

REM down.js
call javascript-obfuscator src/for-electron/crates/down.js --output dist/for-electron/crates/down.js --compact true --control-flow-flattening true --dead-code-injection true
REM geticon.js
call javascript-obfuscator src/for-electron/crates/geticon.js --output dist/for-electron/crates/geticon.js --compact true --control-flow-flattening true --dead-code-injection true
REM launch.js
call javascript-obfuscator src/for-electron/crates/httpserver.js --output dist/for-electron/crates/httpserver.js --compact true --control-flow-flattening true --dead-code-injection true
REM httpserver.js
call javascript-obfuscator src/for-electron/crates/launch.js --output dist/for-electron/crates/launch.js --compact true --control-flow-flattening true --dead-code-injection true
REM logging.js
call javascript-obfuscator src/for-electron/crates/logging.js --output dist/for-electron/crates/logging.js --compact true --control-flow-flattening true --dead-code-injection true
REM uplaunch.js
call javascript-obfuscator src/for-electron/crates/uplaunch.js --output dist/for-electron/crates/uplaunch.js --compact true --control-flow-flattening true --dead-code-injection true
REM upversion.js
call javascript-obfuscator src/for-electron/crates/upversion.js --output dist/for-electron/crates/upversion.js --compact true --control-flow-flattening true --dead-code-injection true
REM ieproxy.js.js
call javascript-obfuscator src/for-electron/crates/ieproxy.js --output dist/for-electron/crates/ieproxy.js --compact true --control-flow-flattening true --dead-code-injection true
REM huaci_handler.js
call javascript-obfuscator src/for-electron/crates/huaci_handler.js --output dist/for-electron/crates/huaci_handler.js --compact true --control-flow-flattening true --dead-code-injection true

REM main_process.js
call javascript-obfuscator main_process.js --output main_process.dist.js --compact true --control-flow-flattening true --dead-code-injection true


echo dist> .electron-crates.txt