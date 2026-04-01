// Estado de la app 
const state = {
    users: [],
    events: []
};

// Referencias a elementos
const DOM = {
    usersList: document.getElementById('users-list'),
    eventsList: document.getElementById('events-list'),
    balancesList: document.getElementById('balances-list'),
    eventAdminSelect: document.getElementById('event-admin'),
    participantUserSelect: document.getElementById('participant-user'),
    participantEventSelect: document.getElementById('participant-event')
};

// Fetch inicial de BD
async function loadData() {
    try {
        const usersReq = await fetch('/api/users');
        state.users = await usersReq.json();

        const eventsReq = await fetch('/api/events');
        state.events = await eventsReq.json();

        updateUI();
        renderBalances();
    } catch (err) {
        showToast('Error conectando a la BD');
        console.error(err);
    }
}

// Lógica
async function createUser() {
    const nameInput = document.getElementById('user-name');
    const emailInput = document.getElementById('user-email');
    
    if (!nameInput.value || !emailInput.value) {
        showToast('Por favor completa los datos del usuario');
        return;
    }

    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nameInput.value, email: emailInput.value })
        });
        
        if(!res.ok) throw new Error((await res.json()).error);
        
        nameInput.value = '';
        emailInput.value = '';
        
        showToast('Usuario creado con éxito');
        await loadData();
    } catch (err) {
        showToast('Error: ' + err.message);
    }
}

async function createEvent() {
    const titleInput = document.getElementById('event-title');
    const amountInput = document.getElementById('event-amount');
    const adminSelect = document.getElementById('event-admin');
    
    if (!titleInput.value || !amountInput.value || !adminSelect.value) {
        showToast('Por favor completa todos los datos del gasto');
        return;
    }

    try {
        const res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title: titleInput.value, 
                amount: parseFloat(amountInput.value),
                adminId: adminSelect.value
            })
        });

        if(!res.ok) throw new Error((await res.json()).error);

        titleInput.value = '';
        amountInput.value = '';
        adminSelect.value = '';
        
        showToast('Gasto añadido');
        await loadData();
    } catch (err) {
        showToast('Error: ' + err.message);
    }
}

