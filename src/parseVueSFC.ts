import * as vscode from "vscode";
import { parse, compileScript, SFCParseOptions, walk } from "@vue/compiler-sfc";
import { calleeNameNode, isVariable } from "./utils";
import {
  isIdentifier,
  Node,
  isMemberExpression,
  identifier,
} from "@babel/types";

export const parseVueSFC = (vueSfc: string, parseOptions?: SFCParseOptions) => {
  const { scriptAst, scriptSetupAst, bindings, ...rest } = compileScript(
    parse(vueSfc, parseOptions).descriptor,
    {
      id: "xxxx",
    }
  );

  const stateObject = {
    state: {
      ref: [] as any[],
      computed: [] as any[],
      reactive: [] as any[], 
      defineProps: [] as any[], 
    },
    watch: [] as any[],
    watchEffect: [] as any[],
    methods: [] as any[],
  };

  function createItem(tagName: string, node: Node, isLeaf?: boolean) {
    const { start } = node.loc || {};
    const column = start.column;
    const key = (Math.random() * 1000000).toString(24);
    if (!isLeaf) {
      return {
        title: node?.id?.name || tagName,
        tagName,
        key,
        line: rest.loc.start.line + start.line - 2,
        column,
      };
    } else {
      const line = rest.loc.start.line + start.line - 2;
      return {
        title: `${line}:${column}`,
        key,
        line,
        column,
      };
    }
  }

  walk(scriptSetupAst || scriptAst, {
    enter(node: Node) {
      if (calleeNameNode("ref", node)) {
        stateObject.state.ref.push(createItem("ref", node));
      } else if (calleeNameNode("computed", node)) {
        stateObject.state.computed.push(createItem("computed", node));
      } else if (calleeNameNode("reactive", node)) {
        stateObject.state.reactive.push(createItem("reactive", node));
      } else if (calleeNameNode("defineProps", node)) {
        stateObject.state.defineProps.push(createItem("defineProps", node));
      }  else if (isIdentifier(node?.callee, { name: "watch" })) {
        stateObject.watch.push(createItem("watch", node));
      } else if (isIdentifier(node?.callee, { name: "watchEffect" })) {
        stateObject.watchEffect.push(createItem("watch", node));
      }

      if (bindings && isVariable(node, Object.keys(bindings))) {
        Object.entries(stateObject.state).forEach(([key, list]) => {
          list.forEach((item) => {
            if (node.object.name === item.title) {
              if (item.children) {
                item.children.push(createItem(key, node, true));
              } else {
                item.children = [createItem(key, node, true)];
              }
            }
          });
        });
      }
    },
  });
  return stateObject;
};

export const parseFile = (webView: vscode.WebviewView["webview"]) => {
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    const document = activeEditor.document;
    const fileName = document.fileName;

    if (fileName.endsWith(".vue")) {
      const fileContent = document.getText();
      // 在这里处理 .vue 文件的内容
      const res = parseVueSFC(fileContent);
      webView.postMessage({
        command: "stateObject",
        value: res,
      });
    }
  }
};
