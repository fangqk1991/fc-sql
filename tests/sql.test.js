const FCDatabase = require('../FCDatabase')
const SQLAdder = require('../SQLAdder')
const SQLSearcher = require('../SQLSearcher')
const assert = require('assert')

const database = FCDatabase.getInstance()
database.init({
  host: '127.0.0.1',
  port: '3306',
  dialect: 'mysql',
  database: 'demo_db',
  username: 'root',
  password: '',
  timezone: '+08:00'
})

const globalSearcher = new SQLSearcher(database)
globalSearcher.setTable('demo_table')

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

  it(`Test SQLSearcher`, async () => {
    const searcher = new SQLSearcher(database)
    searcher.setTable('demo_table')
    searcher.setColumns(['uid', 'key1', 'key2'])
    const count = await searcher.queryCount()
    const items = await searcher.queryList()
    assert.ok(Array.isArray(items))
    assert.ok(items.length === count)
  })
})
