import { Database } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { Source, NotebookLMNotebook } from '../types/models';

export class SourceRepository {
  constructor(private db: Database) {}

  // Source Materials
  async createSource(source: Omit<Source, 'id' | 'uploaded_at'>): Promise<Source> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO sources (id, title, source_type, file_path, url, version,
       date_published, authority_level, scope_of_use, jurisdiction, uploaded_at, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        source.title,
        source.source_type,
        source.file_path,
        source.url,
        source.version,
        source.date_published,
        source.authority_level,
        source.scope_of_use,
        source.jurisdiction,
        now,
        source.uploaded_by
      ]
    );

    return this.db.get<Source>('SELECT * FROM sources WHERE id = ?', [id]) as Promise<Source>;
  }

  async getSourceById(id: string): Promise<Source | undefined> {
    return this.db.get<Source>('SELECT * FROM sources WHERE id = ?', [id]);
  }

  // Alias for getSourceById (used by CourseCreatorService)
  async getSource(id: string): Promise<Source | undefined> {
    return this.getSourceById(id);
  }

  async getAllSources(): Promise<Source[]> {
    return this.db.all<Source>('SELECT * FROM sources ORDER BY uploaded_at DESC');
  }

  async getSourcesByType(sourceType: string): Promise<Source[]> {
    return this.db.all<Source>(
      'SELECT * FROM sources WHERE source_type = ? ORDER BY uploaded_at DESC',
      [sourceType]
    );
  }

  async getSourcesByJurisdiction(jurisdiction: string): Promise<Source[]> {
    return this.db.all<Source>(
      'SELECT * FROM sources WHERE jurisdiction = ? ORDER BY uploaded_at DESC',
      [jurisdiction]
    );
  }

  async updateSource(id: string, updates: Partial<Source>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'uploaded_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    values.push(id);

    await this.db.run(
      `UPDATE sources SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteSource(id: string): Promise<void> {
    await this.db.run('DELETE FROM sources WHERE id = ?', [id]);
  }

  // NotebookLM Notebooks
  async createNotebook(notebook: Omit<NotebookLMNotebook, 'id' | 'created_at'>): Promise<NotebookLMNotebook> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO notebooklm_notebooks (id, course_id, title, notebook_type, external_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, notebook.course_id, notebook.title, notebook.notebook_type, notebook.external_id, now]
    );

    return this.db.get<NotebookLMNotebook>('SELECT * FROM notebooklm_notebooks WHERE id = ?', [id]) as Promise<NotebookLMNotebook>;
  }

  async getNotebookById(id: string): Promise<NotebookLMNotebook | undefined> {
    return this.db.get<NotebookLMNotebook>('SELECT * FROM notebooklm_notebooks WHERE id = ?', [id]);
  }

  async getCourseNotebooks(courseId: string): Promise<NotebookLMNotebook[]> {
    return this.db.all<NotebookLMNotebook>(
      'SELECT * FROM notebooklm_notebooks WHERE course_id = ?',
      [courseId]
    );
  }

  async getNotebookByType(courseId: string, notebookType: string): Promise<NotebookLMNotebook | undefined> {
    return this.db.get<NotebookLMNotebook>(
      'SELECT * FROM notebooklm_notebooks WHERE course_id = ? AND notebook_type = ?',
      [courseId, notebookType]
    );
  }

  async updateNotebook(id: string, externalId: string): Promise<void> {
    await this.db.run(
      'UPDATE notebooklm_notebooks SET external_id = ? WHERE id = ?',
      [externalId, id]
    );
  }
}
