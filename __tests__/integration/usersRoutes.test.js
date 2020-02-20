process.env.NODE_ENV = 'test';

const request = require('supertest');
const db = require('../../db');
const User = require('../../models/user');
const app = require('../../app')


describe('user Routes', () => {
  let u1;

  beforeEach(async () => {
    await db.query(`DELETE FROM users`)

    u1 = await User.create({
      username: "user1",
      password: "password",
      first_name: "user",
      last_name: "one",
      email: "user1@email.com",
      photo_url: "https://recoverycafe.org/wp-content/uploads/2019/06/generic-user.png"
    })
  })


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
      })
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
      }

      

      const response = await request(app)
        .post("/users")
        .send(u2);

        const userDetails = await User.getUser(u2.username);

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({
        user: userDetails
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
      expect(response.body.message).toBe('Could not add new user')
    });
  });


  describe('GET /users/:username', () => {
    it('should return single user', async () => {
      const response = await request(app)
        .get(`/users/${u1.username}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ user: u1 });
    });

    it('should throw an error if user does not exist', async () => {
      const response = await request(app)
        .get(`/users/none`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('User does not exist');
    });
  });


  describe('PATCH /users/:username', () => {
    it('should update user if input is valid', async () => {
      const response = await request(app)
        .patch(`/users/${u1.username}`)
        .send({ first_name: 'Tim' });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        user: {
          ...u1,
          first_name: 'Tim'
        }
      });
    });

    it('should throw an error if user does not exist', async () => {
      const response = await request(app)
        .patch(`/users/none`)
        .send({ first_name: 'Tim' });

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('User does not exist');
    });

    it('should throw an error if user name is already being used', async () => {
      let u2 = await User.create({
        username: "user2",
        password: "password",
        first_name: "user",
        last_name: "two",
        email: "user2@email.com"
      });

      const response = await request(app)
        .patch(`/users/${u2.username}`)
        .send({ username: u1.username });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Invalid input')
    });

    it('should throw an error if invalid input type', async () => {
      const response = await request(app)
        .patch(`/users/${u1.username}`)
        .send({ first_name: 45 });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toEqual(["instance.first_name is not of a type(s) string"]);
    });
  });

  
  describe('DELETE /users/:username', () => {
    it('should delete user', async () => {
      let response = await request(app)
        .delete(`/users/${u1.username}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ message: "User deleted" });

      // check to ensure user does not exist after user deletion
      try {
        await User.getUser(u1.username);
      } 
      catch (err) {
        expect(err.message).toBe('User does not exist');
      }
    });

    it('should throw an error if user does not exist', async () => {
      const response = await request(app)
        .delete(`/users/none`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toEqual("User does not exist");
    });
  });
});

afterAll(async function () {
  await db.end();
});