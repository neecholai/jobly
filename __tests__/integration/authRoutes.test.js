process.env.NODE_ENV = 'test';

const request = require('supertest');
const db = require('../../db');
const User = require('../../models/user');
const app = require('../../app');

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


  describe('POST /login', () => {
    it('should login user if username and password are valid', async () => {
      const response = await request(app)
      .post('/login')
      .send({
        username: u1.username,
        password: "password"
      });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        token: expect.any(String)
      });
    });

    it('should throw error if username/password is invalid', async () => {
      const response = await request(app)
      .post('/login')
      .send({
        username: u1.username,
        password: 'bad password'
      });
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("invalid username or password");
    });
  });
});

afterAll(async function () {
  await db.end();
});