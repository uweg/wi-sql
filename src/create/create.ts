import { Model } from "../sql2";
import { InfoBase, WithInfo } from "../ready";

type InsertInfo = { table: string; values: { [column: string]: any } };

export class CreateInfo<TModel extends Model> extends InfoBase<TModel> {
  constructor(public insert: InsertInfo) {
    super();
  }
}

export class Create<TModel extends Model> extends WithInfo<
  TModel,
  CreateInfo<TModel>
> {}
