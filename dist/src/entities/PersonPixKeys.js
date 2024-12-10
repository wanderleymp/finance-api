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
exports.PersonPixKeys = void 0;
const typeorm_1 = require("typeorm");
let PersonPixKeys = class PersonPixKeys {
    pix_key_id;
    person_id;
    pix_key_type_id;
    is_preferred;
    created_at;
    pix_key_value;
    created_at;
    updated_at;
};
exports.PersonPixKeys = PersonPixKeys;
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], PersonPixKeys.prototype, "pix_key_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Number)
], PersonPixKeys.prototype, "person_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Number)
], PersonPixKeys.prototype, "pix_key_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], PersonPixKeys.prototype, "is_preferred", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PersonPixKeys.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 255 }),
    __metadata("design:type", String)
], PersonPixKeys.prototype, "pix_key_value", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PersonPixKeys.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PersonPixKeys.prototype, "updated_at", void 0);
exports.PersonPixKeys = PersonPixKeys = __decorate([
    (0, typeorm_1.Entity)('person_pix_keys')
], PersonPixKeys);
//# sourceMappingURL=PersonPixKeys.js.map