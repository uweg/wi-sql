import { Model, Context } from "../sql";
import { WithSelect } from "./select";
import { applyMixins } from "../helper";
import { WithInfo } from "../ready";
import { WithJoin } from "./join";
import { WithWhere } from "./where";
import { ReadInfo } from "./read";
import { WithOr } from "./or";

export class WithFrom<TModel extends Model> {
  constructor(protected context: Context<TModel>) {}

  from<TTable extends Extract<keyof TModel, string>>(
    table: TTable
  ): From<TModel, Pick<TModel, TTable>> {
    return new From(this.context, {
      from: table,
      distinct: false,
      join: [],
      orderBy: [],
      paginate: null,
      select: [],
      where: [],
      union: null,
    });
  }
}

class From<TModel extends Model, T extends Model> extends WithInfo<
  TModel,
  ReadInfo<TModel>
> {}
interface From<TModel, T extends Model>
  extends WithSelect<TModel, T, {}>,
    WithJoin<TModel, T>,
    WithWhere<TModel, T>,
    WithOr<TModel, T> {}

applyMixins(From, [WithSelect, WithJoin, WithWhere, WithOr]);
