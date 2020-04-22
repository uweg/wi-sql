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
  ): DeleteWhere<TModel, Omit<TEntity, TColumn>> {
    return new DeleteWhere(this.context, {
      ...this.info,
      where: [
        ...this.info.where,
        { column: column, comparator: comparator, value: value },
      ],
    });
  }
}

export class DeleteWhere<
  TModel extends Model,
  TEntity extends Entity
> extends Remove<TModel> {}
export interface DeleteWhere<TModel extends Model, TEntity extends Entity>
  extends WithWhere<TModel, TEntity> {}
applyMixins(DeleteWhere, [WithWhere]);
