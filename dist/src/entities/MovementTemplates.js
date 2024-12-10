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
exports.MovementTemplates = void 0;
const typeorm_1 = require("typeorm");
let MovementTemplates = class MovementTemplates {
    template_id;
    person_id;
    license_id;
    payment_method_id;
    total_value;
    created_at;
    updated_at;
    generate_nfse;
    generate_boleto;
    default_discount;
    default_addition;
    active;
    service_id;
    movement_date;
    vencimento_date;
    notifica;
    description;
    template_name;
    movement_type;
    created_at;
    updated_at;
};
exports.MovementTemplates = MovementTemplates;
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], MovementTemplates.prototype, "template_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MovementTemplates.prototype, "person_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Number)
], MovementTemplates.prototype, "license_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MovementTemplates.prototype, "payment_method_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MovementTemplates.prototype, "total_value", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MovementTemplates.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MovementTemplates.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], MovementTemplates.prototype, "generate_nfse", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], MovementTemplates.prototype, "generate_boleto", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MovementTemplates.prototype, "default_discount", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MovementTemplates.prototype, "default_addition", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], MovementTemplates.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Number)
], MovementTemplates.prototype, "service_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], MovementTemplates.prototype, "movement_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], MovementTemplates.prototype, "vencimento_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], MovementTemplates.prototype, "notifica", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MovementTemplates.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 255 }),
    __metadata("design:type", String)
], MovementTemplates.prototype, "template_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 50 }),
    __metadata("design:type", String)
], MovementTemplates.prototype, "movement_type", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MovementTemplates.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MovementTemplates.prototype, "updated_at", void 0);
exports.MovementTemplates = MovementTemplates = __decorate([
    (0, typeorm_1.Entity)('movement_templates')
], MovementTemplates);
//# sourceMappingURL=MovementTemplates.js.map