async function addParticipant() {
    const eventId = document.getElementById('participant-event').value;
    const userId = document.getElementById('participant-user').value;
    const assignedAmountRaw = document.getElementById('participant-assigned-amount').value;
    
    if (!eventId || !userId) {
        showToast('Selecciona el gasto y el participante');
        return;
    }

    try {
        const body = { userId };
        if (assignedAmountRaw) {
            body.assignedAmount = parseFloat(assignedAmountRaw);
        }

        const res = await fetch(`/api/events/${eventId}/participants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if(!res.ok) throw new Error((await res.json()).error);

        document.getElementById('participant-assigned-amount').value = '';
        showToast('Participante agregado al gasto');
        await loadData();
    } catch (err) {
        showToast('Error: ' + err.message);
    }
}

async function recalculateBalances() {
    showToast('Actualizando datos desde BD...');
    await loadData();
}

// Lógica de Eliminación y Update extra
async function deleteUser(userId) {
    if (!confirm('¿Estás seguro que deseas eliminar este usuario? Eliminarlo borrará los gastos que haya creado.')) return;
    
    try {
        const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
        if(!res.ok) throw new Error((await res.json()).error);
        
        showToast('Usuario eliminado');
        await loadData();
    } catch (err) {
        showToast('Error: ' + err.message);
    }
}

async function deleteEvent(eventId) {
    if (!confirm('¿Estás seguro que deseas eliminar este gasto de forma permanente?')) return;
    
    try {
        const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
        if(!res.ok) throw new Error((await res.json()).error);
        
        showToast('Gasto eliminado');
        await loadData();
    } catch (err) {
        showToast('Error: ' + err.message);
    }
}

async function updateEventAmount() {
    const eventId = document.getElementById('update-event-select').value;
    const newAmount = document.getElementById('update-event-amount').value;

    if (!eventId || !newAmount) {
        showToast('Selecciona el gasto y el nuevo monto');
        return;
    }

    try {
        const res = await fetch(`/api/events/${eventId}/amount`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newAmount: parseFloat(newAmount) })
        });

        if(!res.ok) throw new Error((await res.json()).error);

        document.getElementById('update-event-amount').value = '';
        showToast('Gasto actualizado');
        await loadData();
    } catch (err) {
        showToast('Error: ' + err.message);
    }
}

// UI Handlers
function updateUI() {
    renderUsers();
    renderSelects();
    renderEvents();
}

function renderUsers() {
    if (!state.users || state.users.length === 0) {
        DOM.usersList.innerHTML = '<li class="empty-state">No hay usuarios aún</li>';
        return;
    }
    DOM.usersList.innerHTML = state.users.map(u => 
        `<li>
            <span>${u.name} <br><small style="color:var(--text-muted)">${u.email}</small></span>
            <button onclick="deleteUser('${u.id}')" style="background:transparent; border:none; color:red; cursor:pointer;" title="Eliminar usuario">❌</button>
        </li>`
    ).join('');
}

function renderEvents() {
    if (!state.events || state.events.length === 0) {
        DOM.eventsList.innerHTML = '<li class="empty-state">No hay gastos aún</li>';
        return;
    }
    DOM.eventsList.innerHTML = state.events.map(e => {
        const adminName = state.users.find(u => u.id === e.adminId)?.name || 'Desconocido';
        return `
        <li>
            <div>
                <strong>${e.title}</strong>
                <div style="font-size:0.8rem; color:var(--text-muted)">Pagó: ${adminName}</div>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
                <span class="badge">$${e.amount.toFixed(2)}</span>
                <button onclick="deleteEvent('${e.id}')" style="background:transparent; border:none; color:red; cursor:pointer;" title="Eliminar gasto">❌</button>
            </div>
        </li>`
    }).join('');
}

function renderSelects() {
    if (!state.users || !state.events) return;
    
    const userOptions = state.users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    const eventOptions = state.events.map(e => `<option value="${e.id}">${e.title} ($${e.amount})</option>`).join('');
    
    DOM.eventAdminSelect.innerHTML = `<option value="">Selecciona quién pagó...</option>` + userOptions;
    DOM.participantUserSelect.innerHTML = `<option value="">Selecciona participante...</option>` + userOptions;
    DOM.participantEventSelect.innerHTML = `<option value="">Selecciona el gasto...</option>` + eventOptions;
    document.getElementById('update-event-select').innerHTML = `<option value="">Gasto a actualizar...</option>` + eventOptions;
}

function renderBalances() {
    if (!state.users || state.users.length === 0) {
        DOM.balancesList.innerHTML = '<li class="empty-state">Agrega usuarios y gastos para ver los balances</li>';
        return;
    }
    
    DOM.balancesList.innerHTML = state.users.map(u => {
        const balance = u.balance || 0;
        const isPositive = balance >= 0;
        const colorClass = balance === 0 ? '' : (isPositive ? 'positive-balance' : 'negative-balance');
        const sign = balance > 0 ? '+' : '';
        return `
        <li>
            <span>${u.name}</span>
            <span class="${colorClass}">${sign}$${balance.toFixed(2)}</span>
        </li>`
    }).join('');
}

function showToast(message) {
    const snackbar = document.getElementById("snackbar");
    snackbar.textContent = message;
    snackbar.className = "show";
    setTimeout(() => { snackbar.className = snackbar.className.replace("show", ""); }, 3000);
}

// Listeners
document.getElementById('btn-create-user').addEventListener('click', createUser);
document.getElementById('btn-create-event').addEventListener('click', createEvent);
document.getElementById('btn-add-participant').addEventListener('click', addParticipant);
document.getElementById('btn-refresh-balances').addEventListener('click', recalculateBalances);
document.getElementById('btn-update-event').addEventListener('click', updateEventAmount);

// Init
window.addEventListener('DOMContentLoaded', loadData);
