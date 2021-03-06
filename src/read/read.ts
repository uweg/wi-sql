import { Comparator, Direction, Model, ComparatorWithLike } from "../sql";
import { InfoBase, WithInfo } from "../ready";

type FromInfo = string;
type SelectInfo = { table: string; columns: string[] }[];
type JoinInfo<TModel extends Model> = ({
  tableLeft: string;
  as: string;
  columnLeft: string;
  comparator: Comparator;
  tableRight: string;
  columnRight: string;
} & (
  | {
      type: "inner";
    }
  | {
      type: "left";
      select: ReadInfo<TModel>;
    }
))[];
export type WhereInfo =
  | {
      type: "value";
      table: string;
      column: string;
      comparator: ComparatorWithLike;
      value: any;
    }
  | {
      type: "reference";
      table: string;
      column: string;
      comparator: Comparator;
      tableX: string;
      columnX: string;
    };
type OrderByInfo = {
  table: string;
  column: string;
  direction: Direction;
}[];
type DistinctInfo = boolean;
type PaginateInfo = { offset: number; limit: number } | null;

export class ReadInfo<TModel extends Model> extends InfoBase<TModel> {
  constructor(
    public from: FromInfo,
    public select: SelectInfo,
    public join: JoinInfo<TModel>,
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
}
