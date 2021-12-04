'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = __importDefault(require('express'));
// const fs = require('fs');
// const path = require('path');
// const multer = require('multer');
// const UPLOAD_FOLDER = './data/uploads';
// const oneMegabyteInBytes = 1000000;
// const upload = multer({
//     limits: { fileSize: oneMegabyteInBytes * 20 },
//     storage: multer.diskStorage({
//         destination: UPLOAD_FOLDER,
//         filename: (_, file, cb) => {
//             return cb(
//                 null,
//                 `${file.originalname.slice(0, 16)}-${Date.now()}${path.extname(
//                     file.originalname,
//                 )}`,
//             );
//         },
//     }),
// });
// const app = express();
// app.use(upload.array('theFiles'));
// const port = 3001;
// app.get('/', (req, res) => {
//     res.send('The sedulous hyena ate the antelope!');
// });
// app.listen(port, () => {
//     return console.log(`server is listening on ${port}`);
// });
// Boot express
const app = (0, express_1.default)();
const port = 5000;
// Application routing
app.use('/', (req, res, next) => {
  res.status(200).send({ data: 'Hello from Ornio AS' });
});
// Start server
app.listen(port, () => console.log(`Server is listening on port ${port}!`));
//# sourceMappingURL=app.js.map
