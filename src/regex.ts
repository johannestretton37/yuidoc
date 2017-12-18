export const classRegex = /class [^{]* ?{/gi
export const funcRegex = /function ([^\(]*) ?\(([^\)]*)\) ?{/gi
export const methodRegex = /([^\(]*) ?\(([^\)]*)\) ?{/gi
export const arrowFuncRegex = /([^\=]*) ?\= ?\(([^\)]*)\) ?\=> ?{/gi
  
export const commentLineRegex = /@(method|param|return) /gi
