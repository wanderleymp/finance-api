"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InformationSchema = void 0;
const typeorm_1 = require("typeorm");
let InformationSchema = class InformationSchema {
};
exports.InformationSchema = InformationSchema;
exports.InformationSchema = InformationSchema = __decorate([
    (0, typeorm_1.Entity)('information_schema.tables')
], InformationSchema);
tables;
{
    table_catalog: string;
    table_schema: string;
    table_name: string;
    table_type: string;
    self_referencing_column_name: string;
    reference_generation: string;
    user_defined_type_catalog: string;
    user_defined_type_schema: string;
    user_defined_type_name: string;
    is_insertable_into: string;
    is_typed: string;
    commit_action: string;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=InformationSchema.tables.js.map