import {
  ExtensionContext,
  Uri,
  Disposable,
  ViewColumn,
  Webview,
  WebviewPanel,
  WebviewView,
  WebviewViewProvider,
  commands,
  window,
  workspace,
} from "vscode";
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

export class VividWebview {
  public static currentPanel: VividWebview | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];

  constructor(panel: WebviewPanel, extensionUri: Uri) {
    this._panel = panel;


    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Set the HTML content for the webview panel
    this._panel.webview.html = this._getWebviewContent(
      this._panel.webview,
      extensionUri
    );
    this._setWebviewMessageListener(this._panel.webview);
  }

  public dispose() {
    VividWebview.currentPanel = undefined;

    // Dispose of the current webview panel
    this._panel.dispose();

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  //用于生成 Webview 的 HTML 内容
  private _getWebviewContent(webview: Webview, _extensionUri: Uri) {
    const stylesUri = getUri(
      webview,
      _extensionUri,
      isDev
        ? ["webview-ui", "build", "assets", "index.css"]
        : ["dist", "assets", "index.css"]
    );
    // The JS file from the Vue build output
    const scriptUri = getUri(
      webview,
      _extensionUri,
      isDev
        ? ["webview-ui", "build", "assets", "index.js"]
        : ["dist", "assets", "index.js"]
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

  public static render(contextUri: Uri) {
    if (VividWebview.currentPanel) {
      // If the webview panel already exists reveal it
      VividWebview.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        // Panel view type
        "activateVivid",
        // Panel title
        "vivid",
       {
        viewColumn: ViewColumn.Beside,
        preserveFocus:true // 持续聚焦当前文件  https://github.com/microsoft/vscode/issues/170751
       },
        // Extra panel configurations
        {
          // Enable JavaScript in the webview
          enableScripts: true,
          
        }
      );
      VividWebview.currentPanel = new VividWebview(panel, contextUri);
    }
  }

  public _setWebviewMessageListener(webviewView: Webview) {
    let hightLightList: CodeBlockInfo[] = [];

    webviewView.onDidReceiveMessage((data) => {
      const value = data.value;
      switch (data.command) {
        // 搜索代码
        case "searchCode":
          window.activeTextEditor?.setDecorations(highlightDecorationType, []);
          hightLightList = highlightCodeWithKeyword(value as string);
          webviewView.postMessage({
            command: "hightLight",
            value: hightLightList,
          });
          break;
        //
        case "selectCodeItemId":
          window.activeTextEditor?.setDecorations(highlightDecorationType, []);
          const id = value;
          const item = hightLightList.find((item) => item.id === id);
          const editor = window.activeTextEditor;
          if (editor && item) {
            editor.setDecorations(highlightDecorationType, [item]);
            editor.revealRange(item.range);
          }
          break;
        case "notSearchCode":
          window.activeTextEditor?.setDecorations(highlightDecorationType, []);
          break;
        case "selectItem":
          setCursorPosition(value.line, value.column);
          break;
        case "navigateBack":
          commands.executeCommand("workbench.action.navigateBack");
          break;
        case "navigateForward":
          commands.executeCommand("workbench.action.navigateForward");
          break;
      }
    }, this._disposables);
    parseFile(webviewView);
    const debounceFn = debounce(parseFile, 500);

    workspace.onDidChangeTextDocument(() => {
      // 检查更改是否发生在当前活动文件中
      debounceFn(webviewView);
    });

    window.onDidChangeActiveTextEditor(() => {
      // 检查更改是否发生在当前活动文件中
      debounceFn(webviewView);
    });
  }
}
