import express, { Request, Response } from 'express';
import { getDatabase } from '../db/database';
import { LearnerRepository } from '../repositories/LearnerRepository';
import { CourseRepository } from '../repositories/CourseRepository';
import { SectionExecutionService } from '../services/SectionExecutionService';

const router = express.Router();

// Create enrollment
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const learnerRepo = new LearnerRepository(db);
    const courseRepo = new CourseRepository(db);

    const { learner_id, course_id } = req.body;

    // Verify learner and course exist
    const learner = await learnerRepo.getLearnerById(learner_id);
    const course = await courseRepo.getCourseById(course_id);

    if (!learner) {
      return res.status(404).json({ error: 'Learner not found' });
    }
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    const enrollment = await learnerRepo.enrollLearner(learner_id, course_id);

    // Initialize section progress for all sections
    const sections = await courseRepo.getSections(course_id);
    for (const section of sections) {
      await learnerRepo.initializeSectionProgress(enrollment.id, section.id);
    }

    res.status(201).json({ enrollment });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get enrollment
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new LearnerRepository(db);

    const enrollment = await repo.getEnrollment(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json({ enrollment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get enrollment progress
router.get('/:id/progress', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new LearnerRepository(db);

    const progress = await repo.getAllSectionProgress(req.params.id);
    res.json({ progress });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start a section
router.post('/:enrollmentId/sections/:sectionId/start', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const learnerRepo = new LearnerRepository(db);
    const executionService = new SectionExecutionService(db);

    const { enrollmentId, sectionId } = req.params;

    // Get section progress
    const progress = await learnerRepo.getSectionProgress(enrollmentId, sectionId);
    if (!progress) {
      return res.status(404).json({ error: 'Section progress not found' });
    }

    // Start section
    await learnerRepo.startSection(progress.id);

    // Generate welcome video
    const welcome = await executionService.generateSectionWelcome(sectionId);

    res.json({
      message: 'Section started',
      welcome_video: welcome
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Conduct calibration interview
router.post('/:enrollmentId/sections/:sectionId/calibrate', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const executionService = new SectionExecutionService(db);

    const { enrollmentId, sectionId } = req.params;
    const { responses } = req.body;

    const calibration = await executionService.conductCalibrationInterview(
      enrollmentId,
      sectionId,
      responses
    );

    res.json({ calibration });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Deliver instruction
router.post('/:enrollmentId/sections/:sectionId/instruct', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const executionService = new SectionExecutionService(db);

    const { sectionId } = req.params;
    const { notebook_id } = req.body;

    const instruction = await executionService.deliverInstruction(sectionId, notebook_id);

    res.json({ instruction });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Submit verification
router.post('/:enrollmentId/sections/:sectionId/verify', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const learnerRepo = new LearnerRepository(db);
    const executionService = new SectionExecutionService(db);

    const { enrollmentId, sectionId } = req.params;
    const { assessment_id, learner_response } = req.body;

    const progress = await learnerRepo.getSectionProgress(enrollmentId, sectionId);
    if (!progress) {
      return res.status(404).json({ error: 'Section progress not found' });
    }

    const result = await executionService.verifyLearning({
      section_progress_id: progress.id,
      assessment_id,
      learner_response
    });

    res.json({ verification: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get remediation
router.post('/:enrollmentId/sections/:sectionId/remediate', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const learnerRepo = new LearnerRepository(db);
    const executionService = new SectionExecutionService(db);

    const { enrollmentId, sectionId } = req.params;
    const { remediation_type } = req.body;

    const progress = await learnerRepo.getSectionProgress(enrollmentId, sectionId);
    if (!progress) {
      return res.status(404).json({ error: 'Section progress not found' });
    }

    const content = await executionService.provideRemediation(progress.id, remediation_type);

    res.json({ remediation: content });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Complete section
router.post('/:enrollmentId/sections/:sectionId/complete', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const executionService = new SectionExecutionService(db);

    const { enrollmentId, sectionId } = req.params;
    const { final_score } = req.body;

    // Generate wrap-up video
    const wrapUp = await executionService.generateSectionWrapUp(sectionId, enrollmentId);

    // Complete section
    await executionService.completeSection(enrollmentId, sectionId, final_score);

    res.json({
      message: 'Section completed',
      wrap_up_video: wrapUp
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update enrollment status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new LearnerRepository(db);

    const { status, final_score } = req.body;
    await repo.updateEnrollmentStatus(req.params.id, status, final_score);

    const enrollment = await repo.getEnrollment(req.params.id);
    res.json({ enrollment });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
