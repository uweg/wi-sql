import { Model, Context } from "./sql2";
import { ReadInfo } from "./read/read";

export abstract class InfoBase<TModel extends Model> {}

export class WithInfo<TModel extends Model, TInfo extends InfoBase<TModel>> {
  constructor(protected context: Context<TModel>, protected info: TInfo) {}
}
