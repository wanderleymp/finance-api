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
exports.DbScripts = void 0;
const typeorm_1 = require("typeorm");
let DbScripts = class DbScripts {
    script_id;
    version_id;
    object_type;
    object_name;
    execution_order;
    script_content;
    applied;
    createdAt;
    updatedAt;
};
exports.DbScripts = DbScripts;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(model.db_scripts_script_id_seq)' }),
    __metadata("design:type", Number)
], DbScripts.prototype, "script_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DbScripts.prototype, "version_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], DbScripts.prototype, "object_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], DbScripts.prototype, "object_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], DbScripts.prototype, "execution_order", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DbScripts.prototype, "script_content", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: false }),
    __metadata("design:type", Boolean)
], DbScripts.prototype, "applied", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DbScripts.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DbScripts.prototype, "updatedAt", void 0);
exports.DbScripts = DbScripts = __decorate([
    (0, typeorm_1.Entity)('db_scripts')
], DbScripts);
//# sourceMappingURL=Db_scripts.js.map