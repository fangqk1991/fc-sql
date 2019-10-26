import { FCDatabase } from './FCDatabase'
import { FCTransaction } from './FCTransaction'

export interface TransactionProtocol {
  transaction: FCTransaction;
  execute(): Promise<any>;
}

export type OperationCallback = (retData?: any) => Promise<any>

export interface TransactionOperation {
  performer: TransactionProtocol;
  callback?: OperationCallback;
}

export class TransactionRunner {
  public readonly operations: TransactionOperation[]
  private database: FCDatabase
  private _transaction?: FCTransaction

  constructor(database: FCDatabase) {
    this.database = database
    this.operations = []
  }

  public async begin() {
    this._transaction = await this.database._db().transaction()
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

  public addCustomFunc(func: (transaction?: FCTransaction) => Promise<void>) {
    const transaction = this._transaction as FCTransaction
    this.operations.push({
      performer: {
        transaction: transaction,
        execute: func,
      },
    })
  }

  public async commit() {
    if (this._transaction) {
      try {
        const retList: any[] = []
        for (const operation of this.operations) {
          operation.performer.transaction = this._transaction
          const ret = await operation.performer.execute()
          console.error(`performer execute`)
          retList.push(ret)
        }
        console.error(`performer commit before`)
        await this._transaction.commit()
        console.error(`performer commit after`)

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
        console.error(`TransactionRunner: Catch an error "${e.message}", transaction rollback`)
        await this.rollback()
        throw e
      }
    }
  }

  public async rollback() {
    if (this._transaction) {
      await this._transaction.rollback()
      this.operations.length = 0
    }
  }
}
