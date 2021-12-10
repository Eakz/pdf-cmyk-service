import express, { Application, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import Que from './cache';

// Types
type TfileType = 'rgbPdf';
type TuploadFileType = {
  fieldname: TfileType;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
};

// Config
const port = 5000;
const oneMegabyteInBytes = 1000000;
const uploadFolder = './data/uploads';
const convertFolder = './data/cmyk';
// Boot express
const app: Application = express();
const upload = multer({
  limits: { fileSize: oneMegabyteInBytes * 20 },
  storage: multer.diskStorage({
    destination: uploadFolder,
    filename: (_, file, cb) => {
      return cb(
        null,
        `${file.originalname.slice(0, 16)}-${Date.now()}${path.extname(
          file.originalname,
        )}`,
      );
    },
  }),
});
const corsAllowingMW =
  (allowedSites = '*') =>
  (req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', allowedSites);
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept',
    );
    next();
  };
// enable CORS without external module
app.use(corsAllowingMW('https://service.eakzit.site'));
app.post(
  '/:process',
  upload.single('rgbPdf'),
  async (req: Request & { file?: TuploadFileType }, res: Response) => {
    const fileName = req.file.filename;
    const absPathToFile = path.join(process.cwd(), req.file.path);
    const folderPath = path.join(process.cwd(), convertFolder);
    const cmykFileName = `CMYK-${fileName}`;
    const pathToCmykFile = path.join(`${folderPath}/${cmykFileName}`);
    const actionId = req.params.process;
    if (!Que.queIsFull()) {
      const childProcess = await exec(
        `gs -dSAFER \
        -dBATCH \
        -dNOPAUSE \
        -dNOCACHE \
        -dPDFX \
        -sDEVICE=pdfwrite \
        -sColorConversionStrategy=CMYK \
        -sOutputFile=${pathToCmykFile} ${absPathToFile}`,
        {},
        (err, stdout, stderr) => {
          if (err) {
            // some err occurred
            Que.removeProcessId(actionId);
            res
              .status(501)
              .json({ status: 'FAIL', error: JSON.stringify({ err }) });
          } else {
            // the *entire* stdout and stderr (buffered)
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            const fileNames = fs.readdirSync(convertFolder);
            Que.removeProcessId(actionId);
            res.status(200).json({
              status: 'SUCCESS',
              fileNames,
              path: `transformed/${cmykFileName}`,
              name: cmykFileName,
            });
          }
        },
      );
      if (req.params?.process) {
        Que.addProcessId({ key: actionId, id: childProcess.pid });
      }
    } else {
      res.status(201).json({ status: 'BUSY' });
    }
  },
);
app.get(
  '/transformed/:fileName',
  corsAllowingMW(),
  (req: Request, res: Response) => {
    const fileName = req.params.fileName;
    const convertedFolder = path
      .resolve(__dirname, '../data/cmyk')
      .replace('/dist', '');
    res.download(path.resolve(convertedFolder, fileName), fileName, (err) => {
      if (err) {
        res.status(500).send({
          message: 'Could not download the file. ' + err,
        });
      }
    });
  },
);
app.get('/:process', async (req: Request, res: Response) => {
  const key = req.params.process;
  if (Que.hasProcessId(key) === 'SUCCESS') {
    const id = Que.getProcessId(key);
    if (typeof id === 'number') {
      try {
        const result = await process.kill(id, 'SIGKILL');
        const result2 = await process.kill(id + 1, 'SIGKILL');
        Que.removeProcessId(key);
        res.status(200).json({ status: 'SUCCESS', result: result && result2 });
      } catch (error) {
        res.status(501).json({ status: 'FAIL', error });
      }
    }
  } else {
    res.status(500).json({ status: 'FAIL' });
  }
});
// Start server
app.listen(port, () =>
  console.log(
    `Server is listening on port ${port}!\n-------- ${new Date().toUTCString()} --------`,
  ),
);
