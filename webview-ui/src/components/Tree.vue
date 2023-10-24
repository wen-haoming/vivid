<script setup lang="tsx">
import { vscode } from "../utilities/vscode";

defineProps<{
  data: any[];
}>();

const treeSelect = (_: any, selectItem: any) => {
  if (selectItem.node) {
    const { column, line } = selectItem.node;
    vscode.postMessage({
      command: "selectItem",
      value: {
        column,
        line,
      },
    });
  }
};
</script>
<template>
  <a-tree
    class="vivid-tree w-100% p-0px"
    blockNode
    :data="data"
    @select="treeSelect"
  >
    <template #title="nodeData">
      <a-tooltip mini arrow-class="w-90vw p-0px overflow-auto">
        <template #content>
            <code class="w-90vw ">
              <pre class="w-90vw">
                {{ nodeData.overview }}
              </pre>
            </code>
        </template>
        <span>{{ nodeData.title }}</span>
      </a-tooltip>
    </template>
    <template #extra="nodeData">
      <a-tag bordered v-if="nodeData.tagName"> {{ nodeData.tagName }}</a-tag>
    </template>
  </a-tree>
</template>
<style lang="less" scoped>
.vivid-tree {
  :deep(.arco-tree-node-title-text) {
    display: block;
    flex: 1;
  }
}
</style>
