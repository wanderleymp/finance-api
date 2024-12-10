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
exports.ServiceLc116 = void 0;
const typeorm_1 = require("typeorm");
let ServiceLc116 = class ServiceLc116 {
    service_lc116_id;
    code;
    description;
    cnae;
    created_at;
    updated_at;
};
exports.ServiceLc116 = ServiceLc116;
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], ServiceLc116.prototype, "service_lc116_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 10 }),
    __metadata("design:type", String)
], ServiceLc116.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], ServiceLc116.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10 }),
    __metadata("design:type", String)
], ServiceLc116.prototype, "cnae", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ServiceLc116.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ServiceLc116.prototype, "updated_at", void 0);
exports.ServiceLc116 = ServiceLc116 = __decorate([
    (0, typeorm_1.Entity)('service_lc116')
], ServiceLc116);
//# sourceMappingURL=ServiceLc116.js.map