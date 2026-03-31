//


export namespace Models {

  export interface IExpense {
    id: string
    title: string
    amount: number
    payerId: string
    createdAt: Date
  }

  export interface IExpenseParticipant {
    id: string
    expenseId: string
    userId: string
    share: number
  }

  export interface IBalance {
    debtorId: string
    creditorId: string
    amount: number
  }

  export class Expense implements IExpense {

    public readonly id: string
    public title: string
    public amount: number
    public payerId: string
    public readonly createdAt: Date

    constructor(
      title: string,
      amount: number,
      payerId: string
    ) {
      if (!title || title.trim().length === 0) {
        throw new Error("El título es obligatorio")
      }

      if (amount <= 0) {
        throw new Error("El monto debe ser mayor a 0")
      }

      if (!payerId) {
        throw new Error("payerId es obligatorio")
      }

      this.id = crypto.randomUUID()
      this.title = title
      this.amount = amount
      this.payerId = payerId
      this.createdAt = new Date()
    }

    public getSummary(): string {
      return `${this.title} - ${this.amount}`
    }

    public updateAmount(newAmount: number): void {
      if (newAmount <= 0) {
        throw new Error("El monto debe ser mayor a 0")
      }
      this.amount = newAmount
    }
  }

  export class ExpenseParticipant implements IExpenseParticipant {

    public readonly id: string
    public expenseId: string
    public userId: string
    public share: number

    constructor(
      expenseId: string,
      userId: string,
      share: number
    ) {
      if (!expenseId) {
        throw new Error("expenseId es obligatorio")
      }

      if (!userId) {
        throw new Error("userId es obligatorio")
      }

      if (share <= 0) {
        throw new Error("El share debe ser mayor a 0")
      }

      this.id = crypto.randomUUID()
      this.expenseId = expenseId
      this.userId = userId
      this.share = share
    }

    public updateShare(newShare: number): void {
      if (newShare <= 0) {
        throw new Error("El share debe ser mayor a 0")
      }
      this.share = newShare
    }
  }

}