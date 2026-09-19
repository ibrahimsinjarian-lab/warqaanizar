-- =====================================================================
-- Pictures. They live on Cloudinary; this only records where.
--
-- media.path holds the full Cloudinary address of the original. The site
-- asks Cloudinary for a resized copy in the best format for each reader.
--
-- The tables for covers and project pictures already exist from 001.
-- This adds the portrait on the front page, shared by both languages.
--
-- Run after 010_rich_text.sql.
-- =====================================================================

alter table warqaa.site_settings
  add column if not exists portrait_media_id uuid references warqaa.media(id) on delete set null;
