type Connection = {
  query: <T>(query: string) => Promise<T[]>;
  count: (info: Ready<any>) => string;
  list: (info: Ready<any>) => string;
};

type Nullable<T> = { [key in keyof T]: T[key] | null };

export type Comparator = "=" | "<>";

export type Direction = "asc" | "desc";

type JoinType = "inner" | "left";

export abstract class ColumnBase<T> {
  constructor(public column: string) {}
}

export type Result<T extends Model> = {
  info: { [table in keyof T]: string };
  data: {
    [table in keyof T]: {
      [column in keyof T[table]["columns"]]: ExtractColumnType<
        T[table]["columns"][column]
      >;
    };
  }[];
};

export function ds<T extends Model>(model: T) {
  return function <T extends Model>(
    target: any,
    name: string,
    descriptor: TypedPropertyDescriptor<Ready<T>>
  ) {
    // return deserialize(model, {} as any);
  };
}

export type Model = {
  [table: string]: Entity;
};

export type Entity = {
  name: string;
  columns: { [column: string]: ColumnBase<any> };
};

export type Filter<TTable = any, TColumn = any, TValue = any> =
  | [TTable, TColumn, Comparator, TValue]
  | null;

export type Order<TTable = any, TColumn = any> = [TTable, TColumn, Direction];

type FromInfo = { table: string };

type JoinInfo = {
  leftTable: string;
  as: string | null;
  leftColumn: string;
  comparator: Comparator;
  rightTable: string;
  rightColumn: string;
  type: JoinType;
};

export type WhereInfo = {
  table: string;
  column: string;
  comparator: Comparator;
  value: any;
  tableTo: string | null;
  columnTo: string | null;
};

type SelectInfo = {
  table: string;
  columns: string[];
};

type OrderByInfo = {
  table: string;
  column: string;
  direction: Direction;
};

type PageInfo = {
  offset: number;
  limit: number;
};

export class Ready<TSelected extends Model> {
  constructor(
    public model: TSelected,
    public fromInfo: FromInfo,
    public joinInfo: JoinInfo[],
    public whereInfo: WhereInfo[],
    public selectInfo: SelectInfo[],
    public distinctInfo: boolean,
    public orderByInfo: OrderByInfo | null,
    public pageInfo: PageInfo | null,
    public unionInfo: Ready<TSelected> | null
  ) {}

  async count(connection: Connection): Promise<number> {
    const query = connection.count(this);
    console.log(query);
    const result = await connection.query<any>(query);

    return result[0].result;
  }

  async first(connection: Connection) {
    this.pageInfo = { offset: 0, limit: 1 };
    const item = await this.list(connection);

    return { info: item.info, data: item.data.find(() => true) || null };
  }

  async remoteList<T extends Model>(
    rpc: (query: Ready<TSelected>) => Promise<Result<T>[]>
  ): Promise<T> {
    return {} as any;
  }

  async list(connection: Connection): Promise<Result<TSelected>> {
    const data = [];

    if (this.pageInfo === null || this.pageInfo.limit > 0) {
      const query = connection.list(this);

      console.log(query);

      const result: any[] = await connection.query(query);

      for (const r of result) {
        const o = {} as any;
        this.selectInfo.map((s) => {
          const oo = {} as any;
          const as = this.joinInfo.find((j) => j.as === s.table);
          if (as !== undefined) {
            for (const c of s.columns) {
              oo[c] =
                r[`${s.table}__${this.model[as.leftTable].columns[c].column}`];
            }
          } else {
            for (const c of s.columns) {
              oo[c] =
                r[
                  `${this.model[s.table].name}__${
                    this.model[s.table].columns[c].column
                  }`
                ];
            }
          }

          o[s.table] = oo;
        });

        data.push(o);
      }
    }

    const info = {} as any;
    this.selectInfo.map((s) => {
      const as = this.joinInfo.find((j) => j.as === s.table);
      if (as !== undefined) {
        info[s.table] = as.leftTable;
      } else {
        info[s.table] = s.table;
      }
    });

    return { info: info, data: data };
  }
}

class Query<T extends Model> {
  constructor(private model: T) {}

