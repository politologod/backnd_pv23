import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Ecommerce Backend API',
            version: '1.0.0',
            description: 'Documentación de la API REST del backend de ecommerce',
        },
        servers: [
            {
                url: 'http://localhost:2300',
                description: 'Servidor de desarrollo',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{
            bearerAuth: [],
        }],
    },
    apis: ['./src/routes/*.ts'], // archivos donde buscar anotaciones
};

const specs = swaggerJsdoc(options);

export default specs; 