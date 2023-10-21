import * as vscode from "vscode";
import { highlightDecorationType } from "./hightLight";

export const cancelHightlight = (context: vscode.ExtensionContext) => {
  // 监听按键事件
  return vscode.commands.registerCommand("extension.keyPress", (key) => {
    if (key === "escape") {
      // 取消高亮逻辑
      vscode.window.activeTextEditor?.setDecorations(
        highlightDecorationType,
        []
      );
    }
  });
};
