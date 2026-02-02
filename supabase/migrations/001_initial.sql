-- Commits table (one row per analyzed PR/commit)
CREATE TABLE commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sha TEXT NOT NULL,
  repo TEXT NOT NULL,
  author TEXT NOT NULL,
  date DATE NOT NULL,
  commit_date TIMESTAMPTZ NOT NULL,
  message TEXT NOT NULL,
  additions INTEGER NOT NULL,
  
  -- PR details
  pr_number INTEGER,
  pr_title TEXT,
  pr_url TEXT,
  pr_description TEXT,
  
  -- AI analysis
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
  quality_summary TEXT,
  quality_analysis TEXT,
  analyzed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(sha, repo)
);

-- Daily summaries (aggregated per author per day)
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  author TEXT NOT NULL,
  total_lines INTEGER NOT NULL DEFAULT 0,
  total_commits INTEGER NOT NULL DEFAULT 0,
  avg_quality_score DECIMAL(3,1),
  avatar_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(date, author)
);

-- Contributors (all-time totals)
CREATE TABLE contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login TEXT NOT NULL UNIQUE,
  total_lines INTEGER NOT NULL DEFAULT 0,
  total_commits INTEGER NOT NULL DEFAULT 0,
  avg_quality_score DECIMAL(3,1),
  avatar_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_commits_date ON commits(date);
CREATE INDEX idx_commits_author ON commits(author);
CREATE INDEX idx_commits_repo ON commits(repo);
CREATE INDEX idx_daily_summaries_date ON daily_summaries(date);
CREATE INDEX idx_daily_summaries_author ON daily_summaries(author);
CREATE INDEX idx_contributors_login ON contributors(login);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_commits_updated_at
    BEFORE UPDATE ON commits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_summaries_updated_at
    BEFORE UPDATE ON daily_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contributors_updated_at
    BEFORE UPDATE ON contributors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
