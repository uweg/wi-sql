import { Model, Comparator } from "../sql2";
import { InfoBase, WithInfo } from "../ready";

type _UpdateInfo = { table: string; values: { [column: string]: any } };
type WhereInfo = { column: string; comparator: Comparator; value: any };

export class UpdateInfo<TModel extends Model> extends InfoBase<TModel> {
  constructor(public update: _UpdateInfo, public where: WhereInfo[]) {
    super();
  }
}

export class Update<TModel extends Model> extends WithInfo<
  TModel,
  UpdateInfo<TModel>
> {
  getInfo() {
    return this.info;
  }

  go(): Promise<void> {
    return this.context.update(this.info);
  }
}
