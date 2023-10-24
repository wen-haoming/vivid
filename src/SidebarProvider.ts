import * as vscode from "vscode";
import { getUri } from "./utilities/getUri";
import { getNonce } from "./utilities/getNonce";
import {
  highlightDecorationType,
  highlightCodeWithKeyword,
  CodeBlockInfo,
} from "./hightLight";
import { parseFile } from "./parseVueSFC";
import { debounce, setCursorPosition } from "./utils";

const isDev = process.env.NODE_ENV !== "production";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView; //存储 Webview 视图
  private _context: vscode.ExtensionContext; // 存储扩展上下文对象

  constructor(
    private readonly _extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this._context = context;
  }
  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };
    let hightLightList: CodeBlockInfo[] = [];
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((data) => {
      const value = data.value;
      switch (data.command) {
        case "searchCode":
          vscode.window.activeTextEditor?.setDecorations(
            highlightDecorationType,
            []
          );
          hightLightList = highlightCodeWithKeyword(value as string);
          webviewView.webview.postMessage({
            command: "hightLight",
            value: hightLightList,
          });
          break;
        case "selectCodeItemId":
          vscode.window.activeTextEditor?.setDecorations(
            highlightDecorationType,
            []
          );
          const id = value;
          const item = hightLightList.find((item) => item.id === id);
          const editor = vscode.window.activeTextEditor;
          if (editor && item) {
            editor.setDecorations(highlightDecorationType, [item]);
            editor.revealRange(item.range);
          }
          break;
        case "notSearchCode":
          vscode.window.activeTextEditor?.setDecorations(
            highlightDecorationType,
            []
          );
          break;
        case "selectItem":
          setCursorPosition(value.line, value.column);
          break;
        case "navigateBack":
          vscode.commands.executeCommand("workbench.action.navigateBack");
          break;
        case "navigateForward":
          vscode.commands.executeCommand("workbench.action.navigateForward");
          break;
      }
    });
    parseFile(webviewView.webview);
    const debounceFn = debounce(parseFile, 500);

    vscode.workspace.onDidChangeTextDocument(() => {
      // 检查更改是否发生在当前活动文件中
      debounceFn(webviewView.webview);
    });

    vscode.window.onDidChangeActiveTextEditor(() => {
      // 检查更改是否发生在当前活动文件中
      debounceFn(webviewView.webview);
    });
  }

  //用于生成 Webview 的 HTML 内容
  private _getHtmlForWebview(webview: vscode.Webview) {
    const stylesUri = getUri(
      webview,
      this._extensionUri,
      isDev
        ? ["webview-ui", "build", "assets", "index.css"]
        : ["dist","assets", "index.css"]
    );
    // The JS file from the Vue build output
    const scriptUri = getUri(
      webview,
      this._extensionUri,
      isDev
        ? ["webview-ui", "build", "assets", "index.js"]
        : ["dist","assets", "index.js"]
    );

    const nonce = getNonce();

    return `
       <!DOCTYPE html>
       <html lang="en">
         <head>
           <meta charset="UTF-8" />
           <meta name="viewport" content="width=device-width, initial-scale=1.0" />
           <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
           <link rel="stylesheet" type="text/css" href="${stylesUri}">
           <title>Hello World</title>
         </head>
         <body>
           <div id="app"></div>
           <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
         </body>
       </html>
       `;
  }
}
