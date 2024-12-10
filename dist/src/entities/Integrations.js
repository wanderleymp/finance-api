"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Integrations = void 0;
const typeorm_1 = require("typeorm");
let Integrations = class Integrations {
    integration_id;
    system_name;
    system_description;
    api_endpoint;
    authentication_method;
    created_at;
    updated_at;
    is_global;
};
exports.Integrations = Integrations;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(integrations_integration_id_seq)' }),
    __metadata("design:type", Number)
], Integrations.prototype, "integration_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Integrations.prototype, "system_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Integrations.prototype, "system_description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], Integrations.prototype, "api_endpoint", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], Integrations.prototype, "authentication_method", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], Integrations.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], Integrations.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: true }),
    __metadata("design:type", Boolean)
], Integrations.prototype, "is_global", void 0);
exports.Integrations = Integrations = __decorate([
    (0, typeorm_1.Entity)('integrations')
], Integrations);
//# sourceMappingURL=Integrations.js.map