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
exports.Channels = void 0;
const typeorm_1 = require("typeorm");
let Channels = class Channels {
    channel_id;
    channel_name;
    contact_type_id;
    contact_value;
    is_active;
    department_id;
    created_at;
    updated_at;
};
exports.Channels = Channels;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(channels_channel_id_seq)' }),
    __metadata("design:type", Number)
], Channels.prototype, "channel_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Channels.prototype, "channel_name", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Channels.prototype, "contact_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], Channels.prototype, "contact_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: true }),
    __metadata("design:type", Boolean)
], Channels.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], Channels.prototype, "department_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], Channels.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], Channels.prototype, "updated_at", void 0);
exports.Channels = Channels = __decorate([
    (0, typeorm_1.Entity)('channels')
], Channels);
//# sourceMappingURL=Channels.js.map