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
exports.PrismaMigrations = void 0;
const typeorm_1 = require("typeorm");
let PrismaMigrations = class PrismaMigrations {
    applied_steps_count;
    finished_at;
    rolled_back_at;
    started_at;
    checksum;
    logs;
    migration_name;
    id;
    created_at;
    updated_at;
};
exports.PrismaMigrations = PrismaMigrations;
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Number)
], PrismaMigrations.prototype, "applied_steps_count", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PrismaMigrations.prototype, "finished_at", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PrismaMigrations.prototype, "rolled_back_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], PrismaMigrations.prototype, "started_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 64 }),
    __metadata("design:type", String)
], PrismaMigrations.prototype, "checksum", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PrismaMigrations.prototype, "logs", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 255 }),
    __metadata("design:type", String)
], PrismaMigrations.prototype, "migration_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true, length: 36 }),
    __metadata("design:type", String)
], PrismaMigrations.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PrismaMigrations.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PrismaMigrations.prototype, "updated_at", void 0);
exports.PrismaMigrations = PrismaMigrations = __decorate([
    (0, typeorm_1.Entity)('_prisma_migrations')
], PrismaMigrations);
//# sourceMappingURL=PrismaMigrations.js.map