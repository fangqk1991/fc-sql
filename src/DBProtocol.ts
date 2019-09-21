import { FCDatabase } from './FCDatabase'

export interface DBProtocol {
  /**
   * @description Database instance
   */
  database(): FCDatabase;

  /**
   * @description A simple table name, such as 'student', or the union big table such as 'table_a INNER JOIN table_b'
   */
  table(): string;

  /**
   * @description Table's primary key, use a string for single-primary-key, use a map for multiple-primary-keys.
   */
  primaryKey(): (string | string[]);

  /**
   * @description Table's columns, pass the column name list which you show.
   */
  cols(): string[];

  /**
   * @description When an insert-sql execute, only columns in insertableCols() will be used.
   */
  insertableCols(): string[];

  /**
   * @description When an update-sql execute, only columns in modifiableCols() will be used.
   */
  modifiableCols(): string[];
}
