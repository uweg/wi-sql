import { Model, Comparator } from "../sql";
import { WithInfo } from "../ready";
import { applyMixins } from "../helper";
import { WithSelect } from "./select";
import { WithWhere } from "./where";
import { ReadInfo } from "./read";
import { WithOr, OrWhere, WithOrWhere } from "./or";

export class WithJoin<TModel extends Model, T extends Model> extends WithInfo<
  TModel,
  ReadInfo<TModel>
> {
  innerJoin<
    TTableLeft extends Extract<keyof TModel, string>,
    TAs extends string
  >(
    tableLeft: TTableLeft,
    as: TAs,
    query: (
      query: WithOrWhere<TModel, T & { [table in TAs]: TModel[TTableLeft] }>
    ) => OrWhere<TModel, Model>
  ): Join<
    TModel,
    T &
      {
        [table in TAs]: TModel[TTableLeft];
      }
  > {
    const res = query(new WithOrWhere([]));

    return new Join(this.context, {
      ...this.info,
      join: [
        ...this.info.join,
        { tableLeft: tableLeft, as: as, type: "inner", where: res.getInfo() },
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
    query: (
      query: WithOrWhere<TModel, T & { [table in TAs]: TModel[TTableLeft] }>
    ) => OrWhere<TModel, Model>
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
    const res = query(new WithOrWhere([]));

    return new Join(this.context, {
      ...this.info,
      join: [
        ...this.info.join,
        {
          tableLeft: tableLeft,
          as: as,
          type: "left",
          where: res.getInfo(),
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
