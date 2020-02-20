process.env.NODE_ENV = 'test';

const db = require('../../db');
const Company = require('../../models/company');
const Job = require('../../models/job')

describe('Job Model', () => {
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

  describe('Create a new job', () => {
    it('should create a job if inputs are valid', async () => {
      let j2 = await Job.create({
        title: "testJob2",
        salary: 2,
        equity: .3,
        company_handle: c1.handle
      });
      expect(await Job.getJob(j2.id)).toEqual({
        ...j2,
        company: expect.any(Object)
      });
    });

    it('should throw bad request error if job already exists', async () => {
      try {
        await Job.create(j1);
      }
      catch (err) {
        expect(err.message).toBe("Could not add new job");
      }
    });
  });

  describe('Get all jobs', () => {
    it('should return all jobs if no parameters entered', async () => {
      let jobs = await Job.getJobs();
      expect(jobs).toEqual([{ title: j1.title, company_handle: j1.company_handle }]);
    });

    it('should return only jobs that match the search query', async () => {
      let j2 = await Job.create({
        title: "testJob2",
        salary: 2,
        equity: .3,
        company_handle: c1.handle
      });

      // should only return jobs with 'testJob1' in the title
      let jobs = await Job.getJobs("testJob1");
      expect(jobs).toEqual([{
        title: j1.title,
        company_handle: j1.company_handle
      }]);
      
      // should only return jobs with minimum salary of 2
      jobs = await Job.getJobs("", 2, 0);
      expect(jobs).toEqual([{
        title: j2.title,
        company_handle: j2.company_handle
      }]);
    });
  });

  describe('Get single job', () => {
    it('should return single job', async () => {
      let job = await Job.getJob(j1.id);
      expect(job).toEqual({
        ...j1,
        company: expect.any(Object)
      });
    });

    it('should throw an error if job does not exist', async () => {
      try {
        await Job.getJob(0);
      }
      catch (err) {
        expect(err.message).toBe("Job does not exist");
      }
    });
  });

  describe('Update job', () => {
    it('should update job if input is valid', async () => {
      const newTitle = 'Accountant';
      await Job.updateJob(j1.id, {
        title: newTitle
      });

      let updatedJob = await Job.getJob(j1.id);
      expect(updatedJob.title).toEqual(newTitle);
    });

    it('should throw an error if job does not exist', async () => {
      try {
        await Job.updateJob(0, {
          name: 'Accountant'
        });
      }
      catch (err) {
        expect(err.message).toBe("Job does not exist");
      }
    });

    it('should throw an error if inputs are invalid - company must exist', async () => {
      try {
        await Job.updateJob(j1.id, {
          company_handle: 'fakeHandle'
        });
      }
      catch (err) {
        expect(err.message).toBe("Invalid input");
      }
    })
  });

  describe('Delete job', () => {
    it('should delete job - should not be able to access job after deletion', async () => {
      try {
        let result = await Job.deleteJob(j1.id);

        expect(result).toEqual({ message: "Job deleted" });

        await Job.getJob(j1.id);
      }
      catch (err) {
        expect(err.message).toBe("Job does not exist");
      }
    });

    it('should throw an error if job does not exist', async () => {
      try {
        await Job.deleteJob(0);
      }
      catch (err) {
        expect(err.message).toBe("Job does not exist");
      }
    });
  });
});

afterAll(async function () {
  await db.end();
});