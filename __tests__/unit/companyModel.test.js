process.env.NODE_ENV = 'test';

const db = require('../../db');
const Company = require('../../models/company');
const ExpressError = require('../../helpers/expressError');

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

    it('should throw bad request error if company already exists', async() => {
      try {
        let c2 = await Company.create(c1);
      }
      catch(err) {
        expect(err.message).toBe("Could not add new company");
      }
    });
  });

  describe('Get all companies', () => {
    it('should return all companies if no parameters entered', async () => {
      let companies = await Company.getCompanies();
      expect(companies).toEqual([ { handle: c1.handle, name: c1.name }]);
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
      expect(companies).toEqual([ { handle: c1.handle, name: c1.name }]);
      
      companies = await Company.getCompanies("", 0, 2500);
      expect(companies).toEqual([ { handle: c2.handle, name: c2.name }]);
    });
  });

  

})

afterAll(async function () {
  await db.end();
});