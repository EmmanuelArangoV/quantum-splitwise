create table users (
   id uuid primary key default gen_random_uuid(),
   name text not null,
   email text not null unique,
   created_at timestamp default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  title text,
  amount numeric,
  payer_id uuid references users(id),
  created_at timestamp default now()
);

create table expense_participants (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references expenses(id),
  user_id uuid references users(id),
  amount numeric
);

-- ========== USERS ==========
create policy "Allow all on users"
on users for all
to public
using (true)
with check (true);

-- ========== EXPENSES ==========
create policy "Allow all on expenses"
on expenses for all
to public
using (true)
with check (true);

-- ========== EXPENSE_PARTICIPANTS ==========
create policy "Allow all on expense_participants"
on expense_participants for all
to public
using (true)
with check (true);
-- altering tables to execute on delete cascade for make more easiest the deleting of user in the tables


alter table expense_participants
drop constraint expense_participants_user_id_fkey;

alter table expense_participants
    add constraint expense_participants_user_id_fkey
        foreign key (user_id)
            references users(id)
            on delete cascade;

alter table expenses
drop constraint expenses_payer_id_fkey;

alter table expenses
    add constraint expenses_payer_id_fkey
        foreign key (payer_id)
            references users(id)
            on delete cascade;

alter table expense_participants
drop constraint expense_participants_expense_id_fkey;

alter table expense_participants
    add constraint expense_participants_expense_id_fkey
        foreign key (expense_id)
            references expenses(id)
            on delete cascade;

delete from expense_participants;
delete from expenses;
delete from users;