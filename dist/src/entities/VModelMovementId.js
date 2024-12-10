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
exports.VModelMovementId = void 0;
const typeorm_1 = require("typeorm");
let VModelMovementId = class VModelMovementId {
    model_movement_id;
    created_at;
    updated_at;
};
exports.VModelMovementId = VModelMovementId;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VModelMovementId.prototype, "model_movement_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], VModelMovementId.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], VModelMovementId.prototype, "updated_at", void 0);
exports.VModelMovementId = VModelMovementId = __decorate([
    (0, typeorm_1.Entity)('v_model_movement_id')
], VModelMovementId);
//# sourceMappingURL=VModelMovementId.js.map