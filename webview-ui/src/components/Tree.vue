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
  <a-tree class="w-100% p-0px" blockNode :data="data" @select="treeSelect">
    <template #extra="nodeData">
      <a-tag bordered v-if="nodeData.tagName"> {{ nodeData.tagName }}</a-tag>
    </template>
  </a-tree>
</template>
