import { Model } from "../sql2";
import { applyMixins } from "../helper";
import { WithInfo } from "../ready";
import { WithOrderBy } from "./orderBy";
import { WithDistinct } from "./distinct";
import { ReadInfo, Read } from "./read";
import { WithUnion } from "./union";

export class WithSelect<
  TModel extends Model,
  T extends Model,
  TSelected extends Model
> extends WithInfo<TModel, ReadInfo<TModel>> {
  select<
    TTable extends Extract<keyof Omit<T, keyof TSelected>, string>,
    TColumns extends Extract<keyof T[TTable], string>
  >(
    table: TTable,
    columns: TColumns[]
  ): Select<
    TModel,
    T,
    TSelected & { [table in TTable]: Pick<T[table], TColumns> }
  > {
    return new Select(this.context, {
      ...this.info,
      select: [...this.info.select, { table: table, columns: columns }],
    });
  }
}

export class Select<
  TModel extends Model,
  T extends Model,
  TSelected extends Model
> extends Read<TModel, TSelected> {}
export interface Select<
  TModel extends Model,
  T extends Model,
  TSelected extends Model
>
  extends WithSelect<TModel, T, TSelected>,
    WithOrderBy<TModel, TSelected>,
    WithDistinct<TModel, TSelected>,
    WithUnion<TModel, T, TSelected> {}

applyMixins(Select, [WithSelect, WithOrderBy, WithDistinct, WithUnion]);
