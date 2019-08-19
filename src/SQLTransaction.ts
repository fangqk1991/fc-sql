import { FCDatabase } from './FCDatabase'

export class SQLTransaction {
  database: FCDatabase

  constructor(database: FCDatabase) {
    this.database = database
  }

  public async begin() {
    await this.database.update('BEGIN')
  }

  public async commit() {
    await this.database.update('COMMIT')
  }

  public async rollback() {
    await this.database.update('ROLLBACK')
  }
}