  from<TTable extends Extract<keyof T, string>>(
    table: TTable
  ): From<T, Pick<T, TTable>> {
    return new From(this.model, { table: table }, []);
  }
}

export class From<T extends Model, TCurrent extends Model> extends Ready<
  TCurrent
> {
  constructor(model: T, fromInfo: FromInfo, joinInfo: JoinInfo[]) {
    super(
      (model as any) as TCurrent,
      fromInfo,
      joinInfo,
      [],
      [],
      false,
      null,
      null,
      null
    );
  }

  innerJoin<
    TTableLeft extends Extract<Exclude<keyof T, keyof TCurrent>, string>,
    TColumnLeft extends Extract<keyof T[TTableLeft]["columns"], string>,
    TTableRight extends Extract<keyof TCurrent, string>,
    TColumnRight extends Extract<
      keyof TCurrent[TTableRight]["columns"],
      string
    >,
    TComparator extends T[TTableLeft]["columns"][TColumnLeft] extends TCurrent[TTableRight]["columns"][TColumnRight]
      ? Comparator
      : never
  >(
    leftTable: TTableLeft,
    leftColumn: TColumnLeft,
    comparator: TComparator,
    rightTable: TTableRight,
    rightColumn: TColumnRight
  ): From<T, TCurrent & Pick<T, TTableLeft>> {
    return new From((this.model as any) as T, this.fromInfo, [
      ...this.joinInfo,
      {
        leftTable: leftTable,
        as: null,
        leftColumn: leftColumn,
        comparator: comparator,
        rightTable: rightTable,
        rightColumn: rightColumn,
        type: "inner",
      },
    ]);
  }

  innerJoinAs<
    TTableLeft extends Extract<keyof T, string>,
    TLeftAs extends string,
    TColumnLeft extends Extract<keyof T[TTableLeft]["columns"], string>,
    TTableRight extends Extract<keyof TCurrent, string>,
    TColumnRight extends Extract<
      keyof TCurrent[TTableRight]["columns"],
      string
    >,
    TComparator extends T[TTableLeft]["columns"][TColumnLeft] extends TCurrent[TTableRight]["columns"][TColumnRight]
      ? Comparator
      : never
  >(
    leftTable: TTableLeft,
    as: TLeftAs,
    leftColumn: TColumnLeft,
    comparator: TComparator,
    rightTable: TTableRight,
    rightColumn: TColumnRight
  ): From<T, TCurrent & { [table in TLeftAs]: T[TTableLeft] }> {
    return new From((this.model as any) as T, this.fromInfo, [
      ...this.joinInfo,
      {
        leftTable: leftTable,
        as: as,
        leftColumn: leftColumn,
        comparator: comparator,
        rightTable: rightTable,
        rightColumn: rightColumn,
        type: "inner",
      },
    ]);
  }

  leftJoin<
    TTableLeft extends Extract<Exclude<keyof T, keyof TCurrent>, string>,
    TColumnLeft extends Extract<keyof T[TTableLeft]["columns"], string>,
    TTableRight extends Extract<keyof TCurrent, string>,
    TColumnRight extends Extract<
      keyof TCurrent[TTableRight]["columns"],
      string
    >,
    TComparator extends T[TTableLeft]["columns"][TColumnLeft] extends TCurrent[TTableRight]["columns"][TColumnRight]
      ? Comparator
      : never
  >(
    leftTable: TTableLeft,
    leftColumn: TColumnLeft,
    comparator: TComparator,
    rightTable: TTableRight,
    rightColumn: TColumnRight
  ): From<
    T,
    TCurrent &
      {
        [table in TTableLeft]: {
          name: string;
          columns: Nullable<T[table]["columns"]>;
        };
      }
  > {
    return new From((this.model as any) as T, this.fromInfo, [
      ...this.joinInfo,
      {
        leftTable: leftTable,
        as: null,
        leftColumn: leftColumn,
        comparator: comparator,
        rightTable: rightTable,
        rightColumn: rightColumn,
        type: "left",
      },
    ]);
  }

  leftJoinAs<
    TTableLeft extends Extract<keyof T, string>,
    TLeftAs extends string,
    TColumnLeft extends Extract<keyof T[TTableLeft]["columns"], string>,
    TTableRight extends Extract<keyof TCurrent, string>,
    TColumnRight extends Extract<
      keyof TCurrent[TTableRight]["columns"],
      string
    >,
    TComparator extends T[TTableLeft]["columns"][TColumnLeft] extends TCurrent[TTableRight]["columns"][TColumnRight]
      ? Comparator
      : never
  >(
    leftTable: TTableLeft,
    as: TLeftAs,
    leftColumn: TColumnLeft,
    comparator: TComparator,
    rightTable: TTableRight,
    rightColumn: TColumnRight
  ): From<
    T,
    TCurrent &
      {
        [table in TLeftAs]: {
          name: string;
          columns: Nullable<T[TTableLeft]["columns"]>;
        };
      }
  > {
    return new From((this.model as any) as T, this.fromInfo, [
      ...this.joinInfo,
      {
        leftTable: leftTable,
        as: as,
        leftColumn: leftColumn,
        comparator: comparator,
        rightTable: rightTable,
        rightColumn: rightColumn,
        type: "left",
      },
    ]);
  }

  where<
    TTable extends Extract<keyof TCurrent, string>,
    TColumn extends Extract<keyof TCurrent[TTable]["columns"], string>
  >(
    table: TTable,
    column: TColumn,
    comparator: Comparator,
    value: ExtractColumnType<T[TTable]["columns"][TColumn]>
  ): Select<T, TCurrent, {}> {
    return new Select(
      (this.model as any) as T,
      this.fromInfo,
      this.joinInfo,
      [
        {
          table: table,
          column: column,
          comparator: comparator,
          value: value,
          tableTo: null,
          columnTo: null,
        },
      ],
      this.selectInfo
    );
  }

  whereTo<
    TTable extends Extract<keyof TCurrent, string>,
    TColumn extends Extract<keyof T[TTable]["columns"], string>,
    TTableTo extends Extract<keyof TCurrent, string>,
    TColumnTo extends Extract<keyof T[TTableTo]["columns"], string>,
    TComparator extends T[TTable]["columns"][TColumn] extends TCurrent[TTableTo]["columns"][TColumnTo]
      ? Comparator
      : never
  >(
    table: TTable,
    column: TColumn,
    comparator: TComparator,
    tableTo: TTableTo,
    columnTo: TColumnTo
  ): Select<T, TCurrent, {}> {
    return new Select(
      (this.model as any) as T,
      this.fromInfo,
      this.joinInfo,
      [
        {
          table: table,
          column: column,
          comparator: comparator,
          value: undefined,
          tableTo: tableTo,
          columnTo: columnTo,
        },
      ],
      this.selectInfo
    );
  }

  whereInternal(filter: Filter): Select<T, TCurrent, {}> {
    return new Select(
      this.model,
      this.fromInfo,
      this.joinInfo,
      [
        ...this.whereInfo,
        ...(filter === null
          ? []
          : [
              {
                table: filter[0],
                column: filter[1],
                comparator: filter[2],
                value: filter[3],
                tableTo: null,
                columnTo: null,
              },
            ]),
      ],
      this.selectInfo
    );
  }

  select<
    TTable extends Extract<keyof TCurrent, string>,
    TColumn extends Extract<keyof TCurrent[TTable]["columns"], string>
  >(
    table: TTable,
    columns: TColumn[]
  ): Select<
    T,
    TCurrent,
    {
      [table in TTable]: {
        name: string;
        columns: {
          [column in TColumn]: TCurrent[table]["columns"][column];
        };
      };
    }
  > {
    return new Select(
      (this.model as any) as TCurrent,
      this.fromInfo,
      this.joinInfo,
      [],
      [{ table: table, columns: columns }]
    );
  }
}

