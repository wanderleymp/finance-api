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
exports.ContactSharedView = void 0;
const typeorm_1 = require("typeorm");
let ContactSharedView = class ContactSharedView {
    contact_id;
    busines;
    contact_value;
    contact_name;
    contact_type_name;
    created_at;
    updated_at;
};
exports.ContactSharedView = ContactSharedView;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ContactSharedView.prototype, "contact_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], ContactSharedView.prototype, "busines", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], ContactSharedView.prototype, "contact_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], ContactSharedView.prototype, "contact_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], ContactSharedView.prototype, "contact_type_name", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ContactSharedView.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ContactSharedView.prototype, "updated_at", void 0);
exports.ContactSharedView = ContactSharedView = __decorate([
    (0, typeorm_1.Entity)('contact_shared_view')
], ContactSharedView);
//# sourceMappingURL=ContactSharedView.js.map