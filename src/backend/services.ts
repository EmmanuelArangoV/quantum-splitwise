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
	const row = await createUserDB(name.trim(), email.trim().toLowerCase())
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
	  const expense = await getExpenseByIdDB(expenseId)
	  if (!expense) {
		continue
	  }

	  // Version simple: si el admin se elimina, se elimina su evento.
	  if (expense.payer_id === userId) {
		await deleteExpenseDB(expenseId)
		continue
	  }

	  const participants = await getParticipantsByExpenseIdDB(expenseId)
	  const removed = participants.find(participant => participant.user_id === userId)
	  if (!removed) {
		continue
	  }

	  const transfer = this.toNumber(removed.amount)
	  const remaining = participants.filter(participant => participant.user_id !== userId)
	  const next = remaining.map(participant => ({
		userId: participant.user_id,
		amount:
		  participant.user_id === expense.payer_id
			? this.toNumber(participant.amount) + transfer
			: this.toNumber(participant.amount)
	  }))

	  await replaceExpenseParticipantsDB(expenseId, next)
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
	if (amount <= 0) {
	  throw new Error('El monto debe ser mayor a 0')
	}

	const admin = await getUserByIdDB(adminId)
	if (!admin) {
	  throw new Error('El admin no existe')
	}

	const expense = await createExpenseDB(title.trim(), amount, adminId)
	await replaceExpenseParticipantsDB(expense.id, [{ userId: adminId, amount }])
	return this.getEventById(expense.id)
  }

  @LogAction
  public async addParticipantToEvent(eventId: string, userId: string, assignedAmount?: number): Promise<BackendModels.IEvent> {
	const expense = await getExpenseByIdDB(eventId)
	if (!expense) {
	  throw new Error('Evento no encontrado')
	}

	const user = await getUserByIdDB(userId)
	if (!user) {
	  throw new Error('Usuario no encontrado')
	}

	const participants = await getParticipantsByExpenseIdDB(eventId)
	if (participants.some(participant => participant.user_id === userId)) {
	  return this.getEventById(eventId)
	}

	const totalAmount = this.toNumber(expense.amount)
	let updatedParticipants: { userId: string; amount: number }[] = []

	if (assignedAmount !== undefined) {
	  if (assignedAmount <= 0) {
		throw new Error('El monto asignado debe ser mayor a 0')
	  }

	  const adminId = expense.payer_id
	  const adminParticipant = participants.find(p => p.user_id === adminId)
	  const currentAdminAmount = adminParticipant ? this.toNumber(adminParticipant.amount) : 0

	  if (assignedAmount > currentAdminAmount) {
		throw new Error('El monto asignado supera la deuda actual del administrador para este evento')
	  }

	  updatedParticipants = participants.map(p => {
		if (p.user_id === adminId) {
		  return { userId: p.user_id, amount: this.toNumber(p.amount) - assignedAmount }
		}
		return { userId: p.user_id, amount: this.toNumber(p.amount) }
	  })

	  updatedParticipants.push({ userId, amount: assignedAmount })
	} else {
	  const userIds = [...participants.map(participant => participant.user_id), userId]
	  const share = totalAmount / userIds.length
	  updatedParticipants = userIds.map(id => ({ userId: id, amount: share }))
	}

	await replaceExpenseParticipantsDB(
	  eventId,
	  updatedParticipants
	)

	return this.getEventById(eventId)
  }

  @LogAction
  public async updateEventAmount(eventId: string, newAmount: number): Promise<BackendModels.IEvent> {
	if (newAmount <= 0) {
	  throw new Error('El monto debe ser mayor a 0')
	}

	const expense = await getExpenseByIdDB(eventId)
	if (!expense) {
	  throw new Error('Evento no encontrado')
	}

	await updateExpenseDB(eventId, { amount: newAmount })

	const participants = await getParticipantsByExpenseIdDB(eventId)
	const userIds = participants.length > 0
	  ? participants.map(participant => participant.user_id)
	  : [expense.payer_id]
	const share = newAmount / userIds.length

	await replaceExpenseParticipantsDB(
	  eventId,
	  userIds.map(id => ({ userId: id, amount: share }))
	)

	return this.getEventById(eventId)
  }

  public async getEvents(): Promise<BackendModels.IEvent[]> {
	const expenses = await getExpensesDB()
	return Promise.all(expenses.map(expense => this.getEventById(expense.id)))
  }

  private async getEventById(eventId: string): Promise<BackendModels.IEvent> {
	const expense = await getExpenseByIdDB(eventId)
	if (!expense) {
	  throw new Error('Evento no encontrado')
	}

	const participants = await getParticipantsByExpenseIdDB(eventId)
	return {
	  id: expense.id,
	  title: expense.title,
	  adminId: expense.payer_id,
	  amount: this.toNumber(expense.amount),
	  createdAt: new Date(expense.created_at),
	  debts: participants.map(participant => ({
		userId: participant.user_id,
		amount: this.toNumber(participant.amount)
	  }))
	}
  }

  private toNumber(value: number | string): number {
	return typeof value === 'number' ? value : Number(value)
  }
}
