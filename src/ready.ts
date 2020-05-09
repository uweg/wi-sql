import { Model, Context } from "./sql";

export abstract class InfoBase<TModel extends Model> {}

export class WithInfo<TModel extends Model, TInfo extends InfoBase<TModel>> {
  constructor(protected context: Context<TModel>, public info: TInfo) {}
}
