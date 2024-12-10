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
exports.ProcessesTypes = void 0;
const typeorm_1 = require("typeorm");
let ProcessesTypes = class ProcessesTypes {
    process_type_id;
    process_name;
    description;
    is_standard;
    created_at;
    updated_at;
};
exports.ProcessesTypes = ProcessesTypes;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(processes_types_process_type_id_seq)' }),
    __metadata("design:type", Number)
], ProcessesTypes.prototype, "process_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], ProcessesTypes.prototype, "process_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProcessesTypes.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: true }),
    __metadata("design:type", Boolean)
], ProcessesTypes.prototype, "is_standard", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], ProcessesTypes.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], ProcessesTypes.prototype, "updated_at", void 0);
exports.ProcessesTypes = ProcessesTypes = __decorate([
    (0, typeorm_1.Entity)('processes_types')
], ProcessesTypes);
//# sourceMappingURL=Processes_types.js.map