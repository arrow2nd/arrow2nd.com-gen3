import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Career from ".";

const meta = {
  component: Career,
} satisfies Meta<typeof Career>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
