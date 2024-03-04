import { ipcMain } from 'electron'
import {
  ADD_FILE,
  ADD_FOLDER,
  UPDATE_TREE,
  COMMON_ERROR,
  COMMON_ERROR_LOG,
  RENAME,
  DELETE,
  COPY,
  MOVE
} from '../event'
import fs from 'fs'
import fsExtra from 'fs-extra'
import { sep, join } from 'path'
import { addChildNode, updateNodeValue, deleteNodeByKey, dfs } from '../utils/tree'
import { deleteFile, deleteFolderRecursive, isSubdirectory } from '../utils/file'
import { cloneDeep } from 'lodash'

export default () => {
  ipcMain.on(ADD_FILE, (event, path, title, oldData) => {
    const newPath = `${path}${sep}${title}.md`
    const exists = fs.existsSync(newPath)
    if (exists) {
      event.sender.send(COMMON_ERROR, '文件已存在')
      return
    }
    fs.writeFile(newPath, '', { encoding: 'utf8' }, (err) => {
      if (!err) {
        const newData = [...oldData]
        addChildNode(newData, path, { title: `${title}.md`, key: newPath, isLeaf: true })
        event.sender.send(UPDATE_TREE, newData)
      } else {
        console.log('err', err)
        event.sender.send(COMMON_ERROR_LOG, err)
      }
    })
  })
  ipcMain.on(ADD_FOLDER, (event, path, title, oldData) => {
    const newPath = `${path}${sep}${title}`
    const exists = fs.existsSync(newPath)
    if (exists) {
      event.sender.send(COMMON_ERROR, '文件夹已存在')
      return
    }
    fs.mkdir(newPath, {}, (err) => {
      if (!err) {
        const newData = [...oldData]
        addChildNode(newData, path, { title: `${title}`, key: newPath, children: [] })
        event.sender.send(UPDATE_TREE, newData)
      } else {
        console.log('err', err)
        event.sender.send(COMMON_ERROR_LOG, err)
      }
    })
  })
  ipcMain.on(RENAME, (event, path, title, oldData, selectNode) => {
    const arr = path.split(sep)
    arr.pop()
    if (selectNode.isLeaf) {
      arr.push(`${title}.md`)
    } else {
      arr.push(title)
    }
    let newPath = `${sep}${join(...arr)}`
    const exists = fs.existsSync(newPath)
    if (exists) {
      event.sender.send(COMMON_ERROR, '文件/文件夹重名')
      return
    }
    fs.rename(path, newPath, (err) => {
      if (err) {
        console.log('err', err)
        event.sender.send(COMMON_ERROR_LOG, err)
      } else {
        const newData = [...oldData]
        updateNodeValue(newData, path, 'title', selectNode.isLeaf ? `${title}.md` : title)
        updateNodeValue(newData, path, 'key', newPath)
        event.sender.send(UPDATE_TREE, newData)
      }
    })
  })

  const deleteFileOrFolder = (event, path, selectNode, oldData) => {
    try {
      if (selectNode.isLeaf) {
        fs.unlinkSync(path)
      } else {
        fs.rmSync(path, { recursive: true })
      }
      const newData = [...oldData]
      deleteNodeByKey(newData, path)
      event.sender.send(UPDATE_TREE, newData)
    } catch (err) {
      console.log('err', err)
      event.sender.send(COMMON_ERROR_LOG, err)
    }
  }

  ipcMain.on(DELETE, deleteFileOrFolder)

  const copy = (event, path, targetPath, selectNode, oldData) => {
    let newTitle = selectNode.title
    if (fs.existsSync(`${targetPath}/${newTitle}`)) {
      if (selectNode.isLeaf) {
        const extIndex = newTitle.lastIndexOf('.')
        newTitle = `${selectNode.title.substring(0, extIndex)}_${Date.now()}.md`
      } else {
        newTitle = `${selectNode.title}_${Date.now()}`
      }
    }

    const newNode = {
      title: newTitle,
      key: `${targetPath}${sep}${newTitle}`
    }
    if (selectNode.isLeaf) {
      newNode.isLeaf = true
    } else {
      newNode.children = cloneDeep(selectNode.children)
      dfs(newNode.children, (node) => {
        node.key = node.key.replace(`${targetPath}/${selectNode.title}`, newNode.key)
      })
    }
    if (!selectNode.isLeaf) {
      // 如果目标文件夹是源文件夹的子文件夹，则不进行复制
      let newDestinationDir = newNode.key

      if (isSubdirectory(path, newDestinationDir)) {
        event.sender.send(COMMON_ERROR, '目标文件夹是源文件夹的子文件夹，无法复制！')
        return
      }
      // 使用 fs-extra 的 copy 方法复制文件夹
      try {
        fsExtra.copySync(path, newDestinationDir)
      } catch (error) {
        event.sender.send(COMMON_ERROR_LOG, error)
      }
    } else {
      try {
        const content = fs.readFileSync(path, { encoding: 'utf8' })
        fs.writeFileSync(newNode.key, content, { encoding: 'utf8' })
      } catch (error) {}
    }
    const newData = [...oldData]
    addChildNode(newData, targetPath, newNode)
    event.sender.send(UPDATE_TREE, newData)
    return { data: newData, success: true }
  }

  ipcMain.on(COPY, copy)
  ipcMain.on(MOVE, (event, path, targetPath, selectNode, oldData) => {
    const copyRes = copy(event, path, targetPath, selectNode, oldData)
    if (copyRes.success) {
      deleteFileOrFolder(event, path, selectNode, copyRes.data)
    }
  })
}
