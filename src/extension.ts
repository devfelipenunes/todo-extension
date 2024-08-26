import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "todo-tracker.showTodos",
    async () => {
      const todos: { file: string; line: number; text: string }[] = [];
      const workspaceFolders = vscode.workspace.workspaceFolders;

      if (!workspaceFolders) {
        vscode.window.showInformationMessage(
          "Nenhuma pasta de trabalho encontrada."
        );
        return;
      }

      // Obtém a pasta de trabalho atual
      const workspacePath = workspaceFolders[0].uri.fsPath;
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(workspacePath, "**/*.{js,ts,jsx,tsx}"),
        "**/node_modules/**"
      );

      for (const file of files) {
        const document = await vscode.workspace.openTextDocument(file);
        const totalLines = document.lineCount;

        // Processar linha por linha para evitar grandes strings
        for (let i = 0; i < totalLines; i++) {
          const lineText = document.lineAt(i).text;
          if (lineText.includes("TODO:")) {
            todos.push({
              file: file.fsPath,
              line: i + 1,
              text: lineText.trim(),
            });
          }
        }
      }

      if (todos.length === 0) {
        vscode.window.showInformationMessage("Nenhum TODO encontrado.");
      } else {
        const items = todos.map((todo) => ({
          label: `${todo.file}:${todo.line}`,
          description: todo.text,
          file: todo.file,
          line: todo.line,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: "Selecione um TODO para navegar até ele",
        });

        if (selected) {
          const doc = await vscode.workspace.openTextDocument(selected.file);
          const editor = await vscode.window.showTextDocument(doc);
          const position = new vscode.Position(selected.line - 1, 0);
          editor.selection = new vscode.Selection(position, position);
          editor.revealRange(new vscode.Range(position, position));
        }
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
