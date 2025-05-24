@echo off
echo Starting Local BLOOM Chat Interface...
echo.
set NODE_ENV=development
set HOST=localhost
set VLLM_HOST=172.21.65.17
npx tsx server/index.ts
pause