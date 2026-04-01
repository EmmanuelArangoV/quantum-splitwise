import { supabase } from '../configuration/supabaseClient'

export interface ExpenseRow {
  id: string
  title: string
  amount: number | string
  payer_id: string
  created_at: string
}

export interface ExpenseParticipantRow {
  id: string
  expense_id: string
  user_id: string
  amount: number | string
}

export interface ExpenseParticipantInput {
  userId: string
  amount: number
}

export const createExpenseDB = async (
  title: string,
  amount: number,
  payerId: string
): Promise<ExpenseRow> => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([
      { title, amount, payer_id: payerId }
    ])
    .select('*')
    .single<ExpenseRow>()

  if (error) {
    console.error('Error creating expense:', error)
    throw error
  }

  return data
}

export const getExpensesDB = async (): Promise<ExpenseRow[]> => {
  const { data, error } = await supabase.from('expenses').select('*')

  if (error) {
    console.error('Error fetching expenses:', error)
    throw error
  }

  return (data as ExpenseRow[]) ?? []
}

export const getExpenseByIdDB = async (id: string): Promise<ExpenseRow | null> => {
  const { data, error } = await supabase.from('expenses').select('*').eq('id', id).maybeSingle<ExpenseRow>()

  if (error) {
    console.error('Error fetching expense by id:', error)
    throw error
  }

  return data
}

export const updateExpenseDB = async (
  id: string,
  payload: { title?: string; amount?: number; payerId?: string }
): Promise<ExpenseRow> => {
  const updatePayload: { title?: string; amount?: number; payer_id?: string } = {}

  if (payload.title !== undefined) {
    updatePayload.title = payload.title
  }
  if (payload.amount !== undefined) {
    updatePayload.amount = payload.amount
  }
  if (payload.payerId !== undefined) {
    updatePayload.payer_id = payload.payerId
  }

  const { data, error } = await supabase
    .from('expenses')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single<ExpenseRow>()

  if (error) {
    console.error('Error updating expense:', error)
    throw error
  }

  return data
}

export const deleteExpenseDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from('expenses').delete().eq('id', id)

  if (error) {
    console.error('Error deleting expense:', error)
    throw error
  }
}

export const getParticipantsByExpenseIdDB = async (expenseId: string): Promise<ExpenseParticipantRow[]> => {
  const { data, error } = await supabase
    .from('expense_participants')
    .select('*')
    .eq('expense_id', expenseId)

  if (error) {
    console.error('Error fetching participants by expense:', error)
    throw error
  }

  return (data as ExpenseParticipantRow[]) ?? []
}

export const getParticipantsByUserIdDB = async (userId: string): Promise<ExpenseParticipantRow[]> => {
  const { data, error } = await supabase.from('expense_participants').select('*').eq('user_id', userId)

  if (error) {
    console.error('Error fetching participants by user:', error)
    throw error
  }

  return (data as ExpenseParticipantRow[]) ?? []
}

export const getAllParticipantsDB = async (): Promise<ExpenseParticipantRow[]> => {
  const { data, error } = await supabase.from('expense_participants').select('*')

  if (error) {
    console.error('Error fetching participants:', error)
    throw error
  }

  return (data as ExpenseParticipantRow[]) ?? []
}

export const replaceExpenseParticipantsDB = async (
  expenseId: string,
  participants: ExpenseParticipantInput[]
): Promise<void> => {
  const { error: deleteError } = await supabase.from('expense_participants').delete().eq('expense_id', expenseId)

  if (deleteError) {
    console.error('Error deleting previous participants:', deleteError)
    throw deleteError
  }

  if (participants.length === 0) {
    return
  }

  const rows = participants.map(participant => ({
    expense_id: expenseId,
    user_id: participant.userId,
    amount: participant.amount
  }))

  const { error: insertError } = await supabase.from('expense_participants').insert(rows)

  if (insertError) {
    console.error('Error inserting participants:', insertError)
    throw insertError
  }
}

