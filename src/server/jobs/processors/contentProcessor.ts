import { contentQueue } from '../queues';
import { ContentExtractor } from '../../services/ContentExtractor';
import { getDatabase } from '../../db/database';

const extractor = new ContentExtractor();

// Process content extraction jobs
contentQueue.process('extract', async (job) => {
  const { sourceId, filePath, fileType } = job.data;

  console.log(`Extracting content from ${filePath} (${fileType})`);

  try {
    const text = await extractor.extractContent(filePath, fileType);
    const keywords = extractor.extractKeywords(text);
    const chunks = extractor.chunkContent(text);

    // Store extracted content metadata in database
    const db = getDatabase();
    await db.run(
      `UPDATE sources
       SET version = ?,
           date_published = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [JSON.stringify({ extracted: true, length: text.length, chunks: chunks.length, keywords }), sourceId]
    );

    return {
      sourceId,
      extractedLength: text.length,
      chunkCount: chunks.length,
      keywordCount: keywords.length
    };
  } catch (error: any) {
    console.error(`Content extraction failed for ${sourceId}:`, error.message);
    throw error;
  }
});

console.log('Content processor worker started');
