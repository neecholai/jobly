process.env.NODE_ENV = 'test';

const db = require('../../db');
const User = require('../../models/user');

describe('User Model', () => {
  let u1;

  beforeEach(async () => {
    await db.query(`DELETE FROM users`)

    u1 = await User.create({
      username: "user1",
      password: "password",
      first_name: "user",
      last_name: "one",
      email: "user1@email.com"
    })
  })

  describe('Create a new user', () => {
    it('should create a user if inputs are valid', async () => {
      let u2 = await User.create({
        username: "user2",
        password: "password",
        first_name: "user",
        last_name: "two",
        email: "user2@email.com"
      });
      expect(await User.getUser(u2.username)).toEqual(u2);
    });

    it('should throw bad request error if username already exists', async () => {
      try {
        await User.create(u1);
      } catch (err) {
        expect(err.message).toBe("Could not add new user");
      }
    });
  });

  describe('Get all users', () => {
    it('should return all users', async () => {
      let users = await User.getUsers();
      expect(users).toEqual([{
        username: u1.username,
        first_name: u1.first_name,
        last_name: u1.last_name,
        email: u1.email
      }]);
    });
  });

  describe('Get single user', () => {
    it('should return single user', async () => {
      let user = await User.getUser(u1.username);
      expect(user).toEqual(u1);
    });

    it('should throw an error if user does not exist', async () => {
      try {
        await User.getUser('none');
      } catch (err) {
        expect(err.message).toBe("User does not exist");
      }
    });
  });

  describe('Update user', () => {
    it('should update user if input is valid', async () => {
      const newFirstName = 'Tim';
      await User.updateUser(u1.username, {
        first_name: newFirstName
      });

      let updatedUser = await User.getUser(u1.username);
      expect(updatedUser.first_name).toEqual(newFirstName);
    });

    it('should throw an error if user does not exist', async () => {
      try {
        await User.updateUser('none', {
          first_name: 'Tim'
        });
      } catch (err) {
        expect(err.message).toBe("User does not exist");
      }
    });

    it('should throw an error if inputs are invalid - username must be unique', async () => {
      try {
        let u2 = await User.create({
          username: "user2",
          password: "password",
          first_name: "user",
          last_name: "two",
          email: "user2@email.com"
        });

        await User.updateUser(u2.username, {
          username: u1.username
        });
      } catch (err) {
        expect(err.message).toBe("Invalid input");
      }
    })
  });

  describe('Delete user', () => {
    it('should delete user - should not be able to access user after deletion', async () => {
      try {
        let result = await User.deleteUser(u1.username);

        expect(result).toEqual({
          message: "User deleted"
        });

        await User.getUser(u1.username);
      } catch (err) {
        expect(err.message).toBe("User does not exist");
      }
    });

    it('should throw an error if user does not exist', async () => {
      try {
        await User.deleteUser('none');
      } catch (err) {
        expect(err.message).toBe("User does not exist");
      }
    });
  });
});

afterAll(async function () {
  await db.end();
});