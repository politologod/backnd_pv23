// @ts-nocheck
import User from '../models/model_user';
import bcrypt from 'bcrypt';
import sequelize from '../configs/database';
import {  Order, OrderItem, Product  } from '../models';
import { Request, Response } from 'express';


export const getAllUsers = async (req: Request, res: Response) => {
    try {
        // Obtener total de usuarios por rol para diagnóstico
        const userCountByRole = await User.findAll({
            attributes: [
                'role',
                [sequelize.fn('COUNT', sequelize.col('id_autoincrement')), 'count']
            ],
            group: ['role']
        });

        // Consulta incluyendo las órdenes de cada usuario
        const users = await User.findAll({
            attributes: { 
                exclude: ['password'] 
            },
            include: [
                {
                    model: Order,
                    include: [
                        {
                            model: OrderItem,
                            include: [
                                {
                                    model: Product,
                                    attributes: ['id', 'name', 'price']
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Información del usuario autenticado para diagnóstico
        const authenticatedUser = (req as any).user ? {
            id: (req as any).user.id,
            email: (req as any).user.email,
            role: (req as any).user.role
        } : null;

        res.status(200).json({
            users,
            meta: {
                total: users.length,
                usersByRole: userCountByRole,
                authenticatedUser
            }
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ 
            message: "Error al obtener usuarios.", 
            error: (error as Error).message 
        });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener usuario.", error: (error as Error).message });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        await user.update(req.body);
        res.status(200).json({ message: "Usuario actualizado con éxito.", user });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar usuario.", error: (error as Error).message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        await user.destroy();
        res.status(200).json({ message: "Usuario eliminado con éxito." });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar usuario.", error: (error as Error).message });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        // Detectar si la solicitud es para un solo usuario o para múltiples
        const isBatchOperation = Array.isArray(req.body);
        
        // Si es una operación por lotes
        if (isBatchOperation) {
            return await handleBatchUserCreation(req, res);
        }
        
        // Validaciones básicas para un solo usuario
        const { email, password, name, role } = req.body;
        
        if (!email || !password || !name) {
            return res.status(400).json({ message: "Nombre, email y contraseña son campos requeridos." });
        }
        
        // Verificar si el email ya está registrado
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "El email ya está registrado." });
        }
        
        // Determinar rol
        let userRole = 'customer';
        if (role && (req as any).user && (req as any).user.role === 'admin') {
            userRole = role;
        }
        
        const user = await User.create({
            ...req.body,
            role: userRole
        });
        
        // Excluir la contraseña de la respuesta
        const userResponse = user.toJSON();
        delete userResponse.password;
        
        res.status(201).json({ 
            message: "Usuario creado con éxito.", 
            user: userResponse 
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ 
            message: "Error al crear usuario.", 
            error: (error as Error).message 
        });
    }
};

/**
 * Maneja la creación de múltiples usuarios en una sola operación
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handleBatchUserCreation(req: any, res: any) {
    const users = req.body;
    const results = {
        success: [],
        errors: []
    };
    
    // Validar que sea un array no vacío
    if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({ 
            error: "El formato para creación por lotes debe ser un array no vacío de usuarios" 
        });
    }
    
    // Limitar la cantidad de usuarios por operación
    const MAX_BATCH_SIZE = 50;
    if (users.length > MAX_BATCH_SIZE) {
        return res.status(400).json({ 
            error: `Demasiados usuarios en una sola operación. Máximo permitido: ${MAX_BATCH_SIZE}` 
        });
    }
    
    console.info(`Iniciando creación por lotes de ${users.length} usuarios`);
    
    // Recolectar todos los emails para verificar duplicados en una sola consulta
    const allEmails = users.map(user => user.email).filter(Boolean);
    const existingUsers = await User.findAll({ 
        where: { email: allEmails },
        attributes: ['email']
    });
    
    // Crear un conjunto de emails existentes para búsqueda rápida
    const existingEmails = new Set(existingUsers.map((user: any) => (user as any).email));
    
    // Procesar cada usuario
    for (let i = 0; i < users.length; i++) {
        const userData = users[i];
        
        try {
            // Validaciones básicas
            const { email, password, name, role } = userData;
            
            if (!email || !password || !name) {
                throw new Error("Nombre, email y contraseña son campos requeridos");
            }
            
            // Verificar si el email ya existe en nuestra base de datos
            if (existingEmails.has(email)) {
                throw new Error(`El email ${email} ya está registrado`);
            }
            
            // Añadir este email a nuestro conjunto para evitar duplicados en el mismo lote
            existingEmails.add(email);
            
            // Determinar rol
            let userRole = 'customer';
            if (role && req.user && req.user.role === 'admin') {
                userRole = role;
            }
            
            // Crear el usuario
            const user = await User.create({
                ...userData,
                role: userRole
            });
            
            // Añadir a resultados exitosos (sin incluir la contraseña)
            const userResponse = user.toJSON();
            delete userResponse.password;
            
            results.success.push({
                index: i,
                id: user.id_autoincrement,
                email: user.email,
                name: user.name,
                role: user.role
            });
            
            console.info(`Usuario ${i+1}/${users.length} creado con éxito`, { 
                id: user.id_autoincrement, 
                email: user.email,
                role: user.role
            });
            
        } catch (error) {
            console.error(`Error al crear usuario ${i+1}/${users.length}:`, error);
            
            // Añadir a errores
            results.errors.push({
                index: i,
                email: userData.email || 'Sin email',
                name: userData.name || 'Sin nombre',
                error: (error as Error).message
            });
        }
    }
    
    // Enviar respuesta con resultados
    const totalSuccess = results.success.length;
    const totalErrors = results.errors.length;
    
    console.info(`Creación por lotes de usuarios completada. Éxitos: ${totalSuccess}, Errores: ${totalErrors}`);
    
    res.status(207).json({
        message: `Creación por lotes completada. ${totalSuccess} usuarios creados con éxito, ${totalErrors} errores.`,
        success: results.success,
        errors: results.errors,
        stats: {
            total: users.length,
            successful: totalSuccess,
            failed: totalErrors
        }
    });
}

/**
 * Obtiene información del usuario autenticado actual
 */
export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        if (!(req as any).user || !(req as any).user.id) {
            return res.status(401).json({ 
                message: "No hay usuario autenticado" 
            });
        }
        
        // Buscar el usuario completo para obtener información actualizada
        const user = await User.findByPk((req as any).user.id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!user) {
            return res.status(404).json({ 
                message: "Usuario no encontrado en la base de datos",
                sessionUser: (req as any).user
            });
        }
        
        res.status(200).json({
            message: "Usuario actual",
            user,
            auth: {
                token: !!req.headers.authorization,
                sessionUser: (req as any).user
            }
        });
    } catch (error) {
        console.error('Error al obtener usuario actual:', error);
        res.status(500).json({ 
            message: "Error al obtener usuario actual", 
            error: (error as Error).message 
        });
    }
};


export {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
  getCurrentUser
};
