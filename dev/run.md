# 1. Start the Server (Terminal 1)
cd packages/server
npm run dev
# You should see output like:
#   ✓ Server running at ws://[IP_ADDRESS]/dev/[Your-Room-Name]
#   ✓ http://localhost:1999/docs

# 2. Start the Frontend (Terminal 2)
cd packages/frontend
npm run dev

# 3. Connect
# Open http://localhost:5173/ in two separate browser windows (or tabs).
# In each window, click "Login with Discord".
# Create or Join a lobby. You should see yourself appear in the other window!
