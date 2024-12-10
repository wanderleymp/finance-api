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
exports.VwServicesDetails = void 0;
const typeorm_1 = require("typeorm");
let VwServicesDetails = class VwServicesDetails {
    item_id;
    item_name;
    item_description;
    municipality_code;
    lc116_code;
    lc116_description;
    cnae;
    created_at;
    updated_at;
};
exports.VwServicesDetails = VwServicesDetails;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwServicesDetails.prototype, "item_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], VwServicesDetails.prototype, "item_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], VwServicesDetails.prototype, "item_description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], VwServicesDetails.prototype, "municipality_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10 }),
    __metadata("design:type", String)
], VwServicesDetails.prototype, "lc116_code", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], VwServicesDetails.prototype, "lc116_description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10 }),
    __metadata("design:type", String)
], VwServicesDetails.prototype, "cnae", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], VwServicesDetails.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], VwServicesDetails.prototype, "updated_at", void 0);
exports.VwServicesDetails = VwServicesDetails = __decorate([
    (0, typeorm_1.Entity)('vw_services_details')
], VwServicesDetails);
//# sourceMappingURL=VwServicesDetails.js.map