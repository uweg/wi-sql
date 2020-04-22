import { IntColumn, StringColumn, ExtractColumnType, NullableStringColumn } from "../src/access2";

export const model = {
  foo: {
    name: "t_foo",
    columns: { a: new IntColumn("c_a"), b: new NullableStringColumn("c_b") },
  },
  bar: { name: "t_bar", columns: { one: new NullableStringColumn("c_one") } },
};
