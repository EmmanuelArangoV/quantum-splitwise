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

    constructor(title: string, amount: number, adminId: string, id?: string, createdAt?: Date, debts?: IEventDebt[]) {
      if (!title.trim()) {
        throw new Error('El titulo del evento es obligatorio')
      }
      if (amount <= 0) {
        throw new Error('El monto debe ser mayor a 0')
      }
      if (!adminId) {
        throw new Error('El admin del evento es obligatorio')
      }

      this.id = id || crypto.randomUUID()
      this.title = title
      this.adminId = adminId
      this.amount = amount
      this.createdAt = createdAt || new Date()
      this.debts = debts || [{ userId: adminId, amount }]
    }

    public addParticipant(userId: string, assignedAmount?: number): void {
      if (!userId) {
        throw new Error('El participante es obligatorio')
      }
      if (this.hasParticipant(userId)) {
        return
      }

      if (assignedAmount !== undefined) {
        if (assignedAmount <= 0) {
          throw new Error('El monto asignado debe ser mayor a 0')
        }

        const adminDebt = this.debts.find(d => d.userId === this.adminId)
        const currentAdminAmount = adminDebt ? adminDebt.amount : 0

        if (assignedAmount > currentAdminAmount) {
          throw new Error('El monto asignado supera la deuda actual del administrador para este evento')
        }

        if (adminDebt) {
          adminDebt.amount -= assignedAmount
        }

        this.debts.push({ userId, amount: assignedAmount })
      } else {
        this.debts.push({ userId, amount: 0 })
        this.recalculateDebts()
      }
    }

    public updateAmount(newAmount: number): void {
      if (newAmount <= 0) {
        throw new Error('El monto debe ser mayor a 0')
      }
      
      const diff = newAmount - this.amount
      this.amount = newAmount

      if (diff > 0) {
        const adminDebt = this.debts.find(d => d.userId === this.adminId)
        if (adminDebt) {
          adminDebt.amount += diff
        } else {
          this.debts.push({ userId: this.adminId, amount: diff })
        }
      } else if (diff < 0) {
        const discountAmount = Math.abs(diff)
        const numParticipants = this.debts.length
        if (numParticipants > 0) {
          const discountPerPerson = discountAmount / numParticipants
          this.debts.forEach(d => {
            d.amount -= discountPerPerson
            if (d.amount < 0) {
              d.amount = 0
            }
          })
        }
      }
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