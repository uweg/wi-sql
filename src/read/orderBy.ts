import { WithInfo } from "../ready";
import { Model, Direction } from "../sql";
import { applyMixins } from "../helper";
import { WithPaginate } from "./paginate";
import { ReadInfo, Read } from "./read";

export class WithOrderBy<
  TModel extends Model,
  TSelected extends Model
> extends WithInfo<TModel, ReadInfo<TModel>> {
  orderBy<
    TTable extends Extract<keyof TSelected, string>,
    TColumn extends Extract<keyof TSelected[TTable], string>
  >(
    table: TTable,
    column: TColumn,
    direction: Direction
  ): OrderBy<TModel, TSelected> {
    return new OrderBy(this.context, {
      ...this.info,
      orderBy: [
        ...this.info.orderBy,
        { table: table, column: column, direction: direction },
      ],
    });
  }
}

export class OrderBy<TModel extends Model, TSelected extends Model> extends Read<
  TModel,
  TSelected
> {}
export interface OrderBy<TModel extends Model, TSelected extends Model>
  extends WithPaginate<TModel, TSelected>,
    WithOrderBy<TModel, TSelected> {}
applyMixins(OrderBy, [WithPaginate, WithOrderBy]);
