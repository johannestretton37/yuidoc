import * as vscode from 'vscode'
import { classRegex, funcRegex, arrowFuncRegex, commentLineRegex } from './regex'

class Generator {
  editor: vscode.TextEditor
  edit: vscode.TextEditorEdit

  constructor(editor:vscode.TextEditor, edit:vscode.TextEditorEdit) {
    this.editor = editor
    this.edit = edit
  }

  generateSelected = () => {
    const selectedRange: vscode.Range = new vscode.Range(this.editor.selection.start, this.editor.selection.end)
    this.generateCommentsForRange(selectedRange)
  }

  generateAll = () => {
    const fullRange: vscode.Range = new vscode.Range(0, 0, this.editor.document.lineCount, 0)
    this.generateCommentsForRange(fullRange)
  }

  generateCommentsForRange = (range: vscode.Range) => {
    const editRangeStartLineIndex = range.start.line
    const editRangeEndLineIndex = range.end.line
    let doc = this.editor.document
    if (doc.languageId === "javascript") {
      console.log("This is a javascript file")
    } else { console.log(doc.languageId) }

    let addedComments: number = 0
    let prevLineIndex: number
    let currComment: string[]
    let currCommentStart: vscode.Position
    let currCommentEnd: vscode.Position
    let pointerIsInComment: boolean = false
    for (let i: number = editRangeStartLineIndex; i < editRangeStartLineIndex; i++) {
      let line = doc.lineAt(i)
      // console.log(line.text)
      let range = line.range
      if (!line.range.isEmpty) {
        // Count spaces before words
        let indent = this.indentTo(line.firstNonWhitespaceCharacterIndex)
        // Extract words only
        let lineContent = line.text.trim()
        if (lineContent.startsWith('/**')) {
          // An existing comment starts
          // Save range start
          currCommentStart = range.start
          // Read it into currComment
          pointerIsInComment = true
          // Reset variable
          currComment = []
        }
        if (pointerIsInComment) {
          currComment.push(lineContent)
        }
        // Ignore existing comments
        if (lineContent.startsWith('*/')) {
          // This is the end of a comment.
          // Save range end
          currCommentEnd = range.end
          // Read last line into currComment
          currComment.push(lineContent)
          // Validate comment
          let validatedComment = this.validateComment(currComment, indent)
          // Reset variables
          pointerIsInComment = false
          this.edit.insert(currCommentStart, validatedComment)
          continue
        }
        let words = lineContent.split(' ')
        // Generate comment if line matches any predefined regexes
        if (classRegex.test(lineContent)) {
          this.edit.insert(range.start, this.classComment(words[1], indent))
          addedComments++
        }
        if (funcRegex.test(lineContent)) {
          this.edit.insert(range.start, this.funcComment(false, lineContent, indent))
          addedComments++
        }
        if (arrowFuncRegex.test(lineContent)) {
          this.edit.insert(range.start, this.funcComment(true, lineContent, indent))
          addedComments++
        }
      }
    }
    vscode.window.showInformationMessage(`${addedComments} YUIDoc comments generated`)
  }

  indentTo(index) {
    return ' '.repeat(index)
  }

  validateComment(commentLines: string[], indent: string) {
    console.log("Found existing comment:")
    let comment: string
    let hasMethod: boolean = false
    commentLines.forEach(line => {
      console.log(line)
      if (commentLineRegex.test(line)) {
        console.log(" - This is a formatted comment line:", line)
        let match: RegExpExecArray | null
        match = commentLineRegex.exec(line)
        let param, type
        while (match = commentLineRegex.exec(line)) {
          param = match[1].trim()
          console.log(" - param:", param)
        }
      }
      comment += line
    })
    return this.formatComment(comment, indent)
  }

  classComment(className: string, indent: string) {
    let comment = `/**
    * ${className} description
    *
    * @class ${className}
    * @constructor
    */`
    return this.formatComment(comment, indent)
  }

  formatComment(comment, indent) {
    let lines = comment.split('\n')
    let output = ''
    lines.forEach(line => {
      line = line.trim()
      let spacer = line.startsWith('*') ? ' ' : ''
      output += indent + spacer + line + '\n'
    })
    return output
  }

  funcComment(isArrow: boolean, declaration: string, indent: string) {
    let words = declaration.split(' ')
    const regex = isArrow ? arrowFuncRegex : funcRegex
    let match: RegExpExecArray | null
    match = regex.exec(declaration)
    let name, args
    while (match = regex.exec(declaration)) {
      name = match[1]
      args = match[2].split(',')
      args = args.map(param => param.trim())
    }
    let comment = `/**
    * Description
    *
    * @method ${name}
    `
    if (args) {
      args.forEach(param => {
        if (param.trim() !== '') {
          comment += `* @param {type} ${param.trim()} - description\n`
        }
      })
    }

    comment += `*/`

    return this.formatComment(comment, indent)
  }
}

export default Generator