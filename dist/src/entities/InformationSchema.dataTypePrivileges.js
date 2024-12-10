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
    (0, typeorm_1.Entity)('information_schema.data_type_privileges')
], InformationSchema);
dataTypePrivileges;
{
    object_catalog: string;
    object_schema: string;
    object_name: string;
    object_type: string;
    dtd_identifier: string;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=InformationSchema.dataTypePrivileges.js.map