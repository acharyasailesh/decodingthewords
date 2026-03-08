-- ============================================================
-- 🚀 BOOK DATA IMPORT: Sections & Chapters
-- This script inserts the table of contents based on your book!
-- ============================================================

-- 1. Update Book Sections in Settings
UPDATE public.settings 
SET book_sections = '[
  {"id": "SECTION-1", "titleEn": "W = WISDOM", "titleNp": "खण्ड १ : बुद्धिमत्ता"},
  {"id": "SECTION-2", "titleEn": "O = OBSERVATION", "titleNp": "खण्ड २ : अवलोकन"},
  {"id": "SECTION-3", "titleEn": "R = REPETITION", "titleNp": "खण्ड ३ : दोहोर्याउने"},
  {"id": "SECTION-4", "titleEn": "D = DISCIPLINE", "titleNp": "खण्ड ४ : अनुशासन"},
  {"id": "SPECIAL", "titleEn": "Additional Resources", "titleNp": "थप सामग्रीहरू"}
]'::jsonb
WHERE id = 1;

-- 2. Clear existing chapters to avoid duplicates (Optional, but cleaner)
DELETE FROM public.book_content;

-- 3. Insert Chapters for Section 1 (Wisdom)
INSERT INTO public.book_content (chapter_id, section_id, title_english, title_nepali, order_index, is_preview) VALUES
('ch-1', 'SECTION-1', 'The Beginning', 'अध्याय १: सुरु-वाद र सुरु-वात', 1, true),
('ch-2', 'SECTION-1', 'Clarity of Destination', 'अध्याय २: गन्तव्यको स्पष्टता र उद्देश्यको बोध', 2, false),
('ch-3', 'SECTION-1', 'The Social Trap', 'अध्याय ३: सामाजिक पासो (The Social Trap)', 3, false);

-- 4. Insert Chapters for Section 2 (Observation)
INSERT INTO public.book_content (chapter_id, section_id, title_english, title_nepali, order_index, is_preview) VALUES
('ch-4', 'SECTION-2', 'The Language of Wealth', 'अध्याय ४: द ल्याङ्ग्वेज अफ वेल्थ (The Language of Wealth)', 4, false),
('ch-5', 'SECTION-2', 'Is Problem Real?', 'अध्याय ५: के समस्या वास्तवमै वास्तविक छ ? (Is Problem Real?)', 5, false);

-- 5. Insert Chapters for Section 3 (Repetition)
INSERT INTO public.book_content (chapter_id, section_id, title_english, title_nepali, order_index, is_preview) VALUES
('ch-6', 'SECTION-3', 'Correction with Problem', 'अध्याय ६: समस्यासँग प्रेम, करेक्सन', 6, false),
('ch-7', 'SECTION-3', 'The Sangat Effect', 'अध्याय ७: द संगत इफेक्ट (The Sangat Effect)', 7, false),
('ch-8', 'SECTION-3', 'The Money Machine', 'अध्याय ८: द मनी मेसिन (The Money Machine)', 8, false);

-- 6. Insert Chapters for Section 4 (Discipline)
INSERT INTO public.book_content (chapter_id, section_id, title_english, title_nepali, order_index, is_preview) VALUES
('ch-9', 'SECTION-4', 'Do It Now (DIN)', 'अध्याय ९: तुरुन्तै गर (Do It Now – DIN)', 9, false),
('ch-10', 'SECTION-4', 'Gratitude', 'अध्याय १०: कृतज्ञता (Gratitude)', 10, false),
('ch-11', 'SECTION-4', 'The Power of Process', 'अध्याय ११: द पावर अफ प्रोसेस (The Power of Process)', 11, false),
('ch-12', 'SECTION-4', 'The Chapter of Harvest', 'अध्याय १२: प्रतिफलको अध्याय (The Chapter of Harvest)', 12, false),
('ch-13', 'SECTION-4', 'Celebration of Success', 'अध्याय १३: सफलताको उत्सव र नयाँ क्षितिज', 13, false);

-- 7. Insert Special Sections
INSERT INTO public.book_content (chapter_id, section_id, title_english, title_nepali, order_index, is_preview) VALUES
('epilogue', 'SPECIAL', 'Epilogue: Your Turn', 'उपसंहार: अब तपाईंको पालो (Epilogue: Now It’s Your Turn)', 14, false),
('challenge-21', 'SPECIAL', '21 Day Challenge', '२१ दिने डिकोडिङ च्यालेन्ज', 15, true),
('references', 'SPECIAL', 'References', 'सन्दर्भ सामग्री तथा डिजिटल स्रोतहरू (References & Digital Resources)', 16, false),
('acknowledgement', 'SPECIAL', 'Acknowledgement', 'कृतज्ञता ज्ञापन (Acknowledgement)', 17, false),
('about-author', 'SPECIAL', 'About the Author', 'लेखकको बारेमा', 18, false),
('problem-index', 'SPECIAL', 'Problem Solving Index', 'समस्या समाधान अनुक्रमणीका (Problem Solving Index)', 19, false),
('the-blurb', 'SPECIAL', 'The Blurb', 'पुस्तकको पछाडिको भागका लागि (The Blurb)', 20, false);
