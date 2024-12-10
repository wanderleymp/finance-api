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
exports.VwPersonsComplete = void 0;
const typeorm_1 = require("typeorm");
let VwPersonsComplete = class VwPersonsComplete {
    person_id;
    birth_date;
    created_at;
    social_capital;
    contacts;
    documents;
    pix_keys;
    tax_regimes;
    licenses;
    qsa;
    cnae;
    full_name;
    fantasy_name;
    person_type_description;
    created_at;
    updated_at;
};
exports.VwPersonsComplete = VwPersonsComplete;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwPersonsComplete.prototype, "person_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], VwPersonsComplete.prototype, "birth_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], VwPersonsComplete.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], VwPersonsComplete.prototype, "social_capital", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], VwPersonsComplete.prototype, "contacts", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], VwPersonsComplete.prototype, "documents", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], VwPersonsComplete.prototype, "pix_keys", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], VwPersonsComplete.prototype, "tax_regimes", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], VwPersonsComplete.prototype, "licenses", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], VwPersonsComplete.prototype, "qsa", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], VwPersonsComplete.prototype, "cnae", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], VwPersonsComplete.prototype, "full_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], VwPersonsComplete.prototype, "fantasy_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], VwPersonsComplete.prototype, "person_type_description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], VwPersonsComplete.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], VwPersonsComplete.prototype, "updated_at", void 0);
exports.VwPersonsComplete = VwPersonsComplete = __decorate([
    (0, typeorm_1.Entity)('vw_persons_complete')
], VwPersonsComplete);
//# sourceMappingURL=VwPersonsComplete.js.map