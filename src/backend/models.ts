export namespace BackendModels {
  export interface IUser {
    id: string
    name: string
    email: string
    createdAt: Date
  }

  export interface IUserBalance extends IUser {
    balance: number
  }

  export interface IEventDebt {
    userId: string
    amount: number
  }

  export interface IEvent {
    id: string
    title: string
    adminId: string
    amount: number
    createdAt: Date
    debts: IEventDebt[]
  }

  export class User implements IUser {
    public readonly id: string
    public name: string
    public email: string
    public readonly createdAt: Date

    constructor(name: string, email: string) {
      if (!name.trim()) {
        throw new Error('El nombre es obligatorio')
      }
      if (!email.trim()) {
        throw new Error('El email es obligatorio')
      }

      this.id = crypto.randomUUID()
      this.name = name
      this.email = email
      this.createdAt = new Date()
    }
  }

  export class Event implements IEvent {
    public readonly id: string
    public title: string
    public adminId: string
    public amount: number
    public readonly createdAt: Date
    public debts: IEventDebt[]

    constructor(title: string, amount: number, adminId: string) {
      if (!title.trim()) {
        throw new Error('El titulo del evento es obligatorio')
      }
      if (amount <= 0) {
        throw new Error('El monto debe ser mayor a 0')
      }
      if (!adminId) {
        throw new Error('El admin del evento es obligatorio')
      }

      this.id = crypto.randomUUID()
      this.title = title
      this.adminId = adminId
      this.amount = amount
      this.createdAt = new Date()
      this.debts = [{ userId: adminId, amount }]
    }

    public addParticipant(userId: string): void {
      if (!userId) {
        throw new Error('El participante es obligatorio')
      }
      const alreadyInEvent = this.debts.some(debt => debt.userId === userId)
      if (alreadyInEvent) {
        return
      }

      this.debts.push({ userId, amount: 0 })
      this.recalculateDebts()
    }

    public updateAmount(newAmount: number): void {
      if (newAmount <= 0) {
        throw new Error('El monto debe ser mayor a 0')
      }
      this.amount = newAmount
      this.recalculateDebts()
    }

    public transferDebt(fromUserId: string, toUserId: string): void {
      if (fromUserId === toUserId) {
        return
      }

      const fromDebt = this.debts.find(debt => debt.userId === fromUserId)
      if (!fromDebt) {
        return
      }

      const toDebt = this.debts.find(debt => debt.userId === toUserId)
      if (toDebt) {
        toDebt.amount += fromDebt.amount
      } else {
        this.debts.push({ userId: toUserId, amount: fromDebt.amount })
      }
    }

    public removeParticipant(userId: string): void {
      this.debts = this.debts.filter(debt => debt.userId !== userId)
    }

    public hasParticipant(userId: string): boolean {
      return this.debts.some(debt => debt.userId === userId)
    }

    private recalculateDebts(): void {
      if (this.debts.length === 0) {
        return
      }
      const equalShare = this.amount / this.debts.length
      this.debts = this.debts.map(debt => ({ ...debt, amount: equalShare }))
    }
  }
}