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
    (0, typeorm_1.Entity)('pg_catalog.pg_statistic')
], PgCatalog);
pgStatistic;
{
    starelid: string;
    staattnum: string;
    stainherit: boolean;
    stanullfrac: string;
    stawidth: number;
    stadistinct: string;
    stakind1: string;
    stakind2: string;
    stakind3: string;
    stakind4: string;
    stakind5: string;
    staop1: string;
    staop2: string;
    staop3: string;
    staop4: string;
    staop5: string;
    stacoll1: string;
    stacoll2: string;
    stacoll3: string;
    stacoll4: string;
    stacoll5: string;
    stanumbers1: string;
    stanumbers2: string;
    stanumbers3: string;
    stanumbers4: string;
    stanumbers5: string;
    stavalues1: string;
    stavalues2: string;
    stavalues3: string;
    stavalues4: string;
    stavalues5: string;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=PgCatalog.pgStatistic.js.map