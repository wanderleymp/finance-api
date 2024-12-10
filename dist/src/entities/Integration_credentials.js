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
exports.IntegrationCredentials = void 0;
const typeorm_1 = require("typeorm");
let IntegrationCredentials = class IntegrationCredentials {
    credential_id;
    integration_id;
    license_id;
    client_id;
    client_secret;
    scope;
    created_at;
    updated_at;
    certificate_data;
    key_data;
};
exports.IntegrationCredentials = IntegrationCredentials;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(integration_credentials_credential_id_seq)' }),
    __metadata("design:type", Number)
], IntegrationCredentials.prototype, "credential_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], IntegrationCredentials.prototype, "integration_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], IntegrationCredentials.prototype, "license_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ length: 255 }),
    __metadata("design:type", String)
], IntegrationCredentials.prototype, "client_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], IntegrationCredentials.prototype, "client_secret", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], IntegrationCredentials.prototype, "scope", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], IntegrationCredentials.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], IntegrationCredentials.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], IntegrationCredentials.prototype, "certificate_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], IntegrationCredentials.prototype, "key_data", void 0);
exports.IntegrationCredentials = IntegrationCredentials = __decorate([
    (0, typeorm_1.Entity)('integration_credentials')
], IntegrationCredentials);
//# sourceMappingURL=Integration_credentials.js.map