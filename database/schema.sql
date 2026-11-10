-- =====================================================================
-- BrainBridge database schema (PostgreSQL / Neon)
-- Run with:  npm run db:init   (drops and recreates all tables)
-- =====================================================================

DROP TABLE IF EXISTS
  user_bookmarks, placement_readiness, study_streaks, learning_progress,
  daily_activity_logs, daily_goals, assessment_attempts, assessment_questions,
  assessments, mock_interview_responses, mock_interviews, interview_questions,
  company_preparation, companies, project_ideas, portfolio_profiles,
  resume_analysis, resume_records, resume_templates, communication_attempts,
  communication_exercises, code_drafts, coding_submissions, coding_problems,
  aptitude_attempts, aptitude_questions, video_resources, lessons, learning_topics,
  learning_modules, roadmap_items, learning_roadmaps, student_profiles, users
CASCADE;

-- ---------------------------------------------------------------------
-- Users & profiles
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL CHECK (length(trim(name)) >= 2),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_profiles (
  user_id              INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  college              VARCHAR(200),
  branch               VARCHAR(100),
  academic_year        VARCHAR(20) CHECK (academic_year IN ('1','2','3','4','graduate')),
  graduation_year      INTEGER CHECK (graduation_year BETWEEN 2000 AND 2100),
  preferred_language   VARCHAR(10) NOT NULL DEFAULT 'java' CHECK (preferred_language IN ('java','python','c')),
  target_role          VARCHAR(100),
  target_companies     TEXT[] NOT NULL DEFAULT '{}',
  preparation_level    VARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (preparation_level IN ('beginner','intermediate','advanced')),
  daily_goal_minutes   INTEGER NOT NULL DEFAULT 60 CHECK (daily_goal_minutes BETWEEN 10 AND 720),
  onboarding_complete  BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Learning content
-- ---------------------------------------------------------------------
CREATE TABLE learning_modules (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(60) NOT NULL UNIQUE,
  title       VARCHAR(120) NOT NULL,
  category    VARCHAR(40) NOT NULL,   -- programming | dsa | aptitude | logical | verbal | communication | interview | core
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE learning_topics (
  id          SERIAL PRIMARY KEY,
  module_id   INTEGER NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  slug        VARCHAR(80) NOT NULL,
  title       VARCHAR(150) NOT NULL,
  summary     TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (module_id, slug)
);
CREATE INDEX idx_topics_module ON learning_topics(module_id);

CREATE TABLE lessons (
  id          SERIAL PRIMARY KEY,
  topic_id    INTEGER NOT NULL REFERENCES learning_topics(id) ON DELETE CASCADE,
  title       VARCHAR(150) NOT NULL,
  content     JSONB NOT NULL,          -- structured sections (explanation, syntax, code, ...)
  difficulty  VARCHAR(10) NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  est_minutes INTEGER NOT NULL DEFAULT 20,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_lessons_topic ON lessons(topic_id);

CREATE TABLE video_resources (
  id          SERIAL PRIMARY KEY,
  category    VARCHAR(60) NOT NULL,
  title       VARCHAR(200) NOT NULL,
  topic       VARCHAR(120) NOT NULL,
  description TEXT,
  source      VARCHAR(120) NOT NULL,
  url         TEXT NOT NULL UNIQUE,
  embed_id    VARCHAR(40),             -- YouTube id when the video can be embedded
  kind        VARCHAR(20) NOT NULL DEFAULT 'video'   -- video | course | article | platform
);
CREATE INDEX idx_videos_category ON video_resources(category);

CREATE TABLE learning_progress (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status       VARCHAR(15) NOT NULL DEFAULT 'started' CHECK (status IN ('started','completed')),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX idx_progress_user ON learning_progress(user_id);

-- ---------------------------------------------------------------------
-- Roadmaps
-- ---------------------------------------------------------------------
CREATE TABLE learning_roadmaps (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  based_on     JSONB NOT NULL,          -- snapshot of the profile used to generate it
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roadmap_items (
  id           SERIAL PRIMARY KEY,
  roadmap_id   INTEGER NOT NULL REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
  stage        INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 4),
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  link         VARCHAR(200),            -- route inside the app
  topic_id     INTEGER REFERENCES learning_topics(id) ON DELETE SET NULL,
  priority     VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('high','normal','optional')),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_roadmap_items_roadmap ON roadmap_items(roadmap_id);

-- ---------------------------------------------------------------------
-- Aptitude
-- ---------------------------------------------------------------------
CREATE TABLE aptitude_questions (
  id           SERIAL PRIMARY KEY,
  section      VARCHAR(20) NOT NULL CHECK (section IN ('quant','logical','verbal')),
  topic_slug   VARCHAR(80) NOT NULL,
  question     TEXT NOT NULL,
  options      JSONB NOT NULL,          -- array of 4 strings
  answer_index INTEGER NOT NULL CHECK (answer_index BETWEEN 0 AND 4),
  explanation  TEXT NOT NULL,
  difficulty   VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  UNIQUE (topic_slug, question)
);
CREATE INDEX idx_apt_topic ON aptitude_questions(section, topic_slug, difficulty);

CREATE TABLE aptitude_attempts (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section       VARCHAR(20) NOT NULL,
  topic_slug    VARCHAR(80) NOT NULL,
  difficulty    VARCHAR(10),
  total         INTEGER NOT NULL,
  correct       INTEGER NOT NULL,
  time_taken_s  INTEGER NOT NULL DEFAULT 0,
  answers       JSONB NOT NULL,         -- [{question_id, selected, correct}]
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_apt_attempts_user ON aptitude_attempts(user_id, created_at);

-- ---------------------------------------------------------------------
-- Coding practice
-- ---------------------------------------------------------------------
CREATE TABLE coding_problems (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(100) NOT NULL UNIQUE,
  title         VARCHAR(150) NOT NULL,
  difficulty    VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  topic         VARCHAR(60) NOT NULL,
  description   TEXT NOT NULL,
  input_format  TEXT NOT NULL,
  output_format TEXT NOT NULL,
  constraints   TEXT NOT NULL,
  examples      JSONB NOT NULL,        -- [{input, output, explanation}]
  hints         JSONB NOT NULL DEFAULT '[]',
  explanation   TEXT NOT NULL,
  solutions     JSONB NOT NULL,        -- {java, python, c}
  test_cases    JSONB NOT NULL         -- [{input, output, hidden}]
);
CREATE INDEX idx_coding_filter ON coding_problems(difficulty, topic);

CREATE TABLE coding_submissions (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id   INTEGER NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
  language     VARCHAR(10) NOT NULL CHECK (language IN ('java','python','c')),
  code         TEXT NOT NULL,
  status       VARCHAR(30) NOT NULL,   -- accepted | wrong_answer | compile_error | runtime_error | time_limit | not_executed
  passed       INTEGER NOT NULL DEFAULT 0,
  total        INTEGER NOT NULL DEFAULT 0,
  runner       VARCHAR(20),            -- judge0 | local | none
  details      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_submissions_user ON coding_submissions(user_id, problem_id);

CREATE TABLE code_drafts (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id INTEGER NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
  language   VARCHAR(10) NOT NULL,
  code       TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, problem_id, language)
);

-- ---------------------------------------------------------------------
-- Communication
-- ---------------------------------------------------------------------
CREATE TABLE communication_exercises (
  id           SERIAL PRIMARY KEY,
  slug         VARCHAR(80) NOT NULL UNIQUE,
  title        VARCHAR(150) NOT NULL,
  category     VARCHAR(40) NOT NULL,    -- placement | email | gd | presentation | grammar ...
  prompt       TEXT NOT NULL,
  guidance     TEXT NOT NULL,
  model_answer TEXT NOT NULL,
  keywords     JSONB NOT NULL DEFAULT '[]',
  min_words    INTEGER NOT NULL DEFAULT 60
);

CREATE TABLE communication_attempts (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES communication_exercises(id) ON DELETE CASCADE,
  response    TEXT NOT NULL,
  score       INTEGER NOT NULL,
  feedback    JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_comm_attempts_user ON communication_attempts(user_id);

-- ---------------------------------------------------------------------
-- Resume & portfolio
-- ---------------------------------------------------------------------
CREATE TABLE resume_templates (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(40) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  section_order JSONB NOT NULL,
  accent      VARCHAR(10) NOT NULL
);

CREATE TABLE resume_records (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(120) NOT NULL DEFAULT 'My Resume',
  template_key VARCHAR(40) NOT NULL REFERENCES resume_templates(key),
  data         JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_resume_user ON resume_records(user_id);

CREATE TABLE resume_analysis (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name      VARCHAR(255) NOT NULL,
  target_role    VARCHAR(100),
  score          INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  breakdown      JSONB NOT NULL,
  missing_keywords JSONB NOT NULL,
  suggestions    JSONB NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_resume_analysis_user ON resume_analysis(user_id);

CREATE TABLE portfolio_profiles (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  slug       VARCHAR(80) NOT NULL UNIQUE,
  is_public  BOOLEAN NOT NULL DEFAULT FALSE,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Projects & companies
-- ---------------------------------------------------------------------
CREATE TABLE project_ideas (
  id                 SERIAL PRIMARY KEY,
  role               VARCHAR(60) NOT NULL,
  title              VARCHAR(150) NOT NULL,
  difficulty         VARCHAR(15) NOT NULL CHECK (difficulty IN ('beginner','intermediate','advanced')),
  problem_statement  TEXT NOT NULL,
  description        TEXT NOT NULL,
  tech_stack         JSONB NOT NULL,
  features           JSONB NOT NULL,
  architecture       TEXT NOT NULL,
  expected_output    TEXT NOT NULL,
  skills             JSONB NOT NULL,
  resume_description TEXT NOT NULL,
  interview_questions JSONB NOT NULL,
  UNIQUE (role, title)
);
CREATE INDEX idx_projects_role ON project_ideas(role, difficulty);

CREATE TABLE companies (
  id           SERIAL PRIMARY KEY,
  slug         VARCHAR(60) NOT NULL UNIQUE,
  name         VARCHAR(100) NOT NULL,
  type         VARCHAR(20) NOT NULL CHECK (type IN ('product','service')),
  overview     TEXT NOT NULL,
  products     TEXT NOT NULL,
  careers_url  TEXT NOT NULL,
  headquarters VARCHAR(120)
);

CREATE TABLE company_preparation (
  id          SERIAL PRIMARY KEY,
  company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  section     VARCHAR(40) NOT NULL,   -- roles | eligibility | stages | technical | coding | aptitude | interview | hr | roadmap | resources | practice
  title       VARCHAR(120) NOT NULL,
  content     JSONB NOT NULL,         -- array of strings
  verification VARCHAR(20) NOT NULL DEFAULT 'guidance' CHECK (verification IN ('official','guidance','not_verified')),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (company_id, section)
);

-- ---------------------------------------------------------------------
-- Interviews
-- ---------------------------------------------------------------------
CREATE TABLE interview_questions (
  id           SERIAL PRIMARY KEY,
  bank         VARCHAR(20) NOT NULL CHECK (bank IN ('prep','mock')),
  category     VARCHAR(40) NOT NULL,    -- prep: dsa/oops/dbms/sql/os/cn/se/system-design/project/hr/etiquette ; mock: intro/technical/coding/project/hr
  track        VARCHAR(40),             -- mock only: java | fullstack | sde | data
  set_no       INTEGER,                 -- mock only: 1..4
  sort_order   INTEGER NOT NULL DEFAULT 0,
  difficulty   VARCHAR(10) NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  question     TEXT NOT NULL,
  model_answer TEXT NOT NULL,
  keywords     JSONB NOT NULL DEFAULT '[]'
);
CREATE INDEX idx_iq_bank ON interview_questions(bank, category);
CREATE INDEX idx_iq_track ON interview_questions(track, set_no);

CREATE TABLE mock_interviews (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track        VARCHAR(40) NOT NULL,
  set_no       INTEGER NOT NULL,
  status       VARCHAR(15) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  overall_score INTEGER,
  report       JSONB,
  evaluator    VARCHAR(20) NOT NULL DEFAULT 'rule-based',
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_mock_user ON mock_interviews(user_id);

CREATE TABLE mock_interview_responses (
  id            SERIAL PRIMARY KEY,
  interview_id  INTEGER NOT NULL REFERENCES mock_interviews(id) ON DELETE CASCADE,
  question_id   INTEGER NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
  answer        TEXT NOT NULL,
  score         INTEGER NOT NULL,
  feedback      JSONB NOT NULL,
  evaluator     VARCHAR(20) NOT NULL DEFAULT 'rule-based',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (interview_id, question_id)
);

-- ---------------------------------------------------------------------
-- Assessments
-- ---------------------------------------------------------------------
CREATE TABLE assessments (
  id           SERIAL PRIMARY KEY,
  slug         VARCHAR(80) NOT NULL UNIQUE,
  title        VARCHAR(150) NOT NULL,
  description  TEXT NOT NULL,
  category     VARCHAR(40) NOT NULL,
  duration_min INTEGER NOT NULL,
  pass_percent INTEGER NOT NULL DEFAULT 60
);

CREATE TABLE assessment_questions (
  id            SERIAL PRIMARY KEY,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  options       JSONB NOT NULL,
  answer_index  INTEGER NOT NULL,
  explanation   TEXT NOT NULL,
  topic         VARCHAR(60) NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_aq_assessment ON assessment_questions(assessment_id);

CREATE TABLE assessment_attempts (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  score         INTEGER NOT NULL,
  total         INTEGER NOT NULL,
  percent       INTEGER NOT NULL,
  passed        BOOLEAN NOT NULL,
  answers       JSONB NOT NULL,
  topic_breakdown JSONB NOT NULL,
  time_taken_s  INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_assess_attempts_user ON assessment_attempts(user_id);

-- ---------------------------------------------------------------------
-- Daily tracker, streaks & readiness
-- ---------------------------------------------------------------------
CREATE TABLE daily_goals (
  user_id                 INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  coding_problems         INTEGER NOT NULL DEFAULT 2  CHECK (coding_problems BETWEEN 0 AND 50),
  aptitude_questions      INTEGER NOT NULL DEFAULT 10 CHECK (aptitude_questions BETWEEN 0 AND 200),
  communication_exercises INTEGER NOT NULL DEFAULT 1  CHECK (communication_exercises BETWEEN 0 AND 20),
  lessons                 INTEGER NOT NULL DEFAULT 1  CHECK (lessons BETWEEN 0 AND 20),
  interview_questions     INTEGER NOT NULL DEFAULT 2  CHECK (interview_questions BETWEEN 0 AND 50),
  study_minutes           INTEGER NOT NULL DEFAULT 60 CHECK (study_minutes BETWEEN 10 AND 720),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per user per LOCAL calendar date (the student's own date, sent by the browser).
CREATE TABLE daily_activity_logs (
  id                        SERIAL PRIMARY KEY,
  user_id                   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_date             DATE NOT NULL,
  topics_studied            JSONB NOT NULL DEFAULT '[]',
  lessons_completed         INTEGER NOT NULL DEFAULT 0,
  coding_attempted          INTEGER NOT NULL DEFAULT 0,
  coding_solved             INTEGER NOT NULL DEFAULT 0,
  aptitude_attempted        INTEGER NOT NULL DEFAULT 0,
  aptitude_correct          INTEGER NOT NULL DEFAULT 0,
  communication_completed   INTEGER NOT NULL DEFAULT 0,
  interview_answered        INTEGER NOT NULL DEFAULT 0,
  assessments_completed     INTEGER NOT NULL DEFAULT 0,
  mock_interviews_attempted INTEGER NOT NULL DEFAULT 0,
  study_minutes             INTEGER NOT NULL DEFAULT 0,
  notes                     TEXT,
  last_heartbeat_at         TIMESTAMPTZ,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, activity_date)
);
CREATE INDEX idx_activity_user_date ON daily_activity_logs(user_id, activity_date);

CREATE TABLE study_streaks (
  user_id          INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak   INTEGER NOT NULL DEFAULT 0,
  longest_streak   INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE placement_readiness (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  breakdown   JSONB NOT NULL,
  calc_date   DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, calc_date)
);

CREATE TABLE user_bookmarks (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type   VARCHAR(30) NOT NULL CHECK (item_type IN ('coding_problem','lesson','project','company','video','aptitude_question')),
  item_id     INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_type, item_id)
);
CREATE INDEX idx_bookmarks_user ON user_bookmarks(user_id, item_type);
