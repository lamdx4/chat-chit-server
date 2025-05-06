import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandInput,
  GetObjectCommandInput,
  DeleteObjectCommandInput,
  PutObjectCommandOutput,
  GetObjectCommandOutput,
  DeleteObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { ConfigService } from "../../shared-kernel/env/config-service";

export class CloudService {
  private readonly s3: S3Client;
  private static instance: CloudService;
  private static readonly BUCKET_NAME = ConfigService.tryGet("AWS_BUCKET_NAME");

  constructor() {
    this.s3 = new S3Client({
      region: ConfigService.tryGet("AWS_REGION"),
      credentials: {
        accessKeyId: ConfigService.tryGet("AWS_ACCESS_KEY_ID"),
        secretAccessKey: ConfigService.tryGet("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }

  async uploadFile(
    key: string,
    body: Buffer | Uint8Array | Blob | string,
    contentType?: string
  ): Promise<PutObjectCommandOutput> {
    const params: PutObjectCommandInput = {
      Bucket: CloudService.BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    };
    return await this.s3.send(new PutObjectCommand(params));
  }

  async getFile(key: string): Promise<GetObjectCommandOutput> {
    const params: GetObjectCommandInput = {
      Bucket: CloudService.BUCKET_NAME,
      Key: key,
    };
    return await this.s3.send(new GetObjectCommand(params));
  }

  async deleteFile(key: string): Promise<DeleteObjectCommandOutput> {
    const params: DeleteObjectCommandInput = {
      Bucket: CloudService.BUCKET_NAME,
      Key: key,
    };
    return await this.s3.send(new DeleteObjectCommand(params));
  }
}
