import { query, dummyContext } from "../src/sql2";

const context = dummyContext();

test("from", () => {
  expect(query(context).from("foo")).toHaveProperty("info", {
    from: "foo",
    select: [],
    join: [],
    where: [],
    orderBy: null,
    distinct: false,
    paginate: null,
    union: null,
  });
});

test("select", () => {
  expect(query(context).from("foo").select("foo", ["a"])).toHaveProperty(
    "info",
    {
      from: "foo",
      select: [{ table: "foo", columns: ["a"] }],
      join: [],
      where: [],
      orderBy: null,
      distinct: false,
      paginate: null,
      union: null,
    }
  );
});

test("innerJoin", () => {
  expect(
    query(context).from("foo").innerJoin("bar", "as", "one", "=", "foo", "b")
  ).toHaveProperty("info", {
    from: "foo",
    select: [],
    join: [
      {
        tableLeft: "bar",
        as: "as",
        columnLeft: "one",
        comparator: "=",
        tableRight: "foo",
        columnRight: "b",
        type: "inner",
      },
    ],
    where: [],
    orderBy: null,
    distinct: false,
    paginate: null,
    union: null,
  });
});

test("leftJoin", () => {
  expect(
    query(context).from("foo").leftJoin("bar", "as", "one", "=", "foo", "b")
  ).toHaveProperty("info", {
    from: "foo",
    select: [],
    join: [
      {
        tableLeft: "bar",
        as: "as",
        columnLeft: "one",
        comparator: "=",
        tableRight: "foo",
        columnRight: "b",
        type: "left",
      },
    ],
    where: [],
    orderBy: null,
    distinct: false,
    paginate: null,
    union: null,
  });
});

test("where", () => {
  expect(query(context).from("foo").where("foo", "a", "=", 1)).toHaveProperty(
    "info",
    {
      from: "foo",
      select: [],
      join: [],
      where: [{ table: "foo", column: "a", comparator: "=", value: 1 }],
      orderBy: null,
      distinct: false,
      paginate: null,
      union: null,
    }
  );
});

test("orderBy", () => {
  expect(
    query(context).from("foo").select("foo", ["a"]).orderBy("foo", "a", "asc")
  ).toHaveProperty("info", {
    from: "foo",
    select: [{ table: "foo", columns: ["a"] }],
    join: [],
    where: [],
    orderBy: { table: "foo", column: "a", direction: "asc" },
    distinct: false,
    paginate: null,
    union: null,
  });
});

test("distinct", () => {
  expect(
    query(context).from("foo").select("foo", ["a"]).distinct()
  ).toHaveProperty("info", {
    from: "foo",
    select: [{ table: "foo", columns: ["a"] }],
    join: [],
    where: [],
    orderBy: null,
    distinct: true,
    paginate: null,
    union: null,
  });
});

test("paginate", () => {
  expect(
    query(context)
      .from("foo")
      .select("foo", ["a"])
      .orderBy("foo", "a", "asc")
      .paginate(10, 5)
  ).toHaveProperty("info", {
    from: "foo",
    select: [{ table: "foo", columns: ["a"] }],
    join: [],
    where: [],
    orderBy: { table: "foo", column: "a", direction: "asc" },
    distinct: false,
    paginate: { offset: 10, limit: 5 },
    union: null,
  });
});

test("insert", () => {
  expect(query(context).insert("foo", { a: 1, b: "2" })).toHaveProperty(
    "info",
    {
      insert: {
        table: "foo",
        values: { a: 1, b: "2" },
      },
    }
  );
});

test("delete", () => {
  expect(query(context).delete("foo")).toHaveProperty("info", {
    _delete: "foo",
    where: [],
  });
});

test("delete where", () => {
  expect(query(context).delete("foo").where("a", "=", 1)).toHaveProperty(
    "info",
    {
      _delete: "foo",
      where: [{ column: "a", comparator: "=", value: 1 }],
    }
  );
});

test("update", () => {
  expect(query(context).update("foo", {})).toHaveProperty("info", {
    update: { table: "foo", values: {} },
    where: [],
  });
});

test("update where", () => {
  expect(
    query(context).update("foo", { b: "new" }).where("a", "=", 1)
  ).toHaveProperty("info", {
    update: { table: "foo", values: { b: "new" } },
    where: [{ column: "a", comparator: "=", value: 1 }],
  });
});
