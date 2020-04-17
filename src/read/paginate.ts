import { WithInfo } from "../ready";
import { Model } from "../sql2";
import { ReadInfo, Read } from "./read";

export class WithPaginate<
  TModel extends Model,
  T extends Model
> extends WithInfo<TModel, ReadInfo<TModel>> {
  paginate(offset: number, limit: number): Paginate<TModel, T> {
    return new Paginate(this.context, {
      ...this.info,
      paginate: { offset: offset, limit: limit },
    });
  }
}

class Paginate<TModel extends Model, T extends Model> extends Read<TModel, T> {}
