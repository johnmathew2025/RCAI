/**
 * Anti-duplication guardrails test
 * Ensures admin navigation IDs are unique
 */
import { ADMIN_SECTIONS, TAXONOMY_TABS } from '@/config/adminNav';

describe('Admin Navigation Tests', () => {
  test('admin nav IDs are unique', () => {
    const ids = ADMIN_SECTIONS.map(x => x.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toHaveLength(0);
  });

  test('taxonomy tab IDs are unique', () => {
    const ids = TAXONOMY_TABS.map(x => x.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toHaveLength(0);
  });

  test('evidence library appears only once in admin sections', () => {
    const evidenceSections = ADMIN_SECTIONS.filter(s => 
      s.label.toLowerCase().includes('evidence') || 
      s.label.toLowerCase().includes('library')
    );
    expect(evidenceSections).toHaveLength(1);
    expect(evidenceSections[0].id).toBe('evidence');
  });

  test('evidence library is NOT in taxonomy tabs', () => {
    const evidenceTabs = TAXONOMY_TABS.filter(t => 
      t.label.toLowerCase().includes('evidence') || 
      t.label.toLowerCase().includes('library')
    );
    expect(evidenceTabs).toHaveLength(0);
  });
});