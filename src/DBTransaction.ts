import { FCDatabase } from './FCDatabase'
import { FCTransaction } from './FCTransaction'

export interface TransactionProtocol {
  transaction: FCTransaction;
  execute(): Promise<any>;
}

export type OperationCallback = (retData?: any) => Promise<void>

export interface TransactionOperation {
  performer: TransactionProtocol;
  callback?: OperationCallback;
}

export class DBTransaction {
  public readonly operations: TransactionOperation[]
  private database: FCDatabase
  private _transactionInstance?: FCTransaction

  constructor(database: FCDatabase) {
    this.database = database
    this.operations = []
  }

  public async begin() {
    this._transactionInstance = await this.database._db().transaction()
  }

  public addOperation(operation: TransactionOperation) {
    this.operations.push(operation)
  }

  public addPerformer(performer: TransactionProtocol, callback?: OperationCallback) {
    this.addOperation({
      performer: performer,
      callback: callback,
    })
  }

  public addCustomFunc(func: () => Promise<void>) {
    const transaction = this._transactionInstance as FCTransaction
    this.operations.push({
      performer: {
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
          operation.performer.transaction = this._transactionInstance
          const ret = await operation.performer.execute()
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
