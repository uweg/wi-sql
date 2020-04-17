import { IntColumn, StringColumn, ExtractColumnType } from "../src/access2";

export const model = {
  foo: {
    name: "t_foo",
    columns: { a: new IntColumn("c_a"), b: new StringColumn("c_b") },
  },
  bar: { name: "t_bar", columns: { one: new StringColumn("c_one") } },
};
