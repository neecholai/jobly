process.env.NODE_ENV = 'test';

const request = require('supertest');
const db = require('../../db');
const User = require('../../models/user');
const app = require('../../app');
const jwt = require('jsonwebtoken');
const {
  SECRET_KEY
} = require('../../config');

describe('user Routes', () => {
  let u1;

  beforeEach(async () => {
    await db.query(`DELETE FROM users`);

    u1 = await User.create({
      username: "user1",
      password: "password",
      first_name: "user",
      last_name: "one",
      email: "user1@email.com",
      photo_url: "https://recoverycafe.org/wp-content/uploads/2019/06/generic-user.png"
    });

    const {
      is_admin,
      ...u1Details
    } = u1;
    u1 = u1Details;
  });


  describe('GET /users', () => {
    it('should return all users if no parameters entered', async () => {
      const response = await request(app)
        .get("/users");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        users: [{
          username: u1.username,
          first_name: u1.first_name,
          last_name: u1.last_name,
          email: u1.email
        }]
      });
    });
  });


  describe('POST /users', () => {
    it('should create a user if inputs are valid', async () => {
      let u2 = {
        username: "user2",
        password: "password",
        first_name: "user",
        last_name: "two",
        email: "user2@email.com"
      };

      // response is a token
      const response = await request(app)
        .post("/users")
        .send(u2);

      // userdetails is user info
      const userDetails = await User.getUser(u2.username);
      const {
        password,
        ...u2Details
      } = u2;

      expect(userDetails).toEqual({
        ...u2Details,
        photo_url: null
      });
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({
        token: expect.any(String)
      });

    });

    it('should throw bad request error if user already exists', async () => {
      const response = await request(app)
        .post("/users")
        .send({
          ...u1,
          password: "password"
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Could not add new user');
    });
  });


  describe('GET /users/:username', () => {
    it('should return single user', async () => {
      const response = await request(app)
        .get(`/users/${u1.username}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        user: u1
      });
    });

    it('should throw an error if user does not exist', async () => {
      const response = await request(app)
        .get(`/users/none`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('User does not exist');
    });
  });


  describe('PATCH /users/:username', () => {

    let _token;

    beforeEach(async () => {
      let u1Payload = {
        username: u1.username,
        is_admin: false
      };
      _token = jwt.sign(u1Payload, SECRET_KEY);
    });

    it('should update user if input is valid and user is correct', async () => {
      const response = await request(app)
        .patch(`/users/${u1.username}`)
        .send({
          first_name: 'Tim',
          _token
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        user: {
          ...u1,
          first_name: 'Tim'
        }
      });

      const updatedUser = await User.getUser(u1.username);
      expect(updatedUser.first_name).toEqual(response.body.user.first_name);
    });

    it('should throw unauthorized user error if logged in user doesn\'t match patched user', async () => {
      let u2 = await User.create({
        username: "user2",
        password: "password",
        first_name: "user",
        last_name: "two",
        email: "user2@email.com"
      });

      const response = await request(app)
        .patch(`/users/${u2.username}`)
        .send({
          first_name: 'Tim',
          _token
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Unauthorized user');
    });

    // it('should throw an error if user does not exist', async () => {
    //   const response = await request(app)
    //     .patch(`/users/none`)
    //     .send({
    //       first_name: 'Tim',
    //       _token
    //     });

    // expect(response.statusCode).toBe(401);
    // expect(response.body.message).toBe('Unauthorized user');
    // });

    it('should throw an error if user name is already being used', async () => {
      let u2 = await User.create({
        username: "user2",
        password: "password",
        first_name: "user",
        last_name: "two",
        email: "user2@email.com"
      });

      const response = await request(app)
        .patch(`/users/${u1.username}`)
        .send({
          username: u2.username,
          _token
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Invalid input')
    });

    it('should throw an error if invalid input type', async () => {
      const response = await request(app)
        .patch(`/users/${u1.username}`)
        .send({
          first_name: 45,
          _token
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toEqual(["instance.first_name is not of a type(s) string"]);
    });
  });


  describe('DELETE /users/:username', () => {

    let _token;

    beforeEach(async () => {
      let u1Payload = {
        username: u1.username,
        is_admin: false
      };
      _token = jwt.sign(u1Payload, SECRET_KEY);
    });

    it('should delete user', async () => {
      const response = await request(app)
        .delete(`/users/${u1.username}`)
        .send({
          _token
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        message: "User deleted"
      });

      // check to ensure user does not exist after user deletion
      try {
        await User.getUser(u1.username);
      } catch (err) {
        expect(err.message).toBe('User does not exist');
      }
    });

    it('should throw unauthorized user error if logged in user doesn\'t match deleted user', async () => {
      let u2 = await User.create({
        username: "user2",
        password: "password",
        first_name: "user",
        last_name: "two",
        email: "user2@email.com"
      });

      const response = await request(app)
        .delete(`/users/${u2.username}`)
        .send({
          _token
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Unauthorized user');
    });

    // it('should throw an error if user does not exist', async () => {
    //   const response = await request(app)
    //     .delete(`/users/none`)
    //     .send({
    //       _token
    //     });

    //   expect(response.statusCode).toBe(401);
    //   expect(response.body.message).toBe('Unauthorized user');
    // });
  });
});

afterAll(async function () {
  await db.end();
});