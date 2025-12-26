import { Database } from 'sqlite3';
import { promisify } from 'util';
import {
  Deployment,
  PromptTemplate,
  PromptVariable,
  DeploymentPrompt,
  DeploymentVariable,
  CoursePrompt,
  CourseVariable,
  SectionVariable,
  PromptExecution,
  PromptType,
  VariableScope,
  PromptTemplateCreateRequest,
  DeploymentPromptCreateRequest,
  VariableValueSetRequest,
  BulkVariableSetRequest
} from '../types/prompt-models';

export class PromptRepository {
  private db: Database;
  private run: any;
  private get: any;
  private all: any;

  constructor(database: Database) {
    this.db = database;
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
  }

  // ============================================
  // Deployments
  // ============================================

  async createDeployment(data: Omit<Deployment, 'id' | 'created_at' | 'updated_at'>): Promise<Deployment> {
    const id = `dep_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await this.run(
      `INSERT INTO deployments (id, name, description, active) VALUES (?, ?, ?, ?)`,
      [id, data.name, data.description, data.active ? 1 : 0]
    );
    return this.get(`SELECT * FROM deployments WHERE id = ?`, [id]);
  }

  async getDeployment(id: string): Promise<Deployment | null> {
    return this.get(`SELECT * FROM deployments WHERE id = ?`, [id]);
  }

  async getAllDeployments(activeOnly: boolean = false): Promise<Deployment[]> {
    const query = activeOnly
      ? `SELECT * FROM deployments WHERE active = 1 ORDER BY name`
      : `SELECT * FROM deployments ORDER BY name`;
    return this.all(query);
  }

  async updateDeployment(id: string, data: Partial<Deployment>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.active !== undefined) { fields.push('active = ?'); values.push(data.active ? 1 : 0); }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      await this.run(
        `UPDATE deployments SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  // ============================================
  // Prompt Templates
  // ============================================

  async createPromptTemplate(data: PromptTemplateCreateRequest): Promise<PromptTemplate> {
    const id = `tpl_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await this.run(
      `INSERT INTO prompt_templates (id, name, prompt_type, template_text, description, version, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.name, data.prompt_type, data.template_text, data.description, data.version || '1.0', 1]
    );

    // Link variables if provided
    if (data.variables && data.variables.length > 0) {
      for (const variableId of data.variables) {
        await this.run(
          `INSERT INTO template_variables (template_id, variable_id, is_required) VALUES (?, ?, ?)`,
          [id, variableId, 0]
        );
      }
    }

    return this.get(`SELECT * FROM prompt_templates WHERE id = ?`, [id]);
  }

  async getPromptTemplate(id: string): Promise<PromptTemplate | null> {
    return this.get(`SELECT * FROM prompt_templates WHERE id = ?`, [id]);
  }

  async getPromptTemplateByType(
    promptType: PromptType,
    activeOnly: boolean = true
  ): Promise<PromptTemplate | null> {
    const query = activeOnly
      ? `SELECT * FROM prompt_templates WHERE prompt_type = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1`
      : `SELECT * FROM prompt_templates WHERE prompt_type = ? ORDER BY created_at DESC LIMIT 1`;
    return this.get(query, [promptType]);
  }

  async getAllPromptTemplates(promptType?: PromptType): Promise<PromptTemplate[]> {
    if (promptType) {
      return this.all(
        `SELECT * FROM prompt_templates WHERE prompt_type = ? ORDER BY prompt_type, created_at DESC`,
        [promptType]
      );
    }
    return this.all(`SELECT * FROM prompt_templates ORDER BY prompt_type, created_at DESC`);
  }

