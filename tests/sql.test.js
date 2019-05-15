const FCDatabase = require('../FCDatabase')
const SQLAdder = require('../SQLAdder')
const SQLModifier = require('../SQLModifier')
const SQLRemover = require('../SQLRemover')
const SQLSearcher = require('../SQLSearcher')
const DBTools = require('../DBTools')
const DBProtocol = require('../DBProtocol')
const assert = require('assert')

const database = FCDatabase.getInstance()
database.init({
  host: '127.0.0.1',
  port: '3306',
  dialect: 'mysql',
  database: 'demo_db',
  username: 'root',
  password: '',
  timezone: '+08:00',
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
    const dataBefore = await globalSearcher.querySingle()
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
    const dataAfter = await searcher.querySingle()
    assert.ok(dataAfter['key1'] === `K1 - Changed`)
    assert.ok(dataAfter['key2'] === `K2 - Changed`)
  })

  it(`Test SQLRemover`, async () => {
    const countBefore = await globalSearcher.queryCount()

    const count = Math.floor(countBefore / 2)

    for (let i = 0; i < count; ++i) {
      const dataBefore = await globalSearcher.querySingle()
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
    const searcher = new SQLSearcher(database)
    searcher.setTable('demo_table')
    searcher.setColumns(['uid', 'key1', 'key2'])
    const count = await searcher.queryCount()
    const items = await searcher.queryList()
    assert.ok(Array.isArray(items))
    assert.ok(items.length === count)
  })

  it(`Test DBTools`, async () => {
    class MyProtocol extends DBProtocol {
      database() {
        return database
      }
      table() {
        return 'demo_table'
      }
      primaryKey() {
        return 'uid'
      }
      cols() {
        return [
          'uid',
          'key1',
          'key2',
        ]
      }
      modifiableCols() {
        return [
          'key1',
          'key2',
        ]
      }
    }

    const tools = new DBTools(new MyProtocol())
    const countBefore = await tools.fetchCount({})

    const count = 5
    for (let i = 0; i < count; ++i) {
      await tools.add({
        key1: `K1 - ${Math.random()}`,
        key2: `K2 - ${Math.random()}`,
      })
    }

    const countAfter = await tools.fetchCount({})
    assert.ok(countBefore + count === countAfter)

    const items = await tools.fetchList({}, -1)
    const watchUID = items[0]['uid']
    const feed = await tools.searchSingle({
      uid: watchUID
    })
    await tools.update({
      uid: watchUID,
      key1: 'K1 - New',
    })
    const feed2 = await tools.searchSingle({
      uid: watchUID
    })
    assert.ok(feed.uid === feed2.uid)
    assert.ok(feed.key2 === feed2.key2)
    assert.ok(feed2.key1 === 'K1 - New')

    await tools.delete({
      uid: watchUID
    })
    const feed3 = await tools.searchSingle({
      uid: watchUID
    })
    assert.ok(feed3 === null)
  })
})
