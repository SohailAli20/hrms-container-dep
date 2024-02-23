const AWS = require('aws-sdk');
const mimeTypes = require('mime-types');
const s3 = new AWS.S3();

exports.handler = async (event, context) => {
  try {
    const formData = (event.body);
    const fileExtension = formData.filename ? formData.filename.split('.').pop() : '';
    const contentType = mimeTypes.lookup(fileExtension) || 'application/octet-stream';
    const fileName = `file_${Date.now()}.${fileExtension}`;
    const folder = 'workflow_DMS';
    const params = {
      Bucket: 'workflow-lambda-dev-serverlessdeploymentbucket-ygpfd8ufe19x',
      Key: `${folder}/${fileName}`,
      Body: formData,
      ContentType: contentType,
    };
    
    console.log("hfshfhsf",params)
    await s3.upload(params).promise();
    const imageUrl = `https://workflow-lambda-dev-serverlessdeploymentbucket-ygpfd8ufe19x.s3.amazonaws.com/${folder}/${fileName}`;
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ imageUrl }),
    };
  } catch (error) {
    console.error('Error uploading Document:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to upload Document', details: error.message }),
    };
  }
};
