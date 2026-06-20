/**
 * UserModule.
 *
 * Groups the user domain (controller + service) behind a single module
 * that the root AppModule imports.
 */
import { Module } from "../../core/decorators/module.js";
import { HomeController } from "../controllers/home.controller.js";
import { UserController } from "../controllers/user.controller.js";
import { UserService } from "../services/user.service.js";

@Module({
	controllers: [HomeController, UserController],
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
