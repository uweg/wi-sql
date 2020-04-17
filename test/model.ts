import { StringColumn } from "../src/access";

export const model = {
  foo: {
    name: "foo",
    columns: {
      a: new StringColumn("a", "a"),
      b: new StringColumn("b", "b"),
    },
  },
  bar: {
    name: "bar",
    columns: {
      one: new StringColumn("one", "one"),
      two: new StringColumn("two", "two"),
    },
  },
};
