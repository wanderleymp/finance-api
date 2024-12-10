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
exports.PersonContactGroup = void 0;
const typeorm_1 = require("typeorm");
let PersonContactGroup = class PersonContactGroup {
    group_id;
    group_name;
    created_at;
    updated_at;
};
exports.PersonContactGroup = PersonContactGroup;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(person_contact_group_group_id_seq)' }),
    __metadata("design:type", Number)
], PersonContactGroup.prototype, "group_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], PersonContactGroup.prototype, "group_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], PersonContactGroup.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], PersonContactGroup.prototype, "updated_at", void 0);
exports.PersonContactGroup = PersonContactGroup = __decorate([
    (0, typeorm_1.Entity)('person_contact_group')
], PersonContactGroup);
//# sourceMappingURL=Person_contact_group.js.map