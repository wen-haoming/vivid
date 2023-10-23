import { createApp } from "vue";
import "./style.css";
import 'virtual:uno.css';
import '@unocss/reset/normalize.css';
import '@arco-design/web-vue/dist/arco.css';

import App from "./App.vue";

document.body.setAttribute('arco-theme', 'dark');


createApp(App).mount("#app");
