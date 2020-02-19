process.env.NODE_ENV = 'test';
const sqlForPartialUpdate = require('../../helpers/partialUpdate');


describe("partialUpdate()", () => {
  let table;
  let items;
  let key;
  let keyVal;
  let col;

  beforeEach(() => {
    table = "users";
    key = "username";
    keyVal = "user1";
    col = "first_name";
    items = {
      _token: "test_token",
      [col]: "change1",
    }
  });

  it("should generate a proper partial update query with just 1 field",
      function () {
    let sql = sqlForPartialUpdate(table, items, key, keyVal);
    expect(sql).toEqual({
      query: `UPDATE ${table} SET ${col}=$1 WHERE ${key}=$2 RETURNING *`,
      values: [items.first_name, keyVal]
    })
  });

});
