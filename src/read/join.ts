import { Model, Comparator } from "../sql2";
import { WithInfo } from "../ready";
import { applyMixins } from "../helper";
import { WithSelect } from "./select";
import { WithWhere } from "./where";
import { ReadInfo } from "./read";
import { WithOr } from "./or";

export class WithJoin<TModel extends Model, T extends Model> extends WithInfo<
  TModel,
  ReadInfo<TModel>
> {
  innerJoin<
    TTableLeft extends Extract<keyof TModel, string>,
    TColumnLeft extends Extract<keyof TModel[TTableLeft], string>,
    TTableRight extends Extract<keyof T, string>,
    TColumnRight extends Extract<keyof T[TTableRight], string>,
    TComparator extends TModel[TTableLeft][TColumnLeft] extends T[TTableRight][TColumnRight]
      ? Comparator
      : never,
    TAs extends string
  >(
    tableLeft: TTableLeft,
    as: TAs,
    columnLeft: TColumnLeft,
    comparator: TComparator,
    tableRight: TTableRight,
    columnRight: TColumnRight
  ): Join<
    TModel,
    T &
      {
        [table in TAs]: TModel[TTableLeft];
      }
  > {
    return new Join(this.context, {
      ...this.info,
      join: [
        ...this.info.join,
        {
          tableLeft: tableLeft,
          as: as,
          columnLeft: columnLeft,
          comparator: comparator,
          tableRight: tableRight,
          columnRight: columnRight,
          type: "inner",
        },
      ],
    });
  }

  leftJoin<
    TTableLeft extends Extract<keyof TModel, string>,
    TColumnLeft extends Extract<keyof TModel[TTableLeft], string>,
    TTableRight extends Extract<keyof T, string>,
    TColumnRight extends Extract<keyof T[TTableRight], string>,
    TComparator extends TModel[TTableLeft][TColumnLeft] extends T[TTableRight][TColumnRight]
      ? Comparator
      : never,
    TAs extends string
  >(
    tableLeft: TTableLeft,
    as: TAs,
    columnLeft: TColumnLeft,
    comparator: TComparator,
    tableRight: TTableRight,
    columnRight: TColumnRight
  ): Join<
    TModel,
    T &
      {
        [table in TAs]: {
          [column in keyof TModel[TTableLeft]]:
            | TModel[TTableLeft][column]
            | null;
        };
      }
  > {
    return new Join(this.context, {
      ...this.info,
      join: [
        ...this.info.join,
        {
          tableLeft: tableLeft,
          as: as,
          columnLeft: columnLeft,
          comparator: comparator,
          tableRight: tableRight,
          columnRight: columnRight,
          type: "left",
        },
      ],
    });
  }
}

class Join<TModel extends Model, T extends Model> extends WithInfo<
  TModel,
  ReadInfo<TModel>
> {}
interface Join<TModel extends Model, T extends Model>
  extends WithJoin<TModel, T>,
    WithSelect<TModel, T, {}>,
    WithWhere<TModel, T>,
    WithOr<TModel, T> {}
applyMixins(Join, [WithJoin, WithSelect, WithWhere, WithOr]);
