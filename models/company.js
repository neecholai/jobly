const db = require('../db');
const ExpressError = require('../helpers/expressError');
const sqlForPartialUpdate = require('../helpers/partialUpdate');

class Company {

  /**
   * create a new company
   * Returns { handle, name, num_employees, description, logo_url }
   */

  static async create({ handle, name, num_employees, description, logo_url }) {


    try {
      const result = await db.query(
        `INSERT INTO companies
          (handle, name, num_employees, description, logo_url)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING handle, name, num_employees, description, logo_url`,
        [handle, name, num_employees, description, logo_url]
      );

      const company = result.rows[0];

      return company;
    }

    catch (err) {
      throw new ExpressError("Could not add new company", 400);
    }
  };

  /**
   * Get all companies
   * (search (optional), min_employees (optional), max_employees (optional))
   * Returns [ {handle, name} ... ]
   */

  static async getCompanies({search, min_employees, max_employees}) {
    
    // Max and minimum integers that SQL accepts.
    let maxInt = 2147483647;
    let minInt = 0;
    
    // Defaults for parameters if undefined.
    min_employees = min_employees || minInt;
    max_employees = max_employees || maxInt;
    search = search || "";
    
    if (min_employees > max_employees) {
      throw new ExpressError('Minimum employees cannot be greater than maximum employees', 400);
    }

    const result = await db.query(
      `SELECT handle, name
        FROM companies
        WHERE name ILIKE $1 
        AND num_employees >= $2 
        AND num_employees <= $3`,
      [`%${search}%`, min_employees, max_employees]
    );

    const companies = result.rows;

    return companies;
  }

  /**
   * Get one company 
   * Returns { handle, name, num_employees, description, logo_url }
   * Throws error if company does not exist.
   */

  static async getCompany(handle) {

    const result = await db.query(
      `SELECT handle, name, num_employees, description, logo_url
        FROM companies WHERE handle = $1`,
      [handle]
    );

    const company = result.rows[0]

    if (!company) {
      throw new ExpressError("Company does not exist", 404);
    }

    return company;
  }

  /**
   * Update values for company resource only for specified columns
   * Returns { handle, name, num_employees, description, logo_url }
   * Throws error if company does not exist.
   */

  static async updateCompany(handle, items) {
    /* 
    Try to get company before updating company. If it doesn't exist, getCompany
    will thrown an error.
    */
    await Company.getCompany(handle);

    /*
    Update company only with columns/items that are passed in as arguments.
    sqlForPartialUpdate returcns "UPDATE" query for specified columns passed in,
    and 'values' is array of the values to be updated, and the handle that we query by
    */
    try {
      const { query, values } = sqlForPartialUpdate("companies", items, "handle", handle);
      const result = await db.query(query, values);
      const company = result.rows[0];

      return company;
    }
    catch (err) {
      throw new ExpressError('Invalid input', 400);
    }
  }

  /**
   * Delete company from companies table
   * Returns success message: { message: "Company deleted" }
   * Throws error if company does not exist.
   */

  static async deleteCompany(handle) {

    const result = await db.query(`
    DELETE FROM companies
    WHERE handle=$1
    RETURNING handle`,
      [handle]);

    const company = result.rows[0]

    if (!company) {
      throw new ExpressError("Company does not exist", 404);
    }

    return { message: "Company deleted" }
  }
}

module.exports = Company;