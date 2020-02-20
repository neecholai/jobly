const db = require('../db');
const ExpressError = require('../helpers/expressError');
const sqlForPartialUpdate = require('../helpers/partialUpdate');

class Job {

  /**
   * create a new job
   * Returns { id, title, salary, equity, company_handle, date_posted }
   */

  static async create({ title, salary, equity, company_handle }) {

    console.log("TITLE", title);
    console.log("salary", salary);
    console.log("equity", equity);
    console.log("company_handle", company_handle);

    try {
      const result = await db.query(
        `INSERT INTO jobs
          (title, salary, equity, company_handle)
          VALUES ($1, $2, $3, $4)
          RETURNING id, title, salary, equity, company_handle, date_posted`,
        [title, salary, equity, company_handle]
      );

      const job = result.rows[0];

      return job;
    }

    catch (err) {
      console.log("ERROR", err);
      throw new ExpressError("Could not add new job", 400);
    }
  };

  /**
   * Get all jobs
   * (search (optional), min_salary (optional), min_equity (optional))
   * Returns [ { title, company_handle }, ... ]
   */

  static async getJobs({search, min_salary, min_equity}) {
    // Defaults for parameters if undefined.
    min_salary = min_salary || 0;
    min_equity = min_equity || 0;
    search = search || "";
    
    if (min_salary < 0 || 
        min_equity < 0 || 
        min_equity > 1) {
      throw new ExpressError('Please enter salary greater than 0 and equity between 0 and 1', 400);
    }

    const result = await db.query(
      `SELECT title, company_handle
        FROM jobs
        WHERE title ILIKE $1 
        AND salary >= $2 
        AND equity >= $3
        ORDER BY date_posted DESC`,
      [`%${search}%`, min_salary, min_equity]
    );

    const jobs = result.rows;

    return jobs;
  }

  /**
   * Get one job 
   * Returns { id, title, salary, equity, company_handle, date_posted, company { name, num_employees, description, logo_url } }
   * Throws error if job does not exist.
   */

  static async getJob(id) {

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle, date_posted, 
              name, num_employees, description, logo_url
        FROM jobs
        JOIN companies
        ON jobs.company_handle = companies.handle
        WHERE id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      throw new ExpressError("Job does not exist", 404);
    }

    const job = result.rows[0].map(job => ({
      id: job.id,
      title: job.title,
      salary: job.salary,
      equity: job.equity,
      company_handle: job.company_handle,
      date_posted: job.date_posted,
      company: {
        name: job.name,
        num_employees: job.num_employees,
        description: job.description,
        logo_url: job.logo_url
      }
    }));

    return job;
  }

  /**
   * Update values for job resource only for specified columns
   * Returns { id, title, salary, equity, company_handle, date_posted }
   * Throws error if company does not exist.
   */

  static async updateJob(id, items) {
    /* 
    Try to get job before updating job. If it doesn't exist, getJob
    will thrown an error.
    */
    await job.getJob(id);

    /*
    Update job only with columns/items that are passed in as arguments.
    sqlForPartialUpdate returcns "UPDATE" query for specified columns passed in,
    and 'values' is array of the values to be updated, and the id that we query by
    */
    try {
      const { query, values } = sqlForPartialUpdate("jobs", items, "id", id);
      const result = await db.query(query, values);
      const job = result.rows[0];

      return job;
    }
    catch (err) {
      throw new ExpressError('Invalid input', 400);
    }
  }

  /**
   * Delete job from jobs table
   * Returns success message: { message: "Job deleted" }
   * Throws error if job does not exist.
   */

  static async deleteJob(id) {

    const result = await db.query(`
    DELETE FROM jobs
    WHERE id=$1
    RETURNING id`,
      [id]);

    const job = result.rows[0]

    if (!job) {
      throw new ExpressError("Job does not exist", 404);
    }

    return { message: "Job deleted" }
  }
}

module.exports = Job;