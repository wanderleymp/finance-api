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
    (0, typeorm_1.Entity)('information_schema._pg_foreign_servers')
], InformationSchema);
PgForeignServers;
{
    oid: string;
    srvoptions: string;
    foreign_server_catalog: string;
    foreign_server_name: string;
    foreign_data_wrapper_catalog: string;
    foreign_data_wrapper_name: string;
    foreign_server_type: string;
    foreign_server_version: string;
    authorization_identifier: string;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=InformationSchema.PgForeignServers.js.map