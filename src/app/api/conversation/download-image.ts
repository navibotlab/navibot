import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ message: 'Imagem não fornecida' });
  }

  const imageBuffer = Buffer.from(image, 'base64');
  const imageName = `${uuidv4()}.jpg`;
  const imagesDir = path.join(process.cwd(), 'public', 'images');

  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const imagePath = path.join(imagesDir, imageName);

  fs.writeFile(imagePath, imageBuffer, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao salvar a imagem' });
    }

    const imageUrl = `/images/${imageName}`;
    res.status(200).json({ imageUrl });
  });
} 