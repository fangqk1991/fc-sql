import { Options, QueryTypes, Sequelize, Transaction } from 'sequelize'
import { SQLSearcher } from './SQLSearcher'
import { SQLAdder } from './SQLAdder'
import { SQLModifier } from './SQLModifier'
import { SQLRemover } from './SQLRemover'
import * as moment from 'moment'
import { TransactionRunner } from './TransactionRunner'
import { DBTableHandler } from './DBTableHandler'
import { QueryOptionsWithType } from 'sequelize/types/lib/query-interface'
import { SequelizeProtocol } from './SequelizeProtocol'

const _instanceMap: { [key: string]: any } = {}

export class FCDatabase<T extends SequelizeProtocol = Sequelize> {
  private __theDatabase?: T
  private _options!: Options

  public static instanceWithName<T extends SequelizeProtocol = Sequelize>(name: string): FCDatabase<T> {
    let obj = null
    if (name in _instanceMap && _instanceMap[name] instanceof FCDatabase) {
      obj = _instanceMap[name]
    } else {
      obj = new this()
      _instanceMap[name] = obj
    }
    return obj
  }

  public static getInstance<T extends SequelizeProtocol = Sequelize>(): FCDatabase<T> {
    return (this as any).instanceWithName('default')
  }

  public init(options: Options) {
    this._options = options
    return this
  }

  public dbName() {
    return this._options.database as string
  }

  public async query(
    query: string,
    replacements: (string | number | null)[] = [],
    transaction: Transaction | null = null
  ): Promise<{ [key: string]: any }[]> {
    const options: Partial<QueryOptionsWithType<QueryTypes>> = {
      replacements: replacements,
      type: QueryTypes.SELECT,
      raw: true,
    }
    if (transaction) {
      options.transaction = transaction
    }
    const items = (await this._db().query(query, options)) as any[]
    if (items.length > 0) {
      const remainKeyMap = Object.keys(items[0]).reduce((result: any, cur: string) => {
        result[cur] = true
        return result
      }, {})
      for (const item of items) {
        const keys = Object.keys(remainKeyMap)
        for (const key of keys) {
          if (Object.prototype.toString.call(item[key]) === '[object Date]') {
            // console.log(`Convert "${key}"`)
            item[key] = moment(item[key]).format()
          } else {
            if (item[key] !== null && item[key] !== undefined) {
              delete remainKeyMap[key]
            }
          }
        }
      }
    }
    return items as { [p: string]: number | string }[]
  }

  public async update(
    query: string,
    replacements: (string | number | null)[] = [],
    transaction: Transaction | null = null
  ): Promise<any> {
    const options: Partial<QueryOptionsWithType<QueryTypes>> = {
      replacements: replacements,
    }
    if (transaction) {
      options.transaction = transaction
    }
    return this._db().query(query, options)
  }

  public setSequelizeProtocol(protocol: T) {
    this.__theDatabase = protocol
  }

  public _db(): T {
    if (!this.__theDatabase) {
      this.__theDatabase = new Sequelize(this._options) as any as T
    }
    return this.__theDatabase
  }

  public searcher() {
    return new SQLSearcher(this as any as FCDatabase)
  }

  public adder() {
    return new SQLAdder(this as any as FCDatabase)
  }

  public modifier() {
    return new SQLModifier(this as any as FCDatabase)
  }

  public remover() {
    return new SQLRemover(this as any as FCDatabase)
  }

  public tableHandler(tableName: string) {
    return new DBTableHandler(this as any as FCDatabase, tableName)
  }

  public createTransactionRunner(): TransactionRunner {
    return new TransactionRunner(this as any as FCDatabase)
  }

  public async timezone() {
    const result = await this.query(`SHOW VARIABLES LIKE "time_zone"`)
    return result[0]['Value']
  }

  public async ping() {
    await this.query('SELECT 1').catch((err) => {
      throw new Error(`[${this._options?.username} -> ${this._options?.database}] ${err.message}`)
    })
    return 'PONG'
  }

  public async getTables() {
    const items = await this.query('SHOW TABLES')
    return items.map((item) => item[`Tables_in_${this.dbName()}`]) as string[]
  }
}