export class Select<
  T extends Model,
  TCurrent extends Model,
  TSelected extends Model
> extends Ready<TSelected> {
  constructor(
    model: TSelected,
    fromInfo: FromInfo,
    joinInfo: JoinInfo[],
    whereInfo: WhereInfo[],
    selectInfo: SelectInfo[]
  ) {
    super(
      model,
      fromInfo,
      joinInfo,
      whereInfo,
      selectInfo,
      false,
      null,
      null,
      null
    );
  }

  select<
    TTable extends Extract<Exclude<keyof TCurrent, keyof TSelected>, string>,
    TColumn extends Extract<keyof TCurrent[TTable]["columns"], string>
  >(
    table: TTable,
    columns: TColumn[]
  ): Select<
    T,
    TCurrent,
    TSelected &
      {
        [table in TTable]: {
          name: string;
          columns: {
            [column in TColumn]: T[table]["columns"][column];
          };
        };
      }
  > {
    return new Select(
      this.model,
      this.fromInfo,
      this.joinInfo,
      this.whereInfo,
      [...this.selectInfo, { table: table, columns: columns }]
    );
  }

  where<
    TTable extends Extract<keyof TCurrent, string>,
    TColumn extends Extract<keyof TCurrent[TTable]["columns"], string>
  >(
    table: TTable,
    column: TColumn,
    comparator: Comparator,
    value: ExtractColumnType<TCurrent[TTable]["columns"][TColumn]>
  ): Select<T, TCurrent, TSelected> {
    return new Select(
      this.model,
      this.fromInfo,
      this.joinInfo,
      [
        ...this.whereInfo,
        {
          table: table,
          column: column,
          comparator: comparator,
          value: value,
          tableTo: null,
          columnTo: null,
        },
      ],
      this.selectInfo
    );
  }

  whereTo<
    TTable extends Extract<keyof TCurrent, string>,
    TColumn extends Extract<keyof TCurrent[TTable]["columns"], string>,
    TTableTo extends Extract<keyof TCurrent, string>,
    TColumnTo extends Extract<keyof TCurrent[TTableTo]["columns"], string>,
    TComparator extends TCurrent[TTable]["columns"][TColumn] extends TCurrent[TTableTo]["columns"][TColumnTo]
      ? Comparator
      : never
  >(
    table: TTable,
    column: TColumn,
    comparator: TComparator,
    tableTo: TTableTo,
    columnTo: TColumnTo
  ): Select<T, TCurrent, {}> {
    return new Select(
      (this.model as any) as T,
      this.fromInfo,
      this.joinInfo,
      [
        {
          table: table,
          column: column,
          comparator: comparator,
          value: undefined,
          tableTo: tableTo,
          columnTo: columnTo,
        },
      ],
      this.selectInfo
    );
  }

  whereInternal(filter: Filter): Select<T, TCurrent, TSelected> {
    return new Select(
      this.model,
      this.fromInfo,
      this.joinInfo,
      [
        ...this.whereInfo,
        ...(filter === null
          ? []
          : [
              {
                table: filter[0],
                column: filter[1],
                comparator: filter[2],
                value: filter[3],
                tableTo: null,
                columnTo: null,
              },
            ]),
      ],
      this.selectInfo
    );
  }

  distinct(): Distinct<T, TSelected> {
    return new Distinct(
      this.model,
      this.fromInfo,
      this.joinInfo,
      this.whereInfo,
      this.selectInfo
    );
  }

  orderBy<
    TTable extends Extract<keyof TSelected, string>,
    TColumn extends Extract<keyof T[TTable]["columns"], string>
  >(table: TTable, columns: TColumn, direction: Direction): OrderBy<TSelected> {
    return new OrderBy(
      this.model,
      this.fromInfo,
      this.joinInfo,
      this.whereInfo,
      this.selectInfo,
      false,
      { table: table, column: columns, direction: direction },
      null
    );
  }

  orderByInternal(order: Order) {
    return this.orderBy(order[0], order[1], order[2]);
  }

  union<Tbla extends T>(
    items: Select<T, Tbla, TSelected>
  ): Union<TCurrent, TSelected> {
    return new Union(
      this.model,
      this.fromInfo,
      this.joinInfo,
      this.whereInfo,
      this.selectInfo,
      items
    );
  }
}

