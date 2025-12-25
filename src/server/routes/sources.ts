import express, { Request, Response } from 'express';
import { getDatabase } from '../db/database';
import { SourceRepository } from '../repositories/SourceRepository';

const router = express.Router();

// Get all sources
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new SourceRepository(db);

    const sources = await repo.getAllSources();
    res.json({ sources });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get source by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new SourceRepository(db);

    const source = await repo.getSourceById(req.params.id);
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    res.json({ source });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create source
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new SourceRepository(db);

    const source = await repo.createSource(req.body);
    res.status(201).json({ source });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update source
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new SourceRepository(db);

    await repo.updateSource(req.params.id, req.body);
    const source = await repo.getSourceById(req.params.id);

    res.json({ source });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete source
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new SourceRepository(db);

    await repo.deleteSource(req.params.id);
    res.json({ message: 'Source deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get sources by type
router.get('/type/:type', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new SourceRepository(db);

    const sources = await repo.getSourcesByType(req.params.type);
    res.json({ sources });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get sources by jurisdiction
router.get('/jurisdiction/:jurisdiction', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new SourceRepository(db);

    const sources = await repo.getSourcesByJurisdiction(req.params.jurisdiction);
    res.json({ sources });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
