import { Model, Comparator } from "../sql";
import { ReadInfo, WhereInfo } from "./read";
import { WithInfo } from "../ready";
import { Where } from "./where";
import { applyMixins } from "../helper";

class OrBase {
  constructor(protected info: WhereInfo[]) {}

  getInfo() {
    return this.info;
  }
}

export class WithOr<TModel extends Model, T extends Model> extends WithInfo<
  TModel,
  ReadInfo<TModel>
> {
  or(
    query: (query: WithWhere<TModel, T>) => OrWhere<TModel, Model>
  ): Where<TModel, T> {
    const res = query(new WithWhere([]));
    return new Where(this.context, {
      ...this.info,
      where: [...this.info.where, res.getInfo()],
    });
  }
}

class WithWhere<TModel extends Model, T extends Model> extends OrBase {
  where<
    TTable extends Extract<keyof T, string>,
    TColumn extends Extract<keyof T[TTable], string>
  >(
    table: TTable,
    column: TColumn,
    comparator: Comparator,
    value: T[TTable][TColumn]
  ): OrWhere<TModel, T> {
    return new OrWhere([
      ...this.info,
      {
        table: table,
        column: column,
        comparator: comparator,
        value: value,
      },
    ]);
  }
}

class OrWhere<TModel extends Model, T extends Model> extends OrBase {}
interface OrWhere<TModel extends Model, T extends Model>
  extends WithWhere<TModel, T> {}
applyMixins(OrWhere, [WithWhere]);
