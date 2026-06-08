import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import BudouX from "./budoux";

const meta = {
  component: BudouX,
} satisfies Meta<typeof BudouX>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "触り心地のいいUIを考え実装すること",
  },
};

export const Short: Story = {
  args: {
    children: "フロントエンドエンジニア",
  },
};
