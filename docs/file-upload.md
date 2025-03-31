### **Using `multer` in NestJS for File Uploads to Backblaze B2**

`multer` is a middleware for handling `multipart/form-data`, which is commonly used for uploading files. NestJS provides built-in support for `multer` through `@UploadedFile()` and `FileInterceptor`.

---

## **Step 1: Install Dependencies**

You'll need `multer`, `@nestjs/platform-express`, and `aws-sdk` (for S3 compatibility with Backblaze B2).

```sh
npm install @nestjs/platform-express multer multer-s3 @aws-sdk/client-s3
```

---

## **Step 2: Configure Multer for Backblaze B2 (S3-Compatible)**

Since you're using **Backblaze's S3-compatible API** , `multer` needs to be configured with `multer-s3`.

### **`storage.service.ts` (Handles Upload to Backblaze)**

```ts
import { Injectable } from '@nestjs/common';
import { S3 } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private s3: S3;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3({
      endpoint: this.configService.get<string>('BACKBLAZE_ENDPOINT'),
      region: this.configService.get<string>('BACKBLAZE_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('BACKBLAZE_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'BACKBLAZE_APPLICATION_KEY',
        ),
      },
    });

    this.bucketName = this.configService.get<string>('BACKBLAZE_BUCKET_NAME');
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const fileKey = `${folder}/${randomUUID()}-${file.originalname}`;

    await this.s3.putObject({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    return `${this.configService.get<string>('BACKBLAZE_ENDPOINT')}/${this.bucketName}/${fileKey}`;
  }
}
```

- `putObject()` uploads the file.
- `ACL: 'public-read'` ensures public accessibility.
- Generates a **random UUID** to prevent duplicate filenames.

---

## **Step 3: Create File Upload Controller**

NestJS provides decorators like `@UploadedFile()` and `@UseInterceptors()` to handle file uploads.

### **`upload.controller.ts`**

```ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const url = await this.storageService.uploadFile(file, 'documents');
    return { url };
  }
}
```

- `@UseInterceptors(FileInterceptor('file'))`: Enables **Multer** for handling file uploads.
- `@UploadedFile() file`: Captures the uploaded file from the request.
- Calls `storageService.uploadFile()` and returns the **public file URL** .

---

## **Step 4: Configure `multer` in `AppModule`**

Add configuration for **Multer** .

### **`app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [MulterModule.register()],
  controllers: [UploadController],
  providers: [StorageService],
})
export class AppModule {}
```

---

## **Step 5: Test File Upload**

You can test the upload using **Postman** or **cURL** .

### **cURL Example**

```sh
curl -X POST http://localhost:3000/upload/file \
  -F "file=@path/to/your/image.jpg"
```

It should return:

```json
{
  "url": "https://s3.us-west-002.backblazeb2.com/your-bucket/documents/1234-image.jpg"
}
```

---

## **Understanding `@UploadedFile()` and `FileInterceptor`**

- `@UploadedFile() file`: Extracts the uploaded file from the request.
- `FileInterceptor('file')`:
  - Middleware that processes `multipart/form-data`.
  - Uses `multer` under the hood.
  - Parses the uploaded file and makes it accessible in `@UploadedFile()`.

---

## **Next Steps**

- If you want to **restrict file types** , use:
  ```ts
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only images are allowed!'), false);
      }
      cb(null, true);
    }
  }))
  ```
- If handling **large files** , use **streaming uploads** instead of `file.buffer`.

---

This setup ensures:
✅ Secure Backblaze B2 integration.

✅ Efficient file handling with Multer.

✅ Future-proofing for AWS S3 migration.

Let me know if you need modifications! 🚀
