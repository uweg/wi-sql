import { WithInfo } from "../ready";
import { Model } from "../sql";
import { applyMixins } from "../helper";
import { WithOrderBy } from "./orderBy";
import { ReadInfo, Read } from "./read";

export class WithDistinct<
  TModel extends Model,
  T extends Model,
  TSelected extends Model
> extends WithInfo<TModel, ReadInfo<TModel>> {
  distinct(): Distinct<TModel, T, TSelected> {
    return new Distinct(this.context, { ...this.info, distinct: true });
  }
}

export class Distinct<
  TModel extends Model,
  T extends Model,
  TSelected extends Model
> extends Read<Model, TSelected> {}
export interface Distinct<
  TModel extends Model,
  T extends Model,
  TSelected extends Model
> extends WithOrderBy<TModel, TSelected> {}
applyMixins(Distinct, [WithOrderBy]);
