"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
function setupSwagger(app) {
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
                    url: 'https://backendnew-wd64.onrender.com',
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
    const swaggerDocs = (0, swagger_jsdoc_1.default)(swaggerOptions);
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocs));
}
