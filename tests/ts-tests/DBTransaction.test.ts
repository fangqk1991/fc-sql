import { FCDatabase, SQLAdder, SQLModifier, SQLRemover, SQLSearcher } from "../../src"
import * as assert from 'assert'
import { SQLCustomer } from '../../src/SQLCustomer'

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
globalSearcher.setTable('demo_table_2')
globalSearcher.setColumns(['*'])

const clearRecords = async () => {
  await database.update('TRUNCATE demo_table_2')
}

const buildSomeRecords = async (count: number) => {
  for (let i = 0; i < count; ++i) {
    const adder = new SQLAdder(database)
    adder.setTable('demo_table_2')
    adder.insertKV('key1', `K1 - ${Math.random()}`)
    adder.insertKV('key2', `K2 - ${Math.random()}`)
    await adder.execute()
  }
}

describe('Test DBTransaction', () => {
  it(`Test Rollback`, async () => {
    await clearRecords()
    const transaction = database.createTransaction()
    await transaction.begin()
    const count = 5
    for (let i = 0; i < count; ++i) {
      const adder = new SQLAdder(database)
      adder.setTable('demo_table_2')
      adder.insertKV('key1', `K1 - ${Math.random()}`)
      adder.insertKV('key2', `K2 - ${Math.random()}`)
      transaction.addPerformer(adder, async () => {
        assert.fail()
      })

      transaction.addCustomFunc(async () => {
        await buildSomeRecords(2)
        assert.equal(await globalSearcher.queryCount(), 2 * (i + 1))
      })
    }
    const errorMessage = 'Throw error deliberately.'
    transaction.addCustomFunc(async () => {
      throw new Error(errorMessage)
    })
    try {
      await transaction.commit()
      assert.fail()
    } catch (e) {
      assert.equal(e.message, errorMessage)
    }

    assert.equal(await globalSearcher.queryCount(), 2 * count)
    assert.equal(transaction.operations.length, 0)
  })

  it(`Test Normal`, async () => {
    await clearRecords()

    const transaction = database.createTransaction()
    await transaction.begin()
    const count = 5
    for (let i = 0; i < count; ++i) {
      const adder = new SQLAdder(database)
      adder.setTable('demo_table_2')
      adder.insertKV('key1', `K1 - ${Math.random()}`)
      adder.insertKV('key2', `K2 - ${Math.random()}`)
      transaction.addCustomFunc(async () => {
        console.log(`Fake operation: Index - ${i}`)
      })

      transaction.addPerformer(adder, async (uid: number) => {
        console.log(`Transaction callback: [uid: ${uid}]`)
        assert.ok(uid > 0)
      })

      {
        const customer = SQLCustomer.searcher(database)
        customer.setEntity('SELECT COUNT(*) AS count FROM demo_table_2')

        transaction.addPerformer(customer, async (items: any) => {
          assert.ok(Array.isArray(items))
          const count = items[0]['count']
          assert.equal(count, i + 1)
        })
      }
    }

    const key2Desc = 'zxcvbn'
    {
      const customer = SQLCustomer.editor(database)
      customer.setEntity('UPDATE demo_table_2 SET key2 = ?', key2Desc)
      transaction.addPerformer(customer)
    }

    const modifyUid = 1
    const modifyContent = '345678'
    const deleteUid = 2

    {
      const modifier = new SQLModifier(database)
      modifier.setTable('demo_table_2')
      modifier.updateKV('key1', modifyContent)
      modifier.addConditionKV('uid', modifyUid)
      transaction.addPerformer(modifier)
    }
    {
      const modifier = new SQLRemover(database)
      modifier.setTable('demo_table_2')
      modifier.addConditionKV('uid', deleteUid)
      transaction.addPerformer(modifier)
    }

    await transaction.commit()

    assert.equal(await globalSearcher.queryCount(), count - 1)

    {
      const searcher = new SQLSearcher(database)
      searcher.setTable('demo_table_2')
      searcher.setColumns(['*'])
      searcher.addConditionKV('uid', modifyUid)
      const data = (await searcher.querySingle()) as any
      assert.equal(data['key1'], modifyContent)
    }

    {
      const searcher = new SQLSearcher(database)
      searcher.setTable('demo_table_2')
      searcher.setColumns(['*'])
      searcher.addConditionKV('uid', deleteUid)
      const data = await searcher.querySingle()
      assert.equal(data, null)
    }

    {
      const items = await globalSearcher.queryList()
      items.forEach((item: any) => {
        assert.equal(item['key2'], key2Desc)
      })
    }
  })
})
