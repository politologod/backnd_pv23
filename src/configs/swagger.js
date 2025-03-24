const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Puravida23 Ecommerce Backend',
            version: '1.0.0',
            description: 'Documentación de la API de Puravida23 Ecommerce',
        },
        servers: [
            {
                url: 'http://localhost:777',
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
    apis: ['./src/routes/*.js'], // archivos donde buscar anotaciones
};

const specs = swaggerJsdoc(options);

module.exports = specs; 