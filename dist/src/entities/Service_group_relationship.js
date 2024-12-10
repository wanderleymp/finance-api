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
exports.ServiceGroupRelationship = void 0;
const typeorm_1 = require("typeorm");
let ServiceGroupRelationship = class ServiceGroupRelationship {
    service_group_relationship_id;
    service_group_id;
    created_at;
    updated_at;
};
exports.ServiceGroupRelationship = ServiceGroupRelationship;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(service_group_relationship_service_group_relationship_id_seq)' }),
    __metadata("design:type", Number)
], ServiceGroupRelationship.prototype, "service_group_relationship_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ServiceGroupRelationship.prototype, "service_group_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], ServiceGroupRelationship.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], ServiceGroupRelationship.prototype, "updated_at", void 0);
exports.ServiceGroupRelationship = ServiceGroupRelationship = __decorate([
    (0, typeorm_1.Entity)('service_group_relationship')
], ServiceGroupRelationship);
//# sourceMappingURL=Service_group_relationship.js.map