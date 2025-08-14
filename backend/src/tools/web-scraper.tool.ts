import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapingResult {
  title: string;
  content: string;
  url: string;
}

export class WebScraperTool {
  async scrapeUrl(url: string): Promise<ScrapingResult> {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      const title = $('title').text() || 'No title';
      const content = $('body').text().slice(0, 5000);
      
      return {
        title,
        content,
        url
      };
    } catch (error) {
      throw new Error(`Failed to scrape URL: ${error.message}`);
    }
  }
}