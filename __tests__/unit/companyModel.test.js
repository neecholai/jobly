process.env.NODE_ENV = 'test';

const db = require('../../db');
const Company = require('../../models/company');

describe('Company Model', () => {
  let c1;

  beforeEach(async () => {
    await db.query(`DELETE FROM companies`)

    c1 = await Company.create({
      handle: "apple",
      name: "Apple",
      num_employees: 3000,
      description: "Steve Jobs' lil' baby girl grow big now.",
      logo_url: "https://www.apple.com/ac/structured-data/images/knowledge_graph_logo.png"
    })
  })

  describe('Create a new company', () => {
    it('should create a company if inputs are valid', async () => {
      let c2 = await Company.create({
        handle: "tesla",
        name: "Tesla",
        num_employees: 2000,
        description: "Elon Musk's lil' baby boy is growing.",
        logo_url: "https://ih0.redbubble.net/image.815733429.5771/fposter,small,wall_texture,product,750x1000.u2.jpg"
      });
      expect(await Company.getCompany(c2.handle)).toEqual(c2);
    });

    it('should throw bad request error if company already exists', async () => {
      try {
        await Company.create(c1);
      }
      catch (err) {
        expect(err.message).toBe("Could not add new company");
      }
    });
  });

  describe('Get all companies', () => {
    it('should return all companies if no parameters entered', async () => {
      let companies = await Company.getCompanies();
      expect(companies).toEqual([{ handle: c1.handle, name: c1.name }]);
    });

    it('should return only companies that match the search query', async () => {
      let c2 = await Company.create({
        handle: "tesla",
        name: "Tesla",
        num_employees: 2000,
        description: "Elon Musk's lil' baby boy is growing.",
        logo_url: "https://ih0.redbubble.net/image.815733429.5771/fposter,small,wall_texture,product,750x1000.u2.jpg"
      });
      let companies = await Company.getCompanies("apple");
      expect(companies).toEqual([{
        handle: c1.handle,
        name: c1.name
      }]);

      companies = await Company.getCompanies("", 0, 2500);
      expect(companies).toEqual([{
        handle: c2.handle,
        name: c2.name
      }]);
    });
  });

  describe('Get single company', () => {
    it('should return single company', async () => {
      let company = await Company.getCompany(c1.handle);
      expect(company).toEqual(c1);
    });

    it('should throw an error if company does not exist', async () => {
      try {
        await Company.getCompany('none');
      }
      catch (err) {
        expect(err.message).toBe("Company does not exist");
      }
    });
  });

  describe('Update company', () => {
    it('should update company if input is valid', async () => {
      const newName = 'Big Apple';
      await Company.updateCompany(c1.handle, {
        name: newName
      });

      let updatedCompany = await Company.getCompany(c1.handle);
      expect(updatedCompany.name).toEqual(newName);
    });

    it('should throw an error if company does not exist', async () => {
      try {
        await Company.updateCompany('none', {
          name: 'Big Apple'
        });
      }
      catch (err) {
        expect(err.message).toBe("Company does not exist");
      }
    });

    it('should throw an error if inputs are invalid - name must be unique', async () => {
      try {
        let c2 = await Company.create({
          handle: "tesla",
          name: "Tesla",
          num_employees: 2000,
          description: "Elon Musk's lil' baby boy is growing.",
          logo_url: "https://ih0.redbubble.net/image.815733429.5771/fposter,small,wall_texture,product,750x1000.u2.jpg"
        });

        await Company.updateCompany(c1.handle, {
          name: c2.name
        });
      }
      catch (err) {
        expect(err.message).toBe("Invalid input");
      }
    })
  });

  describe('Delete company', () => {
    it('should delete company - should not be able to access company after deletion', async () => {
      try {
        let result = await Company.deleteCompany(c1.handle);

        expect(result).toEqual({ message: "Company deleted" });

        await Company.getCompany(c1.handle);
      }
      catch (err) {
        expect(err.message).toBe("Company does not exist");
      }
    });

    it('should throw an error if company does not exist', async () => {
      try {
        await Company.deleteCompany('none');
      }
      catch (err) {
        expect(err.message).toBe("Company does not exist");
      }
    });
  });
});

afterAll(async function () {
  await db.end();
});