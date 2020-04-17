import { WithInfo } from "../ready";
import { Model, Comparator } from "../sql2";
import { WithSelect } from "./select";
import { applyMixins } from "../helper";
import { ReadInfo } from "./read";

export class WithWhere<TModel extends Model, T extends Model> extends WithInfo<
  TModel,
  ReadInfo<TModel>
> {
  where<
    TTable extends Extract<keyof T, string>,
    TColumn extends Extract<keyof T[TTable], string>
  >(
    table: TTable,
    column: TColumn,
    comparator: Comparator,
    value: T[TTable][TColumn]
  ): Where<TModel, T> {
    return new Where(this.context, {
      ...this.info,
      where: [
        ...this.info.where,
        { table: table, column: column, comparator: comparator, value: value },
      ],
    });
  }
}

class Where<TModel extends Model, T extends Model> extends WithInfo<
  TModel,
  ReadInfo<TModel>
> {}
interface Where<TModel extends Model, T extends Model>
  extends WithSelect<TModel, T, {}>,
    WithWhere<TModel, T> {}
applyMixins(Where, [WithSelect, WithWhere]);
