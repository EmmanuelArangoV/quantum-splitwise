import {supabase} from '../configuration/supabaseClient'

//create user putting on the name and email
export const createUserDB = async (name: string, email: string) => {
    const {data,error} = await supabase.from('users').insert([{name,email}]).select()

    if(error) {
        console.error('Error creating user:', error)
        throw error
    }

    if (process.env.NODE_ENV === 'development'){
        console.log('User created successfully')
    }
    return data
}

//obtain all users from the database
export const getUsersDB = async () => {
    const {data,error} = await supabase.from('users').select('*')
    
    if(error) {
        console.error('Error obtaining user:', error)
        throw error
    }

    if (process.env.NODE_ENV === 'development'){
        console.log('Users obtained successfully')
    }
    return data
}

//that its very simplified because the tables are configurated with On delete cascade (delete user by id)
export const deleteUserDB = async (id:string) => {
    const {error} = await supabase.from('users').delete().eq('id',id)

    if(error) {
        console.error('Error deleting user', error)
        throw error
    }
}