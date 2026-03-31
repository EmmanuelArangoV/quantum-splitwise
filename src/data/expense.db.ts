import { supabase } from "../configuration/supabaseClient";
import { Models } from '../types'

//create all expenses
export const createExpenseDB = async (
    expense: Models.IExpense,
    participants: Models.IExpenseParticipant[]
) => {
    const {error: e1} = await supabase.from('expenses').insert([{
        id: expense.id,
        title: expense.title,
        amount: expense.amount,
        payer_id: expense.payerId,
        created_at: expense.createdAt
    }]).select()

    if (e1) {
        console.error('Error creating expense:', e1)
        throw e1
    }

    const formatted = participants.map(p => ({ //map transform cammel case into snake_case to submit into database
        id: p.id,
        expense_id: p.expenseId,
        user_id: p.userId,
        amount: p.share //expense shared
    }))

    const {error: e2} = await supabase.from('expense_participants').insert(formatted)

    if (e2){
        console.error('error inserting participants:', e2)
        throw e2
    }

    if (process.env.NODE_ENV === 'development'){
        console.log('Expense created with participants')
    }
}

//obtain all expenses
export const getExpensesDB = async () => {
    const { data, error } = await supabase.from('expenses').select('*')

    if (error) {
        console.error('Error fetching expenses:', error)
        throw error
    }

    return data
}

//delete expenses by id
export const deleteExpenseDB = async (id: string) => {
    await supabase.from('expense_participants').delete().eq('expense_id', id)

    const { error } = await supabase.from('expenses').delete().eq('id', id)

    if (error) {
        console.error('Error deleting expense:', error)
        throw error
    }
}

