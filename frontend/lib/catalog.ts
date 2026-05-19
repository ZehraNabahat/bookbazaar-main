export const BOOK_CATEGORIES = [
  { slug: 'textbooks', label: 'Textbooks' },
  { slug: 'fiction', label: 'Fiction' },
  { slug: 'non-fiction', label: 'Non-Fiction' },
  { slug: 'science', label: 'Science' },
] as const;

export const TEXTBOOK_SUBCATEGORIES = [
  { slug: 'grade-1', label: 'Grade 1' },
  { slug: 'grade-2', label: 'Grade 2' },
  { slug: 'grade-3', label: 'Grade 3' },
  { slug: 'grade-4', label: 'Grade 4' },
  { slug: 'grade-5', label: 'Grade 5' },
  { slug: 'grade-6', label: 'Grade 6' },
  { slug: 'grade-7', label: 'Grade 7' },
  { slug: 'grade-8', label: 'Grade 8' },
  { slug: 'grade-9', label: 'Grade 9' },
  { slug: 'grade-10', label: 'Grade 10' },
  { slug: 'o-levels', label: 'O Levels' },
  { slug: 'a-levels', label: 'A Levels' },
  { slug: 'matric', label: 'Matric' },
  { slug: 'intermediate', label: 'Intermediate' },
  { slug: 'university', label: 'University' },
] as const;

const categorySlugMap = Object.fromEntries(
  BOOK_CATEGORIES.map((c) => [c.slug, c.label])
);

export function categoryLabelFromSlug(slug: string): string | undefined {
  return categorySlugMap[slug.toLowerCase()];
}

export function subcategoryLabelFromSlug(slug: string): string | undefined {
  return TEXTBOOK_SUBCATEGORIES.find((s) => s.slug === slug.toLowerCase())?.label;
}
