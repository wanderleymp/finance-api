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
exports.PersonContactPersonContactGroup = void 0;
const typeorm_1 = require("typeorm");
let PersonContactPersonContactGroup = class PersonContactPersonContactGroup {
    person_contact_id;
    group_id;
    created_at;
    updatedAt;
};
exports.PersonContactPersonContactGroup = PersonContactPersonContactGroup;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PersonContactPersonContactGroup.prototype, "person_contact_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PersonContactPersonContactGroup.prototype, "group_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], PersonContactPersonContactGroup.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PersonContactPersonContactGroup.prototype, "updatedAt", void 0);
exports.PersonContactPersonContactGroup = PersonContactPersonContactGroup = __decorate([
    (0, typeorm_1.Entity)('person_contact_person_contact_group')
], PersonContactPersonContactGroup);
//# sourceMappingURL=Person_contact_person_contact_group.js.map