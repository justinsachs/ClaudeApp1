import express, { Request, Response } from 'express';
import { getDatabase } from '../db/database';
import { CourseRepository } from '../repositories/CourseRepository';
import { SourceRepository } from '../repositories/SourceRepository';
import { CourseDefinitionPackage } from '../types/models';

const router = express.Router();

// Get all courses
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);
    const status = req.query.status as string | undefined;

    const courses = await repo.getAllCourses(status);
    res.json({ courses });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single course
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    const course = await repo.getCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ course });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get full course with all details
router.get('/:id/full', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    const courseData = await repo.getFullCourse(req.params.id);
    if (!courseData) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(courseData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new course
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    const course = await repo.createCourse(req.body);
    res.status(201).json({ course });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Create complete course package (CDP)
router.post('/package', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    const cdp: CourseDefinitionPackage = req.body;
    const courseId = await repo.createCoursePackage(cdp);

    const courseData = await repo.getFullCourse(courseId);
    res.status(201).json({ courseId, course: courseData });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update course
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    await repo.updateCourse(req.params.id, req.body);
    const course = await repo.getCourseById(req.params.id);

    res.json({ course });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Publish course
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    await repo.publishCourse(req.params.id);
    const course = await repo.getCourseById(req.params.id);

    res.json({ course, message: 'Course published successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete course
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    await repo.deleteCourse(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get course learning outcomes
router.get('/:id/outcomes', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    const outcomes = await repo.getLearningOutcomes(req.params.id);
    res.json({ outcomes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add learning outcome
router.post('/:id/outcomes', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    const outcome = await repo.addLearningOutcome(req.params.id, req.body);
    res.status(201).json({ outcome });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get course sections
router.get('/:id/sections', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    const sections = await repo.getSections(req.params.id);
    res.json({ sections });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create section
router.post('/:id/sections', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    const section = await repo.createSection(req.params.id, req.body);
    res.status(201).json({ section });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get course configuration
router.get('/:id/configuration', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    const configuration = await repo.getCourseConfiguration(req.params.id);
    res.json({ configuration });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Set course configuration
router.post('/:id/configuration', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const repo = new CourseRepository(db);

    const config = { ...req.body, course_id: req.params.id };
    await repo.setCourseConfiguration(config);

    res.json({ configuration: config });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
