export const BOOK_CATEGORIES = ['Textbooks', 'Fiction', 'Non-Fiction', 'Science'];

export const TEXTBOOK_SUBCATEGORIES = [
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'O Levels',
  'A Levels',
  'Matric',
  'Intermediate',
  'University',
];

export const BOOK_CONDITIONS = ['Like New', 'Good', 'Acceptable'];

/** Condition is stored on Product.brand in this codebase */
export function normalizeCategory(value) {
  if (!value) return undefined;
  const found = BOOK_CATEGORIES.find(
    (c) => c.toLowerCase() === String(value).toLowerCase()
  );
  return found;
}

export function normalizeCondition(value) {
  if (!value) return undefined;
  const found = BOOK_CONDITIONS.find(
    (c) => c.toLowerCase() === String(value).toLowerCase()
  );
  return found;
}

export function normalizeSubcategory(value) {
  if (!value) return undefined;
  const found = TEXTBOOK_SUBCATEGORIES.find(
    (s) => s.toLowerCase() === String(value).toLowerCase()
  );
  return found;
}
