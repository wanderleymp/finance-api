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
exports.TaskDependencies = void 0;
const typeorm_1 = require("typeorm");
let TaskDependencies = class TaskDependencies {
    dependency_id;
    task_id;
    depends_on;
    createdAt;
    updatedAt;
};
exports.TaskDependencies = TaskDependencies;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(task_dependencies_dependency_id_seq)' }),
    __metadata("design:type", Number)
], TaskDependencies.prototype, "dependency_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TaskDependencies.prototype, "task_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TaskDependencies.prototype, "depends_on", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TaskDependencies.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TaskDependencies.prototype, "updatedAt", void 0);
exports.TaskDependencies = TaskDependencies = __decorate([
    (0, typeorm_1.Entity)('task_dependencies')
], TaskDependencies);
//# sourceMappingURL=Task_dependencies.js.map