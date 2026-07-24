// Lets plain Node resolve the extensionless relative imports the app uses
// (`from "./payments"`), which Next's bundler handles but Node ESM does not.
// Registered via `node --import ./tests/hooks.mjs`. Source files stay untouched.
import { register } from "node:module";
register("./resolve-extensionless.mjs", import.meta.url);
