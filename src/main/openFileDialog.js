import { dialog, ipcMain } from 'electron'
import { OPEN_FILE_DIALOG, SELECTED_DIRECTORY } from '../event'
import fs from 'fs'
import path from 'path'
export default () => {
  ipcMain.on(OPEN_FILE_DIALOG, (event) => {
    dialog
      .showOpenDialog({
        properties: ['openDirectory']
      })
      .then((result) => {
        if (!result.canceled) {
          const directoryPath = result.filePaths[0]
          const generateTree = (dir) => {
            const items = fs.readdirSync(dir, { withFileTypes: true })
            return items
              .map((item) => {
                const fullPath = path.join(dir, item.name)
                if (item.isDirectory()) {
                  return {
                    title: item.name,
                    key: fullPath,
                    children: generateTree(fullPath)
                  }
                } else if (item.isFile() && item.name.endsWith('.md')) {
                  return {
                    title: item.name,
                    key: fullPath,
                    isLeaf: true
                  }
                }
              })
              .filter(Boolean)
          }

          let folderTreeData = generateTree(directoryPath)
          folderTreeData = [
            { title: path.basename(directoryPath), key: directoryPath, children: folderTreeData }
          ]
          event.sender.send(SELECTED_DIRECTORY, { folderTreeData, directoryPath })
        }
      })
      .catch((err) => {
        console.log(err)
      })
  })
}
