import { Model, Context } from "../sql2";
import { CreateInfo, Create } from "./create";

export class WithInsert<TModel extends Model> {
  constructor(protected context: Context<TModel>) {}
  insert<TTable extends Extract<keyof TModel, string>>(
    table: TTable,
    values: TModel[TTable]
  ): Insert<TModel> {
    return new Insert(
      this.context,
      new CreateInfo<TModel>({ table: table, values: values })
    );
  }
}

class Insert<TModel extends Model> extends Create<TModel> {
  getInfo() {
    return this.info;
  }
}
