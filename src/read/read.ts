import { Comparator, Direction, Model } from "../sql2";
import { InfoBase, WithInfo } from "../ready";

type FromInfo = string;
type SelectInfo = { table: string; columns: string[] }[];
type JoinType = "inner" | "left";
type JoinInfo = {
  tableLeft: string;
  as: string;
  columnLeft: string;
  comparator: Comparator;
  tableRight: string;
  columnRight: string;
  type: JoinType;
}[];
export type WhereInfo = {
  table: string;
  column: string;
  comparator: Comparator;
  value: any;
};
type OrderByInfo = {
  table: string;
  column: string;
  direction: Direction;
} | null;
type DistinctInfo = boolean;
type PaginateInfo = { offset: number; limit: number } | null;

export class ReadInfo<TModel extends Model> extends InfoBase<TModel> {
  constructor(
    public from: FromInfo,
    public select: SelectInfo,
    public join: JoinInfo,
    public where: WhereInfo[][],
    public orderBy: OrderByInfo,
    public distinct: DistinctInfo,
    public paginate: PaginateInfo,
    public union: ReadInfo<TModel> | null
  ) {
    super();
  }
}

export class Read<
  TModel extends Model,
  TSelected extends Model
> extends WithInfo<TModel, ReadInfo<TModel>> {
  list(): Promise<TSelected[]> {
    return this.context.list<TSelected>(this.info);
  }

  first(): Promise<TSelected | null> {
    return this.context.first<TSelected>(this.info);
  }

  count(): Promise<number> {
    return this.context.count(this.info);
  }

  getInfo() {
    return this.info;
  }
}
