import { WithInfo } from "../ready";
import { Model, Comparator, ComparatorWithLike } from "../sql";
import { WithSelect } from "./select";
import { applyMixins } from "../helper";
import { ReadInfo } from "./read";
import { WithOr } from "./or";

export class WithWhere<TModel extends Model, T extends Model> extends WithInfo<
  TModel,
  ReadInfo<TModel>
> {
  where<
    TTable extends Extract<keyof T, string>,
    TColumn extends Extract<keyof T[TTable], string>,
    TComparator extends T[TTable][TColumn] extends string | null
      ? ComparatorWithLike
      : Comparator
  >(
    table: TTable,
    column: TColumn,
    comparator: TComparator,
    value: T[TTable][TColumn]
  ): Where<TModel, T> {
    return new Where(this.context, {
      ...this.info,
      where: [
        ...this.info.where,
        [
          {
            type: "value",
            table: table,
            column: column,
            comparator: comparator,
            value: value,
          },
        ],
      ],
    });
  }

  xwhere<
    TTable extends Extract<keyof T, string>,
    TColumn extends Extract<keyof T[TTable], string>,
    TTableX extends Extract<keyof T, string>,
    TColumnX extends Extract<keyof T[TTableX], string>,
    TComparator extends TModel[TTable][TColumn] extends T[TTableX][TColumnX]
      ? Comparator
      : never
  >(
    table: TTable,
    column: TColumn,
    comparator: TComparator,
    tableX: TTableX,
    columnX: TColumnX
  ): Where<TModel, T> {
    return new Where(this.context, {
      ...this.info,
      where: [
        ...this.info.where,
        [
          {
            type: "reference",
            table: table,
            column: column,
            comparator: comparator,
            tableX: tableX,
            columnX: columnX,
          },
        ],
      ],
    });
  }
}

export class Where<TModel extends Model, T extends Model> extends WithInfo<
  TModel,
  ReadInfo<TModel>
> {}
export interface Where<TModel extends Model, T extends Model>
  extends WithSelect<TModel, T, {}>,
    WithWhere<TModel, T>,
    WithOr<TModel, T> {}
applyMixins(Where, [WithSelect, WithWhere, WithOr]);
