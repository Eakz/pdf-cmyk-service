"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const cache_1 = __importDefault(require("./cache"));
// Config
const port = 5000;
const oneMegabyteInBytes = 1000000;
const uploadFolder = './data/uploads';
const convertFolder = './data/cmyk';
// Boot express
const app = (0, express_1.default)();
const upload = (0, multer_1.default)({
    limits: { fileSize: oneMegabyteInBytes * 20 },
    storage: multer_1.default.diskStorage({
        destination: uploadFolder,
        filename: (_, file, cb) => {
            return cb(null, `${file.originalname.slice(0, 16)}-${Date.now()}${path_1.default.extname(file.originalname)}`);
        },
    }),
});
app.post('/:process', upload.single('rgbPdf'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const fileName = req.file.filename;
    const absPathToFile = path_1.default.join(process.cwd(), req.file.path);
    const folderPath = path_1.default.join(process.cwd(), convertFolder);
    const cmykFileName = `CMYK-${fileName}`;
    const pathToCmykFile = path_1.default.join(`${folderPath}/${cmykFileName}`);
    const actionId = req.params.process;
    if (!cache_1.default.queIsFull()) {
        const childProcess = yield (0, child_process_1.exec)(`gs -dSAFER \
        -dBATCH \
        -dNOPAUSE \
        -dNOCACHE \
        -dPDFX \
        -sDEVICE=pdfwrite \
        -sColorConversionStrategy=CMYK \
        -sOutputFile=${pathToCmykFile} ${absPathToFile}`, {}, (err, stdout, stderr) => {
            if (err) {
                // some err occurred
                res
                    .status(501)
                    .json({ status: 'FAIL', error: JSON.stringify({ err }) });
            }
            else {
                // the *entire* stdout and stderr (buffered)
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                const fileNames = fs_1.default.readdirSync(convertFolder);
                cache_1.default.removeProcessId(actionId);
                res.status(200).json({
                    status: 'SUCCESS',
                    fileNames,
                    path: `transformed/${cmykFileName}`,
                    name: cmykFileName,
                });
            }
        });
        if ((_a = req.params) === null || _a === void 0 ? void 0 : _a.process)
            cache_1.default.addProcessId({ key: actionId, id: childProcess.pid });
    }
    else {
        res.status(201).json({ status: 'BUSY' });
    }
}));
app.get('/:process', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const key = req.params.process;
    if (cache_1.default.hasProcessId(key) === 'SUCCESS') {
        const id = cache_1.default.getProcessId(key);
        if (typeof id === 'number') {
            try {
                const result = yield process.kill(id, 'SIGKILL');
                const result2 = yield process.kill(id + 1, 'SIGKILL');
                cache_1.default.removeProcessId(key);
                res.status(200).json({ status: 'SUCCESS', result });
            }
            catch (error) {
                res.status(501).json({ status: 'FAIL', error });
            }
        }
    }
    else {
        res.status(500).json({ status: 'FAIL' });
    }
}));
// Start server
app.listen(port, () => console.log(`Server is listening on port ${port}!\n-------- ${new Date().toUTCString()} --------`));
//# sourceMappingURL=app.js.map