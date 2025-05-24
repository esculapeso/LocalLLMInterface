@echo off
echo Starting Local BLOOM Chat Interface...
echo.
set NODE_ENV=development
set HOST=localhost
npx tsx server/index.ts
pause