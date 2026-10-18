-- Client reviews shown on the site. Set hidden = 1 to take one down without deleting it.
CREATE TABLE IF NOT EXISTS reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  company    TEXT    NOT NULL DEFAULT '',
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text       TEXT    NOT NULL,
  ip_hash    TEXT    NOT NULL,
  hidden     INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_visible ON reviews (hidden, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_ip ON reviews (ip_hash, created_at);
