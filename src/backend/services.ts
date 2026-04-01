import { BackendModels } from './models'
import {
  createExpenseDB,
  createUserDB,
  deleteExpenseDB,
  deleteUserDB,
  getAllParticipantsDB,
  getExpenseByIdDB,
  getExpensesDB,
  getParticipantsByExpenseIdDB,
  getParticipantsByUserIdDB,
  getUserByIdDB,
  getUsersDB,
  replaceExpenseParticipantsDB,
  updateExpenseDB
} from './data'

function LogAction(_target: object, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const originalMethod = descriptor.value as (...args: unknown[]) => unknown
  descriptor.value = function (...args: unknown[]): unknown {
	if (process.env.NODE_ENV === 'development') {
	  console.log(`[ExpenseManager] ${propertyKey}`, args)
	}
	return originalMethod.apply(this, args)
  }
  return descriptor
}

export class ExpenseManagerService {
  @LogAction
  public async createUser(name: string, email: string): Promise<BackendModels.IUser> {
	const newUser = new BackendModels.User(name, email)
	const row = await createUserDB(newUser.name, newUser.email)
	return {
	  id: row.id,
	  name: row.name,
	  email: row.email,
	  createdAt: new Date(row.created_at)
	}
  }

  @LogAction
  public async deleteUser(userId: string): Promise<void> {
	const user = await getUserByIdDB(userId)
	if (!user) {
	  throw new Error('Usuario no encontrado')
	}

	const expenses = await getExpensesDB()
	const participations = await getParticipantsByUserIdDB(userId)
	const affectedExpenseIds = new Set<string>([
	  ...expenses.filter(expense => expense.payer_id === userId).map(expense => expense.id),
	  ...participations.map(participant => participant.expense_id)
	])

	for (const expenseId of affectedExpenseIds) {
	  const event = await this.getEventById(expenseId)

	  // Version simple: si el admin se elimina, se elimina su evento.
	  if (event.adminId === userId) {
		await deleteExpenseDB(expenseId)
		continue
	  }

	  if (!event.hasParticipant(userId)) {
		continue
	  }

      event.transferDebt(userId, event.adminId)
      event.removeParticipant(userId)

	  await replaceExpenseParticipantsDB(expenseId, event.debts)
	}

	await deleteUserDB(userId)
  }

  @LogAction
  public async getUsersWithBalance(): Promise<BackendModels.IUserBalance[]> {
	const users = await getUsersDB()
	const expenses = await getExpensesDB()
	const participants = await getAllParticipantsDB()
	const balances: Record<string, number> = {}

	for (const participant of participants) {
	  const expense = expenses.find(current => current.id === participant.expense_id)
	  if (!expense || participant.user_id === expense.payer_id) {
		continue
	  }

	  const share = this.toNumber(participant.amount)
	  balances[participant.user_id] = (balances[participant.user_id] ?? 0) - share
	  balances[expense.payer_id] = (balances[expense.payer_id] ?? 0) + share
	}

	return users.map(user => ({
	  id: user.id,
	  name: user.name,
	  email: user.email,
	  createdAt: new Date(user.created_at),
	  balance: balances[user.id] ?? 0
	}))
  }

  @LogAction
  public async createEvent(title: string, amount: number, adminId: string): Promise<BackendModels.IEvent> {
    const newEvent = new BackendModels.Event(title, amount, adminId)

	const admin = await getUserByIdDB(adminId)
	if (!admin) {
	  throw new Error('El admin no existe')
	}

	const expense = await createExpenseDB(newEvent.title.trim(), newEvent.amount, newEvent.adminId)
	await replaceExpenseParticipantsDB(expense.id, newEvent.debts)
	return this.getEventById(expense.id)
  }

  @LogAction
  public async addParticipantToEvent(eventId: string, userId: string, assignedAmount?: number): Promise<BackendModels.IEvent> {
	const user = await getUserByIdDB(userId)
	if (!user) {
	  throw new Error('Usuario no encontrado')
	}

    const event = await this.getEventById(eventId)
    
    if (event.hasParticipant(userId)) {
      return event
    }

    event.addParticipant(userId, assignedAmount)

	await replaceExpenseParticipantsDB(
	  eventId,
	  event.debts
	)

	return event
  }

  @LogAction
  public async updateEventAmount(eventId: string, newAmount: number): Promise<BackendModels.IEvent> {
    const event = await this.getEventById(eventId)
    event.updateAmount(newAmount)

	await updateExpenseDB(eventId, { amount: newAmount })

	await replaceExpenseParticipantsDB(
	  eventId,
	  event.debts
	)

	return event
  }

  @LogAction
  public async getEvents(): Promise<BackendModels.IEvent[]> {
	const expenses = await getExpensesDB()
	return Promise.all(expenses.map(expense => this.getEventById(expense.id)))
  }

  @LogAction
  public async deleteEvent(eventId: string): Promise<void> {
    const expense = await getExpenseByIdDB(eventId)
    if (!expense) {
      throw new Error('Evento no encontrado')
    }
    
    await deleteExpenseDB(eventId)
  }

  private async getEventById(eventId: string): Promise<BackendModels.Event> {
	const expense = await getExpenseByIdDB(eventId)
	if (!expense) {
	  throw new Error('Evento no encontrado')
	}

	const participants = await getParticipantsByExpenseIdDB(eventId)
	return new BackendModels.Event(
      expense.title,
      this.toNumber(expense.amount),
      expense.payer_id,
      expense.id,
      new Date(expense.created_at),
      participants.map(participant => ({
        userId: participant.user_id,
        amount: this.toNumber(participant.amount)
      }))
    )
  }

  private toNumber(value: number | string): number {
	return typeof value === 'number' ? value : Number(value)
  }
}
