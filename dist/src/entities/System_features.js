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
exports.SystemFeatures = void 0;
const typeorm_1 = require("typeorm");
let SystemFeatures = class SystemFeatures {
    feature_id;
    feature_name;
    feature_description;
    createdAt;
    updatedAt;
};
exports.SystemFeatures = SystemFeatures;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(system_features_feature_id_seq)' }),
    __metadata("design:type", Number)
], SystemFeatures.prototype, "feature_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], SystemFeatures.prototype, "feature_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SystemFeatures.prototype, "feature_description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SystemFeatures.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SystemFeatures.prototype, "updatedAt", void 0);
exports.SystemFeatures = SystemFeatures = __decorate([
    (0, typeorm_1.Entity)('system_features')
], SystemFeatures);
//# sourceMappingURL=System_features.js.map