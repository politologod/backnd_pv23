/**
 * Utilidades de validación centralizadas para la aplicación
 * Estas funciones permiten validar datos de entrada de manera consistente en toda la aplicación
 */

// Validadores comunes
const validateString = (value, { min = 1, max = 255, required = true } = {}) => {
    if (!value && required) {
        return { valid: false, message: 'El valor es requerido' };
    }
    
    if (!value && !required) {
        return { valid: true };
    }
    
    if (typeof value !== 'string') {
        return { valid: false, message: 'El valor debe ser una cadena de texto' };
    }
    
    const trimmed = value.trim();
    
    if (trimmed.length < min) {
        return { valid: false, message: `El valor debe tener al menos ${min} caracteres` };
    }
    
    if (trimmed.length > max) {
        return { valid: false, message: `El valor no debe exceder ${max} caracteres` };
    }
    
    return { valid: true };
};

const validateNumber = (value, { min, max, required = true, isInteger = false } = {}) => {
    if ((value === undefined || value === null) && required) {
        return { valid: false, message: 'El valor es requerido' };
    }
    
    if ((value === undefined || value === null) && !required) {
        return { valid: true };
    }
    
    const num = Number(value);
    
    if (isNaN(num)) {
        return { valid: false, message: 'El valor debe ser un número válido' };
    }
    
    if (isInteger && !Number.isInteger(num)) {
        return { valid: false, message: 'El valor debe ser un número entero' };
    }
    
    if (min !== undefined && num < min) {
        return { valid: false, message: `El valor debe ser mayor o igual a ${min}` };
    }
    
    if (max !== undefined && num > max) {
        return { valid: false, message: `El valor debe ser menor o igual a ${max}` };
    }
    
    return { valid: true };
};

const validateEmail = (email, { required = true } = {}) => {
    if (!email && required) {
        return { valid: false, message: 'El correo electrónico es requerido' };
    }
    
    if (!email && !required) {
        return { valid: true };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'El correo electrónico no es válido' };
    }
    
    return { valid: true };
};

const validateUrl = (url, { required = false } = {}) => {
    if (!url && required) {
        return { valid: false, message: 'La URL es requerida' };
    }
    
    if (!url && !required) {
        return { valid: true };
    }
    
    try {
        new URL(url);
        return { valid: true };
    } catch (error) {
        return { valid: false, message: 'La URL no es válida' };
    }
};

const validateArray = (array, { minLength = 0, maxLength, required = true } = {}) => {
    if (!array && required) {
        return { valid: false, message: 'El array es requerido' };
    }
    
    if (!array && !required) {
        return { valid: true };
    }
    
    if (!Array.isArray(array)) {
        return { valid: false, message: 'El valor debe ser un array' };
    }
    
    if (array.length < minLength) {
        return { valid: false, message: `El array debe tener al menos ${minLength} elementos` };
    }
    
    if (maxLength !== undefined && array.length > maxLength) {
        return { valid: false, message: `El array no debe exceder ${maxLength} elementos` };
    }
    
    return { valid: true };
};

// Validadores para modelos específicos
const validateProduct = (data) => {
    const errors = {};
    
    // Validar nombre
    const nameValidation = validateString(data.name, { min: 3, max: 100 });
    if (!nameValidation.valid) {
        errors.name = nameValidation.message;
    }
    
    // Validar SKU
    if (data.sku !== undefined) {
        const skuValidation = validateString(data.sku, { required: false, min: 3, max: 50 });
        if (!skuValidation.valid) {
            errors.sku = skuValidation.message;
        }
    }
    
    // Validar descripción
    const descriptionValidation = validateString(data.description, { required: false, max: 1000 });
    if (!descriptionValidation.valid) {
        errors.description = descriptionValidation.message;
    }
    
    // Validar precio
    const priceValidation = validateNumber(data.price, { min: 0 });
    if (!priceValidation.valid) {
        errors.price = priceValidation.message;
    }
    
    // Validar stock
    const stockValidation = validateNumber(data.stock, { min: 0, isInteger: true });
    if (!stockValidation.valid) {
        errors.stock = stockValidation.message;
    }
    
    // Validar URL de imagen
    const imageUrlValidation = validateUrl(data.imageUrl, { required: false });
    if (!imageUrlValidation.valid) {
        errors.imageUrl = imageUrlValidation.message;
    }
    
    // Validar categorías
    if (data.categoryIds) {
        const categoryIdsValidation = validateArray(data.categoryIds, { required: false });
        if (!categoryIdsValidation.valid) {
            errors.categoryIds = categoryIdsValidation.message;
        }
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
};

const validateCategory = (data) => {
    const errors = {};
    
    // Validar nombre
    const nameValidation = validateString(data.name, { min: 2, max: 50 });
    if (!nameValidation.valid) {
        errors.name = nameValidation.message;
    }
    
    // Validar descripción
    const descriptionValidation = validateString(data.description, { required: false, max: 500 });
    if (!descriptionValidation.valid) {
        errors.description = descriptionValidation.message;
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
};

const validateUser = (data, isUpdate = false) => {
    const errors = {};
    
    // Validar nombre
    const nameValidation = validateString(data.name, { min: 2, max: 100 });
    if (!nameValidation.valid) {
        errors.name = nameValidation.message;
    }
    
    // Validar email
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.valid) {
        errors.email = emailValidation.message;
    }
    
    // Validar contraseña sólo si es creación o si se proporciona en actualización
    if (!isUpdate || data.password) {
        const passwordValidation = validateString(data.password, { min: 8, max: 100 });
        if (!passwordValidation.valid) {
            errors.password = passwordValidation.message;
        }
    }
    
    // Validar dirección
    const addressValidation = validateString(data.address, { required: false, max: 200 });
    if (!addressValidation.valid) {
        errors.address = addressValidation.message;
    }
    
    // Validar teléfono
    const phoneValidation = validateString(data.phone, { required: false, max: 20 });
    if (!phoneValidation.valid) {
        errors.phone = phoneValidation.message;
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
};

// Exportar validadores
module.exports = {
    // Validadores generales
    validateString,
    validateNumber,
    validateEmail,
    validateUrl,
    validateArray,
    
    // Validadores de modelos
    validateProduct,
    validateCategory,
    validateUser
}; 