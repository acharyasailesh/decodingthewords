-- Create announcements table for CRUD operations
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    link TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Note: We can keep the announcement_bar and announcement_active in the settings table 
-- as a "Master Switch" or we can deprecate them. 
-- For now, let's just create this new table for full CRUD control.
