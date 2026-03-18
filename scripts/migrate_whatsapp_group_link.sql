-- Add WhatsApp group invite link to families table
-- Run: psql $DATABASE_URL -f scripts/migrate_whatsapp_group_link.sql

ALTER TABLE families ADD COLUMN IF NOT EXISTS whatsapp_group_link text;

