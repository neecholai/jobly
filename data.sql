DROP TABLE jobs;
DROP TABLE companies;

-- Create the table in the specified schema
CREATE TABLE companies
(
    handle TEXT PRIMARY KEY, -- primary key column
    name TEXT UNIQUE NOT NULL,
    num_employees INTEGER,
    description TEXT,
    logo_url TEXT
);

CREATE TABLE jobs
(
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    salary FLOAT NOT NULL,
    equity FLOAT NOT NULL,
    company_handle TEXT NOT NULL REFERENCES companies (handle) ON DELETE CASCADE,
    date_posted TIMESTAMP WITH TIME ZONE
);