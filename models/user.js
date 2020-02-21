const db = require('../db');
const ExpressError = require('../helpers/expressError');
const sqlForPartialUpdate = require('../helpers/partialUpdate');
const bcrypt = require('bcrypt');

class User {

  /**
   * create a new user
   * Returns { username, first_name, last_name, email, photo_url }
   */

  static async create({
    username,
    password,
    first_name,
    last_name,
    email,
    photo_url
  }) {

    try {
      const result = await db.query(
        `INSERT INTO users
          (username, password, first_name, last_name, email, photo_url)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING username, first_name, last_name, email, photo_url`,
        [username, password, first_name, last_name, email, photo_url]
      );

      const user = result.rows[0];

      return user;
    } catch (err) {
      throw new ExpressError("Could not add new user", 400);
    }
  };

  /**
   * Get all users
   * Returns [ { username, first_name, last_name, email }, ... ]
   */

  static async getUsers() {
    const result = await db.query(
      `SELECT username, first_name, last_name, email
        FROM users`
    );

    const users = result.rows;

    return users;
  }

  /**
   * Get one user 
   * Returns { username, first_name, last_name, email, photo_url }
   * Throws error if user does not exist.
   */

  static async getUser(username) {

    const result = await db.query(
      `SELECT username, first_name, last_name, email, photo_url
        FROM users
        WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      throw new ExpressError("User does not exist", 404);
    }

    return user;
  }

  /**
   * Update values for user resource only for specified columns
   * Returns { username, first_name, last_name, email, photo_url }
   * Throws error if user does not exist.
   */

  static async updateUser(username, items) {
    /* 
    Try to get user before updating user. If it doesn't exist, getUser
    will thrown an error.
    */
    await User.getUser(username);

    /*
    Update user only with columns/items that are passed in as arguments.
    sqlForPartialUpdate returcns "UPDATE" query for specified columns passed in,
    and 'values' is array of the values to be updated, and the username that we query by
    */
    try {
      const {
        query,
        values
      } = sqlForPartialUpdate("users", items, "username", username);
      const result = await db.query(query, values);
      const {
        password,
        is_admin,
        ...user
      } = result.rows[0];

      return user;
    } catch (err) {
      throw new ExpressError('Invalid input', 400);
    }
  }

  /**
   * Delete user from users table
   * Returns success message: { message: "User deleted" }
   * Throws error if user does not exist.
   */

  static async deleteUser(username) {

    const result = await db.query(`
    DELETE FROM users
    WHERE username=$1
    RETURNING username`,
      [username]);

    const user = result.rows[0]

    if (!user) {
      throw new ExpressError("User does not exist", 404);
    }

    return {
      message: "User deleted"
    }
  }

  /**
   * Authenticate if username/password is valid
   * Returns True if valid
   * Returns False if username does not exist or password does not match for user.
   */

  static async authenticate(username, password) {

    const result = await db.query(
      `SELECT password, is_admin
      FROM users
      WHERE username = $1`,
      [username]
    )

    const { password, is_admin } = result.rows;
    
    if (!hashedPassword) { return false };

    const isAuthenticated = await bcrypt.compare(password, hashedPassword);

    return isAuthenticated ? { isAuthenticated, is_admin } : false;
  }
}

module.exports = User;