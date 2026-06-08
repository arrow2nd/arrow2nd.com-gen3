import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Meishi from ".";

const meta = {
  component: Meishi,
} satisfies Meta<typeof Meishi>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
