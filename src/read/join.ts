import { Model, Comparator } from "../sql";
import { WithInfo } from "../ready";
import { applyMixins } from "../helper";
import { WithSelect } from "./select";
import { WithWhere } from "./where";
import { ReadInfo, Read } from "./read";
import { WithOr, OrWhere, WithOrWhere } from "./or";
import { WithFrom } from "./from";

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
    TResult extends Model,
    TTableLeft extends Extract<keyof TResult, string>,
    TColumnLeft extends Extract<keyof TResult[TTableLeft], string>,
    TTableRight extends Extract<keyof T, string>,
    TColumnRight extends Extract<keyof T[TTableRight], string>,
    TComparator extends TResult[TTableLeft][TColumnLeft] extends T[TTableRight][TColumnRight]
      ? Comparator
      : never,
    TAs extends string
  >(
    query: (query: WithFrom<TModel>) => Read<TModel, TResult>,
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
    const res = query(new WithFrom(this.context));

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
          select: res.info,
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
