import {FCDatabase} from './FCDatabase'

export interface DBProtocol {
  database(): FCDatabase;

  table(): string;

  primaryKey(): (string | string[]);

  cols(): string[];

  insertableCols(): string[];

  modifiableCols(): string[];
}
