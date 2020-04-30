import { WithInfo } from "../ready";
import { RemoveInfo } from "./remove";
import { Model, Entity, Context } from "../sql";
import { WithWhere } from "./where";
import { applyMixins } from "../helper";

export class WithDelete<TModel extends Model> {
  constructor(protected context: Context<TModel>) {}
  delete<TTable extends Extract<keyof TModel, string>>(
    table: TTable
  ): Delete<TModel, TModel[TTable]> {
    return new Delete(this.context, new RemoveInfo(table, []));
  }
}

class Delete<TModel extends Model, TEntity extends Entity> extends WithInfo<
  TModel,
  RemoveInfo<TModel>
> {}
interface Delete<TModel extends Model, TEntity extends Entity>
  extends WithWhere<TModel, TEntity> {}
applyMixins(Delete, [WithWhere]);
