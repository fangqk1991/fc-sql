import { FCDatabase, SQLAdder, SQLBulkAdder, SQLModifier, SQLRemover, SQLSearcher } from '../../src'
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

const globalSearcher = new SQLSearcher(database)
globalSearcher.setTable('demo_table')
globalSearcher.setColumns(['*'])

describe('Test SQL', () => {
  it(`Test FCDatabase`, async () => {
    await database.update('DELETE FROM demo_table')

    {
      const items = await database.query('SELECT * FROM demo_table')
      assert.ok(Array.isArray(items) && items.length === 0)
    }

    await database.update('INSERT INTO demo_table(key1, key2) VALUES(?, ?)', ['K1', 'K2'])
    await database.update('INSERT INTO demo_table(key1, key2) VALUES(?, ?)', ['K100', 'K2'])

    {
      const items = await database.query('SELECT * FROM demo_table')
      assert.ok(Array.isArray(items) && items.length === 2)
      assert.ok(items[0]['key1'] === 'K1' && items[0]['key2'] === 'K2')
      assert.ok(items[1]['key1'] === 'K100' && items[1]['key2'] === 'K2')
    }

    await database.update('UPDATE demo_table SET key2 = ? WHERE key1 = ?', ['K2-Changed', 'K1'])

    {
      const items = await database.query('SELECT * FROM demo_table')
      assert.ok(Array.isArray(items) && items.length === 2)
      assert.ok(items[0]['key1'] === 'K1' && items[0]['key2'] === 'K2-Changed')
      assert.ok(items[1]['key1'] === 'K100' && items[1]['key2'] === 'K2')
    }

    await database.update('DELETE FROM demo_table WHERE key1 = ?', ['K100'])

    {
      const items = await database.query('SELECT * FROM demo_table')
      assert.ok(Array.isArray(items) && items.length === 1)
      assert.ok(items[0]['key1'] === 'K1' && items[0]['key2'] === 'K2-Changed')
    }

    await database.update('DELETE FROM demo_table WHERE key1 = ?', ['K1'])

    {
      const items = await database.query('SELECT * FROM demo_table')
      assert.ok(Array.isArray(items) && items.length === 0)
    }
  })

  it(`Test SQLAdder`, async () => {
    const countBefore = await globalSearcher.queryCount()

    const count = 5
    for (let i = 0; i < count; ++i) {
      const data = {
        uid: 0,
        key1: `K1 - ${Math.random()}`,
        key2: `K2 - ${Math.random()}`,
      }
      const adder = new SQLAdder(database)
      adder.setTable('demo_table')
      adder.insertKV('key1', data.key1)
      adder.insertKV('key2', data.key2)
      data.uid = await adder.execute()
      console.error(`Last Insert ID: ${data.uid}`)
      const [newData] = await database.query('SELECT * FROM demo_table WHERE uid = ?', [data.uid])
      assert.equal(data.uid, newData.uid)
      assert.equal(data.key1, newData.key1)
      assert.equal(data.key2, newData.key2)

      const newKey1 = `K1 - ${Math.random()}`
      const newKey2 = `K2 - ${Math.random()}`
      const superAdder = new SQLAdder(database)
      superAdder.setTable('demo_table')
      superAdder.useUpdateWhenDuplicate()
      superAdder.insertKV('uid', newData.uid)
      superAdder.insertKV('key1', newKey1)
      superAdder.insertKV('key2', newKey2)
      await superAdder.execute()

      const [newData2] = await database.query('SELECT * FROM demo_table WHERE uid = ?', [newData.uid])
      assert.equal(newData2.uid, newData.uid)
      assert.equal(newData2.key1, newKey1)
      assert.equal(newData2.key2, newKey2)
    }

    const countAfter = await globalSearcher.queryCount()
    assert.ok(countBefore + count === countAfter)
  })

  it(`Test SQLBulkAdder`, async () => {
    const countBefore = await globalSearcher.queryCount()
    const count = 5
    {
      const bulkAdder = new SQLBulkAdder(database)
      bulkAdder.setTable('demo_table')
      bulkAdder.setInsertKeys(['key1', 'key2'])
      for (let i = 0; i < count; ++i) {
        bulkAdder.putObject({
          key1: `Bulk K1 - ${Math.random()}`,
          key2: `Bulk K2 - ${Math.random()}`,
        })
      }
      await bulkAdder.execute()
    }

    const countAfter = await globalSearcher.queryCount()
    assert.strictEqual(countBefore + count, countAfter)

    const feeds = await database.query(`SELECT * FROM demo_table ORDER BY uid DESC LIMIT ${count}`)
    const newDataList = feeds.map((feed) => {
      return {
        uid: feed['uid'],
        key1: `Dup K1 - ${Math.random()}`,
        key2: `Dup K2 - ${Math.random()}`,
      }
    })
    {
      const bulkAdder = new SQLBulkAdder(database)
      bulkAdder.setTable('demo_table')
      bulkAdder.useUpdateWhenDuplicate()
      bulkAdder.setInsertKeys(['uid', 'key1', 'key2'])
      newDataList.forEach((newData) => {
        bulkAdder.putObject(newData)
      })
      await bulkAdder.execute()
    }
    const countAfter2 = await globalSearcher.queryCount()
    assert.strictEqual(countAfter, countAfter2)

    for (const newData of newDataList) {
      const [newData2] = await database.query('SELECT * FROM demo_table WHERE uid = ?', [newData.uid])
      assert.equal(newData2.uid, newData.uid)
      assert.equal(newData2.key1, newData.key1)
      assert.equal(newData2.key2, newData.key2)
    }
  })

  it(`Test SQLModifier`, async () => {
    const dataBefore: any = await globalSearcher.querySingle()
    const modifier = new SQLModifier(database)
    modifier.setTable('demo_table')
    modifier.updateKV('key1', `K1 - Changed`)
    modifier.updateKV('key2', `K2 - Changed`)
    modifier.addConditionKV('uid', dataBefore['uid'])
    await modifier.execute()

    const searcher = new SQLSearcher(database)
    searcher.setTable('demo_table')
    searcher.setColumns(['uid', 'key1', 'key2'])
    searcher.addConditionKV('uid', dataBefore['uid'])
    const dataAfter: any = await searcher.querySingle()
    assert.ok(dataAfter['key1'] === `K1 - Changed`)
    assert.ok(dataAfter['key2'] === `K2 - Changed`)
  })

  it(`Test SQLRemover`, async () => {
    const countBefore = await globalSearcher.queryCount()

    const count = Math.floor(countBefore / 2)

    for (let i = 0; i < count; ++i) {
      const dataBefore: any = await globalSearcher.querySingle()
      const remover = new SQLRemover(database)
      remover.setTable('demo_table')
      remover.addConditionKV('uid', dataBefore['uid'])
      await remover.execute()

      const searcher = new SQLSearcher(database)
      searcher.setTable('demo_table')
      searcher.setColumns(['uid', 'key1', 'key2'])
      searcher.addConditionKV('uid', dataBefore['uid'])
      assert.ok((await searcher.queryCount()) === 0)
    }

    const countAfter = await globalSearcher.queryCount()
    assert.ok(countBefore - count === countAfter)
  })

  it(`Test SQLSearcher`, async () => {
    {
      const searcher = new SQLSearcher(database)
      searcher.setTable('demo_table')
      searcher.setColumns(['uid', 'key1', 'key2'])
      const count = await searcher.queryCount()
      const items = await searcher.queryList()
      assert.ok(Array.isArray(items))
      assert.ok(items.length === count)
    }
    {
      const searcher = new SQLSearcher(database)
      searcher.setTable('demo_table')
      searcher.setColumns([
        'demo_table.uid AS uid',
        'demo_table.key1 AS key1',
        'demo_table.key2 AS key2',
        'CONCAT(demo_table.key1, demo_table.key2) AS full_name',
      ])
      const count = await searcher.queryCount()
      const items = await searcher.queryList()
      assert.ok(Array.isArray(items))
      assert.ok(items.length === count)
    }
    {
      const searcher = new SQLSearcher(database)
      searcher.setTable('demo_table')
      searcher.setColumns(['*'])
      searcher.addOrderRule('IF(uid > ?, 1000, 0)', 'DESC', 16)
      const count = await searcher.queryCount()
      const items = await searcher.queryList()
      assert.ok(Array.isArray(items))
      assert.ok(items.length === count)
    }
  })
})

describe('Test Timezone', (): void => {
  it(`Test Timezone`, async (): Promise<void> => {
    const timezones = ['+00:00', '+08:00']
    for (const timezone of timezones) {
      console.log(`Timezone: ${timezone}`)
      const database = new FCDatabase()
      database.init({
        host: '127.0.0.1',
        port: 3306,
        dialect: 'mysql',
        database: 'demo_db',
        username: 'root',
        password: '',
        timezone: timezone,
        dialectOptions: {
          dateStrings: true,
        },
      })
      assert.ok((await database.timezone()) === timezone)
    }
  })
})
