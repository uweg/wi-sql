import { WithFrom } from "./read/from";
import { applyMixins } from "./helper";
import { WithInsert } from "./create/insert";
import { WithDelete } from "./remove/delete";
import { WithUpdate } from "./update/_update";
import { ReadInfo } from "./read/read";
import { RemoveInfo } from "./remove/remove";
import { UpdateInfo } from "./update/update";

export type Entity = { [column: string]: any };
export type Model = { [table: string]: Entity };

export type Comparator = "=" | "<>" | "<" | ">";

export type Direction = "asc" | "desc";

export class Query<TModel extends Model> {
  constructor(protected context: Context<TModel>) {}
}
export interface Query<TModel extends Model>
  extends WithInsert<TModel>,
    WithDelete<TModel>,
    WithFrom<TModel>,
    WithUpdate<TModel> {}
applyMixins(Query, [WithFrom, WithInsert, WithDelete, WithUpdate]);

export function query<T extends Model>(context: Context<T>): Query<T> {
  return new Query(context);
}

export type Context<TModel extends Model> = {
  list: <TResult extends Model>(info: ReadInfo<TModel>) => Promise<TResult[]>;
  first: <TResult extends Model>(
    info: ReadInfo<TModel>
  ) => Promise<TResult | null>;
  count: (info: ReadInfo<TModel>) => Promise<number>;
  delete: (info: RemoveInfo<TModel>) => Promise<void>;
  update: (info: UpdateInfo<TModel>) => Promise<void>;
};

export function dummyContext<T extends Model>(): Context<T> {
  return {
    list: async () => [],
    first: async () => null,
    count: async () => 0,
    delete: async () => {},
    update: async () => {},
  };
}
