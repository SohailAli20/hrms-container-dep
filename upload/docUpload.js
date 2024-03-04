require("dotenv").config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multipart = require('parse-multipart');

const s3Client = new S3Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    const contentTypeHeader = event.headers['Content-Type'];
    console.log(contentTypeHeader )
    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'binary');
    const boundary = multipart.getBoundary(contentTypeHeader);
    const parts = multipart.Parse(bodyBuffer, boundary);
    const filePart = parts.find(part => part.filename);
    const { filename, data, type } = filePart;
    const imageFormat = type.split('/')[1] || 'unknown';
    const fileName = `${filename.replace(/ /g,"")
                                .substring(0, filename.lastIndexOf('.'))
                                .toLowerCase()}_${Date.now()}.${imageFormat}`;
    const decodedImageData = Buffer.from(data, 'base64');
    const bucket = process.env.BUCKET_NAME;
    const folder = process.env.BUCKET_FOLDER_NAME;
    
    const s3Params = {
      Bucket: bucket,
      Key: `${folder}${fileName}`,
      Body: decodedImageData,
      ContentType: type,
    };
    
     await s3Client.send(new PutObjectCommand(s3Params));

    const link = `https://${bucket}.s3.amazonaws.com/${folder}${fileName}`;
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ link }),
    };
  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        message: err.message,
        error : err
      }),
    };
  }
};
