import { Model, Comparator } from "../sql";
import { InfoBase, WithInfo } from "../ready";

type DeleteInfo = string;
type WhereInfo = { column: string; comparator: Comparator; value: any };

export class RemoveInfo<TModel extends Model> extends InfoBase<TModel> {
  constructor(public _delete: DeleteInfo, public where: WhereInfo[]) {
    super();
  }
}

export class Remove<TModel extends Model> extends WithInfo<
  TModel,
  RemoveInfo<TModel>
> {
  go(): Promise<void> {
    return this.context.delete(this.info);
  }

  getInfo() {
    return this.info;
  }
}
