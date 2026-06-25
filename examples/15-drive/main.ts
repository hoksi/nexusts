import { Application, Module, Controller, Get, Post, Inject, Injectable } from "@nexusts/core";
import { DriveService, DriveModule } from "@nexusts/drive";
import type { Context } from "hono";

/**
 * 15-drive — local disk file storage.
 *
 *   Run: bun main.ts
 */

@Injectable()
@Controller("/files")
class FileController {
  @Inject(DriveService) declare drive: DriveService;

  @Post("/:name")
  async upload(ctx: Context) {
    const name = ctx.req.param("name");
    const content = await ctx.req.json();
    const path = `uploads/${name}`;
    await this.drive.put(path, content);
    return { ok: true, path };
  }

  @Get("/:name")
  async read(ctx: Context) {
    const name = ctx.req.param("name");
    const path = `uploads/${name}`;
    if (!await this.drive.exists(path)) return { ok: false };
    const content = await this.drive.get(path);
    return { ok: true, content };
  }
}

@Module({
  // Use default (in-memory) driver. For local disk or S3, build a driver instance.
  imports: [DriveModule.forRoot()],
  controllers: [FileController],
})
class AppModule {}

const app = new Application(AppModule);
const port = Number(process.env.PORT ?? 3000);
await app.listen(port);
