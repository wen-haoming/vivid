<script setup lang="tsx">
import { onMounted, ref, watch } from "vue";
import { vscode } from "./utilities/vscode";
// import { CodeBlockInfo } from "../../src/hightLight";
import Panel from "./Panel.vue";

const searchVal = ref("");
const selectId = ref("");
// const selectAllFile = ref(false);
const hightLightList = ref<any[]>([]);

onMounted(() => {
  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.command) {
      case "hightLight":
        hightLightList.value = message.value as any[];
        break;
      case "stateObject":
        console.log(message, "message");
        break;
    }
  });
});

const inputEvent = (value: string) => {
  if (!value) {
    hightLightList.value = [];
    vscode.postMessage({
      command: "notSearchCode",
    });
  } else {
    vscode.postMessage({
      command: "searchCode",
      value: searchVal.value,
    });
  }
};

const selectItem = (id: string) => {
  selectId.value = id;
};

watch(
  () => selectId.value,
  (id) => {
    vscode.postMessage({
      command: "selectCodeItemId",
      value: id,
    });
  }
);

// const checkAll = (val: any) => {
//   selectAllFile.value = val.target.checked;
// };

const inputEnter = () => {
  // 每次回车就自动选择下一个id
  let idx = -1;
  const length = hightLightList.value.length;
  if (length === 0) return;

  if (!hightLightList.value.find((item) => item.id === selectId.value)) {
    selectId.value = hightLightList.value[0].id;
    return;
  }

  while (length > 0) {
    if (hightLightList.value[++idx].id === selectId.value) {
      selectId.value = hightLightList.value[(idx + 1) % length].id;
      return;
    }
  }
};
</script>

<template>
  <a-config-provider size="mini">
    <div class="h-100vh ">
      <div class="h-30vh p-5px box-border">
        <a-input
          v-model="searchVal"
          placeholder="Search"
          allow-clear
          @change="inputEvent"
        />
        <div class="flex flex-col h-300px overflow-y-auto flex-shrink-0">
          <a-link
            v-for="item in hightLightList"
            @click="() => selectItem(item.id)"
            :key="item.id"
            @keyup.enter="inputEnter"
            class="block p-y-5px m-t-5px"
          >
            {{ item.lineText }}
          </a-link>
        </div>
      </div>
      <Panel class="flex flex-col h-70vh" />
    </div>
  </a-config-provider>
</template>
