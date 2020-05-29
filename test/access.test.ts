import { query } from "../src/sql";
import {
  listQuery,
  deleteQuery,
  insertQuery,
  updateQuery,
  access,
  Connection,
  countQuery,
  ExtractModel,
} from "../src/access";
import { model } from "./model";

const connection: Connection = { query: async () => [] };

const context = access(model, connection);

test("select", () => {
  const res = query(context).from("bar").select("bar", ["one"]);

  expect(listQuery(res.info, model)).toEqual(
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
    .leftJoin(
      (q) => q.from("foo").select("foo", ["b"]),
      "foo",
      "as2",
      "b",
      "=",
      "as",
      "b"
    )
    .select("bar", ["one"])
    .select("as", ["a"]);

  expect(listQuery(res.info, model)).toEqual(
    `SELECT
  [bar].[c_one] AS [bar__one],
  [as].[c_a] AS [as__a]
FROM ((
  [t_bar] AS [bar]
  INNER JOIN [t_foo] AS [as] ON [as].[c_b] = [bar].[c_one])
  LEFT JOIN(
    SELECT
      [foo].[c_b] AS [foo__b]
    FROM 
      [t_foo] AS [foo]
  ) AS [as2] ON [as2].[c_b] = [as].[c_b])`
  );
});

test("where", () => {
  const req = query(context)
    .from("bar")
    .innerJoin("foo", "as", "b", "=", "bar", "one")
    .where("bar", "one", "<>", "value")
    .where("as", "a", "=", 1)
    .select("bar", ["one"]);

  expect(listQuery(req.info, model)).toEqual(`SELECT
  [bar].[c_one] AS [bar__one]
FROM (
  [t_bar] AS [bar]
  INNER JOIN [t_foo] AS [as] ON [as].[c_b] = [bar].[c_one])
WHERE
  [bar].[c_one] <> 'value'
  AND [as].[c_a] = 1`);
});

test("wherex", () => {
  const req = query(context)
    .from("bar")
    .innerJoin("foo", "as", "b", "=", "bar", "one")
    .xwhere("bar", "one", "<>", "as", "b")
    .where("as", "a", "=", 1)
    .select("bar", ["one"]);

  expect(listQuery(req.info, model)).toEqual(`SELECT
  [bar].[c_one] AS [bar__one]
FROM (
  [t_bar] AS [bar]
  INNER JOIN [t_foo] AS [as] ON [as].[c_b] = [bar].[c_one])
WHERE
  [bar].[c_one] <> [as].[c_b]
  AND [as].[c_a] = 1`);
});

test("where null", () => {
  const req = query(context)
    .from("bar")
    .where("bar", "one", "=", null)
    .select("bar", ["one"]);

  expect(listQuery(req.info, model)).toEqual(`SELECT
  [bar].[c_one] AS [bar__one]
FROM 
  [t_bar] AS [bar]
WHERE
  [bar].[c_one] IS NULL`);
});

test("where like", () => {
  const req = query(context)
    .from("bar")
    .where("bar", "one", "like", "test")
    .select("bar", ["one"]);

  expect(listQuery(req.info, model)).toEqual(`SELECT
  [bar].[c_one] AS [bar__one]
FROM 
  [t_bar] AS [bar]
WHERE
  [bar].[c_one] ALIKE 'test'`);
});

test("or where", () => {
  const req = query(context)
    .from("foo")
    .or((q) => q.where("foo", "a", "=", 0).where("foo", "b", "=", "0"))
    .select("foo", ["a"]);

  expect(listQuery(req.info, model)).toEqual(`SELECT
  [foo].[c_a] AS [foo__a]
FROM 
  [t_foo] AS [foo]
WHERE
  ([foo].[c_a] = 0 OR [foo].[c_b] = '0')`);
});

test("distinct", () => {
  const req = query(context).from("bar").select("bar", ["one"]).distinct();

  expect(listQuery(req.info, model)).toEqual(`SELECT DISTINCT
  [bar].[c_one] AS [bar__one]
FROM 
  [t_bar] AS [bar]`);
});

test("orderBy", () => {
  const req = query(context)
    .from("foo")
    .select("foo", ["a", "b"])
    .orderBy("foo", "a", "asc")
    .orderBy("foo", "b", "desc");

  expect(listQuery(req.info, model)).toEqual(`SELECT * FROM (
SELECT
  [foo].[c_a] AS [foo__a],
  [foo].[c_b] AS [foo__b]
FROM 
  [t_foo] AS [foo])
ORDER BY [foo__a] ASC,  [foo__b] DESC`);
});

test("paginate", () => {
  const req = query(context)
    .from("bar")
    .innerJoin("foo", "as", "b", "=", "bar", "one")
    .select("as", ["a"])
    .orderBy("as", "a", "desc")
    .paginate(10, 5);

  expect(listQuery(req.info, model)).toEqual(`SELECT * FROM (
SELECT TOP 5 * FROM (
SELECT * FROM (
SELECT TOP 15 * FROM (
SELECT
  [as].[c_a] AS [as__a]
FROM (
  [t_bar] AS [bar]
  INNER JOIN [t_foo] AS [as] ON [as].[c_b] = [bar].[c_one])
ORDER BY [as].[c_a] DESC))
ORDER BY [as__a] ASC))
ORDER BY [as__a] DESC`);
});

test("delete", () => {
  const req = query(context)
    .delete("foo")
    .where("a", "=", 1)
    .where("b", "<>", null);

  expect(deleteQuery(req.info, model)).toEqual(`DELETE FROM [t_foo]
WHERE
  [c_a] = 1
  AND [c_b] IS NOT NULL;`);
});

test("insert", () => {
  const req = query(context).insert("foo", {
    a: 1,
    b: "a",
  });

  expect(insertQuery(req.info, model)).toEqual(`INSERT INTO [t_foo] (
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
    .where("b", "=", null)
    .where("a", "=", 1);

  expect(updateQuery(req.info, model)).toEqual(`UPDATE [t_foo]
SET
  [c_a] = 1,
  [c_b] = 'd'
WHERE
  [c_b] IS NULL
  AND [c_a] = 1;`);
});

test("count", () => {
  const res = query(context).from("bar").select("bar", ["one"]);

  expect(countQuery(res.info, model)).toEqual(
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

  expect(listQuery(res.info, model)).toEqual(
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
