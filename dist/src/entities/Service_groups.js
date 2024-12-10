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
exports.ServiceGroups = void 0;
const typeorm_1 = require("typeorm");
let ServiceGroups = class ServiceGroups {
    service_group_id;
    group_name;
    group_description;
    account_entry_id;
    created_at;
    updated_at;
    service_municipality_id;
};
exports.ServiceGroups = ServiceGroups;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(service_groups_service_group_id_seq)' }),
    __metadata("design:type", Number)
], ServiceGroups.prototype, "service_group_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], ServiceGroups.prototype, "group_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ServiceGroups.prototype, "group_description", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], ServiceGroups.prototype, "account_entry_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], ServiceGroups.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], ServiceGroups.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], ServiceGroups.prototype, "service_municipality_id", void 0);
exports.ServiceGroups = ServiceGroups = __decorate([
    (0, typeorm_1.Entity)('service_groups')
], ServiceGroups);
//# sourceMappingURL=Service_groups.js.map