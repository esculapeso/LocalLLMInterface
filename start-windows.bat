@echo off
echo Starting Local BLOOM Chat Interface...
echo.
set NODE_ENV=development
npx tsx server/index.ts
pause