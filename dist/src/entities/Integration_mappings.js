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
exports.IntegrationMappings = void 0;
const typeorm_1 = require("typeorm");
let IntegrationMappings = class IntegrationMappings {
    mapping_id;
    integration_id;
    entity_type;
    entity_id;
    external_id;
    external_data;
    created_at;
    updated_at;
    entity_type_id;
};
exports.IntegrationMappings = IntegrationMappings;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(integration_mappings_mapping_id_seq)' }),
    __metadata("design:type", Number)
], IntegrationMappings.prototype, "mapping_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], IntegrationMappings.prototype, "integration_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], IntegrationMappings.prototype, "entity_type", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], IntegrationMappings.prototype, "entity_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ length: 255 }),
    __metadata("design:type", String)
], IntegrationMappings.prototype, "external_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], IntegrationMappings.prototype, "external_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], IntegrationMappings.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], IntegrationMappings.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], IntegrationMappings.prototype, "entity_type_id", void 0);
exports.IntegrationMappings = IntegrationMappings = __decorate([
    (0, typeorm_1.Entity)('integration_mappings')
], IntegrationMappings);
//# sourceMappingURL=Integration_mappings.js.map