export const parseMarkdown = <T>(markdown: string[]): T[] => {
  const frontMatterRegex = /^---(.*?)---/s;

  const result = markdown.map((element: string) => {
    const frontMatterMatch = element.match(frontMatterRegex);
    const frontMatterContent = frontMatterMatch !== null ? frontMatterMatch[1].trim() : '';

    const extractedData: RegExpMatchArray | null =
      frontMatterContent.match(/([a-z]+):\s+'([^']+|\S+)'/gm);

    if (extractedData === null) {
      return [] as T[];
    }

    const data = extractedData.reduce((acc: Record<string, string>, curr: string) => {
      const [key, value] = curr.split(/:\s+/);

      acc[key] = value.replace(/'/g, '');

      return acc;
    }, {});

    const duties: string[] = element.split(/-\s+/gm).slice(1);

    return {
      ...data,
      duties
    };
  });

  return result as T[];
};
