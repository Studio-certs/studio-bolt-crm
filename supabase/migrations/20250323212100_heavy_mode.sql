/*
  # Add Profile Fields

  1. Changes
    - Add new columns to profiles table for enhanced user profiles
    - Add title, bio, company, location, and website fields
  
  2. Security
    - Maintains existing RLS policies
*/

ALTER TABLE profiles
ADD COLUMN title text,
ADD COLUMN bio text,
ADD COLUMN company text,
ADD COLUMN location text,
ADD COLUMN website text;
