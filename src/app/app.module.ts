/**
 * Root AppModule.
 *
 * Composes the application's modules into a single tree that the
 * Application class can scan. Adding more domains is just a matter of
 * importing them here.
 */
import { Module } from "../core/decorators/module.js";
import { UserModule } from "./modules/user.module.js";

@Module({
	imports: [UserModule],
})
export class AppModule {}
