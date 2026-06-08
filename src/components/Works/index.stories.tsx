import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Works from ".";

const meta = {
  component: Works,
} satisfies Meta<typeof Works>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
