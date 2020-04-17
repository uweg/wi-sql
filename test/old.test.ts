import { query } from "../src/sql";
import { model } from "./model";
import { list, count } from "../src/access";

test("from", () => {
  expect(list(query(model).from("foo"))).toEqual(`SELECT *
FROM foo`);
});

test("select", () => {
  expect(list(query(model).from("foo").select("foo", ["a"])))
    .toEqual(`SELECT foo.a AS foo__a
FROM foo`);
});

test("where", () => {
  expect(list(query(model).from("foo").where("foo", "a", "=", "value")))
    .toEqual(`SELECT *
FROM foo
WHERE foo.a = 'value'`);
});

test("distinct", () => {
  expect(list(query(model).from("foo").select("foo", ["a"]).distinct()))
    .toEqual(`SELECT DISTINCT foo.a AS foo__a
FROM foo`);
});

test("join", () => {
  expect(
    list(query(model).from("foo").innerJoin("bar", "one", "=", "foo", "a"))
  ).toEqual(`SELECT *
FROM (foo
INNER JOIN bar ON bar.one = foo.a)`);
});

test("order", () => {
  expect(
    list(
      query(model).from("foo").select("foo", ["a"]).orderBy("foo", "a", "asc")
    )
  ).toEqual(`SELECT * FROM (SELECT foo.a AS foo__a
FROM foo)
ORDER BY foo__a ASC`);
});

test("page", () => {
  expect(
    list(
      query(model)
        .from("foo")
        .select("foo", ["a"])
        .orderBy("foo", "a", "asc")
        .page(10, 5)
    )
  ).toEqual(`SELECT * FROM (
SELECT TOP 5 * FROM (
SELECT TOP 15 * FROM (
SELECT * FROM (SELECT foo.a AS foo__a
FROM foo)
 ORDER BY foo__a ASC
)) ORDER BY foo__a DESC)
ORDER BY foo__a ASC`);
});

test("count", () => {
  expect(count(query(model).from("bar")))
    .toEqual(`SELECT COUNT(*) AS result FROM (
SELECT *
FROM bar
)`);
});
