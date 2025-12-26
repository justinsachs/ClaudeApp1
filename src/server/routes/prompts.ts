import express, { Request, Response } from 'express';
import { Database } from 'sqlite3';
import { PromptRepository } from '../repositories/PromptRepository';
import { PromptEngine } from '../services/PromptEngine';
import {
  PromptTemplateCreateRequest,
  DeploymentPromptCreateRequest,
  BulkVariableSetRequest,
  PromptResolutionContext,
  PromptPreviewRequest
} from '../types/prompt-models';

export function createPromptRoutes(db: Database) {
  const router = express.Router();
  const promptRepo = new PromptRepository(db);
  const promptEngine = new PromptEngine(db);

  // ============================================
  // Deployments
  // ============================================

  // Create a new deployment (tenant)
  router.post('/deployments', async (req: Request, res: Response) => {
    try {
      const deployment = await promptRepo.createDeployment({
        name: req.body.name,
        description: req.body.description,
        active: req.body.active !== false
      });
      res.status(201).json(deployment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all deployments
  router.get('/deployments', async (req: Request, res: Response) => {
    try {
      const activeOnly = req.query.active === 'true';
      const deployments = await promptRepo.getAllDeployments(activeOnly);
      res.json(deployments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a single deployment
  router.get('/deployments/:id', async (req: Request, res: Response) => {
    try {
      const deployment = await promptRepo.getDeployment(req.params.id);
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
      await promptRepo.updateDeployment(req.params.id, req.body);
      const updated = await promptRepo.getDeployment(req.params.id);
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
      const templateData: PromptTemplateCreateRequest = {
        name: req.body.name,
        prompt_type: req.body.prompt_type,
        template_text: req.body.template_text,
        description: req.body.description,
        version: req.body.version,
        variables: req.body.variables
      };
      const template = await promptRepo.createPromptTemplate(templateData);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all templates (optionally filter by type)
  router.get('/templates', async (req: Request, res: Response) => {
    try {
      const promptType = req.query.type as any;
      const templates = await promptRepo.getAllPromptTemplates(promptType);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a single template
  router.get('/templates/:id', async (req: Request, res: Response) => {
    try {
      const template = await promptRepo.getPromptTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Include variables used in this template
      const variables = await promptRepo.getTemplateVariables(req.params.id);

      res.json({ ...template, variables });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update a template
  router.patch('/templates/:id', async (req: Request, res: Response) => {
    try {
      await promptRepo.updatePromptTemplate(req.params.id, req.body);
      const updated = await promptRepo.getPromptTemplate(req.params.id);
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
      const variable = await promptRepo.createPromptVariable({
        variable_name: req.body.variable_name,
        description: req.body.description,
        default_value: req.body.default_value,
        variable_type: req.body.variable_type || 'string',
        is_required: req.body.is_required || false,
        scope: req.body.scope || 'global'
      });
      res.status(201).json(variable);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all variables (optionally filter by scope)
  router.get('/variables', async (req: Request, res: Response) => {
    try {
      const scope = req.query.scope as any;
      const variables = await promptRepo.getAllPromptVariables(scope);
      res.json(variables);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a single variable
  router.get('/variables/:id', async (req: Request, res: Response) => {
    try {
      const variable = await promptRepo.getPromptVariable(req.params.id);
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
      const data: DeploymentPromptCreateRequest = {
        deployment_id: req.params.deploymentId,
        template_id: req.body.template_id,
        custom_template_text: req.body.custom_template_text,
        notes: req.body.notes
      };
      const deploymentPrompt = await promptRepo.createDeploymentPrompt(data);
      res.status(201).json(deploymentPrompt);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Set deployment variable values
  router.post('/deployments/:deploymentId/variables', async (req: Request, res: Response) => {
    try {
      const bulkRequest: BulkVariableSetRequest = {
        deployment_id: req.params.deploymentId,
        variables: req.body.variables
      };
      await promptRepo.bulkSetVariables(bulkRequest);

      const variables = await promptRepo.getDeploymentVariables(req.params.deploymentId);
      res.json(variables);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all deployment variables
  router.get('/deployments/:deploymentId/variables', async (req: Request, res: Response) => {
    try {
      const variables = await promptRepo.getDeploymentVariables(req.params.deploymentId);
      res.json(variables);
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
      const coursePrompt = await promptRepo.createCoursePrompt(
        req.params.courseId,
        req.body.template_id,
        req.body.custom_template_text
      );
      res.status(201).json(coursePrompt);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Set course variable values
  router.post('/courses/:courseId/variables', async (req: Request, res: Response) => {
    try {
      const bulkRequest: BulkVariableSetRequest = {
        course_id: req.params.courseId,
        variables: req.body.variables
      };
      await promptRepo.bulkSetVariables(bulkRequest);

      const variables = await promptRepo.getCourseVariables(req.params.courseId);
      res.json(variables);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all course variables
  router.get('/courses/:courseId/variables', async (req: Request, res: Response) => {
    try {
      const variables = await promptRepo.getCourseVariables(req.params.courseId);
      res.json(variables);
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
      const bulkRequest: BulkVariableSetRequest = {
        section_id: req.params.sectionId,
        variables: req.body.variables
      };
      await promptRepo.bulkSetVariables(bulkRequest);

      const variables = await promptRepo.getSectionVariables(req.params.sectionId);
      res.json(variables);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all section variables
  router.get('/sections/:sectionId/variables', async (req: Request, res: Response) => {
    try {
      const variables = await promptRepo.getSectionVariables(req.params.sectionId);
      res.json(variables);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // Prompt Resolution & Preview
  // ============================================

  // Resolve a prompt with full context
  router.post('/resolve', async (req: Request, res: Response) => {
    try {
      const context: PromptResolutionContext = {
        deployment_id: req.body.deployment_id,
        course_id: req.body.course_id,
        section_id: req.body.section_id,
        learner_id: req.body.learner_id,
        additional_variables: req.body.additional_variables
      };

      const resolved = await promptEngine.resolvePrompt(req.body.prompt_type, context);
      res.json(resolved);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Preview a prompt with test variables (doesn't log execution)
  router.post('/preview', async (req: Request, res: Response) => {
    try {
      const previewRequest: PromptPreviewRequest = {
        template_id: req.body.template_id,
        context: {
          deployment_id: req.body.deployment_id,
          course_id: req.body.course_id,
          section_id: req.body.section_id,
          learner_id: req.body.learner_id
        },
        test_variables: req.body.test_variables
      };

      const previewText = await promptEngine.previewPrompt(
        previewRequest.template_id,
        previewRequest.context,
        previewRequest.test_variables
      );

      res.json({ preview: previewText });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================
  // Prompt Execution History
  // ============================================

  // Get prompt execution history
  router.get('/executions', async (req: Request, res: Response) => {
    try {
      const filters = {
        deployment_id: req.query.deployment_id as string,
        course_id: req.query.course_id as string,
        section_id: req.query.section_id as string,
        learner_id: req.query.learner_id as string,
        prompt_type: req.query.prompt_type as any,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100
      };

      const executions = await promptRepo.getPromptExecutions(filters);
      res.json(executions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
