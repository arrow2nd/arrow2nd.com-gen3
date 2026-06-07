import { defineMain } from "@storybook/nextjs-vite/node";

export default defineMain({
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: "@storybook/nextjs-vite",
  features: {
    experimentalRSC: true,
  },
});
