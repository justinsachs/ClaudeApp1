import express, { Request, Response } from 'express';
import { getDatabase } from '../db/database';
import { CourseRepository } from '../repositories/CourseRepository';
import { AssessmentRepository } from '../repositories/AssessmentRepository';

const router = express.Router();

// Get section by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    const section = await repo.getSectionById(req.params.id);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    res.json({ section });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get section objectives
router.get('/:id/objectives', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    const objectives = await repo.getSectionObjectives(req.params.id);
    res.json({ objectives });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add section objective
router.post('/:id/objectives', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    const objective = await repo.addSectionObjective(req.params.id, req.body);
    res.status(201).json({ objective });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get section sources
router.get('/:id/sources', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    const sources = await repo.getSectionSources(req.params.id);
    res.json({ sources });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Link source to section
router.post('/:id/sources/:sourceId', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    await repo.linkSourceToSection(req.params.id, req.params.sourceId);
    res.json({ message: 'Source linked successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get section assessments
router.get('/:id/assessments', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new AssessmentRepository(db);

    const assessments = await repo.getSectionAssessments(req.params.id);
    res.json({ assessments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get section artifacts (NotebookLM outputs)
router.get('/:id/artifacts', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new AssessmentRepository(db);

    const artifacts = await repo.getSectionArtifacts(req.params.id);
    res.json({ artifacts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get section videos
router.get('/:id/videos/:type', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new AssessmentRepository(db);

    const video = await repo.getSectionVideo(req.params.id, req.params.type);
    res.json({ video });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
