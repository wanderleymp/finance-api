"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStorageLoggerService = void 0;
var common_1 = require("@nestjs/common");
var FileStorageLoggerService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var FileStorageLoggerService = _classThis = /** @class */ (function () {
        function FileStorageLoggerService_1() {
            this.logger = new common_1.Logger(FileStorageLoggerService.name);
        }
        FileStorageLoggerService_1.prototype.logFileUpload = function (metadata, fileId) {
            this.logger.log(JSON.stringify({
                event: 'FILE_UPLOAD',
                fileName: metadata.fileName,
                fileSize: metadata.size,
                contentType: metadata.contentType,
                fileId: fileId
            }));
        };
        FileStorageLoggerService_1.prototype.logFileDownload = function (fileId, metadata) {
            this.logger.log(JSON.stringify({
                event: 'FILE_DOWNLOAD',
                fileId: fileId,
                fileName: metadata === null || metadata === void 0 ? void 0 : metadata.fileName,
                contentType: metadata === null || metadata === void 0 ? void 0 : metadata.contentType
            }));
        };
        FileStorageLoggerService_1.prototype.logFileDelete = function (fileId, metadata) {
            this.logger.log(JSON.stringify({
                event: 'FILE_DELETE',
                fileId: fileId,
                fileName: metadata === null || metadata === void 0 ? void 0 : metadata.fileName
            }));
        };
        FileStorageLoggerService_1.prototype.logError = function (context, error) {
            this.logger.error(JSON.stringify({
                event: 'FILE_STORAGE_ERROR',
                context: context,
                errorMessage: error.message,
                errorStack: error.stack
            }));
        };
        FileStorageLoggerService_1.prototype.logPerformance = function (method, startTime) {
            var duration = Date.now() - startTime;
            this.logger.log(JSON.stringify({
                event: 'FILE_STORAGE_PERFORMANCE',
                method: method,
                durationMs: duration
            }));
        };
        return FileStorageLoggerService_1;
    }());
    __setFunctionName(_classThis, "FileStorageLoggerService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FileStorageLoggerService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FileStorageLoggerService = _classThis;
}();
exports.FileStorageLoggerService = FileStorageLoggerService;
