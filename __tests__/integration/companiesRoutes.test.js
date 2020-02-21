process.env.NODE_ENV = 'test';

const request = require('supertest');
const db = require('../../db');
const Company = require('../../models/company');
const Job = require('../../models/job');
const User = require('../../models/user');
const app = require('../../app');
const jwt = require('jsonwebtoken');
const {
  SECRET_KEY
} = require('../../config');


describe('Company Routes', () => {
  let c1;

  beforeEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM users`);

    c1 = await Company.create({
      handle: "apple",
      name: "Apple",
      num_employees: 3000,
      description: "Steve Jobs' lil' baby girl grow big now.",
      logo_url: "https://www.apple.com/ac/structured-data/images/knowledge_graph_logo.png"
    });

    u1 = await User.create({
      username: "user1",
      password: "password",
      first_name: "user",
      last_name: "one",
      email: "user1@email.com",
      photo_url: "https://recoverycafe.org/wp-content/uploads/2019/06/generic-user.png"
    });

    let u1Payload = {
      username: u1.username,
      is_admin: true
    };
    _token = jwt.sign(u1Payload, SECRET_KEY);
  })


  describe('GET /companies', () => {
    it('should return all companies if no parameters entered', async () => {
      const response = await request(app)
        .get("/companies")
        .send({
          _token
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        companies: [{
          handle: c1.handle,
          name: c1.name
        }]
      })
    });

    it('should return only companies that match the search query', async () => {
      let c2 = await Company.create({
        handle: "tesla",
        name: "Tesla",
        num_employees: 2000,
        description: "Elon Musk's lil' baby boy is growing.",
        logo_url: "https://ih0.redbubble.net/image.815733429.5771/fposter,small,wall_texture,product,750x1000.u2.jpg"
      });

      let response = await request(app)
        .get(`/companies?search=${c1.name}`)
        .send({
          _token
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        companies: [{
          handle: c1.handle,
          name: c1.name
        }]
      });

      response = await request(app)
        .get(`/companies?max_employees=2500`)
        .send({
          _token
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        companies: [{
          handle: c2.handle,
          name: c2.name
        }]
      });
    });
  });


  describe('POST /companies', () => {
    it('should create a company if inputs are valid and user is admin', async () => {
      let c2 = {
        handle: "tesla",
        name: "Tesla"
      }

      const response = await request(app)
        .post("/companies")
        .send({
          ...c2,
          _token
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({
        company: {
          ...c2,
          num_employees: null,
          description: null,
          logo_url: null
        }
      });
      expect(await Company.getCompany(c2.handle)).toEqual({
        ...c2,
        num_employees: null,
        description: null,
        logo_url: null
      });
    });

    it('should throw unauthorized user error if user is not an admin', async () => {
      let c2 = {
        handle: "tesla",
        name: "Tesla"
      }

      u1Payload = {
        username: u1.username,
        is_admin: false
      };
      _token = jwt.sign(u1Payload, SECRET_KEY);

      const response = await request(app)
        .post("/companies")
        .send({
          ...c2,
          _token
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Unauthorized user')
    });

    it('should throw bad request error if company already exists', async () => {
      const response = await request(app)
        .post("/companies")
        .send({
          ...c1,
          _token
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Could not add new company')
    });
  });


  describe('GET /companies/:handle', () => {
    it('should return single company', async () => {
      const response = await request(app)
        .get(`/companies/${c1.handle}`)
        .send({
          _token
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        company: c1
      });
    });

    it('should throw an error if company does not exist', async () => {
      const response = await request(app)
        .get(`/companies/none`)
        .send({
          _token
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Company does not exist');
    });
  });


  describe('PATCH /companies/:handle', () => {
    it('should update company if input is valid and user is an admin', async () => {
      const response = await request(app)
        .patch(`/companies/${c1.handle}`)
        .send({
          name: 'Big Apple',
          _token
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        company: {
          handle: c1.handle,
          name: 'Big Apple',
          num_employees: c1.num_employees,
          description: c1.description,
          logo_url: c1.logo_url
        }
      });
    });

    it('should throw unauthorized user error if user is not an admin', async () => {
      u1Payload = {
        username: u1.username,
        is_admin: false
      };
      _token = jwt.sign(u1Payload, SECRET_KEY);

      const response = await request(app)
        .patch(`/companies/${c1.handle}`)
        .send({
          name: 'Big Apple',
          _token
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Unauthorized user')
    });

    it('should throw an error if company does not exist', async () => {
      const response = await request(app)
        .patch(`/companies/none`)
        .send({
          name: 'Big Apple',
          _token
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Company does not exist');
    });

    it('should throw an error if company name is already being used', async () => {
      let c2 = await Company.create({
        handle: "tesla",
        name: "Tesla"
      });

      const response = await request(app)
        .patch(`/companies/${c1.handle}`)
        .send({
          name: c2.name,
          _token
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Invalid input')
    });

    it('should throw an error if invalid input type', async () => {
      const response = await request(app)
        .patch(`/companies/${c1.handle}`)
        .send({
          name: 45,
          _token
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toEqual(["instance.name is not of a type(s) string"]);
    });
  });


  describe('DELETE /companies/:handle', () => {
    it('should delete company and associated jobs and user is an admin', async () => {
      const job = await Job.create({
        title: "jobtitle",
        salary: 2.00,
        equity: 0.5,
        company_handle: c1.handle
      });

      let response = await request(app)
        .delete(`/companies/${c1.handle}`)
        .send({
          _token
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        message: "Company deleted"
      });

      // check to ensure job does not exist after company deletion
      try {
        await Job.getJob(job.id);
      } catch (err) {
        expect(err.message).toBe('Job does not exist');
      }
    });

    it('should throw unauthorized user error if user is not an admin', async () => {
      u1Payload = {
        username: u1.username,
        is_admin: false
      };
      _token = jwt.sign(u1Payload, SECRET_KEY);

      let response = await request(app)
        .delete(`/companies/${c1.handle}`)
        .send({
          _token
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Unauthorized user');
    });

    it('should throw an error if company does not exist', async () => {
      const response = await request(app)
        .delete(`/companies/none`)
        .send({
          _token
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toEqual("Company does not exist");
    });
  });
});

afterAll(async function () {
  await db.end();
});