import express, { Request, Response } from 'express';
import { getDatabase } from '../db/database';
import { AssessmentRepository } from '../repositories/AssessmentRepository';

const router = express.Router();

// Get assessment by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new AssessmentRepository(db);

    const assessment = await repo.getAssessmentById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const options = await repo.getAssessmentOptions(req.params.id);
    res.json({ assessment, options });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create assessment
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new AssessmentRepository(db);

    const { options, ...assessmentData } = req.body;
    const assessment = await repo.createAssessment(assessmentData);

    // Add options if provided (for MCQ)
    if (options && Array.isArray(options)) {
      for (const option of options) {
        await repo.addAssessmentOption(assessment.id, option);
      }
    }

    const assessmentOptions = await repo.getAssessmentOptions(assessment.id);
    res.status(201).json({ assessment, options: assessmentOptions });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get verification records for a section progress
router.get('/verifications/:sectionProgressId', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new AssessmentRepository(db);

    const records = await repo.getVerificationRecords(req.params.sectionProgressId);
    res.json({ verification_records: records });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get remediation logs for a section progress
router.get('/remediations/:sectionProgressId', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new AssessmentRepository(db);

    const logs = await repo.getRemediationLogs(req.params.sectionProgressId);
    res.json({ remediation_logs: logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get video asset
router.get('/videos/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new AssessmentRepository(db);

    const video = await repo.getVideoAsset(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video asset not found' });
    }

    res.json({ video });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit trail
router.get('/audit/:entityType/:entityId', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new AssessmentRepository(db);

    const trail = await repo.getAuditTrail(req.params.entityType, req.params.entityId);
    res.json({ audit_trail: trail });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
