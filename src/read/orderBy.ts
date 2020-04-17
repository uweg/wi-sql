import { WithInfo } from "../ready";
import { Model, Direction } from "../sql2";
import { applyMixins } from "../helper";
import { WithPaginate } from "./paginate";
import { ReadInfo, Read } from "./read";

export class WithOrderBy<
  TModel extends Model,
  T extends Model,
  TSelected extends Model
> extends WithInfo<TModel, ReadInfo<TModel>> {
  orderBy<
    TTable extends Extract<keyof T, string>,
    TColumn extends Extract<keyof T[TTable], string>
  >(
    table: TTable,
    column: TColumn,
    direction: Direction
  ): OrderBy<TModel, TSelected> {
    return new OrderBy(this.context, {
      ...this.info,
      orderBy: { table: table, column: column, direction: direction },
    });
  }
}

class OrderBy<TModel extends Model, TSelected extends Model> extends Read<
  TModel,
  TSelected
> {}
interface OrderBy<TModel extends Model, TSelected extends Model>
  extends WithPaginate<TModel, TSelected> {}
applyMixins(OrderBy, [WithPaginate]);
