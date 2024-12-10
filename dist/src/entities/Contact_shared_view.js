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
    contact_value;
    contact_name;
    contact_type_name;
    busines;
    createdAt;
    updatedAt;
};
exports.ContactSharedView = ContactSharedView;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], ContactSharedView.prototype, "contact_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 100 }),
    __metadata("design:type", String)
], ContactSharedView.prototype, "contact_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 150 }),
    __metadata("design:type", String)
], ContactSharedView.prototype, "contact_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], ContactSharedView.prototype, "contact_type_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], ContactSharedView.prototype, "busines", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ContactSharedView.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ContactSharedView.prototype, "updatedAt", void 0);
exports.ContactSharedView = ContactSharedView = __decorate([
    (0, typeorm_1.Entity)('contact_shared_view')
], ContactSharedView);
//# sourceMappingURL=Contact_shared_view.js.map