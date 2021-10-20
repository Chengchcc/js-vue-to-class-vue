"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fast_glob_1 = __importDefault(require("fast-glob"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var compiler_sfc_1 = require("@vue/compiler-sfc");
var ts_morph_1 = require("ts-morph");
// @ts-ignore
var vue_sfc_descriptor_to_string_1 = __importDefault(require("vue-sfc-descriptor-to-string"));
var vueClassComponentBuilder_1 = __importDefault(require("./vueClassComponentBuilder"));
var assert_1 = __importDefault(require("assert"));
var minimist_1 = __importDefault(require("minimist"));
function main() {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var args, project, relatePathT, files, descriptors, _i, descriptors_1, desc, sf, vueClassBuilder, content, raw, outputPath;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    args = (0, minimist_1.default)(process.argv.slice(2), {
                        default: {
                            output: 'output'
                        }
                    });
                    assert_1.default.ok(args.output, 'output required');
                    assert_1.default.ok(args.input, 'input required');
                    project = new ts_morph_1.Project({
                        compilerOptions: {
                            declaration: true,
                            emitDeclarationOnly: true,
                            noEmitOnError: true,
                            strict: false,
                            noImplicitAny: false,
                            allowJs: true,
                            outDir: 'types' // 可以设置自定义的打包文件夹，如 'types'
                        },
                        skipAddingFilesFromTsConfig: true
                    });
                    relatePathT = path_1.default.relative(process.cwd(), path_1.default.resolve(process.cwd(), args.input));
                    return [4 /*yield*/, (0, fast_glob_1.default)([relatePathT + "/**/*.js", relatePathT + "/**/*.vue"])];
                case 1:
                    files = _b.sent();
                    descriptors = [];
                    return [4 /*yield*/, Promise.all(files.map(function (file) { return __awaiter(_this, void 0, void 0, function () {
                            var sfc, _a, script, sf;
                            var _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        if (!/\.vue$/.test(file)) return [3 /*break*/, 2];
                                        _a = compiler_sfc_1.parse;
                                        return [4 /*yield*/, fs_1.default.promises.readFile(file, 'utf8')];
                                    case 1:
                                        sfc = _a.apply(void 0, [_c.sent()]);
                                        script = sfc.descriptor.script;
                                        if (script && script.content) {
                                            sf = project.createSourceFile((_b = file + '.' + script.lang) !== null && _b !== void 0 ? _b : 'js', script.content);
                                            descriptors.push(__assign(__assign({}, sfc.descriptor), { file: sf, path: file }));
                                        }
                                        else {
                                            descriptors.push(__assign(__assign({}, sfc.descriptor), { path: file }));
                                        }
                                        _c.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 2:
                    _b.sent();
                    _i = 0, descriptors_1 = descriptors;
                    _b.label = 3;
                case 3:
                    if (!(_i < descriptors_1.length)) return [3 /*break*/, 7];
                    desc = descriptors_1[_i];
                    if (desc.file) {
                        sf = desc.file;
                        vueClassBuilder = new vueClassComponentBuilder_1.default();
                        vueClassBuilder.build(sf);
                        sf.formatText();
                        content = sf.getFullText();
                        desc.script.content = content;
                        // desc.script!.lang = desc.script?.lang == 'jsx'? 'tsx': 'ts'
                        desc.script.attrs = {
                            lang: ((_a = desc.script) === null || _a === void 0 ? void 0 : _a.lang) == 'jsx' ? 'tsx' : 'ts'
                        };
                    }
                    raw = (0, vue_sfc_descriptor_to_string_1.default)(desc);
                    outputPath = desc.path.replace(args.input, args.output);
                    return [4 /*yield*/, fs_1.default.promises.mkdir(path_1.default.dirname(outputPath), { recursive: true })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, fs_1.default.promises.writeFile(outputPath, raw, 'utf8')];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 3];
                case 7: return [2 /*return*/];
            }
        });
    });
}
main();
