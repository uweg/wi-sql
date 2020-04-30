import { Model, Entity, Context } from "../sql";
import { UpdateInfo } from "./update";
import { WithInfo } from "../ready";
import { WithWhere } from "./where";
import { applyMixins } from "../helper";

export class WithUpdate<TModel extends Model> {
  constructor(protected context: Context<TModel>) {}
  update<TTable extends Extract<keyof TModel, string>>(
    table: TTable,
    values: Partial<TModel[TTable]>
  ): _Update<TModel, TModel[TTable]> {
    return new _Update(
      this.context,
      new UpdateInfo({ table: table, values: values }, [])
    );
  }
}

class _Update<TModel extends Model, TEntity extends Entity> extends WithInfo<
  TModel,
  UpdateInfo<TModel>
> {}
interface _Update<TModel extends Model, TEntity extends Entity>
  extends WithWhere<TModel, TEntity> {}
applyMixins(_Update, [WithWhere]);
