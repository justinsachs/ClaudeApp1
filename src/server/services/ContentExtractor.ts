import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';

export class ContentExtractor {
  async extractFromPDF(filePath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error: any) {
      throw new Error(`Failed to extract PDF content: ${error.message}`);
    }
  }

  async extractFromDocx(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error: any) {
      throw new Error(`Failed to extract DOCX content: ${error.message}`);
    }
  }

  async extractContent(filePath: string, fileType: string): Promise<string> {
    if (fileType === 'pdf' || filePath.endsWith('.pdf')) {
      return this.extractFromPDF(filePath);
    } else if (fileType === 'docx' || filePath.endsWith('.docx')) {
      return this.extractFromDocx(filePath);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  chunkContent(text: string, maxChunkSize: number = 50000): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += maxChunkSize) {
      chunks.push(text.substring(i, i + maxChunkSize));
    }
    return chunks;
  }

  extractKeywords(text: string, topN: number = 20): string[] {
    // Simple keyword extraction - remove common words
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being']);

    const words = text.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));

    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([word]) => word);
  }
}
