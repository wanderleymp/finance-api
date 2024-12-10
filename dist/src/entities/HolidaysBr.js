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
exports.HolidaysBr = void 0;
const typeorm_1 = require("typeorm");
let HolidaysBr = class HolidaysBr {
    holiday_id;
    day;
    month;
    year;
    name;
    description;
    holiday_type;
    state_code;
    city;
    created_at;
    updated_at;
};
exports.HolidaysBr = HolidaysBr;
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], HolidaysBr.prototype, "holiday_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], HolidaysBr.prototype, "day", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], HolidaysBr.prototype, "month", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], HolidaysBr.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], HolidaysBr.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], HolidaysBr.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 20 }),
    __metadata("design:type", String)
], HolidaysBr.prototype, "holiday_type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], HolidaysBr.prototype, "state_code", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], HolidaysBr.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], HolidaysBr.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], HolidaysBr.prototype, "updated_at", void 0);
exports.HolidaysBr = HolidaysBr = __decorate([
    (0, typeorm_1.Entity)('holidays_br')
], HolidaysBr);
//# sourceMappingURL=HolidaysBr.js.map