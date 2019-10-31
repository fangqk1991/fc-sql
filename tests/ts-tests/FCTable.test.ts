import { FCDatabase, DBTable } from "../../src"
import * as assert from 'assert'

const database = FCDatabase.getInstance()
database.init({
  host: '127.0.0.1',
  port: 3306,
  dialect: 'mysql',
  database: 'demo_db',
  username: 'root',
  password: '',
  timezone: '+00:00',
  // logging: false,
})

describe('Test FCTable', () => {
  it(`Test Normal`, async () => {
    {
      const table = new DBTable(database, 'nonexistent')
      assert.equal(await table.checkTableExists(), false)
    }

    const table = new DBTable(database, 'demo_table')
    assert.equal(await table.checkTableExists(), true)
    const columns = await table.getColumns()
    assert.ok(columns.length > 0)
  })

  it(`Test Create / Drop`, async () => {
    const testTableName = 'temp_table_1'
    const table = new DBTable(database, testTableName)
    await table.dropFromDatabase()
    assert.equal(await table.checkTableExists(), false)

    await table.createInDatabase()
    assert.equal(await table.checkTableExists(), true)

    const columns1 = await table.getColumns()
    assert.equal(columns1.length, 1)

    await table.addColumn('col_1', `INT`)
    await table.addColumn('col_2', `INT NOT NULL DEFAULT '0'`)

    const columns2 = await table.getColumns()
    assert.equal(columns1.length + 2, columns2.length)

    await table.dropColumn('col_2')
    const columns3 = await table.getColumns()
    assert.equal(columns2.length - 1, columns3.length)
  })
})
