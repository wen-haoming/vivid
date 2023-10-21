import * as vscode from "vscode";

export const highlightDecorationType =
  vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgba(255, 200, 0, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
  });

export const hightLight = (searchText: string) => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const text = editor.document.getText();
  const abcRegex = RegExp(searchText, "ig");
  const matchList = text.match(abcRegex);

  if (matchList) {
    let match;
    const decorations = [];
    while ((match = abcRegex.exec(text))) {
      const startPos = editor.document.positionAt(match.index);
      const endPos = editor.document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(startPos, endPos);
      decorations.push({ range: range });
    }
    return decorations;
  } else {
    return [];
  }
};

export interface CodeBlockInfo {
  id: string;
  range: vscode.Range;
  lineText: string;
}

const kebabCaseToCamelCase = (str: string) =>
  str.replace(/-(\w)/gi, (_, letter) => letter.toUpperCase());

export function highlightCodeWithKeyword(keyword: string): CodeBlockInfo[] {
  const editor = vscode.window.activeTextEditor;
  const codeBlocks: CodeBlockInfo[] = [];

  if (editor) {
    const text = editor.document.getText();
    const lines = text.split("\n");

    const regex = new RegExp(kebabCaseToCamelCase(keyword), "gi");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = regex.exec(kebabCaseToCamelCase(line));

      if (match) {
        const startPosition = new vscode.Position(i, match.index);
        const endPosition = new vscode.Position(
          i,
          match.index + match[0].length
        );
        const range = new vscode.Range(startPosition, endPosition);
        const lineText = lines[i];
        const codeBlockInfo: CodeBlockInfo = {
          id: generateUniqueId(), // 生成唯一 ID
          range,
          lineText,
        };

        codeBlocks.push(codeBlockInfo);
      }
    }
  }

  return codeBlocks;
}

/**
 * 生成唯一的 ID
 *
 * @returns 唯一 ID
 */
function generateUniqueId(): string {
  // 在这里使用你喜欢的唯一 ID 生成算法，例如 UUID v4
  // 这里只是一个示例，使用简单的时间戳作为 ID
  return (Math.random() * 100000).toString(24);
}
