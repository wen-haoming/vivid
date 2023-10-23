<script setup lang="tsx">
import { onMounted, ref } from "vue";
import { vscode } from "./utilities/vscode";
import { computed } from "vue";
import Tree from "./components/Tree.vue";

const panelState = ref({
  state: {
    ref: [],
    computed: [],
    reactive: [],
    defineProps: [],
  },
  watch: [],
  methods: [],
});

onMounted(() => {
  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.command) {
      case "stateObject":
        panelState.value = message?.value;
        break;
    }
  });
});

const navigateBack = () => {
  vscode.postMessage({
    command: "navigateBack",
  });
};

const navigateForward = () => {
  vscode.postMessage({
    command: "navigateForward",
  });
};


const stateList = computed(() => [
  ...panelState.value.state.ref,
  ...panelState.value.state.computed,
  ...panelState.value.state.reactive,
]);

const definePropsList = computed(() => panelState.value.state.defineProps);
</script>
<template>
  <div>
    <div class="flex justify-between">
      <a-button type="secondary" class="flex-1 m-r-5px" @click="navigateBack">
        &lt;
      </a-button>
      <a-button
        type="secondary"
        class="flex-1 m-l-5px"
        @click="navigateForward"
      >
        &gt;
      </a-button>
    </div>
    <div class="flex-1 overflow-y-auto p-y-5px">
      <a-tabs default-active-key="state" class="vivid-tree">
        <a-tab-pane key="state" title="state">
          <Tree :data="stateList" />
        </a-tab-pane>
        <a-tab-pane key="props" title="props">
          <Tree :data="definePropsList" />
        </a-tab-pane>
        <a-tab-pane key="watch" title="watch">
          <Tree :data="panelState.watch" />
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>
<style scoped lang="less">
.vivid-tree {
  :deep(.arco-tabs-content) {
    padding-top: 0;
    padding-right: 5px;
  }
}
</style>
