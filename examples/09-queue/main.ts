import {
  Application, Module, Controller, Get, Post, Inject, Injectable,
} from "@nexusts/core";
import { QueueService, QueueModule, OnQueueReady } from "@nexusts/queue";
import type { Context } from "hono";

/**
 * 09-queue — in-process task queue with decorator-based workers.
 *
 * Run: bun main.ts
 * Then: curl http://localhost:3000/email/send -d '{"to":"user@test.com"}' -H "Content-Type: application/json"
 *
 * The worker picks up the job from the queue and logs it after a short delay.
 */

// ─── Worker (consumer) ──────────────────────────────────────────────
@Injectable()
class EmailWorker {
  @Inject(QueueService) declare queue: QueueService;

  @OnQueueReady()
  async start() {
    await this.queue.process("email", async (job) => {
      console.log(`[worker] sending email to ${job.data.to}`);
      // simulate async send
      await new Promise((r) => setTimeout(r, 100));
      console.log(`[worker] done: ${job.data.to}`);
    });
    console.log("[worker] email queue consumer registered");
  }
}

// ─── Controller (producer) ─────────────────────────────────────────
@Controller("/email")
class EmailController {
  @Inject(QueueService) declare queue: QueueService;

  @Post("/send")
  async send(ctx: Context) {
    const body = await ctx.req.json();
    const job = await this.queue.add("email", body);
    return { jobId: job.jobId, status: "queued" };
  }

  @Get("/")
  index(ctx: Context) {
    return { queues: ["email"], status: "running" };
  }
}

// ─── Module ─────────────────────────────────────────────────────────
@Module({
  imports: [QueueModule.forRoot({ backend: "memory" })],
  controllers: [EmailController],
  providers: [EmailWorker],
})
class AppModule {}

// ─── Bootstrap ──────────────────────────────────────────────────────
const app = new Application(AppModule);
const port = Number(process.env.PORT ?? 3000);
await app.listen(port);
