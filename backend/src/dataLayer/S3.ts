import * as AWS from 'aws-sdk'
import { createLogger } from '../utils/logger'

const s3 = new AWS.S3({ signatureVersion: 'v4' })
const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

const logger = createLogger('S3 Access')

export function getUploadUrl(imageId: string): string {
  logger.info('getUploadUrl', { imageId })

  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: imageId,
    Expires: urlExpiration
  })
}
