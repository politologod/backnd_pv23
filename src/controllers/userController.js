const User = require("../models/user");

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener usuarios.", error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener usuario.", error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        await user.update(req.body);
        res.status(200).json({ message: "Usuario actualizado con éxito.", user });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar usuario.", error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        await user.destroy();
        res.status(200).json({ message: "Usuario eliminado con éxito." });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar usuario.", error: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json({ message: "Usuario creado con éxito.", user });
    } catch (error) {
        res.status(500).json({ message: "Error al crear usuario.", error: error.message });
    }
};

