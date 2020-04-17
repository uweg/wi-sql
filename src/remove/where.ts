import { Model, Comparator, Entity } from "../sql2";
import { Remove, RemoveInfo } from "./remove";
import { WithInfo } from "../ready";
import { applyMixins } from "../helper";

export class WithWhere<
  TModel extends Model,
  TEntity extends Entity
> extends WithInfo<TModel, RemoveInfo<TModel>> {
  where<TColumn extends Extract<keyof TEntity, string>>(
    column: TColumn,
    comparator: Comparator,
    value: TEntity[TColumn]
  ): Where<TModel, Omit<TEntity, TColumn>> {
    return new Where(this.context, {
      ...this.info,
      where: [
        ...this.info.where,
        { column: column, comparator: comparator, value: value },
      ],
    });
  }
}

class Where<TModel extends Model, TEntity extends Entity> extends Remove<
  TModel
> {}
interface Where<TModel extends Model, TEntity extends Entity>
  extends WithWhere<TModel, TEntity> {}
applyMixins(Where, [WithWhere]);
