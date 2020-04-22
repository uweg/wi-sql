import { query } from "../src/sql2";
import {
  listQuery,
  deleteQuery,
  insertQuery,
  updateQuery,
  access,
  Connection,
  countQuery,
} from "../src/access2";
import { model } from "./model2";

const connection: Connection = { query: async () => [] };

const context = access(model, connection);

test("select", () => {
  const res = query(context).from("bar").select("bar", ["one"]);

  expect(listQuery(res.getInfo(), model)).toEqual(
    `SELECT
  [bar].[c_one] AS [bar__one]
FROM 
  [t_bar] AS [bar]`
  );
});

test("join", () => {
  const res = query(context)
    .from("bar")
    .innerJoin("foo", "as", "b", "=", "bar", "one")
    .leftJoin("foo", "as2", "b", "=", "as", "b")
    .select("bar", ["one"])
    .select("as", ["a"]);

  expect(listQuery(res.getInfo(), model)).toEqual(
    `SELECT
  [bar].[c_one] AS [bar__one],
  [as].[c_a] AS [as__a]
FROM ((
  [t_bar] AS [bar]
  INNER JOIN [t_foo] AS [as] ON [as].[c_b] = [bar].[c_one])
  LEFT JOIN [t_foo] AS [as2] ON [as2].[c_b] = [as].[c_b])`
  );
});

test("where", () => {
  const req = query(context)
    .from("bar")
    .innerJoin("foo", "as", "b", "=", "bar", "one")
    .where("bar", "one", "<>", "value")
    .where("as", "a", "=", 1)
    .select("bar", ["one"]);

  expect(listQuery(req.getInfo(), model)).toEqual(`SELECT
  [bar].[c_one] AS [bar__one]
FROM (
  [t_bar] AS [bar]
  INNER JOIN [t_foo] AS [as] ON [as].[c_b] = [bar].[c_one])
WHERE
  [bar].[c_one] <> 'value'
  AND [as].[c_a] = 1`);
});

test("distinct", () => {
  const req = query(context).from("bar").select("bar", ["one"]).distinct();

  expect(listQuery(req.getInfo(), model)).toEqual(`SELECT DISTINCT
  [bar].[c_one] AS [bar__one]
FROM 
  [t_bar] AS [bar]`);
});

test("orderBy", () => {
  const req = query(context)
    .from("bar")
    .select("bar", ["one"])
    .orderBy("bar", "one", "desc");

  expect(listQuery(req.getInfo(), model)).toEqual(`SELECT * FROM (
SELECT
  [bar].[c_one] AS [bar__one]
FROM 
  [t_bar] AS [bar]
) ORDER BY [bar__one] DESC`);
});

test("paginate", () => {
  const req = query(context)
    .from("bar")
    .select("bar", ["one"])
    .orderBy("bar", "one", "desc")
    .paginate(10, 5);

  expect(listQuery(req.getInfo(), model)).toEqual(`SELECT * FROM (
SELECT TOP 5 * FROM (
SELECT TOP 15 * FROM (
SELECT
  [bar].[c_one] AS [bar__one]
FROM 
  [t_bar] AS [bar]
) ORDER BY [bar__one] DESC
) ORDER BY [bar__one] ASC
) ORDER BY [bar__one] DESC`);
});

test("delete", () => {
  const req = query(context)
    .delete("foo")
    .where("a", "=", 1)
    .where("b", "<>", "1");

  expect(deleteQuery(req.getInfo(), model)).toEqual(`DELETE FROM [t_foo]
WHERE
  [c_a] = 1
  AND [c_b] <> '1';`);
});

test("insert", () => {
  const req = query(context).insert("foo", {
    a: 1,
    b: "a",
  });

  expect(insertQuery(req.getInfo(), model)).toEqual(`INSERT INTO [t_foo] (
  [c_a],
  [c_b]
) VALUES (
  1,
  'a'
);`);
});

test("update", () => {
  const req = query(context)
    .update("foo", {
      a: 1,
      b: "d",
    })
    .where("b", "=", "a")
    .where("a", "=", 1);

  expect(updateQuery(req.getInfo(), model)).toEqual(`UPDATE [t_foo]
SET
  [c_a] = 1,
  [c_b] = 'd'
WHERE
  [c_b] = 'a'
  AND [c_a] = 1;`);
});

test("count", () => {
  const res = query(context).from("bar").select("bar", ["one"]);

  expect(countQuery(res.getInfo(), model)).toEqual(
    `SELECT COUNT(*) AS result FROM (
SELECT
  [bar].[c_one] AS [bar__one]
FROM 
  [t_bar] AS [bar]
)`
  );
});

test("union", () => {
  const res = query(context)
    .from("bar")
    .select("bar", ["one"])
    .union((q) => q.from("bar").select("bar", ["one"]));

  expect(listQuery(res.getInfo(), model)).toEqual(
    `SELECT
  [bar].[c_one] AS [bar__one]
FROM 
  [t_bar] AS [bar]
UNION (
SELECT
  [bar].[c_one] AS [bar__one]
FROM 
  [t_bar] AS [bar]
)`
  );
});
