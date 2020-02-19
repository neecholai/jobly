
-- Create the table in the specified schema
CREATE TABLE companies
(
    handle TEXT PRIMARY KEY, -- primary key column
    name TEXT UNIQUE NOT NULL,
    num_employees INTEGER,
    description TEXT,
    logo_url TEXT
);