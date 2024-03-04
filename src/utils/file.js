import fs from 'fs'
import path from 'path'

// 删除文件
export const deleteFile = (filePath) => {
  fs.unlinkSync(filePath)
}

// 删除文件夹及其内部文件
export const deleteFolderRecursive = (folderPath) => {
  // 读取文件夹内的文件和子文件夹
  const files = fs.readdirSync(folderPath)
  files.forEach((file) => {
    const filePath = path.join(folderPath, file)
    if (fs.statSync(filePath).isDirectory()) {
      // 递归删除子文件夹
      deleteFolderRecursive(filePath)
    } else {
      // 删除文件
      fs.unlinkSync(filePath)
    }
  })
  // 删除空文件夹
  fs.rmdirSync(folderPath)
}

export const isSubdirectory = (sourceDir, destinationDir) => {
  const relativePath = path.relative(sourceDir, destinationDir)
  return !relativePath.startsWith('..') && !path.isAbsolute(relativePath)
}
