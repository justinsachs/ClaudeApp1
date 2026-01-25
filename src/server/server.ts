import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { getDrizzleDb } from './db/drizzle/connection';

// Load environment variables
dotenv.config();

// Import routes
import courseRoutes from './routes/courses';
import learnerRoutes from './routes/learners';
import enrollmentRoutes from './routes/enrollments';
import sectionRoutes from './routes/sections';
import sourceRoutes from './routes/sources';
import assessmentRoutes from './routes/assessments';
import uploadRoutes from './routes/uploads';
import { createPromptRoutes } from './routes/prompts';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/courses', courseRoutes);
app.use('/api/learners', learnerRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/sources', sourceRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'AI Course Platform API',
    version: '1.0.0',
    description: 'AI-powered course deployment platform with NotebookLM, Sora, and HeyGen integration',
    endpoints: {
      courses: '/api/courses',
      learners: '/api/learners',
      enrollments: '/api/enrollments',
      sections: '/api/sections',
      sources: '/api/sources',
      assessments: '/api/assessments'
    }
  });
});

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Initialize database and start server
async function start() {
  try {
    console.log('Connecting to database...');
    const db = getDrizzleDb();
    console.log('Database connected successfully');

    // Register prompt routes (requires database instance)
    const promptRoutes = createPromptRoutes(db);
    app.use('/api/prompts', promptRoutes);
    console.log('Prompt management routes registered');

    // Start background job processors
    console.log('Starting background job processors...');
    require('./jobs/processors/contentProcessor');
    console.log('Background workers started');

    app.listen(PORT, () => {
      console.log(`\n🚀 AI Course Platform server running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   API info: http://localhost:${PORT}/api`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

start();

export default app;
