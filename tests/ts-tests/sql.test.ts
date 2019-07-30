import { FCDatabase, SQLAdder, SQLModifier, SQLRemover, SQLSearcher } from "../../src"
import * as assert from "assert"
import moment = require("moment")

const database = FCDatabase.getInstance()
database.init({
  host: '127.0.0.1',
  port: '3306',
  dialect: 'mysql',
  database: 'demo_db',
  username: 'root',
  password: '',
  timezone: '+00:00'
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
      const adder = new SQLAdder(database)
      adder.setTable('demo_table')
      adder.insertKV('key1', `K1 - ${Math.random()}`)
      adder.insertKV('key2', `K2 - ${Math.random()}`)
      await adder.execute()
    }

    const countAfter = await globalSearcher.queryCount()
    assert.ok(countBefore + count === countAfter)
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
      assert.ok(await searcher.queryCount() === 0)
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
        'CONCAT(demo_table.key1, demo_table.key2) AS full_name'
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
        port: '3306',
        dialect: 'mysql',
        database: 'demo_db',
        username: 'root',
        password: '',
        timezone: timezone,
        dialectOptions: {
          dateStrings: true
        }
      })
      assert.ok((await database.timezone()) === timezone)
    }
  })

  it(`Test Exact Timezone `, async (): Promise<void> => {
    const database = new FCDatabase()
    database.init({
      host: '127.0.0.1',
      port: '3306',
      dialect: 'mysql',
      database: 'demo_db',
      username: 'root',
      password: '',
      timezone: '+00:00',
      dialectOptions: {
        dateStrings: true
      }
    })

    const createTs = moment().unix()
    const curTime = moment(createTs * 1000).utc().format('YYYY-MM-DD HH:mm:ss')
    const key1 = `K1 - ${Math.random()}`
    const key2 = `K2 - ${Math.random()}`

    const adder = new SQLAdder(database)
    adder.setTable('demo_table')
    adder.insertKV('key1', key1)
    adder.insertKV('key2', key2)
    adder.insertKV('create_ts', curTime)
    await adder.execute()

    const searcher = new SQLSearcher(database)
    searcher.setTable('demo_table')
    searcher.setColumns(['*'])
    searcher.addConditionKV('key1', key1)
    searcher.addConditionKV('key2', key2)
    const result = (await searcher.querySingle()) as any
    assert.ok(result['create_ts'], curTime)

    const createTs2 = moment.utc(curTime).unix()
    assert.ok(createTs === createTs2)
  })
})
