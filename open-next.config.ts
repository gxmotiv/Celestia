import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Build-time adapter configuration only. Runtime bindings and cache services
// must be added explicitly after the production Worker target is confirmed.
export default defineCloudflareConfig();
