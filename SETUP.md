# Setup Guide - AI Course Platform

This guide will help you set up and run the AI Course Platform on your local machine.

## System Requirements

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Operating System**: Windows, macOS, or Linux
- **Disk Space**: At least 500MB for dependencies
- **RAM**: Minimum 4GB recommended

## Installation Steps

### 1. Install Node.js

If you don't have Node.js installed:

**macOS (using Homebrew):**
```bash
brew install node
```

**Windows:**
Download from https://nodejs.org/

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify installation:
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### 2. Clone the Repository

```bash
git clone <repository-url>
cd ClaudeApp1
```

### 3. Install Dependencies

**Backend dependencies:**
```bash
npm install
```

**Frontend dependencies:**
```bash
cd client
npm install
cd ..
```

This may take a few minutes as it downloads all required packages.

### 4. Set Up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Or manually create `.env` with:
```env
PORT=3000
NODE_ENV=development
DATABASE_PATH=./data/courses.db
NOTEBOOKLM_API_KEY=mock_notebooklm_key
SORA_API_KEY=mock_sora_key
HEYGEN_API_KEY=mock_heygen_key
```

**Note:** The platform currently uses mock AI services. When you have real API keys, replace the mock values.

### 5. Initialize the Database

The database will be created automatically on first run. To manually initialize:

```bash
npm run db:migrate
```

This creates:
- `data/` directory
- `data/courses.db` SQLite database
- All required tables from the schema

### 6. Start the Development Server

**Option A: Run both backend and frontend together (recommended):**
```bash
npm run dev
```

**Option B: Run separately:**

Terminal 1 (Backend):
```bash
npm run server:dev
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

### 7. Verify Setup

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

You should see:
- Frontend: The AI Course Platform dashboard
- API: API endpoint information
- Health: `{"status":"ok","timestamp":"..."}`

## Common Issues & Solutions

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:** Change the port in `.env`:
```env
PORT=3001
```

Or kill the process using the port:
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Locked

**Error:** `database is locked`

**Solution:** Close any SQLite browser/viewer and restart the server.

### Module Not Found

**Error:** `Cannot find module 'express'`

**Solution:** Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Compilation Errors

**Error:** TypeScript compilation fails

**Solution:**
```bash
npm install -g typescript
npm run build:server
```

## Production Deployment

### 1. Build for Production

```bash
# Build both frontend and backend
npm run build
```

This creates:
- `dist/` - Compiled backend code
- `client/dist/` - Compiled frontend code

### 2. Set Production Environment

Update `.env`:
```env
NODE_ENV=production
PORT=3000
DATABASE_PATH=/var/data/courses.db
```

### 3. Start Production Server

```bash
npm start
```

### 4. Serve Frontend

Option A: Use a web server (nginx, Apache) to serve `client/dist/`

Option B: Serve from Express (add static middleware in `server.ts`)

## Development Workflow

### Making Changes

**Backend changes:**
1. Edit files in `src/server/`
2. Server auto-restarts (using nodemon)
3. Test at `http://localhost:3000`

**Frontend changes:**
1. Edit files in `client/src/`
2. Page auto-reloads (using Vite HMR)
3. View at `http://localhost:5173`

**Database changes:**
1. Edit `src/server/db/schema.sql`
2. Delete `data/courses.db`
3. Restart server (auto-recreates DB)

### Testing the API

**Using curl:**
```bash
# Health check
curl http://localhost:3000/health

# List courses
curl http://localhost:3000/api/courses

# Create a learner
curl -X POST http://localhost:3000/api/learners \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","experience_level":"novice"}'
```

**Using Postman:**
1. Import API endpoints from `API_GUIDE.md`
2. Set base URL to `http://localhost:3000/api`
3. Test each endpoint

## Database Management

### View Database

Use a SQLite browser:
- **DB Browser for SQLite**: https://sqlitebrowser.org/
- **TablePlus**: https://tableplus.com/
- **DBeaver**: https://dbeaver.io/

Open: `data/courses.db`

### Backup Database

```bash
cp data/courses.db data/courses_backup_$(date +%Y%m%d).db
```

### Reset Database

```bash
rm data/courses.db
npm run server:dev  # Auto-recreates
```

## Integrating Real AI Services

### NotebookLM Integration

1. Obtain API key from Google
2. Update `.env`:
   ```env
   NOTEBOOKLM_API_KEY=your_real_key_here
   ```
3. Update `src/server/services/AIServices.ts`:
   - Replace `MockNotebookLMService` with real implementation
   - Use official NotebookLM API client

### Sora Integration

1. Obtain API key from OpenAI
2. Update `.env`:
   ```env
   SORA_API_KEY=your_real_key_here
   ```
3. Update `src/server/services/AIServices.ts`:
   - Replace `MockSoraService` with real implementation

### HeyGen Integration

1. Obtain API key from HeyGen
2. Update `.env`:
   ```env
   HEYGEN_API_KEY=your_real_key_here
   ```
3. Update `src/server/services/AIServices.ts`:
   - Replace `MockHeyGenService` with real implementation

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_PATH` | SQLite database file path | `./data/courses.db` |
| `NOTEBOOKLM_API_KEY` | NotebookLM API key | `mock_*` |
| `SORA_API_KEY` | Sora video API key | `mock_*` |
| `HEYGEN_API_KEY` | HeyGen video API key | `mock_*` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `10485760` (10MB) |
| `UPLOAD_DIR` | Upload directory | `./uploads` |

## Project Structure

```
ClaudeApp1/
├── src/server/           # Backend code
│   ├── db/              # Database
│   ├── repositories/    # Data access layer
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   └── types/           # TypeScript types
├── client/              # Frontend code
│   └── src/
│       ├── pages/       # React pages
│       ├── api/         # API client
│       └── App.tsx      # Main app
├── data/                # SQLite database (created on first run)
├── uploads/             # File uploads (created on first run)
├── dist/                # Compiled backend (after build)
├── package.json         # Backend dependencies
├── tsconfig.json        # TypeScript config
├── .env                 # Environment variables
└── README.md            # Documentation
```

## Next Steps

1. **Create a Course**: Navigate to "Create Course" and build your first course
2. **Add Learners**: Go to "Learners" and add test learners
3. **Enroll & Test**: Enroll a learner and test the section execution flow
4. **Review API**: Check `API_GUIDE.md` for detailed API documentation
5. **Explore Code**: Review the codebase to understand the architecture

## Getting Help

- **Documentation**: See `README.md` and `API_GUIDE.md`
- **Specification**: Review the AI Course Deployment Specification v1.1
- **Issues**: Check existing issues or create a new one
- **Code Comments**: Read inline code comments for implementation details

## Tips for Success

✅ Start with a simple course (2-3 sections)
✅ Use mock AI services initially
✅ Test the complete section execution flow
✅ Review audit trail to understand system behavior
✅ Explore the database to see data structures
✅ Check browser console for frontend errors
✅ Monitor server logs for backend errors

---

**You're all set! 🚀**

Start building engaging AI-powered courses with NotebookLM, Sora, and HeyGen.
