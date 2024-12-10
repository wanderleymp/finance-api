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
exports.ProcessesTasks = void 0;
const typeorm_1 = require("typeorm");
let ProcessesTasks = class ProcessesTasks {
    task_id;
    process_type_id;
    task_name;
    description;
    is_parallel;
    is_standard;
    created_at;
    updated_at;
};
exports.ProcessesTasks = ProcessesTasks;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(processes_tasks_task_id_seq)' }),
    __metadata("design:type", Number)
], ProcessesTasks.prototype, "task_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], ProcessesTasks.prototype, "process_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], ProcessesTasks.prototype, "task_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProcessesTasks.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: false }),
    __metadata("design:type", Boolean)
], ProcessesTasks.prototype, "is_parallel", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: true }),
    __metadata("design:type", Boolean)
], ProcessesTasks.prototype, "is_standard", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], ProcessesTasks.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], ProcessesTasks.prototype, "updated_at", void 0);
exports.ProcessesTasks = ProcessesTasks = __decorate([
    (0, typeorm_1.Entity)('processes_tasks')
], ProcessesTasks);
//# sourceMappingURL=Processes_tasks.js.map