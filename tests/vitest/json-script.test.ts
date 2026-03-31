import { describe, expect, it } from 'vitest';

import { serializeJsonForScript } from '@/lib/json-script';

describe('JSON script serialization', () => {
  it('escapes closing script tags so CMS content cannot break out of JSON-LD blocks', () => {
    const serialized = serializeJsonForScript({
      headline: '</script><script>alert("owned")</script>',
      tags: ['safe']
    });

    expect(serialized).not.toContain('</script>');
    expect(serialized).toContain('\\u003c/script>');
    expect(serialized).toContain('\\u003cscript>alert(\\"owned\\")\\u003c/script>');
  });
});
