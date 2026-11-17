import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No paid storage or external cache is configured.
// The app can run without creating an R2 bucket.
export default defineCloudflareConfig();
