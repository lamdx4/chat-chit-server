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
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { Upload } from "@aws-sdk/lib-storage";

export class CloudService {
  private readonly s3: S3Client;
  private static instance: CloudService;
  private static readonly BUCKET_NAME = ConfigService.tryGet("AWS_BUCKET_NAME");

  private constructor() {
    this.s3 = new S3Client({
      region: ConfigService.tryGet("AWS_REGION"),
      credentials: {
        accessKeyId: ConfigService.tryGet("AWS_ACCESS_KEY_ID"),
        secretAccessKey: ConfigService.tryGet("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }

  static getInstance(): CloudService {
    if (!CloudService.instance) {
      CloudService.instance = new CloudService();
    }
    return CloudService.instance;
  }

  async uploadFile(
    key: string,
    body: Buffer | Uint8Array | Blob | string,
    contentType: string,
  ): Promise<PutObjectCommandOutput> {
    const params: PutObjectCommandInput = {
      Bucket: CloudService.BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    };
    return await this.s3.send(new PutObjectCommand(params));
  }

  async uploadStreamFile(
    key: string,
    body: Readable, // stream
    contentType: string,
  ): Promise<void> {
    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: CloudService.BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
      },
    });

    await upload.done();
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
  async getFilePreSignerUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: CloudService.BUCKET_NAME,
      Key: key,
    });
    return await getSignedUrl(this.s3, command, { expiresIn });
  }

  getStaticUrl(key: string): string {
    const bucket = CloudService.BUCKET_NAME;
    const region = ConfigService.tryGet("AWS_REGION");
    return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(
      key
    )}`;
  }
}
