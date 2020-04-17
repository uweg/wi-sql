import { Ready, WhereInfo, ColumnBase } from "./sql";

abstract class AccessColumnBase<T> extends ColumnBase<T> {
  constructor(column: string, public name: string) {
    super(column);
  }

  abstract escapeValue(value: T): string;
}

export class StringColumn extends AccessColumnBase<string> {
  escapeValue(value: string) {
    if (typeof value !== "string") {
      throw "Not a string";
    }

    return `'${value}'`;
  }
}

export class IntColumn extends AccessColumnBase<number> {
  escapeValue(value: number) {
    if (!Number.isInteger(value)) {
      throw "Not an integer";
    }

    return value.toString();
  }
}

export class BooleanColumn extends AccessColumnBase<number> {
  escapeValue(value: number) {
    if (!Number.isInteger(value)) {
      throw "Not an integer";
    }

    return value.toString();
  }
}

export function count(info: Ready<any>) {
  let query = list(info);
  return `SELECT COUNT(*) AS result FROM (\n${query}\n)`;
}

export function list(info: Ready<any>) {
  let query = "SELECT ";

  if (info.distinctInfo === true) {
    query += "DISTINCT ";
  }

  if (info.selectInfo.length === 0) {
    query += "*";
  } else {
    query += info.selectInfo
      .map((s) => {
        const as = info.joinInfo.find((j) => j.as === s.table);
        if (as !== undefined) {
          return s.columns.map(
            (c) =>
              `${s.table}.${info.model[as.leftTable].columns[c].column} AS ${
                s.table
              }__${info.model[as.leftTable].columns[c].column}`
          );
        }

        return s.columns
          .map(
            (c) =>
              `${info.model[s.table].name}.${
                info.model[s.table].columns[c].column
              } AS ${info.model[s.table].name}__${
                info.model[s.table].columns[c].column
              }`
          )
          .join(", ");
      })
      .join(", ");
  }

  query += `\nFROM ${info.joinInfo.map(() => "(").join("")}${
    info.model[info.fromInfo.table].name
  }`;
  query += info.joinInfo
    .map((j) => {
      const as = info.joinInfo.find((jj) => jj.as === j.rightTable);
      return `\n${j.type === "inner" ? "INNER" : "LEFT"} JOIN ${
        info.model[j.leftTable].name
      }${j.as === null ? "" : " AS " + j.as} ON ${
        j.as === null ? info.model[j.leftTable].name : j.as
      }.${info.model[j.leftTable].columns[j.leftColumn].column} ${
        j.comparator
      } ${as === undefined ? info.model[j.rightTable].name : j.rightTable}.${
        info.model[as === undefined ? j.rightTable : as.leftTable].columns[
          j.rightColumn
        ].column
      })`;
    })
    .join("");

  function www(w: WhereInfo) {
    const as = info.joinInfo.find((j) => j.as === w.table);
    let result = `${as === undefined ? info.model[w.table].name : w.table}.${
      info.model[as === undefined ? w.table : as.leftTable].columns[w.column]
        .column
    } ${w.comparator} `;

    const tableTo = w.tableTo;
    const columnTo = w.columnTo;

    if (typeof tableTo === "string" && typeof columnTo === "string") {
      const asTo = info.joinInfo.find((j) => j.as === tableTo);
      result += `${asTo === undefined ? info.model[tableTo].name : tableTo}.${
        info.model[asTo === undefined ? tableTo : asTo.leftTable].columns[
          columnTo
        ].column
      }`;
    } else {
      result += info.model[as === undefined ? w.table : as.leftTable].columns[
        w.column
      ].escapeValue(w.value);
    }

    return result;
  }

  if (info.whereInfo.length > 0) {
    query += `\nWHERE ${www(info.whereInfo[0])}`;
    query += info.whereInfo
      .slice(1)
      .map((w) => {
        return `\nAND ${www(w)}`;
      })
      .join("");
  }

  if (info.unionInfo !== null) {
    const uc = list(info.unionInfo);
    query += `\nUNION\n${uc}`;
  }

  if (info.orderByInfo !== null) {
    let ob = "";
    const as = info.joinInfo.find((j) => j.as === info.orderByInfo?.table);
    if (as !== undefined) {
      ob = `${info.orderByInfo.table}__${
        info.model[as.leftTable].columns[info.orderByInfo.column].column
      }`;
    } else {
      ob = `${info.model[info.orderByInfo.table].name}__${
        info.model[info.orderByInfo.table].columns[info.orderByInfo.column]
          .column
      }`;
    }

    query = `SELECT * FROM (${query})`;

    if (info.pageInfo !== null) {
      query = `SELECT * FROM (\nSELECT TOP ${
        info.pageInfo.limit
      } * FROM (\nSELECT TOP ${
        info.pageInfo.offset + info.pageInfo.limit
      } * FROM (\n${query}\n ORDER BY ${ob} ${
        info.orderByInfo.direction === "asc" ? "ASC" : "DESC"
      }\n)) ORDER BY ${ob} ${
        info.orderByInfo.direction === "asc" ? "DESC" : "ASC"
      })`;
    }

    query += `\nORDER BY ${info.pageInfo === null ? ob : ob} ${
      info.orderByInfo.direction === "asc" ? "ASC" : "DESC"
    }`;
  }

  return query;
}
