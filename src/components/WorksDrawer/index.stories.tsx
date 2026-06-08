import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import WorksDrawer from ".";

const meta = {
  component: WorksDrawer,
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof WorksDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <div style={{ padding: "2rem" }}>Drawer content</div>,
  },
};
