import express, { Request, Response } from 'express';
import { getDrizzleDb } from '../db/drizzle/connection';
import {
  deployments,
  promptTemplates,
  promptVariables,
  deploymentPrompts,
  deploymentVariables,
  coursePrompts,
  courseVariables,
  sectionVariables,
  promptExecutions
} from '../db/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export function createPromptRoutes() {
  const router = express.Router();
  const db = getDrizzleDb();

  // ============================================
  // Deployments
  // ============================================

  // Create a new deployment (tenant)
  router.post('/deployments', async (req: Request, res: Response) => {
    try {
      const [deployment] = await db.insert(deployments).values({
        id: `dep_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: req.body.name,
        description: req.body.description,
        active: req.body.active !== false
      }).returning();
      res.status(201).json(deployment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all deployments
  router.get('/deployments', async (req: Request, res: Response) => {
    try {
      const activeOnly = req.query.active === 'true';
      const result = activeOnly
        ? await db.select().from(deployments).where(eq(deployments.active, true))
        : await db.select().from(deployments);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a single deployment
  router.get('/deployments/:id', async (req: Request, res: Response) => {
    try {
      const [deployment] = await db.select().from(deployments).where(eq(deployments.id, req.params.id));
      if (!deployment) {
        return res.status(404).json({ error: 'Deployment not found' });
      }
      res.json(deployment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update deployment
  router.patch('/deployments/:id', async (req: Request, res: Response) => {
    try {
      const [updated] = await db.update(deployments)
        .set(req.body)
        .where(eq(deployments.id, req.params.id))
        .returning();
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================
  // Prompt Templates
  // ============================================

  // Create a new prompt template
  router.post('/templates', async (req: Request, res: Response) => {
    try {
      const [template] = await db.insert(promptTemplates).values({
        id: `tpl_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        prompt_type: req.body.prompt_type,
        name: req.body.name,
        template_text: req.body.template_text,
        description: req.body.description,
        version: req.body.version || '1.0',
        is_active: true
      }).returning();
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all templates (optionally filter by type)
  router.get('/templates', async (req: Request, res: Response) => {
    try {
      const promptType = req.query.type as string;
      const result = promptType
        ? await db.select().from(promptTemplates).where(eq(promptTemplates.prompt_type, promptType))
        : await db.select().from(promptTemplates);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a single template
  router.get('/templates/:id', async (req: Request, res: Response) => {
    try {
      const [template] = await db.select().from(promptTemplates).where(eq(promptTemplates.id, req.params.id));
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update a template
  router.patch('/templates/:id', async (req: Request, res: Response) => {
    try {
      const [updated] = await db.update(promptTemplates)
        .set(req.body)
        .where(eq(promptTemplates.id, req.params.id))
        .returning();
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================
  // Prompt Variables
  // ============================================

  // Create a new variable
  router.post('/variables', async (req: Request, res: Response) => {
    try {
      const [variable] = await db.insert(promptVariables).values({
        id: `var_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        variable_name: req.body.variable_name,
        description: req.body.description,
        default_value: req.body.default_value,
        variable_type: req.body.variable_type || 'text',
        is_required: req.body.is_required || false,
        scope: req.body.scope || 'global'
      }).returning();
      res.status(201).json(variable);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all variables (optionally filter by scope)
  router.get('/variables', async (req: Request, res: Response) => {
    try {
      const scope = req.query.scope as string;
      const result = scope
        ? await db.select().from(promptVariables).where(eq(promptVariables.scope, scope))
        : await db.select().from(promptVariables);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a single variable
  router.get('/variables/:id', async (req: Request, res: Response) => {
    try {
      const [variable] = await db.select().from(promptVariables).where(eq(promptVariables.id, req.params.id));
      if (!variable) {
        return res.status(404).json({ error: 'Variable not found' });
      }
      res.json(variable);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // Deployment Prompts & Variables
  // ============================================

  // Create deployment-specific prompt override
  router.post('/deployments/:deploymentId/prompts', async (req: Request, res: Response) => {
    try {
      const [deploymentPrompt] = await db.insert(deploymentPrompts).values({
        id: `dep_prompt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        deployment_id: req.params.deploymentId,
        template_id: req.body.template_id,
        custom_template_text: req.body.custom_template_text,
        notes: req.body.notes
      }).returning();
      res.status(201).json(deploymentPrompt);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Set deployment variable values
  router.post('/deployments/:deploymentId/variables', async (req: Request, res: Response) => {
    try {
      const variables = req.body.variables || [];

      for (const varData of variables) {
        await db.insert(deploymentVariables)
          .values({
            id: `dep_var_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            deployment_id: req.params.deploymentId,
            variable_id: varData.variable_id,
            value: varData.value
          })
          .onConflictDoUpdate({
            target: [deploymentVariables.deployment_id, deploymentVariables.variable_id],
            set: { value: varData.value, updated_at: new Date() }
          });
      }

      const result = await db.select().from(deploymentVariables)
        .where(eq(deploymentVariables.deployment_id, req.params.deploymentId));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all deployment variables
  router.get('/deployments/:deploymentId/variables', async (req: Request, res: Response) => {
    try {
      const result = await db.select().from(deploymentVariables)
        .where(eq(deploymentVariables.deployment_id, req.params.deploymentId));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // Course Prompts & Variables
  // ============================================

  // Create course-specific prompt override
  router.post('/courses/:courseId/prompts', async (req: Request, res: Response) => {
    try {
      const [coursePrompt] = await db.insert(coursePrompts).values({
        id: `course_prompt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        course_id: req.params.courseId,
        template_id: req.body.template_id,
        custom_template_text: req.body.custom_template_text
      }).returning();
      res.status(201).json(coursePrompt);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Set course variable values
  router.post('/courses/:courseId/variables', async (req: Request, res: Response) => {
    try {
      const variables = req.body.variables || [];

      for (const varData of variables) {
        await db.insert(courseVariables)
          .values({
            id: `course_var_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            course_id: req.params.courseId,
            variable_id: varData.variable_id,
            value: varData.value
          })
          .onConflictDoUpdate({
            target: [courseVariables.course_id, courseVariables.variable_id],
            set: { value: varData.value, updated_at: new Date() }
          });
      }

      const result = await db.select().from(courseVariables)
        .where(eq(courseVariables.course_id, req.params.courseId));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all course variables
  router.get('/courses/:courseId/variables', async (req: Request, res: Response) => {
    try {
      const result = await db.select().from(courseVariables)
        .where(eq(courseVariables.course_id, req.params.courseId));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // Section Variables
  // ============================================

  // Set section variable values
  router.post('/sections/:sectionId/variables', async (req: Request, res: Response) => {
    try {
      const variables = req.body.variables || [];

      for (const varData of variables) {
        await db.insert(sectionVariables)
          .values({
            id: `section_var_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            section_id: req.params.sectionId,
            variable_id: varData.variable_id,
            value: varData.value
          })
          .onConflictDoUpdate({
            target: [sectionVariables.section_id, sectionVariables.variable_id],
            set: { value: varData.value, updated_at: new Date() }
          });
      }

      const result = await db.select().from(sectionVariables)
        .where(eq(sectionVariables.section_id, req.params.sectionId));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all section variables
  router.get('/sections/:sectionId/variables', async (req: Request, res: Response) => {
    try {
      const result = await db.select().from(sectionVariables)
        .where(eq(sectionVariables.section_id, req.params.sectionId));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // Prompt Execution History
  // ============================================

  // Get prompt execution history
  router.get('/executions', async (req: Request, res: Response) => {
    try {
      const result = await db.select().from(promptExecutions).limit(100);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
