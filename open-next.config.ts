import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Keep the adapter on its default cache/runtime behavior until the app has
// explicit Cloudflare cache bindings configured.
export default defineCloudflareConfig({});
