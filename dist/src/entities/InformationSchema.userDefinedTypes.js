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
    (0, typeorm_1.Entity)('information_schema.user_defined_types')
], InformationSchema);
userDefinedTypes;
{
    character_maximum_length: number;
    character_octet_length: number;
    numeric_precision: number;
    numeric_precision_radix: number;
    numeric_scale: number;
    datetime_precision: number;
    interval_precision: number;
    user_defined_type_catalog: string;
    user_defined_type_schema: string;
    user_defined_type_name: string;
    user_defined_type_category: string;
    is_instantiable: string;
    is_final: string;
    ordering_form: string;
    ordering_category: string;
    ordering_routine_catalog: string;
    ordering_routine_schema: string;
    ordering_routine_name: string;
    reference_type: string;
    data_type: string;
    character_set_catalog: string;
    character_set_schema: string;
    character_set_name: string;
    collation_catalog: string;
    collation_schema: string;
    collation_name: string;
    interval_type: string;
    source_dtd_identifier: string;
    ref_dtd_identifier: string;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=InformationSchema.userDefinedTypes.js.map