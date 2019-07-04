import { FCDatabase, SQLSearcher, DBTools, DBProtocol } from '../src'
import * as assert from 'assert'

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

class MyProtocol implements DBProtocol {
  database(): FCDatabase {
    return database
  }
  table(): string {
    return 'demo_table'
  }
  primaryKey(): string {
    return 'uid'
  }
  cols(): string[] {
    return [
      'uid',
      'key1',
      'key2',
    ]
  }
  insertableCols(): string[] {
    return this.cols()
  }
  modifiableCols(): string[] {
    return [
      'key1',
      'key2',
    ]
  }
}

const globalSearcher = new SQLSearcher(database)
globalSearcher.setTable('demo_table')
globalSearcher.setColumns(['*'])

describe('Test DBTools', (): void => {
  it(`Test DBTools`, async (): Promise<void> => {
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
    const watchUID = items[0]['uid'] as string
    const feed = await tools.searchSingle({
      uid: watchUID
    }) as {uid: string; key1: string; key2: string}
    await tools.update({
      uid: watchUID,
      key1: 'K1 - New',
    })
    const feed2 = await tools.searchSingle({
      uid: watchUID
    }) as {uid: string; key1: string; key2: string}
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
