import { Application, Module, Controller, Post, Inject, Injectable } from "@nexusts/core";
import { MailService, MailModule, FileTransport } from "@nexusts/mail";
import type { Context } from "hono";

/**
 * 16-mail — send emails via the file transport (writes to ./outbox).
 *
 *   Run: bun main.ts
 *   Then:
 *     curl -X POST http://localhost:3000/mail \
 *       -H "Content-Type: application/json" \
 *       -d '{"to":"a@b.com","subject":"hi","text":"hello"}'
 */

@Injectable()
@Controller("/mail")
class MailController {
  @Inject(MailService) declare mail: MailService;

  @Post("/")
  async send(ctx: Context) {
    const body = await ctx.req.json() as { to: string; subject: string; text: string };
    await this.mail.send({
      from: "noreply@example.com",
      to: body.to,
      subject: body.subject,
      text: body.text,
    });
    return { ok: true };
  }
}

@Module({
  imports: [
    MailModule.forRoot({ transport: new FileTransport({ dir: "./outbox" }) }),
  ],
  controllers: [MailController],
})
class AppModule {}

const app = new Application(AppModule);
const port = Number(process.env.PORT ?? 3000);
await app.listen(port);
