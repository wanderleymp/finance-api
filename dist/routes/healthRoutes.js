"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthController_js_1 = require("../controllers/healthController.js");
const healthRoutes = (0, express_1.Router)();
healthRoutes.get('/health', healthController_js_1.getHealthStatus);
exports.default = healthRoutes;
