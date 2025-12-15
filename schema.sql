-- Trip Planner Database Schema
-- Run this in Supabase SQL Editor

-- Create trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Trip Basic Info
  destination VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget_usd DECIMAL(10, 2) NOT NULL,
  
  -- Generated Content (stored as JSONB)
  points_of_interest JSONB NOT NULL,
  daily_itinerary JSONB NOT NULL,
  route_information JSONB NOT NULL,
  airbnb_recommendations JSONB NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  is_favorite BOOLEAN DEFAULT false,
  
  -- Constraints
  CONSTRAINT budget_positive CHECK (budget_usd > 0),
  CONSTRAINT valid_dates CHECK (start_date <= end_date)
);

-- Create indexes
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX idx_trips_is_favorite ON trips(is_favorite DESC) WHERE is_favorite = true;
CREATE UNIQUE INDEX idx_trips_user_destination_dates ON trips(user_id, destination, start_date, end_date);

-- Enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own trips
CREATE POLICY "Users can view own trips"
  ON trips
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own trips
CREATE POLICY "Users can create own trips"
  ON trips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trips are read-only after creation (no updates except favorite)
CREATE POLICY "Users can update trip favorite"
  ON trips
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own trips
CREATE POLICY "Users can delete own trips"
  ON trips
  FOR DELETE
  USING (auth.uid() = user_id);
