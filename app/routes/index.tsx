import { createRoute } from "honox/factory";
import About from "../components/About";
import Meishi from "../components/Meishi";
import Works from "../components/Works";
import WorksDrawer from "../islands/WorksDrawer";
import styles from "./index.module.css";

export default createRoute((c) => {
  return c.render(
    <main class={styles.main}>
      <Meishi />
      <About />
      <Works />
      <WorksDrawer />
    </main>,
  );
});
