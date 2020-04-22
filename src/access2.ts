import { Model, Context } from "./sql2";
import { ReadInfo } from "./read/read";
import { RemoveInfo } from "./remove/remove";
import { CreateInfo } from "./create/create";
import { UpdateInfo } from "./update/update";

export type Connection = {
  query: <T>(query: string) => Promise<T[]>;
};

export abstract class ColumnBase<T> {
  constructor(public name: string) {}

  abstract toSqlString(value: T): string;
}

export type ExtractColumnType<T> = T extends ColumnBase<infer X> ? X : never;

export class StringColumn extends ColumnBase<string> {
  toSqlString(value: string) {
    return `'${value.replace("'", "''")}'`;
  }
}

export class NullableStringColumn extends ColumnBase<string | null> {
  toSqlString(value: string | null) {
    return typeof value === "string" ? `'${value.replace("'", "''")}'` : "";
  }
}

export class IntColumn extends ColumnBase<number> {
  toSqlString(value: number) {
    return value.toString();
  }
}

type AccessInfo<T extends Model> = {
  [table in keyof T]: {
    name: string;
    columns: { [column in keyof T[table]]: ColumnBase<T[table][column]> };
  };
};

export type ExtractModel<T extends AccessInfo<any>> = {
  [table in keyof T]: {
    [column in keyof T[table]["columns"]]: ExtractColumnType<
      T[table]["columns"][column]
    >;
  };
};

export function access<T extends Model>(
  accessInfo: AccessInfo<T>,
  connection: Connection
): Context<T> {
  return {
    list: async (info: ReadInfo<T>) => {
      const query = listQuery(info, accessInfo);
      const result = await connection.query(query);
      return result.map((r) => map(r));
    },
    first: async <TResult>(info: ReadInfo<T>) => {
      const query = listQuery(info, accessInfo);
      const result = await connection.query<TResult>(query);
      return result.length > 0 ? map(result[0]) : null;
    },
    count: async (info: ReadInfo<T>) => {
      const query = countQuery(info, accessInfo);
      const result = await connection.query<{ result: number }>(query);
      return result[0].result;
    },
    delete: async (info: RemoveInfo<T>) => {
      const query = deleteQuery(info, accessInfo);
      await connection.query(query);
    },
  };
}

function map(input: any) {
  const result = {} as any;

  for (const key of Object.keys(input)) {
    const splitted = key.split("__");
    const table = splitted[0];
    if (result[table] === undefined) {
      result[table] = {};
    }

    const column = splitted[1];
    result[table][column] = input[key];
  }

  return result;
}

export function updateQuery<T extends Model>(
  info: UpdateInfo<T>,
  accessInfo: AccessInfo<T>
) {
  let result = `UPDATE [${accessInfo[info.update.table].name}]\nSET`;
  result += Object.keys(info.update.values)
    .map(
      (column) =>
        `\n  [${
          accessInfo[info.update.table].columns[column].name
        }] = ${accessInfo[info.update.table].columns[column].toSqlString(
          info.update.values[column]
        )}`
    )
    .join(",");

  const wheres = info.where.map((where) => {
    let r = `[${accessInfo[info.update.table].columns[where.column].name}] `;

    if (where.value === null) {
      r += `IS${where.comparator === "=" ? "" : " NOT"} NULL`;
    } else {
      r += `${where.comparator} ${accessInfo[info.update.table].columns[
        where.column
      ].toSqlString(where.value)}`;
    }

    return r;
  });

  result += `\nWHERE\n  ${wheres[0]}`;

  for (const where of wheres.slice(1)) {
    result += `\n  AND ${where}`;
  }

  result += ";";

  return result;
}

export function insertQuery<T extends Model>(
  info: CreateInfo<T>,
  accessInfo: AccessInfo<T>
) {
  let result = `INSERT INTO [${accessInfo[info.insert.table].name}] (`;
  result += Object.keys(info.insert.values)
    .map(
      (column) => `\n  [${accessInfo[info.insert.table].columns[column].name}]`
    )
    .join(",");

  result += `\n) VALUES (`;
  result += Object.keys(info.insert.values)
    .map(
      (column) =>
        `\n  ${accessInfo[info.insert.table].columns[column].toSqlString(
          info.insert.values[column]
        )}`
    )
    .join(",");

  result += `\n);`;

  return result;
}

