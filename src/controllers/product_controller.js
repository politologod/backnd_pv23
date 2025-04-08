const Product  = require("../models/model_products");
const  Category  = require("../models/model_category");







const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryIds } = req.body;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        await product.update(req.body);

		if (Array.isArray(categoryIds) && categoryIds.length > 0) {
			const categories = await Category.findAll({ where: { id: categoryIds } });
			await product.setCategories(categories);
		}
        res.json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};




// Crear un producto
const createProduct = async (req, res) => {
	try {
        const { categoryIds } = req.body;
		const product = await Product.create(req.body);

		// Asociar categorías (N:M)
		if (Array.isArray(categoryIds) && categoryIds.length > 0) {
			const categories = await Category.findAll({ where: { id: categoryIds } });
			await product.addCategories(categories);
		}

		res.status(201).json(product);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
};

// Obtener todos los productos con sus categorías
const getAllProducts = async (req, res) => {
	try {
		const products = await Product.findAll();
		res.json(products);
	} catch (error) {
		res.status(500).json({ error: "Error al obtener productos" });
	}
};


const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id, { include: Category });
        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        res.json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        await product.destroy();
        res.json({ message: "Producto eliminado con éxito" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}


const getProductByCategory = async (req, res) => {
	try {
		const { categoryId } = req.params;

		// Encontrar categoría
		const category = await Category.findByPk(categoryId, {
			include: [Product]
		});

		if (!category) {
			return res.status(404).json({ error: "Categoría no encontrada" });
		}

		// Devuelve los productos asociados
		res.json(category.Products);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
};


const getProductByNames = async (req, res) => {
    try {
        const { name } = req.query;
        const products = await Product.findAll({
            include: Category,
            where: { name: { [Op.iLike]: `%${name}%` } },
        });
        res.json(products);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const getProductByPrice = async (req, res) => {
    try {
        const { min, max } = req.query;
        const products = await Product.findAll({
            include: Category,
            where: { price: { [Op.between]: [min, max] } },
        });
        res.json(products);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

module.exports = { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, getProductByCategory, getProductByNames, getProductByPrice };
