// Isolated test of the parsing logic (mirrors ItemsCaptureComponent.parseQuickMeta)
function parseQuickMeta(raw: string) {
  const tokens = raw.split(/\s+/);
  const tags: string[] = [];
  let energyLevel: 1 | 2 | 3 | 4 | 5 | undefined;
  let estimateMinutes: number | undefined;
  const titleParts: string[] = [];
  for (const t of tokens) {
    if (t.startsWith('#') && t.length > 1) {
      tags.push(t.substring(1));
      continue;
    }
    if (/^![1-5]$/.test(t)) {
      energyLevel = Number(t.substring(1)) as any;
      continue;
    }
    if (/^~\d+$/.test(t)) {
      estimateMinutes = Number(t.substring(1));
      continue;
    }
    titleParts.push(t);
  }
  return { cleanTitle: titleParts.join(' ').trim(), energyLevel, estimateMinutes, tags };
}

describe('parseQuickMeta', () => {
  function parse(input: string) {
    return parseQuickMeta(input);
  }

  it('parses plain title only', () => {
    const r = parse('Just a task');
    expect(r.cleanTitle).toBe('Just a task');
    expect(r.tags).toEqual([]);
    expect(r.energyLevel).toBeUndefined();
    expect(r.estimateMinutes).toBeUndefined();
  });

  it('parses single tag and energy + estimate', () => {
    const r = parse('#Work !3 ~25 Write report draft');
    expect(r.tags).toEqual(['Work']);
    expect(r.energyLevel).toBe(3);
    expect(r.estimateMinutes).toBe(25);
    expect(r.cleanTitle).toBe('Write report draft');
  });

  it('dedupes and preserves order of multiple tags', () => {
    const r = parse('Finish #Report #report #Writing !5 ~60 outline');
    expect(r.tags).toEqual(['Report', 'report', 'Writing']);
    expect(r.energyLevel).toBe(5);
    expect(r.estimateMinutes).toBe(60);
    expect(r.cleanTitle).toBe('Finish outline');
  });

  it('ignores malformed tokens', () => {
    const r = parse('# !9 ~abc !2x ~30x Title');
    expect(r.tags).toEqual([]);
    expect(r.energyLevel).toBeUndefined();
    expect(r.estimateMinutes).toBeUndefined();
    expect(r.cleanTitle).toBe('# !9 ~abc !2x ~30x Title');
  });

  it('handles empty or whitespace string', () => {
    const r = parse('   ');
    expect(r.cleanTitle).toBe('');
    expect(r.tags).toEqual([]);
  });
});
