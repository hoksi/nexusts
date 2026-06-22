import "reflect-metadata";
import { Application, Controller, Get, Param } from "@kabyeon/nexusjs";

/**
 * 01-basic-mvc — minimal NexusJS application with a single
 * Nest-style controller. Run with: bun main.ts
 */

@Controller("/")
class HelloController {
  @Get("/")
  index() {
    return "Hello from NexusJS!";
  }

  @Get("/json")
  json() {
    return { message: "Hello", framework: "NexusJS" };
  }

  @Get("/users/:id")
  user(@Param("id") id: string) {
    return { id: Number(id), name: `User #${id}` };
  }
}

const app = new Application(HelloController);
await app.listen(3000);