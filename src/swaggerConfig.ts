import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

export function setupSwagger(app: Express) {
    const swaggerOptions = {
        swaggerDefinition: {
            openapi: '3.0.0',
            info: {
                title: 'SecureData API',
                version: '1.0.0',
                description: 'API documentation for SecureData',
            },
            servers: [
                {
                    url: 'http://localhost:3000',
                    description: 'Development server',
                },
                {
                    url: 'https://backend-web3-phgb.onrender.com',
                    description: 'Production server (Render)',
                },
            ],
            
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT', // Optional, can be any string
                },
            },
        },
        security: [
            {
                bearerAuth: [], // Apply this globally to all endpoints
            },
        ],
        },
        apis: ['./src/index.ts'], // Make sure this path matches your codebase structure
    };

    const swaggerDocs = swaggerJsdoc(swaggerOptions);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}