class Union<T extends Model, TSelected extends Model> extends Ready<TSelected> {
  constructor(
    model: TSelected,
    fromInfo: FromInfo,
    joins: JoinInfo[],
    whereInfo: WhereInfo[],
    selectInfo: SelectInfo[],
    unionInfo: Ready<TSelected>
  ) {
    super(
      model,
      fromInfo,
      joins,
      whereInfo,
      selectInfo,
      true,
      null,
      null,
      unionInfo
    );
  }

  orderBy<
    TTable extends Extract<keyof TSelected, string>,
    TColumn extends Extract<keyof T[TTable]["columns"], string>
  >(table: TTable, columns: TColumn, direction: Direction): OrderBy<TSelected> {
    return new OrderBy(
      this.model,
      this.fromInfo,
      this.joinInfo,
      this.whereInfo,
      this.selectInfo,
      true,
      { table: table, column: columns, direction: direction },
      this.unionInfo
    );
  }

  orderByInternal(order: Order) {
    return this.orderBy(order[0], order[1], order[2]);
  }
}

class Distinct<T extends Model, TSelected extends Model> extends Ready<
  TSelected
> {
  constructor(
    model: TSelected,
    fromInfo: FromInfo,
    joins: JoinInfo[],
    whereInfo: WhereInfo[],
    selectInfo: SelectInfo[]
  ) {
    super(
      model,
      fromInfo,
      joins,
      whereInfo,
      selectInfo,
      true,
      null,
      null,
      null
    );
  }

  orderBy<
    TTable extends Extract<keyof TSelected, string>,
    TColumn extends Extract<keyof T[TTable]["columns"], string>
  >(table: TTable, columns: TColumn, direction: Direction): OrderBy<TSelected> {
    return new OrderBy(
      this.model,
      this.fromInfo,
      this.joinInfo,
      this.whereInfo,
      this.selectInfo,
      true,
      { table: table, column: columns, direction: direction },
      this.unionInfo
    );
  }

  orderByInternal(order: Order) {
    return this.orderBy(order[0], order[1], order[2]);
  }
}

