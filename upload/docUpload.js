const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const multipart = require('parse-multipart');
const BUCKET = 'workflow-lambda-dev-serverlessdeploymentbucket-ygpfd8ufe19x';
const FOLDER = 'workflow_DMS/';

exports.handler = async (event) => {
  try {
    const contentTypeHeader = event.headers['Content-Type'];
    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'binary');
    const boundary = multipart.getBoundary(contentTypeHeader);
    const parts = multipart.Parse(bodyBuffer, boundary);
    const filePart = parts.find(part => part.filename);
    const { data, type } = filePart;
    const imageFormat = type.split('/')[1] || 'unknown';
    const fileName = `formData_${Date.now()}.${imageFormat}`;
    const decodedImageData = Buffer.from(data, 'base64');
    const s3params = {
      Bucket: BUCKET,
      Key: `${FOLDER}${fileName}`,
      Body: decodedImageData,
      ContentType: type,
    };
    await s3.upload(s3params).promise();
    const link = `https://${BUCKET}.s3.amazonaws.com/${FOLDER}${fileName}`;
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ link }),
    };
  } catch (err) {
    console.error('Error:', err.message);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: err.message }),
    };
  }
};
