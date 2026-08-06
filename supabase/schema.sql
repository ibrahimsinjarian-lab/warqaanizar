-- ================================================================
-- Warqaa Nazar Portfolio — Supabase Schema
-- Run this entire file in the Supabase SQL Editor (one paste).
-- ================================================================


-- ── ESSAYS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.essays (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    num         text        NOT NULL,
    title       text        NOT NULL DEFAULT '',
    tags        text[]      NOT NULL DEFAULT '{}',
    category    text        NOT NULL DEFAULT 'general',
    year        text        NOT NULL DEFAULT '',
    content     text        NOT NULL DEFAULT '',
    sort_order  integer     NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS essays_num_key ON public.essays (num);


-- ── DESIGNS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.designs (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text        NOT NULL,
    title       text        NOT NULL DEFAULT '',
    tag         text        NOT NULL DEFAULT '',
    category    text        NOT NULL DEFAULT 'interior',
    palette     integer     NOT NULL DEFAULT 1,
    images      text[]      NOT NULL DEFAULT '{}',
    concept     text        NOT NULL DEFAULT '',
    sort_order  integer     NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS designs_slug_key ON public.designs (slug);


-- ── DECORATIONS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.decorations (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    label       text        NOT NULL DEFAULT '',
    zone        text        NOT NULL,
    url         text        NOT NULL,
    pos_top     text        DEFAULT NULL,
    pos_right   text        DEFAULT NULL,
    pos_bottom  text        DEFAULT NULL,
    pos_left    text        DEFAULT NULL,
    width       text        NOT NULL DEFAULT '200px',
    opacity     text        NOT NULL DEFAULT '1',
    rotation    text        NOT NULL DEFAULT '0',
    z_index     integer     NOT NULL DEFAULT 1,
    created_at  timestamptz NOT NULL DEFAULT now()
);


-- ── SETTINGS (single-row) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
    id              integer     PRIMARY KEY DEFAULT 1,
    name_arabic     text        DEFAULT 'ورقاء نزار',
    name_latin      text        DEFAULT 'Warqaa Nazar',
    roles           text        DEFAULT 'writer  ·  designer',
    instagram       text        DEFAULT '@warqaanazar',
    instagram_url   text        DEFAULT 'https://instagram.com/warqaanazar',
    email           text        DEFAULT 'warqaa@email.com',
    whatsapp        text        DEFAULT '+971 00 000 0000',
    whatsapp_url    text        DEFAULT 'https://wa.me/9710000000000',
    about_tagline   text        DEFAULT 'I want to invite people into my own world.',
    about_text      text        DEFAULT '',
    portrait_url    text        DEFAULT 'https://i.ibb.co/tTC3Vjf2/Warqaa.jpg',
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Ensure the single settings row always exists
INSERT INTO public.settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;


-- ── ROW LEVEL SECURITY ────────────────────────────────────────────
-- Public visitors can read everything.
-- Only the authenticated admin can create, update, or delete.

ALTER TABLE public.essays      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings    ENABLE ROW LEVEL SECURITY;

-- DROP existing policies first so re-running this file is safe
DROP POLICY IF EXISTS "public read essays"        ON public.essays;
DROP POLICY IF EXISTS "auth write essays"         ON public.essays;
DROP POLICY IF EXISTS "public read designs"       ON public.designs;
DROP POLICY IF EXISTS "auth write designs"        ON public.designs;
DROP POLICY IF EXISTS "public read decorations"   ON public.decorations;
DROP POLICY IF EXISTS "auth write decorations"    ON public.decorations;
DROP POLICY IF EXISTS "public read settings"      ON public.settings;
DROP POLICY IF EXISTS "auth write settings"       ON public.settings;

-- Public read
CREATE POLICY "public read essays"       ON public.essays      FOR SELECT USING (true);
CREATE POLICY "public read designs"      ON public.designs     FOR SELECT USING (true);
CREATE POLICY "public read decorations"  ON public.decorations FOR SELECT USING (true);
CREATE POLICY "public read settings"     ON public.settings    FOR SELECT USING (true);

-- Authenticated admin write
CREATE POLICY "auth write essays"
    ON public.essays FOR ALL
    USING      (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth write designs"
    ON public.designs FOR ALL
    USING      (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth write decorations"
    ON public.decorations FOR ALL
    USING      (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth write settings"
    ON public.settings FOR ALL
    USING      (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');


-- ── UPDATED_AT TRIGGER ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS essays_updated_at  ON public.essays;
DROP TRIGGER IF EXISTS designs_updated_at ON public.designs;

CREATE TRIGGER essays_updated_at
    BEFORE UPDATE ON public.essays
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER designs_updated_at
    BEFORE UPDATE ON public.designs
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
