import { FCDatabase } from './FCDatabase'
import { FCTransaction } from './FCTransaction'

export interface TransactionOperation {
  transaction: FCTransaction;
  execute(): Promise<any>;
}

export type OperationCallback = (retData?: any) => Promise<void>

interface Operation {
  entity: TransactionOperation;
  callback?: OperationCallback;
}

export class DBTransaction {
  public readonly operations: Operation[]
  private database: FCDatabase
  private _transactionInstance?: FCTransaction

  constructor(database: FCDatabase) {
    this.database = database
    this.operations = []
  }

  public async begin() {
    this._transactionInstance = await this.database._db().transaction()
  }

  public async addOperation(operation: TransactionOperation, callback?: OperationCallback) {
    this.operations.push({
      entity: operation,
      callback: callback,
    })
  }

  public async addCustomFunc(func: () => Promise<void>) {
    const transaction = this._transactionInstance as FCTransaction
    this.operations.push({
      entity: {
        transaction: transaction,
        execute: func,
      },
    })
  }

  public async commit() {
    if (this._transactionInstance) {
      try {
        const retList: any[] = []
        for (const operation of this.operations) {
          operation.entity.transaction = this._transactionInstance
          const ret = await operation.entity.execute()
          retList.push(ret)
        }
        await this._transactionInstance.commit()

        for (let i = 0; i < this.operations.length; ++i) {
          const operation = this.operations[i]
          const callback = operation.callback
          const retData = retList[i]
          if (callback) {
            await callback(retData)
          }
        }
        return retList
      } catch (e) {
        console.error(`DBTransaction: Catch an error "${e.message}", transaction rollback`)
        await this.rollback()
        throw e
      }
    }
  }

  public async rollback() {
    if (this._transactionInstance) {
      await this._transactionInstance.rollback()
      this.operations.length = 0
    }
  }
}
