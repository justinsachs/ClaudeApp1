import express, { Request, Response } from 'express';
import { getDatabase } from '../db/database';
import { LearnerRepository } from '../repositories/LearnerRepository';

const router = express.Router();

// Get all learners
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new LearnerRepository(db);

    const learners = await repo.getAllLearners();
    res.json({ learners });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get learner by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new LearnerRepository(db);

    const learner = await repo.getLearnerById(req.params.id);
    if (!learner) {
      return res.status(404).json({ error: 'Learner not found' });
    }

    res.json({ learner });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get full learner profile
router.get('/:id/profile', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new LearnerRepository(db);

    const profile = await repo.getLearnerProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Learner not found' });
    }

    res.json({ profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create learner
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new LearnerRepository(db);

    const learner = await repo.createLearner(req.body);
    res.status(201).json({ learner });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update learner
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new LearnerRepository(db);

    await repo.updateLearner(req.params.id, req.body);
    const learner = await repo.getLearnerById(req.params.id);

    res.json({ learner });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Set learner preferences
router.post('/:id/preferences', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new LearnerRepository(db);

    await repo.setPreferences(req.params.id, req.body);
    const preferences = await repo.getPreferences(req.params.id);

    res.json({ preferences });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get learner preferences
router.get('/:id/preferences', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new LearnerRepository(db);

    const preferences = await repo.getPreferences(req.params.id);
    res.json({ preferences });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add learner qualifier
router.post('/:id/qualifiers', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new LearnerRepository(db);

    await repo.addQualifier(req.params.id, req.body);
    const qualifiers = await repo.getQualifiers(req.params.id);

    res.status(201).json({ qualifiers });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get learner qualifiers
router.get('/:id/qualifiers', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new LearnerRepository(db);

    const qualifiers = await repo.getQualifiers(req.params.id);
    res.json({ qualifiers });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get learner competencies
router.get('/:id/competencies', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new LearnerRepository(db);

    const competencies = await repo.getCompetencies(req.params.id);
    res.json({ competencies });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update learner competency
router.post('/:id/competencies', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new LearnerRepository(db);

    const { outcome_id, mastery_level } = req.body;
    await repo.updateCompetency(req.params.id, outcome_id, mastery_level);

    const competencies = await repo.getCompetencies(req.params.id);
    res.json({ competencies });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get learner enrollments
router.get('/:id/enrollments', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new LearnerRepository(db);

    const enrollments = await repo.getLearnerEnrollments(req.params.id);
    res.json({ enrollments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
