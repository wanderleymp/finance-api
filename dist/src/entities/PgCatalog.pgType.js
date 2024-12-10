"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgCatalog = void 0;
const typeorm_1 = require("typeorm");
let PgCatalog = class PgCatalog {
};
exports.PgCatalog = PgCatalog;
exports.PgCatalog = PgCatalog = __decorate([
    (0, typeorm_1.Entity)('pg_catalog.pg_type')
], PgCatalog);
pgType;
{
    oid: string;
    typnamespace: string;
    typowner: string;
    typlen: string;
    typbyval: boolean;
    typtype: string;
    typcategory: string;
    typispreferred: boolean;
    typisdefined: boolean;
    typdelim: string;
    typrelid: string;
    typsubscript: string;
    typelem: string;
    typarray: string;
    typinput: string;
    typoutput: string;
    typreceive: string;
    typsend: string;
    typmodin: string;
    typmodout: string;
    typanalyze: string;
    typalign: string;
    typstorage: string;
    typnotnull: boolean;
    typbasetype: string;
    typtypmod: number;
    typndims: number;
    typcollation: string;
    typacl: string;
    typname: string;
    typdefaultbin: string;
    typdefault: string;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=PgCatalog.pgType.js.map