"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
const typeorm_1 = require("typeorm");
let Model = class Model {
};
exports.Model = Model;
exports.Model = Model = __decorate([
    (0, typeorm_1.Entity)('model.db_scripts')
], Model);
dbScripts;
{
    script_id: number;
    version_id: number;
    execution_order: number;
    applied: boolean;
    object_type: string;
    object_name: string;
    script_content: string;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=Model.dbScripts.js.map