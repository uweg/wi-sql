import { Model, Query } from "../sql";
import { Select } from "./select";
import { Read, ReadInfo } from "./read";
import { WithInfo } from "../ready";
import { WithOrderBy } from "./orderBy";
import { WithDistinct } from "./distinct";
import { applyMixins } from "../helper";

export class WithUnion<
  TModel extends Model,
  T extends Model,
  TSelected extends Model
> extends WithInfo<TModel, ReadInfo<TModel>> {
  union(
    query: (q: Query<TModel>) => Select<TModel, any, TSelected>
  ): Union<TModel, T, TSelected> {
    return new Union(this.context, {
      ...this.info,
      union: query(new Query(this.context)).getInfo(),
    });
  }
}

export class Union<
  TModel extends Model,
  T extends Model,
  TSelected extends Model
> extends Read<TModel, TSelected> {}
export interface Union<
  TModel extends Model,
  T extends Model,
  TSelected extends Model
> extends WithOrderBy<TModel, TSelected>, WithDistinct<TModel, T, TSelected> {}
applyMixins(Union, [WithOrderBy, WithDistinct]);