class OrderBy<TSelected extends Model> extends Ready<TSelected> {
  constructor(
    model: TSelected,
    fromInfo: FromInfo,
    joinInfo: JoinInfo[],
    whereInfo: WhereInfo[],
    selectInfo: SelectInfo[],
    distinctInfo: boolean,
    orderByInfo: OrderByInfo,
    unionInfo: Ready<TSelected> | null
  ) {
    super(
      model,
      fromInfo,
      joinInfo,
      whereInfo,
      selectInfo,
      distinctInfo,
      orderByInfo,
      null,
      unionInfo
    );
  }

  page(offset: number, limit: number): Page<TSelected> {
    return new Page(
      this.model,
      this.fromInfo,
      this.joinInfo,
      this.whereInfo,
      this.selectInfo,
      this.distinctInfo,
      this.orderByInfo,
      { offset: offset, limit: limit },
      this.unionInfo
    );
  }
}

class Page<TSelected extends Model> extends Ready<TSelected> {}

export type ExtractColumnType<T> = T extends null
  ? null
  : T extends ColumnBase<infer X>
  ? X
  : never;

export function query<T extends Model>(model: T): Query<T> {
  return new Query(model);
}

export type Serialized<T extends Model> = {
  type: "select";
  distinct: boolean;
  from: string;
  join: JoinInfo[];
  order: OrderByInfo | null;
  page: PageInfo | null;
  select: SelectInfo[];
  union: null | Serialized<T>;
  where: WhereInfo[];
};

export function serialize<T extends Model>(input: Ready<T>): Serialized<T> {
  return {
    type: "select",
    from: input.fromInfo.table,
    distinct: input.distinctInfo,
    join: input.joinInfo,
    order: input.orderByInfo,
    page: input.pageInfo,
    select: input.selectInfo,
    where: input.whereInfo,
    union: input.unionInfo === null ? null : serialize(input.unionInfo),
  };
}

export function deserialize<T extends Model>(
  model: T,
  input: Serialized<T>
): Ready<T> {
  return new Ready<T>(
    model,
    { table: input.from },
    input.join,
    input.where,
    input.select,
    input.distinct,
    input.order,
    input.page,
    input.union === null ? null : deserialize(model, input.union)
  );
}
