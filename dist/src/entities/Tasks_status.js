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
exports.TasksStatus = void 0;
const typeorm_1 = require("typeorm");
let TasksStatus = class TasksStatus {
    status_id;
    name;
    is_default;
    createdAt;
    updatedAt;
};
exports.TasksStatus = TasksStatus;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(tasks_status_status_id_seq)' }),
    __metadata("design:type", Number)
], TasksStatus.prototype, "status_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], TasksStatus.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: false }),
    __metadata("design:type", Boolean)
], TasksStatus.prototype, "is_default", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TasksStatus.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TasksStatus.prototype, "updatedAt", void 0);
exports.TasksStatus = TasksStatus = __decorate([
    (0, typeorm_1.Entity)('tasks_status')
], TasksStatus);
//# sourceMappingURL=Tasks_status.js.map