  async updatePromptTemplate(id: string, data: Partial<PromptTemplate>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.template_text !== undefined) { fields.push('template_text = ?'); values.push(data.template_text); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.version !== undefined) { fields.push('version = ?'); values.push(data.version); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      await this.run(
        `UPDATE prompt_templates SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  // ============================================
  // Prompt Variables
  // ============================================

  async createPromptVariable(data: Omit<PromptVariable, 'id' | 'created_at'>): Promise<PromptVariable> {
    const id = `var_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await this.run(
      `INSERT INTO prompt_variables (id, variable_name, description, default_value, variable_type, is_required, scope)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.variable_name, data.description, data.default_value, data.variable_type, data.is_required ? 1 : 0, data.scope]
    );
    return this.get(`SELECT * FROM prompt_variables WHERE id = ?`, [id]);
  }

  async getPromptVariable(id: string): Promise<PromptVariable | null> {
    return this.get(`SELECT * FROM prompt_variables WHERE id = ?`, [id]);
  }

  async getPromptVariableByName(name: string): Promise<PromptVariable | null> {
    return this.get(`SELECT * FROM prompt_variables WHERE variable_name = ?`, [name]);
  }

  async getAllPromptVariables(scope?: VariableScope): Promise<PromptVariable[]> {
    if (scope) {
      return this.all(`SELECT * FROM prompt_variables WHERE scope = ? ORDER BY variable_name`, [scope]);
    }
    return this.all(`SELECT * FROM prompt_variables ORDER BY scope, variable_name`);
  }

  async getTemplateVariables(templateId: string): Promise<PromptVariable[]> {
    return this.all(
      `SELECT pv.* FROM prompt_variables pv
       INNER JOIN template_variables tv ON pv.id = tv.variable_id
       WHERE tv.template_id = ?
       ORDER BY pv.variable_name`,
      [templateId]
    );
  }

  // ============================================
  // Deployment Prompts & Variables
  // ============================================

  async createDeploymentPrompt(data: DeploymentPromptCreateRequest): Promise<DeploymentPrompt> {
    const id = `deppmt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await this.run(
      `INSERT INTO deployment_prompts (id, deployment_id, template_id, custom_template_text, notes, is_enabled)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.deployment_id, data.template_id, data.custom_template_text, data.notes, 1]
    );
    return this.get(`SELECT * FROM deployment_prompts WHERE id = ?`, [id]);
  }

  async getDeploymentPrompt(deploymentId: string, templateId: string): Promise<DeploymentPrompt | null> {
    return this.get(
      `SELECT * FROM deployment_prompts WHERE deployment_id = ? AND template_id = ?`,
      [deploymentId, templateId]
    );
  }

  async getDeploymentPromptByType(
    deploymentId: string,
    promptType: PromptType
  ): Promise<DeploymentPrompt | null> {
    return this.get(
      `SELECT dp.* FROM deployment_prompts dp
       INNER JOIN prompt_templates pt ON dp.template_id = pt.id
       WHERE dp.deployment_id = ? AND pt.prompt_type = ? AND dp.is_enabled = 1
       ORDER BY dp.created_at DESC LIMIT 1`,
      [deploymentId, promptType]
    );
  }

  async setDeploymentVariable(
    deploymentId: string,
    variableId: string,
    value: string
  ): Promise<DeploymentVariable> {
    const id = `depvar_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Upsert pattern
    await this.run(
      `INSERT INTO deployment_variables (id, deployment_id, variable_id, value)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(deployment_id, variable_id) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
      [id, deploymentId, variableId, value, value]
    );

    return this.get(
      `SELECT * FROM deployment_variables WHERE deployment_id = ? AND variable_id = ?`,
      [deploymentId, variableId]
    );
  }

  async getDeploymentVariables(deploymentId: string): Promise<Record<string, string>> {
    const rows: DeploymentVariable[] = await this.all(
      `SELECT dv.*, pv.variable_name
       FROM deployment_variables dv
       INNER JOIN prompt_variables pv ON dv.variable_id = pv.id
       WHERE dv.deployment_id = ?`,
      [deploymentId]
    );

    const result: Record<string, string> = {};
    for (const row of rows) {
      result[(row as any).variable_name] = row.value;
    }
    return result;
  }

  // ============================================
  // Course Prompts & Variables
  // ============================================

  async createCoursePrompt(
    courseId: string,
    templateId: string,
    customText?: string
  ): Promise<CoursePrompt> {
    const id = `crspmt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await this.run(
      `INSERT INTO course_prompts (id, course_id, template_id, custom_template_text, is_enabled)
       VALUES (?, ?, ?, ?, ?)`,
      [id, courseId, templateId, customText, 1]
    );
    return this.get(`SELECT * FROM course_prompts WHERE id = ?`, [id]);
  }

  async getCoursePromptByType(courseId: string, promptType: PromptType): Promise<CoursePrompt | null> {
    return this.get(
      `SELECT cp.* FROM course_prompts cp
       INNER JOIN prompt_templates pt ON cp.template_id = pt.id
       WHERE cp.course_id = ? AND pt.prompt_type = ? AND cp.is_enabled = 1
       ORDER BY cp.created_at DESC LIMIT 1`,
      [courseId, promptType]
    );
  }

  async setCourseVariable(courseId: string, variableId: string, value: string): Promise<CourseVariable> {
    const id = `crsvar_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await this.run(
      `INSERT INTO course_variables (id, course_id, variable_id, value)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(course_id, variable_id) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
      [id, courseId, variableId, value, value]
    );

    return this.get(
      `SELECT * FROM course_variables WHERE course_id = ? AND variable_id = ?`,
      [courseId, variableId]
    );
  }

  async getCourseVariables(courseId: string): Promise<Record<string, string>> {
    const rows: CourseVariable[] = await this.all(
      `SELECT cv.*, pv.variable_name
       FROM course_variables cv
       INNER JOIN prompt_variables pv ON cv.variable_id = pv.id
       WHERE cv.course_id = ?`,
      [courseId]
    );

    const result: Record<string, string> = {};
    for (const row of rows) {
      result[(row as any).variable_name] = row.value;
    }
    return result;
  }

  // ============================================
  // Section Variables
  // ============================================

  async setSectionVariable(sectionId: string, variableId: string, value: string): Promise<SectionVariable> {
    const id = `secvar_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await this.run(
      `INSERT INTO section_variables (id, section_id, variable_id, value)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(section_id, variable_id) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
      [id, sectionId, variableId, value, value]
    );

    return this.get(
      `SELECT * FROM section_variables WHERE section_id = ? AND variable_id = ?`,
      [sectionId, variableId]
    );
  }

  async getSectionVariables(sectionId: string): Promise<Record<string, string>> {
    const rows: SectionVariable[] = await this.all(
      `SELECT sv.*, pv.variable_name
       FROM section_variables sv
       INNER JOIN prompt_variables pv ON sv.variable_id = pv.id
       WHERE sv.section_id = ?`,
      [sectionId]
    );

    const result: Record<string, string> = {};
    for (const row of rows) {
      result[(row as any).variable_name] = row.value;
    }
    return result;
  }

  // ============================================
  // Prompt Executions (Audit Log)
  // ============================================

  async logPromptExecution(data: Omit<PromptExecution, 'id' | 'executed_at'>): Promise<PromptExecution> {
    const id = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await this.run(
      `INSERT INTO prompt_executions
       (id, prompt_type, deployment_id, course_id, section_id, learner_id, resolved_prompt, ai_service, execution_context)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.prompt_type,
        data.deployment_id,
        data.course_id,
        data.section_id,
        data.learner_id,
        data.resolved_prompt,
        data.ai_service,
        data.execution_context
      ]
    );
    return this.get(`SELECT * FROM prompt_executions WHERE id = ?`, [id]);
  }

  async getPromptExecutions(filters: {
    deployment_id?: string;
    course_id?: string;
    section_id?: string;
    learner_id?: string;
    prompt_type?: PromptType;
    limit?: number;
  }): Promise<PromptExecution[]> {
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters.deployment_id) {
      conditions.push('deployment_id = ?');
      values.push(filters.deployment_id);
    }
    if (filters.course_id) {
      conditions.push('course_id = ?');
      values.push(filters.course_id);
    }
    if (filters.section_id) {
      conditions.push('section_id = ?');
      values.push(filters.section_id);
    }
    if (filters.learner_id) {
      conditions.push('learner_id = ?');
      values.push(filters.learner_id);
    }
    if (filters.prompt_type) {
      conditions.push('prompt_type = ?');
      values.push(filters.prompt_type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 100;

    return this.all(
      `SELECT * FROM prompt_executions ${whereClause} ORDER BY executed_at DESC LIMIT ?`,
      [...values, limit]
    );
  }

  // ============================================
  // Bulk Operations
  // ============================================

  async bulkSetVariables(request: BulkVariableSetRequest): Promise<void> {
    for (const varSet of request.variables) {
      const value = typeof varSet.value === 'object'
        ? JSON.stringify(varSet.value)
        : String(varSet.value);

      if (request.deployment_id) {
        await this.setDeploymentVariable(request.deployment_id, varSet.variable_id, value);
      } else if (request.course_id) {
        await this.setCourseVariable(request.course_id, varSet.variable_id, value);
      } else if (request.section_id) {
        await this.setSectionVariable(request.section_id, varSet.variable_id, value);
      }
    }
  }
}
