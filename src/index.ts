import express from 'express';
import cors from 'cors';
import path from 'path';
import { ExpenseManagerService } from "./backend/services";

const app = express();
const port = process.env.PORT || 3000;
const service = new ExpenseManagerService();

app.use(cors());
app.use(express.json());

// Servir frontend estático directamente
app.use(express.static(path.join(__dirname, '../src/frontend')));

// ENDPOINTS API

// 1. Obtener todos los usuarios (y balances)
app.get('/api/users', async (req, res) => {
    try {
        const users = await service.getUsersWithBalance();
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Crear usuario
app.post('/api/users', async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await service.createUser(name, email);
        res.status(201).json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// 3. Obtener eventos
app.get('/api/events', async (req, res) => {
    try {
        const events = await service.getEvents();
        res.json(events);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Crear evento
app.post('/api/events', async (req, res) => {
    try {
        const { title, amount, adminId } = req.body;
        const event = await service.createEvent(title, amount, adminId);
        res.status(201).json(event);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// 5. Agregar participante a evento
app.post('/api/events/:id/participants', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, assignedAmount } = req.body;
        
        const event = await service.addParticipantToEvent(
            id, 
            userId, 
            assignedAmount ? Number(assignedAmount) : undefined
        );
        res.json(event);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// 6. Eliminar usuario
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await service.deleteUser(id);
        res.status(200).json({ message: 'Usuario eliminado' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 7. Actualizar monto del evento
app.put('/api/events/:id/amount', async (req, res) => {
    try {
        const { id } = req.params;
        const { newAmount } = req.body;
        const event = await service.updateEventAmount(id, Number(newAmount));
        res.json(event);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// 8. Eliminar evento
app.delete('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await service.deleteEvent(id);
        res.status(200).json({ message: 'Evento eliminado' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Servidor y API corriendo en http://localhost:${port}`);
    console.log(`Frontend disponible en http://localhost:${port}/`);
});
