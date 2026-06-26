import { Application, Module, Controller, Get, Injectable } from "@nexusts/core";
import { sse } from "@nexusts/sse";
import type { Context } from "hono";

/**
 * 11-sse — Server-Sent Events with type-safe streaming.
 *
 *   GET /events/timeseries  → streams "tick" events every second.
 *
 *   Run: bun main.ts
 *   Try: curl -N http://localhost:3000/events/timeseries
 *   Or: open http://localhost:3000 for the interactive dashboard.
 */

@Injectable()
@Controller("/")
class AppController {
  @Get("/")
  index(ctx: Context) {
    return ctx.html(
      "<!doctype html><html><body>" +
      "<h1>SSE Demo</h1>" +
      "<pre id=log></pre>" +
      "<script>" +
      "new EventSource('/events/timeseries').onmessage = (e) => {" +
      "  document.getElementById('log').textContent += e.data + '\\n';" +
      "};" +
      "</script></body></html>"
    );
  }

  @Get("/events/timeseries")
  timeseries(ctx: Context) {
    return sse(ctx, async (stream) => {
      let n = 0;
      stream.send({ event: "tick", data: { n } });
      const id = setInterval(() => {
        n += 1;
        stream.send({ event: "tick", data: { n, ts: Date.now() } });
      }, 1000);
      stream.onAbort(() => clearInterval(id));
      await new Promise(() => {});
    });
  }
}

@Module({
  controllers: [AppController],
})
class AppModule {}

const app = new Application(AppModule);
const port = Number(process.env.PORT ?? 3000);
await app.listen(port);