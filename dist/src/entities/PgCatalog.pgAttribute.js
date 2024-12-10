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
    (0, typeorm_1.Entity)('pg_catalog.pg_attribute')
], PgCatalog);
pgAttribute;
{
    attrelid: string;
    atttypid: string;
    attlen: string;
    attnum: string;
    attcacheoff: number;
    atttypmod: number;
    attndims: string;
    attbyval: boolean;
    attalign: string;
    attstorage: string;
    attcompression: string;
    attnotnull: boolean;
    atthasdef: boolean;
    atthasmissing: boolean;
    attidentity: string;
    attgenerated: string;
    attisdropped: boolean;
    attislocal: boolean;
    attinhcount: string;
    attstattarget: string;
    attcollation: string;
    attacl: string;
    attmissingval: string;
    attname: string;
    attoptions: string;
    attfdwoptions: string;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=PgCatalog.pgAttribute.js.map