export function deleteQuery<T extends Model>(
  info: RemoveInfo<T>,
  accessInfo: AccessInfo<T>
) {
  let result = `DELETE FROM [${accessInfo[info._delete].name}]\nWHERE`;

  const wheres = info.where.map((where) => {
    let r = `[${accessInfo[info._delete].columns[where.column].name}] `;

    if (where.value === null) {
      r += `IS${where.comparator === "=" ? "" : " NOT"} NULL`;
    } else {
      r += `${where.comparator} ${accessInfo[info._delete].columns[
        where.column
      ].toSqlString(where.value)}`;
    }

    return r;
  });

  result += `\n  ${wheres[0]}`;
  for (const where of wheres.slice(1)) {
    result += `\n  AND ${where}`;
  }

  result += ";";

  return result;
}

export function countQuery<T extends Model>(
  info: ReadInfo<T>,
  accessInfo: AccessInfo<T>
) {
  let result = listQuery(info, accessInfo);

  result = `SELECT COUNT(*) AS result FROM (
${result}
)`;

  return result;
}

export function listQuery<T extends Model>(
  info: ReadInfo<T>,
  accessInfo: AccessInfo<T>
) {
  // SELECT
  let result = `SELECT${info.distinct ? " DISTINCT" : ""}\n`;
  result += info.select
    .filter((s) => s.columns.length > 0)
    .map((s) =>
      s.columns
        .map((c) => {
          let table = s.table;
          const withAs = info.join.find((j) => j.as === table);
          if (withAs !== undefined) {
            table = withAs.tableLeft;
          }

          return `  [${s.table}].[${accessInfo[table].columns[c].name}] AS [${s.table}__${c}]`;
        })
        .join(",\n")
    )
    .join(",\n");
  result += "\n";

  // FROM
  result += `FROM ${info.join.map(() => "(").join("")}\n  [${
    accessInfo[info.from].name
  }] AS [${info.from}]`;

  // JOIN
  for (const join of info.join) {
    let table = join.tableRight;
    const withAs = info.join.find((j) => j.as === table);
    if (withAs !== undefined) {
      table = withAs.tableLeft;
    }

    result += `\n  ${join.type === "inner" ? "INNER" : "LEFT"} JOIN [${
      accessInfo[join.tableLeft].name
    }] AS [${join.as}] ON [${join.as}].[${
      accessInfo[join.tableLeft].columns[join.columnLeft].name
    }] ${join.comparator} [${join.tableRight}].[${
      accessInfo[table].columns[join.columnRight].name
    }])`;
  }

  // WHERE
  if (info.where.length > 0) {
    result += `\nWHERE`;

    const wheres = info.where.map((where) => {
      let table = where.table;
      const withAs = info.join.find((j) => j.as === table);
      if (withAs !== undefined) {
        table = withAs.tableLeft;
      }

      let r = `[${where.table}].[${
        accessInfo[table].columns[where.column].name
      }] `;

      if (where.value === null) {
        r += `IS${where.comparator === "=" ? "" : " NOT"} NULL`;
      } else {
        r += `${where.comparator} ${accessInfo[table].columns[
          where.column
        ].toSqlString(where.value)}`;
      }

      return r;
    });

    result += `\n  ${wheres[0]}`;
    for (const where of wheres.slice(1)) {
      result += `\n  AND ${where}`;
    }
  }

  if (info.union !== null) {
    result += `\nUNION (\n${listQuery(info.union, accessInfo)}\n)`;
  }

  if (info.orderBy !== null) {
    // PAGINATE
    if (info.paginate !== null) {
      result = `SELECT TOP ${info.paginate.limit} * FROM (
SELECT TOP ${info.paginate.offset + info.paginate.limit} * FROM (
${result}
) ORDER BY [${info.orderBy.table}__${info.orderBy.column}] ${
        info.orderBy.direction === "asc" ? "ASC" : "DESC"
      }
) ORDER BY [${info.orderBy.table}__${info.orderBy.column}] ${
        info.orderBy.direction === "asc" ? "DESC" : "ASC"
      }`;
    }

    // ORDER BY
    result = `SELECT * FROM (\n${result}\n) ORDER BY [${info.orderBy.table}__${
      info.orderBy.column
    }] ${info.orderBy.direction === "asc" ? "ASC" : "DESC"}`;
  }

  return result;
}
