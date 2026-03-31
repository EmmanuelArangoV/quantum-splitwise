import { Models } from "./types"

namespace DataStore {
  // Simulación de una base de datos en memoria
  export const expenses: Models.IExpense[] = []
  export const participants: Models.IExpenseParticipant[] = []
}

export namespace ExpenseService {

  export function createExpense(
    title: string,
    amount: number,
    payerId: string,
    participantIds: string[]
  ): Models.IExpense {

    if (participantIds.length === 0) {
      throw new Error("Debe haber al menos un participante")
    }

    const newExpense = new Models.Expense(
      title,
      amount,
      payerId
    )

    DataStore.expenses.push(newExpense)

    const share = amount / participantIds.length

    participantIds.forEach(userId => {
      const participant = new Models.ExpenseParticipant(
        newExpense.id,
        userId,
        share
      )

      DataStore.participants.push(participant)
    })

    return newExpense
  }

  export function getAllExpenses(): Models.IExpense[] {
    return DataStore.expenses
  }

  export function deleteExpense(id: string): void {

    const index = DataStore.expenses.findIndex(e => e.id === id)

    if (index === -1) {
      throw new Error("Gasto no encontrado")
    }

    DataStore.expenses.splice(index, 1)

    for (let i = DataStore.participants.length - 1; i >= 0; i--) {
      if (DataStore.participants[i].expenseId === id) {
        DataStore.participants.splice(i, 1)
      }
    }
  }

  export function calculateBalances(): Models.IBalance[] {

    const balancesMap: Record<string, number> = {}

    DataStore.expenses.forEach(expense => {

      const expenseParticipants = DataStore.participants.filter(
        p => p.expenseId === expense.id
      )

      expenseParticipants.forEach(p => {
        balancesMap[p.userId] = (balancesMap[p.userId] || 0) - p.share
      })

      balancesMap[expense.payerId] =
        (balancesMap[expense.payerId] || 0) + expense.amount
    })

    const balances: Models.IBalance[] = []

    const debtors = Object.entries(balancesMap).filter(([_, v]) => v < 0)
    const creditors = Object.entries(balancesMap).filter(([_, v]) => v > 0)

    debtors.forEach(([debtorId, debtAmount]) => {
      creditors.forEach(([creditorId, creditAmount]) => {

        if (creditAmount > 0 && debtAmount < 0) {

          const amount = Math.min(creditAmount, -debtAmount)

          if (amount > 0) {
            balances.push({
              debtorId,
              creditorId,
              amount
            })
          }
        }
      })
    })

    return balances
  }

}