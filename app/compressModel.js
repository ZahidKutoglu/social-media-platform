// pages/api/compressModel.js
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { processGlb } from 'gltf-pipeline';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();
    form.uploadDir = path.join(process.cwd(), 'temp'); // Temp folder for file upload
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'Error parsing the file' });
      }

      const file = files.file[0];
      const filePath = file.filepath;

      try {
        const glbData = fs.readFileSync(filePath);
        const options = {
          dracoOptions: {
            compressionLevel: 10
          }
        };
        const result = await processGlb(glbData, options);
        const compressedFilePath = path.join(process.cwd(), 'temp', 'compressed.glb');
        fs.writeFileSync(compressedFilePath, result.glb);

        res.status(200).json({ file: compressedFilePath });
      } catch (error) {
        res.status(500).json({ error: 'Error compressing the file' });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
