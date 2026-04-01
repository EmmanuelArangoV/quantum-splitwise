import { supabase } from '../configuration/supabaseClient'

export interface UserRow {
  id: string
  name: string
  email: string
  created_at: string
}

export const createUserDB = async (name: string, email: string): Promise<UserRow> => {
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email }])
    .select('*')
    .single<UserRow>()

  if (error) {
    console.error('Error creating user:', error)
    throw error
  }

  return data
}

export const getUsersDB = async (): Promise<UserRow[]> => {
  const { data, error } = await supabase.from('users').select('*')

  if (error) {
    console.error('Error obtaining user:', error)
    throw error
  }

  return (data as UserRow[]) ?? []
}

export const getUserByIdDB = async (id: string): Promise<UserRow | null> => {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle<UserRow>()

  if (error) {
    console.error('Error getting user by id:', error)
    throw error
  }

  return data
}

export const deleteUserDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from('users').delete().eq('id', id)

  if (error) {
    console.error('Error deleting user', error)
    throw error
  }
}

