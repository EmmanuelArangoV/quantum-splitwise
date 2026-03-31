import { ExpenseManagerService} from "./backend/services";

function check(label: string, condition: boolean): void {
  if (!condition) {
    throw new Error(`FAIL: ${label}`)
  }
  console.log(`OK: ${label}`)
}

function findDebt(event: { debts: Array<{ userId: string; amount: number }> }, userId: string): number {
  const debt = event.debts.find(d => d.userId === userId)
  return debt ? debt.amount : 0
}

async function run(): Promise<void> {
  const service = new ExpenseManagerService()
  const suffix = Date.now()

  // 1) Usuarios
  const admin = await service.createUser(`Admin ${suffix}`, `admin.${suffix}@test.com`)
  const ana = await service.createUser(`Ana ${suffix}`, `ana.${suffix}@test.com`)
  const luis = await service.createUser(`Luis ${suffix}`, `luis.${suffix}@test.com`)
  check('Crear usuarios', !!admin.id && !!ana.id && !!luis.id)

  // 2) Evento (admin 100%)
  let event = await service.createEvent('Cena test', 120, admin.id)
  check('Evento creado', event.amount === 120 && event.adminId === admin.id)
  check('Admin inicia con 100%', event.debts.length === 1 && findDebt(event, admin.id) === 120)

  // 3) Agregar participantes y repartir
  event = await service.addParticipantToEvent(event.id, ana.id, 50) // admin se queda con 70, Ana con 50
  check('Reparto con monto fijo Ana=50', findDebt(event, admin.id) === 70 && findDebt(event, ana.id) === 50)

  event = await service.addParticipantToEvent(event.id, luis.id, 30) // admin reduce otros 30 (y le queda 40)
  check(
      'Reparto con monto fijo Luis=30',
      findDebt(event, admin.id) === 40 &&
      findDebt(event, ana.id) === 50 &&
      findDebt(event, luis.id) === 30
  )

  // 4) Update amount (esta prueba volverá a dividir equitativo todo, la mantenemos, pero cambiaremos a probar borrar al usuario para la validación de deuda y todo está ok)
  event = await service.updateEventAmount(event.id, 150) // 150 / 3 = 50
  check(
      'Update amount reparte equitativo',
      findDebt(event, admin.id) === 50 &&
      findDebt(event, ana.id) === 50 &&
      findDebt(event, luis.id) === 50
  )

  // 5) Balances
  const balancesBeforeDelete = await service.getUsersWithBalance()
  console.log('\nBalances antes de eliminar usuario:')
  console.table(
      balancesBeforeDelete.map(u => ({
        name: u.name,
        email: u.email,
        balance: u.balance
      }))
  )

  // 6) Eliminar usuario participante (su deuda pasa al admin)
  await service.deleteUser(ana.id)
  event = (await service.getEvents()).find(e => e.id === event.id)!
  check('Ana eliminada del evento', event.debts.every(d => d.userId !== ana.id))
  check('Deuda de Ana transferida al admin', findDebt(event, admin.id) === 100 && findDebt(event, luis.id) === 50)

  const balancesAfterDelete = await service.getUsersWithBalance()
  console.log('\nBalances después de eliminar usuario:')
  console.table(
      balancesAfterDelete.map(u => ({
        name: u.name,
        email: u.email,
        balance: u.balance
      }))
  )

  console.log('\nVALIDACION COMPLETA OK')
}

run().catch(error => {
  console.error('\nVALIDACION FALLIDA')
  console.error(error)
})
