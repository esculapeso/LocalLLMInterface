# Local BLOOM Chat Interface - Windows Setup

## Quick Start

1. **Download** this project to your Windows machine
2. **Open Command Prompt** in the project folder
3. **Install dependencies**: `npm install`
4. **Start the interface**: Double-click `start-windows.bat` OR run:
   ```cmd
   set NODE_ENV=development
   set HOST=localhost
   npx tsx server/index.ts
   ```

## What you get:
- ✅ Local chat interface at `http://localhost:5000`
- ✅ SQLite database (no setup needed - creates `chat.db` file automatically)
- ✅ Persistent conversation history
- ✅ Easy model switching with copy-paste commands
- ✅ Real-time connection monitoring for your VLLM server

## Using with your BLOOM models:

1. **Select model** from the dropdown in the interface
2. **Copy command** using the "Copy" button  
3. **Run in WSL** - paste the command in your WSL terminal:
   ```bash
   python3 -m vllm.entrypoints.openai.api_server --model bigscience/bloom-3b --host 0.0.0.0 --port 8000
   ```
4. **Start chatting** - the interface automatically detects when your model is ready!

## Requirements:
- Node.js installed on Windows
- Your BLOOM models already downloaded in WSL
- VLLM installed in WSL

That's it! No database server, no complex setup - just download and run!