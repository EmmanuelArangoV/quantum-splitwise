//file dedicated to testing and for do the functionalities of CRUD

import { supabase } from './configuration/supabaseClient'
import { createUserDB, getUsersDB,deleteUserDB } from './data/user.db'
import { createExpenseDB,getExpensesDB,deleteExpenseDB } from './data/expense.db'
import { Models } from './types'

async function testConnection() {
  const {error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error to connect with Supabase:', error.message)
  } else {
    console.log('Connection to Supabase was successfully!')
  }
}

testConnection()

// testing for try to create an user, (debugging)


/*
async function test() {
    try {
        console.log('--- creando usuario ---')
        await createUserDB('Juan', 'juan@test.com')

        console.log('--- obteniendo usuarios ---')
        const users = await getUsersDB()

        console.log('RESULT:', users)

    } catch (err) {
        console.error('ERROR GENERAL:', err)
    }
}

test() */

/*
async function test() {
    try {
        console.log('--- obteniendo usuarios ---')

        const users = await getUsersDB()

        console.log('RESULT:', users)

    } catch (err) {
        console.error('ERROR GENERAL:', err)
    }
}

test() */

/* async function testexpense() {
  try {
    // 1. crear usuarios reales
    const u1 = await createUserDB('Juan', 'juan1@test.com')
    const u2 = await createUserDB('Ana', 'ana@test.com')
    const u3 = await createUserDB('Luis', 'luis@test.com')

    const user1 = u1?.[0]?.id
    const user2 = u2?.[0]?.id
    const user3 = u3?.[0]?.id

    console.log('Users:', user1, user2, user3)

    // 2. crear gasto (usando clase de tu compañero)
    const expense = new Models.Expense('Pizza', 60, user1)

    // 3. crear participantes
    const participants = [
        new Models.ExpenseParticipant(expense.id, user1, 20),
        new Models.ExpenseParticipant(expense.id, user2, 20),
        new Models.ExpenseParticipant(expense.id, user3, 20),
    ]

    // 4. guardar en DB
    await createExpenseDB(expense, participants)

    console.log('✅ Expense creado correctamente')

    } catch (err) {
        console.error('❌ ERROR GENERAL:', err)
    }
}

testexpense() */

