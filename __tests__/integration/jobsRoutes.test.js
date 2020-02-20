process.env.NODE_ENV = 'test';

const request = require('supertest');
const db = require('../../db');
const Company = require('../../models/company');
const Job = require('../../models/job')
const app = require('../../app')


describe('Company Routes', () => {
  let c1;
  let j1;

  beforeEach(async () => {
    await db.query(`DELETE FROM jobs`)
    await db.query(`DELETE FROM companies`)

    c1 = await Company.create({
      handle: "apple",
      name: "Apple",
      num_employees: 3000,
      description: "Steve Jobs' lil' baby girl grow big now.",
      logo_url: "https://www.apple.com/ac/structured-data/images/knowledge_graph_logo.png"
    });

    j1 = await Job.create({
      title: "testJob1",
      salary: 1,
      equity: .4,
      company_handle: c1.handle
    });
  })

  describe('GET /jobs', () => {
    it('should return all jobs if no parameters entered', async () => {
      const response = await request(app)
        .get("/jobs");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        jobs: [{
          title: j1.title,
          company_handle: j1.company_handle
        }]
      })
    });

    it('should return only jobs that match the search query', async () => {
      let j2 = await Job.create({
        title: "testJob2",
        salary: 2,
        equity: .3,
        company_handle: c1.handle
      });

      // Should return only j1 when title matches title for j1
      let response = await request(app)
        .get(`/jobs?search=${j1.title}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        jobs: [{
          title: j1.title,
          company_handle: j1.company_handle
        }]
      });

      // Should only match jobs with salary greater than or equal to two
      response = await request(app)
        .get(`/jobs?min_salary=2`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        jobs: [{
          title: j2.title,
          company_handle: j2.company_handle
        }]
      });
    });
  });


  describe('POST /jobs', () => {
    it('should create a job if inputs are valid', async () => {
      let j2 = {
        title: "testJob2",
        salary: 2,
        equity: .3,
        company_handle: c1.handle
      }

      const response = await request(app)
        .post("/jobs")
        .send(j2);

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({
        job: {
          ...j2,
          id: expect.any(Number),
          date_posted: expect.any(String)
        }
      });
      expect(await Job.getJob(response.body.job.id)).toEqual({
        ...j2,
        id: expect.any(Number),
        date_posted: expect.any(Date),
        company: {
          name: c1.name,
          num_employees: c1.num_employees,
          description: c1.description,
          logo_url: c1.logo_url
        }
      });
    });

    it('should throw bad request error if company handle does not exist', async () => {
      let j2 = {
        title: "testJob2",
        salary: 2,
        equity: .3,
        company_handle: "fakeHandle"
      }

      const response = await request(app)
        .post("/jobs")
        .send(j2);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Could not add new job')
    });
  });


  describe('GET /jobs/:id', () => {
    it('should return a single job', async () => {
      const response = await request(app)
        .get(`/jobs/${j1.id}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        job: {
          ...j1,
          date_posted: expect.any(String),
          company: {
            name: c1.name,
            num_employees: c1.num_employees,
            description: c1.description,
            logo_url: c1.logo_url
          }
        }
      });
    });

    it('should throw an error if job does not exist', async () => {
      const response = await request(app)
        .get(`/jobs/0`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Job does not exist');
    });
  });


  describe('PATCH /jobs/:id', () => {
    it('should update job if input is valid', async () => {
      const response = await request(app)
        .patch(`/jobs/${j1.id}`)
        .send({
          title: "Accountant"
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        job: {
          id: j1.id,
          title: "Accountant",
          salary: j1.salary,
          equity: j1.equity,
          company_handle: j1.company_handle,
          date_posted: expect.any(String)
        }
      });
    });

    it('should throw an error if job does not exist', async () => {
      const response = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "fakeTitle"
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Job does not exist');
    });

    it('should throw an error if company name does not exist', async () => {
      const response = await request(app)
        .patch(`/jobs/${j1.id}`)
        .send({
          company_handle: "fakeHandle"
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Invalid input')
    });

    it('should throw an error if invalid input type - title must be a string', async () => {
      const response = await request(app)
        .patch(`/jobs/${j1.id}`)
        .send({
          title: 45
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toEqual(["instance.title is not of a type(s) string"]);
    });
  });


  describe('DELETE /jobs/:id', () => {
    it('should delete job', async () => {
      let response = await request(app)
        .delete(`/jobs/${j1.id}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        message: "Job deleted"
      });

      // check to ensure job does not exist after job deletion
      try {
        await Job.getJob(j1.id);
      } catch (err) {
        expect(err.message).toBe('Job does not exist');
      }
    });

    it('should throw an error if job does not exist', async () => {
      const response = await request(app)
        .delete(`/jobs/0`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toEqual("Job does not exist");
    });
  });
});

afterAll(async function () {
  await db.end();
});