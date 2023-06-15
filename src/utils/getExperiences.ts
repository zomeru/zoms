import { type Experience } from '@/types';
import { parseMarkdown } from './parseMarkdown';

export async function getExperiences(): Promise<Experience[]> {
  const SITE_URL = process.env.SITE_URL;
  const FILE_URL = `${SITE_URL}/content/experiences`;

  try {
    const urls = [
      `${FILE_URL}/beyonder.md`,
      `${FILE_URL}/open-source.md`,
      `${FILE_URL}/freelance.md`
    ];

    const data = await Promise.all(
      urls.map(async (url) => {
        const res = await fetch(url);
        const text = await res.text();
        return text;
      })
    );

    const parseData = parseMarkdown<Experience>(data);
    return parseData;
  } catch {
    return [] as Experience[];
  }
}
