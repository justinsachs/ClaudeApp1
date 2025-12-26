import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { getDatabase } from '../db/database';
import { SourceRepository } from '../repositories/SourceRepository';
import { contentQueue } from '../jobs/queues';
import { StorageFactory } from '../storage/StorageFactory';

const router = express.Router();

// Get storage adapter from factory
const storageAdapter = StorageFactory.getAdapter();

// Configure multer for memory storage (we'll handle file storage via adapter)
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/html'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, DOC, TXT, and HTML files are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter
});

// Upload single file
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, source_type, authority_level, jurisdiction, version } = req.body;

    // Generate unique filename
    const uniqueFilename = `sources/${Date.now()}-${Math.random().toString(36).substring(7)}-${req.file.originalname}`;

    // Upload file using storage adapter
    const uploadedFile = await storageAdapter.uploadFile(
      req.file.buffer,
      uniqueFilename,
      req.file.mimetype,
      { originalName: req.file.originalname }
    );

    const db = getDatabase();
    const sourceRepo = new SourceRepository(db);

    // Determine source type from file
    const fileType = req.file.mimetype.includes('pdf') ? 'pdf' :
                     req.file.mimetype.includes('word') ? 'docx' :
                     req.file.mimetype.includes('html') ? 'website' : 'manual';

    // Create source record with storage path
    const source = await sourceRepo.createSource({
      title: title || req.file.originalname,
      source_type: source_type || fileType,
      file_path: uploadedFile.path,
      url: uploadedFile.url,
      authority_level: authority_level || 'primary',
      jurisdiction,
      version,
      uploaded_by: 'system' // TODO: Get from authenticated user
    });

    // Queue content extraction
    const job = await contentQueue.add('extract', {
      sourceId: source.id,
      filePath: uploadedFile.path,
      fileType: source.source_type
    });

    res.status(201).json({
      source,
      message: 'File uploaded successfully',
      extractionJobId: job.id
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload multiple files
router.post('/upload-multiple', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const db = getDatabase();
    const sourceRepo = new SourceRepository(db);
    const files = req.files as Express.Multer.File[];

    const sources = await Promise.all(
      files.map(async (file) => {
        const fileType = file.mimetype.includes('pdf') ? 'pdf' :
                        file.mimetype.includes('word') ? 'docx' : 'manual';

        const source = await sourceRepo.createSource({
          title: file.originalname,
          source_type: fileType,
          file_path: file.path,
          authority_level: 'primary',
          uploaded_by: 'system'
        });

        // Queue extraction
        await contentQueue.add('extract', {
          sourceId: source.id,
          filePath: file.path,
          fileType: source.source_type
        });

        return source;
      })
    );

    res.status(201).json({
      sources,
      message: `${sources.length} files uploaded successfully`
    });

  } catch (error: any) {
    console.error('Multi-upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get extraction job status
router.get('/extraction-status/:jobId', async (req: Request, res: Response) => {
  try {
    const job = await contentQueue.getJob(req.params.jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    const progress = job.progress();

    res.json({
      jobId: job.id,
      state,
      progress,
      result: await job.finished().catch(() => null)
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
